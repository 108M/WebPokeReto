import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProfileCard } from './components/ProfileCard';
import { Roulette } from './components/Roulette';
import { supabase } from './lib/supabase';

export interface AppEvent {
  id: string;
  type: string;
  desc: string;
  points: number;
  date: string;
}


export interface Medal {
  id: string;
  name: string;
  obtained: boolean;
  index: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  medals: Medal[];
  events: AppEvent[];
}

type AppState = 'video' | 'startMenu' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('video');
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchAllData = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('*');
    if (!profilesData) return;

    const { data: badgesData } = await supabase.from('badges').select('*');
    const { data: eventsData } = await supabase.from('events').select('*');

    const assembledProfiles = profilesData.map(p => {
      const pBadges = badgesData?.filter(b => b.profile_id === p.id).map(b => ({
        id: b.id, name: `Medal ${b.badge_index + 1}`, obtained: b.is_obtained, index: b.badge_index
      })) || [];
      pBadges.sort((a, b) => a.index - b.index);

      const pEvents = eventsData?.filter(e => e.profile_id === p.id).map(e => ({
        id: e.id, type: e.type, desc: e.description, points: e.points_change, date: e.event_date
      })) || [];
      pEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        id: p.id,
        name: p.username,
        avatar: p.avatar_url,
        points: p.total_points,
        medals: pBadges,
        events: pEvents
      } as UserProfile;
    });

    assembledProfiles.sort((a, b) => b.points - a.points);
    setProfiles(assembledProfiles);
  };

  useEffect(() => {
    fetchAllData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAllData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleMedal = async (profileId: string, badgeIndex: number, currentObtained: boolean) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? {
      ...p,
      medals: p.medals.map(m => m.index === badgeIndex ? { ...m, obtained: !currentObtained } : m)
    } : p));
    await supabase.from('badges').update({ is_obtained: !currentObtained }).eq('profile_id', profileId).eq('badge_index', badgeIndex);
  };

  const handleAddEvent = async (profileId: string, newEvent: Omit<AppEvent, 'id'>, currentPoints: number) => {
    const tempId = Date.now().toString();
    setProfiles(prev => prev.map(p => p.id === profileId ? {
      ...p,
      events: [{ ...newEvent, id: tempId }, ...p.events],
      points: p.points + newEvent.points
    } : p));

    await supabase.from('events').insert({ profile_id: profileId, type: newEvent.type, points_change: newEvent.points, description: newEvent.desc, event_date: newEvent.date });
    await supabase.from('profiles').update({ total_points: currentPoints + newEvent.points }).eq('id', profileId);
  };

  const handleDeleteEvent = async (profileId: string, eventId: string, pointsToRevert: number, currentPoints: number) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? {
      ...p,
      events: p.events.filter(e => e.id !== eventId),
      points: p.points - pointsToRevert
    } : p));
    await supabase.from('events').delete().eq('id', eventId);
    await supabase.from('profiles').update({ total_points: currentPoints - pointsToRevert }).eq('id', profileId);
  };



  useEffect(() => {
    // Attempt to bypass browser autoplay restrictions by listening for ANY click on the page
    const enableAudio = () => {
      const audioEl = document.getElementById('bg-music') as HTMLAudioElement;
      if (audioEl && audioEl.paused) {
        if (appState === 'video' && videoRef.current) {
          // Sync audio with video if user interacts while video is playing
          audioEl.currentTime = videoRef.current.currentTime;
        }
        audioEl.play().catch(e => console.log("Autoplay prevented:", e));
      }
    };
    window.addEventListener('click', enableAudio);
    return () => window.removeEventListener('click', enableAudio);
  }, [appState]);

  useEffect(() => {
    // If we reach startMenu, ensure audio is at 30s
    if (appState === 'startMenu') {
      const audioEl = document.getElementById('bg-music') as HTMLAudioElement;
      if (audioEl && audioEl.currentTime < 30) {
        audioEl.currentTime = 30;
      }
    }
  }, [appState]);

  const handleRouletteResult = (effectId: string) => {
    console.log("Roulette spun: ", effectId);
    // TODO: Send to Supabase and show effect notification
  };

  const skipIntro = () => {
    const audioEl = document.getElementById('bg-music') as HTMLAudioElement;
    if (audioEl) {
      // Force audio to 30 seconds
      audioEl.currentTime = 30;
      if (audioEl.paused) {
        audioEl.play().catch(console.error);
      }
    }
    setAppState('startMenu');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 30) {
      skipIntro();
    }
  };

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center">
      <div
        className="relative w-full h-screen bg-[#101820] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* CRT Scanline Overlay for more GBA/Retro feel */}
        <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>

        {appState !== 'dashboard' && (
          <audio id="bg-music" src="/music_intro.mp3" autoPlay loop />
        )}

        <AnimatePresence mode="wait">
          {appState === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex items-center justify-center z-40"
            >
              <video
                ref={videoRef}
                src="/pokemon_intro.mp4"
                className="w-full h-full object-cover"
                autoPlay
                muted // Muted to ensure autoplay works on modern browsers, but bg-music plays over it
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={skipIntro}
              />
              <button
                onClick={skipIntro}
                className="absolute bottom-10 right-10 text-white/50 hover:text-white px-4 py-2 border border-white/50 rounded z-50 transition-colors"
                title="Skip Intro (Jumps to 30s of music)"
              >
                Skip
              </button>
            </motion.div>
          )}

          {appState === 'startMenu' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-between py-12 bg-black"
            >
              <div
                className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat opacity-80"
                style={{ backgroundImage: 'url(/bg.png)' }}
              />
              <motion.img
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                src="/logo.png"
                alt="Pokémon Z Ladder Logo"
                className="w-3/4 max-w-[600px] mt-16 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-10"
              />

              <motion.button
                onClick={() => setAppState('dashboard')}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="mb-24 hover:scale-110 transition-transform cursor-pointer z-10"
              >
                <img src="/start.png" alt="Press Start" className="w-[200px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </motion.button>
            </motion.div>
          )}

          {appState === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 p-6 overflow-y-auto"
              style={{
                backgroundImage: 'url(/fondo.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated'
              }}
            >
              <div className="relative flex items-center justify-center mb-8 w-full">
                <div
                  className="relative flex flex-col items-center justify-center p-6 pb-5 w-full max-w-4xl z-0"
                  style={{
                    backgroundImage: 'url(/titleheader.png)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                    minHeight: '130px'
                  }}
                >
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <h2 className="text-5xl font-bold gba-text text-[#f5c786] tracking-widest" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000, 3px 0 0 #000, 0 -3px 0 #000, -3px 0 0 #000, 4px 4px 0 #000' }}>
                      TABLA DE CLASIFICACIÓN
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <img src="/copa.png" className="h-[44px] w-auto filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)] -mt-2" alt="Copa" />
                      <h3 className="text-3xl font-bold gba-text text-[#82cfb8] tracking-widest leading-none pt-2" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000, 3px 0 0 #000, 0 -3px 0 #000, -3px 0 0 #000, 3px 3px 0 #000' }}>
                        LIGA POKEMON Z
                      </h3>
                      <img src="/logoliga.png" className="h-[40px] w-auto filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" alt="Liga" />
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 pr-2 z-10">
                  <button
                    onClick={() => setIsRouletteOpen(true)}
                    className="gba-button-blue"
                  >
                    RULETA Z
                  </button>
                  <button
                    onClick={() => setAppState('startMenu')}
                    className="gba-button"
                  >
                    SALIR
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {[...profiles].sort((a, b) => b.points - a.points).map((profile, index) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isLeading={index === 0 && profile.points > 0}
                    onToggleMedal={handleToggleMedal}
                    onAddEvent={handleAddEvent}
                    onDeleteEvent={handleDeleteEvent}
                  />
                ))}
              </div>
              <Roulette
                isOpen={isRouletteOpen}
                onClose={() => setIsRouletteOpen(false)}
                onResult={handleRouletteResult}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default App;

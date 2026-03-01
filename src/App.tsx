import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProfileCard } from './components/ProfileCard';
import { Roulette } from './components/Roulette';

export interface AppEvent {
  id: string;
  type: string;
  desc: string;
  points: number;
  date: string;
}

export interface ActiveEffect {
  id: string;
  label: string;
  color: string;
}

export interface Medal {
  id: string;
  name: string;
  obtained: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  medals: Medal[];
  events: AppEvent[];
  activeEffects: ActiveEffect[];
}

const initialProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Markel',
    avatar: '/markel.png',
    points: 120,
    medals: Array.from({ length: 8 }).map((_, i) => ({ id: `m${i}`, name: `Medal ${i + 1}`, obtained: i < 3 })),
    events: [
      { id: '1', type: 'Muerte', desc: 'Perdió a Pikachu contra el Líder', points: -10, date: '2023-10-25' },
      { id: '2', type: 'Medalla', desc: 'Consiguió la Medalla Roca', points: 20, date: '2023-10-23' },
    ],
    activeEffects: [
      { id: 'e1', label: '+2 Niveles', color: '#22c55e' }
    ]
  },
  {
    id: '2',
    name: 'Raul',
    avatar: '/raul.png',
    points: 90,
    medals: Array.from({ length: 8 }).map((_, i) => ({ id: `m${i}`, name: `Medal ${i + 1}`, obtained: i < 2 })),
    events: [
      { id: '3', type: 'Ventaja', desc: 'Encontró Poción Máxima', points: 0, date: '2023-10-24' }
    ],
    activeEffects: []
  },
  {
    id: '3',
    name: 'Xavi',
    avatar: '/xavi.png',
    points: -15,
    medals: Array.from({ length: 8 }).map((_, i) => ({ id: `m${i}`, name: `Medal ${i + 1}`, obtained: false })),
    events: [],
    activeEffects: [
      { id: 'e2', label: '-1 Poke en Gimnasio', color: '#f97316' }
    ]
  },
];

type AppState = 'video' | 'startMenu' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('video');
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
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
              <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-[#1a365d] via-[#2b6cb0] to-[#1a365d] p-4 rounded-lg border-4 border-[#e2e8f0] shadow-[0_6px_0_#0f172a,inset_0_4px_0_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-12 bg-yellow-400 rounded-sm shadow-[inset_2px_0_0_rgba(255,255,255,0.5),inset_-2px_0_0_rgba(0,0,0,0.3)]"></div>
                  <h2 className="text-5xl gba-text text-white tracking-widest" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                    POKEMON Z LADDER
                  </h2>
                </div>
                <div className="flex gap-4">
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
                    onUpdateProfile={handleUpdateProfile}
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

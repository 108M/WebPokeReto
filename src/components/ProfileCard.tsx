import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EventModal } from './EventModal';
import { EventHistoryModal } from './EventHistoryModal';
import type { UserProfile, AppEvent } from '../App';

interface ProfileCardProps {
    profile: UserProfile;
    isLeading: boolean;
    onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isLeading, onUpdateProfile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const handleEventSubmit = (eventDetails: any) => {
        console.log("Event submitted for", profile.name, eventDetails);
        // TODO: Connect to Supabase
    };

    const toggleMedal = (idx: number) => {
        const newMedals = [...profile.medals];
        newMedals[idx] = { ...newMedals[idx], obtained: !newMedals[idx].obtained };
        onUpdateProfile({ ...profile, medals: newMedals });
    };

    const removeEffect = (effectId: string) => {
        onUpdateProfile({
            ...profile,
            activeEffects: profile.activeEffects.filter(e => e.id !== effectId)
        });
    };

    const addEffect = (e: React.MouseEvent) => {
        e.stopPropagation();
        const label = window.prompt("Nombre de la ventaja/desventaja (ej: +2 Niveles):");
        if (!label) return;

        const isBad = label.toLowerCase().includes('menos') || label.includes('-');
        const color = isBad ? '#ef4444' : '#22c55e'; // red or green

        onUpdateProfile({
            ...profile,
            activeEffects: [
                ...profile.activeEffects,
                { id: Date.now().toString(), label, color }
            ]
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative w-full p-4 mb-4 ${isLeading ? 'gba-panel' : 'gba-panel-dark'}`}
            >
                <div className="flex flex-row justify-between items-center mb-2">
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors flex-1"
                        onClick={() => setIsHistoryModalOpen(true)}
                        title="Ver historial de eventos"
                    >
                        <img
                            src={profile.avatar}
                            alt={`${profile.name} avatar`}
                            className="w-20 h-20 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
                        />
                        <div>
                            <h3 className="text-3xl gba-text">{profile.name} {isLeading && '👑'}</h3>
                            <p className="text-xl gba-text text-[#306082]">{profile.points} PTS</p>

                            {/* Active Effects Display */}
                            <div className="flex gap-2 mt-2 flex-wrap items-center">
                                {profile.activeEffects && profile.activeEffects.map(effect => (
                                    <div
                                        key={effect.id}
                                        className="px-2 py-1 text-xs font-bold text-white rounded border border-white/20 flex items-center gap-1 shadow-sm"
                                        style={{ backgroundColor: effect.color }}
                                    >
                                        {effect.label}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeEffect(effect.id); }}
                                            className="ml-1 hover:text-black hover:scale-125 transition-transform"
                                            title="Eliminar ventaja/desventaja"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addEffect}
                                    className="px-2 py-1 text-xs font-bold text-white bg-[#808080] rounded border border-white/20 shadow-sm hover:scale-110 transition-transform"
                                    title="Añadir ventaja/desventaja"
                                >
                                    + Añadir Efecto
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="hover:scale-110 transition-transform ml-4"
                        title="Añadir nuevo evento"
                    >
                        <img src="/addbutton.png" alt="Add Event" className="w-16 h-16 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    </button>
                </div>

                <div className="mt-4 flex flex-row gap-2 justify-start items-center p-3 bg-black/10 rounded-lg inset-shadow-sm border-t-2 border-black/10">
                    {profile.medals.map((medal, idx) => {
                        const imageFileName = medal.obtained ? `medalla${idx + 1}-color.png` : `medalla${idx + 1}.png`;
                        const backgroundImage = `url(/${imageFileName})`;

                        return (
                            <div
                                key={medal.id || idx}
                                onClick={() => toggleMedal(idx)}
                                className={`w-12 h-12 inline-block filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:scale-110 transition-transform cursor-pointer ${medal.obtained ? '' : 'opacity-80 saturate-50'}`}
                                title={medal.name}
                                style={{
                                    backgroundImage,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                        );
                    })}
                </div>
            </motion.div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleEventSubmit}
            />

            <EventHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                playerName={profile.name}
                events={profile.events}
                onAddEvent={(newEvent: Omit<AppEvent, 'id'>) => {
                    const eventWithId = { ...newEvent, id: Date.now().toString() };
                    onUpdateProfile({
                        ...profile,
                        events: [eventWithId, ...profile.events],
                        points: profile.points + newEvent.points
                    });
                }}
                onDeleteEvent={(eventId: string, pointsToRevert: number) => {
                    onUpdateProfile({
                        ...profile,
                        events: profile.events.filter(e => e.id !== eventId),
                        points: profile.points - pointsToRevert
                    });
                }}
            />
        </>
    );
};

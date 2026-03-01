import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EventModal } from './EventModal';
import { EventHistoryModal } from './EventHistoryModal';
import type { UserProfile, AppEvent } from '../App';

interface ProfileCardProps {
    profile: UserProfile;
    isLeading: boolean;
    onToggleMedal: (profileId: string, badgeIndex: number, currentObtained: boolean) => void;
    onAddEvent: (profileId: string, newEvent: Omit<AppEvent, 'id'>, currentPoints: number) => void;
    onDeleteEvent: (profileId: string, eventId: string, pointsToRevert: number, currentPoints: number) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    isLeading,
    onToggleMedal,
    onAddEvent,
    onDeleteEvent
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const handleEventSubmit = (eventDetails: any) => {
        onAddEvent(profile.id, {
            type: eventDetails.type,
            desc: eventDetails.description,
            points: eventDetails.points,
            date: new Date().toISOString().split('T')[0]
        }, profile.points);
    };

    const toggleMedal = (idx: number) => {
        onToggleMedal(profile.id, idx, profile.medals[idx].obtained);
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
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

                            {/* Active Effects / Ventajas Display */}
                            <div className="flex gap-2 mt-2 flex-wrap items-center">
                                {profile.events && profile.events.filter(e => e.type === 'Ventaja' || e.type === 'Desventaja').map(effect => {
                                    const isBad = effect.type === 'Desventaja' || effect.points < 0;
                                    const color = isBad ? '#ef4444' : '#22c55e';
                                    return (
                                        <div
                                            key={effect.id}
                                            className="px-2 py-1 text-xs font-bold text-white rounded border border-white/20 flex items-center gap-1 shadow-sm"
                                            style={{ backgroundColor: color }}
                                        >
                                            {effect.desc}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(profile.id, effect.id, effect.points, profile.points); }}
                                                className="ml-1 hover:text-black hover:scale-125 transition-transform"
                                                title="Eliminar ventaja/desventaja"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
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
                    onAddEvent(profile.id, newEvent, profile.points);
                }}
                onDeleteEvent={(eventId: string, pointsToRevert: number) => {
                    onDeleteEvent(profile.id, eventId, pointsToRevert, profile.points);
                }}
            />
        </>
    );
};

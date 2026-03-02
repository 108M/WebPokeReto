import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EventModal } from './EventModal';
import { EventHistoryModal } from './EventHistoryModal';
import { PokemonSearchModal } from './PokemonSearchModal';
import type { UserProfile, AppEvent } from '../App';

interface ProfileCardProps {
    profile: UserProfile;
    isLeading: boolean;
    onToggleMedal: (profileId: string, badgeIndex: number, currentObtained: boolean) => void;
    onAddEvent: (profileId: string, newEvent: Omit<AppEvent, 'id'>, currentPoints: number) => void;
    onDeleteEvent: (profileId: string, eventId: string, pointsToRevert: number, currentPoints: number) => void;
    onAddPokemon: (profileId: string, slotIndex: number, pokemonName: string, spriteUrl: string) => void;
    onRemovePokemon: (profileId: string, slotIndex: number) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    isLeading,
    onToggleMedal,
    onAddEvent,
    onDeleteEvent,
    onAddPokemon,
    onRemovePokemon
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isPokemonSearchOpen, setIsPokemonSearchOpen] = useState(false);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

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
                className={`relative w-full p-2 md:p-4 mb-4 ${isLeading ? 'gba-panel' : 'gba-panel-dark'}`}
            >
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-2 gap-4 md:gap-0">
                    <div
                        className="flex flex-row items-center gap-2 md:gap-4 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors flex-1 w-full md:w-auto"
                        onClick={() => setIsHistoryModalOpen(true)}
                        title="Ver historial de eventos"
                    >
                        <img
                            src={profile.avatar}
                            alt={`${profile.name} avatar`}
                            className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
                        />
                        <div className="flex-1">
                            <h3 className="text-xl md:text-3xl gba-text mb-0 md:mb-1">{profile.name} {isLeading && '👑'}</h3>
                            <p className="text-lg md:text-xl gba-text text-[#306082] mt-0">{profile.points} PTS</p>

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

                    {/* Pokemon Team Area */}
                    <div className="flex flex-wrap md:flex-nowrap justify-center gap-1 md:gap-2 mx-auto md:mx-0 md:mr-4 bg-black/10 p-2 rounded-xl border-t-2 border-l-2 border-black/20 shadow-inner w-full md:w-auto">
                        {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
                            const pokemon = profile.pokemonTeam?.find(p => p.slot_index === slotIndex);
                            return (
                                <div
                                    key={`slot-${slotIndex}`}
                                    className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full border-2 border-black/30 flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors relative group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (pokemon) {
                                            if (window.confirm(`¿Quieres eliminar a ${pokemon.pokemon_name} de tu equipo?`)) {
                                                onRemovePokemon(profile.id, slotIndex);
                                            }
                                        } else {
                                            const usedSlots = new Set(profile.pokemonTeam?.map(p => p.slot_index) || []);
                                            let firstAvailableIndex = 0;
                                            while (firstAvailableIndex < 6 && usedSlots.has(firstAvailableIndex)) {
                                                firstAvailableIndex++;
                                            }
                                            if (firstAvailableIndex < 6) {
                                                setSelectedSlotIndex(firstAvailableIndex);
                                                setIsPokemonSearchOpen(true);
                                            } else {
                                                alert("¡Tu equipo ya está lleno!");
                                            }
                                        }
                                    }}
                                    title={pokemon ? `Slot ${slotIndex + 1}: ${pokemon.pokemon_name}` : `Añadir Pokémon (Slot ${slotIndex + 1})`}
                                >
                                    {pokemon ? (
                                        <>
                                            <img src={pokemon.sprite_url} alt={pokemon.pokemon_name} className="w-16 h-16 object-contain scale-[1.7]" style={{ imageRendering: 'pixelated' }} />
                                            {/* Hover Delete Icon */}
                                            <div className="absolute inset-0 bg-red-500/80 rounded-full hidden group-hover:flex items-center justify-center">
                                                <span className="text-white text-2xl font-bold">×</span>
                                            </div>
                                        </>
                                    ) : (
                                        <img src="/pokeball.png" alt="Empty slot" className="w-10 h-10 object-contain opacity-50 filter grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="absolute md:static top-2 right-2 md:top-auto md:right-auto hover:scale-110 transition-transform ml-0 md:ml-4 z-10"
                        title="Añadir nuevo evento"
                    >
                        <img src="/addbutton.png" alt="Add Event" className="w-12 h-12 md:w-16 md:h-16 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    </button>
                </div>

                <div className="mt-2 md:mt-4 flex flex-row flex-wrap md:flex-nowrap gap-1 md:gap-2 justify-center md:justify-start items-center p-2 md:p-3 bg-black/10 rounded-lg inset-shadow-sm border-t-2 border-black/10">
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

            <PokemonSearchModal
                isOpen={isPokemonSearchOpen}
                onClose={() => setIsPokemonSearchOpen(false)}
                onSelect={(pokemonName, spriteUrl) => {
                    if (selectedSlotIndex !== null) {
                        onAddPokemon(profile.id, selectedSlotIndex, pokemonName, spriteUrl);
                    }
                    setIsPokemonSearchOpen(false);
                }}
            />
        </>
    );
};

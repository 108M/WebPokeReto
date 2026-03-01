import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppEvent } from '../App';

interface EventHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerName: string;
    events: AppEvent[];
    onAddEvent: (event: Omit<AppEvent, 'id'>) => void;
    onDeleteEvent: (eventId: string, pointsToRevert: number) => void;
}

export const EventHistoryModal: React.FC<EventHistoryModalProps> = ({ isOpen, onClose, playerName, events, onAddEvent, onDeleteEvent }) => {
    const [newType, setNewType] = useState('Ventaja');
    const [newDesc, setNewDesc] = useState('');
    const [newPoints, setNewPoints] = useState(0);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onAddEvent({
            type: newType,
            desc: newDesc,
            points: newPoints,
            date: new Date().toISOString().split('T')[0]
        });
        setNewDesc('');
        setNewPoints(0);
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="gba-panel w-full max-w-2xl max-h-[80vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6 border-b-4 border-[#808080] pb-2">
                            <h2 className="text-3xl gba-text text-[#306082]">Historial: {playerName}</h2>
                            <button
                                onClick={onClose}
                                className="text-3xl gba-text text-red-600 hover:text-red-800 hover:scale-110 transition-transform"
                            >
                                X
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                            {events.length === 0 ? (
                                <p className="text-center text-gray-500 italic py-4">No hay eventos registrados.</p>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="bg-black/5 p-4 rounded border-2 border-black/10 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-1 text-sm text-white rounded font-bold ${event.type === 'Muerte' ? 'bg-red-500' : event.type === 'Medalla' ? 'bg-yellow-500 text-black' : 'bg-green-500'}`}>
                                                    {event.type}
                                                </span>
                                                <span className="text-sm text-gray-500">{event.date}</span>
                                            </div>
                                            <p className="text-xl gba-text">{event.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-2xl gba-text font-bold ${event.points < 0 ? 'text-red-500' : event.points > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                                {event.points > 0 ? '+' : ''}{event.points !== 0 ? event.points : '-'} PTS
                                            </div>
                                            <button
                                                onClick={() => onDeleteEvent(event.id, event.points)}
                                                className="text-red-500 hover:text-red-700 font-bold text-xl px-2 hover:bg-red-100 rounded transition-colors"
                                                title="Eliminar evento"
                                            >
                                                X
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Event Form */}
                        <form onSubmit={handleAdd} className="bg-[#f0f0f0] p-4 rounded border-4 border-[#c0c0c0] flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                                <select className="w-full p-2 border-2 border-gray-400 rounded focus:border-blue-500 outline-none" value={newType} onChange={e => setNewType(e.target.value)}>
                                    <option value="Ventaja">Ventaja</option>
                                    <option value="Desventaja">Desventaja</option>
                                    <option value="Muerte">Muerte</option>
                                    <option value="Medalla">Medalla</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <input required type="text" className="w-full p-2 border-2 border-gray-400 rounded focus:border-blue-500 outline-none" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ej: Capturó a Pidgey" />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Puntos</label>
                                <input type="number" className="w-full p-2 border-2 border-gray-400 rounded focus:border-blue-500 outline-none" value={newPoints} onChange={e => setNewPoints(parseInt(e.target.value) || 0)} />
                            </div>
                            <button type="submit" className="gba-button text-sm px-4 py-2 self-end mb-[2px]">
                                AÑADIR
                            </button>
                        </form>

                        <div className="mt-6 flex justify-end">
                            <button onClick={onClose} className="gba-button">
                                CERRAR
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

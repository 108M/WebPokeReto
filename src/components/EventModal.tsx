import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventDetails: any) => void;
}

const EVENT_TYPES = [
    { id: 'Muerte', name: 'Muerte de Pokémon (-10)', points: -10 },
    { id: 'Ventaja', name: 'Ventaja Manual', points: 0 },
    { id: 'Desventaja', name: 'Desventaja Manual', points: 0 },
    { id: 'Otros', name: 'Otros (Personalizado)', points: 0 },
];

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [selectedEvent, setSelectedEvent] = useState(EVENT_TYPES[0]);
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            type: selectedEvent.id,
            points: parseInt(selectedEvent.points?.toString() || "0") || 0,
            description
        });
        setDescription('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    {/* Click outside to close */}
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="w-[95%] sm:w-full max-w-md gba-panel z-10 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-[#3080c0] text-white p-3 border-4 border-[#103050] rounded inset-shadow-sm mb-4">
                            <h2 className="text-2xl text-center gba-text-white">REGISTRAR EVENTO</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-1 sm:p-2 flex flex-col gap-2 sm:gap-4">
                            <div className="flex flex-col gap-1 sm:gap-2">
                                <label className="text-lg sm:text-xl gba-text">TIPO DE EVENTO:</label>
                                <select
                                    className="p-1 sm:p-2 border-4 border-[#a0a0a0] bg-white rounded font-[var(--font-gba)] text-lg sm:text-xl gba-text"
                                    value={selectedEvent.id}
                                    onChange={(e) => setSelectedEvent(EVENT_TYPES.find(ev => ev.id === e.target.value) || EVENT_TYPES[0])}
                                >
                                    {EVENT_TYPES.map(ev => (
                                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1 sm:gap-2">
                                <label className="text-lg sm:text-xl gba-text">DESCRIPCIÓN (Opcional):</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Pikachu murió"
                                    className="p-1 sm:p-2 border-4 border-[#a0a0a0] bg-white rounded font-[var(--font-gba)] text-lg sm:text-xl gba-text focus:outline-none focus:border-[#3080c0]"
                                />
                            </div>

                            <div className="flex flex-col gap-1 sm:gap-2">
                                <label className="text-lg sm:text-xl gba-text">PUNTOS:</label>
                                <input
                                    type="number"
                                    value={selectedEvent.points}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, points: e.target.value as any })}
                                    className="p-1 sm:p-2 border-4 border-[#a0a0a0] bg-white rounded font-[var(--font-gba)] text-lg sm:text-xl gba-text focus:outline-none focus:border-[#3080c0]"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4 sm:mt-8 pb-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="gba-button w-full sm:w-auto text-sm sm:text-base py-2"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="gba-button-red w-full sm:w-auto text-sm sm:text-base py-2"
                                >
                                    CONFIRMAR
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PokemonSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pokemonName: string, spriteUrl: string) => void;
}

export const PokemonSearchModal: React.FC<PokemonSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<{ name: string, sprite: string } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setPreview(null);

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm.trim().toLowerCase()}`);
            if (!response.ok) {
                throw new Error('Pokémon no encontrado');
            }
            const data = await response.json();
            // Try to get front_default, or official artwork as fallback
            const sprite = data.sprites.front_default || data.sprites.other['official-artwork'].front_default;

            if (sprite) {
                setPreview({
                    name: data.name,
                    sprite: sprite
                });
            } else {
                setError('No se pudo encontrar el sprite.');
            }
        } catch (err: any) {
            setError(err.message || 'Error al buscar el Pokémon');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (preview) {
            // Capitalize first letter
            const formattedName = preview.name.charAt(0).toUpperCase() + preview.name.slice(1);
            onSelect(formattedName, preview.sprite);
            setSearchTerm('');
            setPreview(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="gba-panel max-w-md w-full"
                >
                    <div className="flex justify-between items-center mb-6 border-b-2 border-black/10 pb-2">
                        <h2 className="text-2xl gba-text mb-0">Buscar Pokémon</h2>
                        <button onClick={onClose} className="text-xl font-bold hover:scale-110 hover:text-red-500 transition-transform">
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej. pikachu)"
                            className="flex-1 px-3 py-2 border-2 border-black/20 rounded bg-white/90 text-xl shadow-inner focus:outline-none focus:border-blue-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded gba-button text-xl font-bold disabled:opacity-50"
                            style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                            disabled={loading}
                        >
                            {loading ? '...' : 'Buscar'}
                        </button>
                    </form>

                    {error && (
                        <div className="text-red-500 font-bold mb-4 bg-red-100 p-2 rounded border border-red-300">
                            {error}
                        </div>
                    )}

                    {preview && (
                        <div className="flex flex-col items-center bg-black/5 p-4 rounded-xl border-2 border-dashed border-black/20">
                            <img
                                src={preview.sprite}
                                alt={preview.name}
                                className="w-32 h-32 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                            />
                            <h3 className="text-2xl font-bold capitalize mt-2">{preview.name}</h3>
                            <button
                                onClick={handleConfirm}
                                className="mt-4 w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-lg gba-button text-2xl font-bold tracking-wide"
                                style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                            >
                                Añadir al Equipo
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RouletteProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (effect: string) => void;
}

const ROULETTE_EFFECTS = [
    { id: 'reroll_ruta', label: 'REROLL POKEMON DE RUTA', color: '#000000', chance: 25 }, // (0, 0, 0)
    { id: 'niveles_mas', label: '2-3 NIVELES MAS', color: '#a52a2a', chance: 15 }, // (165, 42, 42) ~ 0.1499 -> 15%
    { id: 'banear_rival', label: 'BANEAR POKEMON DEL RIVAL', color: '#808080', chance: 5 }, // (128, 128, 128)
    { id: 'revivir_poke', label: 'REVIVIR POKEMON', color: '#00ff00', chance: 20 }, // (0, 255, 0)
    { id: 'poke_menos', label: '1 POKEMON MENOS', color: '#ffa500', chance: 10 }, // (255, 165, 0)
    { id: 'captura_libre', label: 'CAPTURA LIBRE', color: '#ffc0cb', chance: 3 }, // (255, 192, 203)
    { id: 'ban_captura', label: 'BAN DE CAPTURA', color: '#800080', chance: 12 }, // (128, 0, 128)
    { id: 'res_locke', label: 'RES LOCKE', color: '#330033', chance: 1 }, // (51, 0, 51) "Rojo" Oscuro
    { id: 'objetos_adicionales', label: 'OBJETOS ADICIONALES', color: '#00008b', chance: 10 }, // (0, 0, 139)
];

export const Roulette: React.FC<RouletteProps> = ({ isOpen, onClose, onResult }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<typeof ROULETTE_EFFECTS[0] | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const spinRoulette = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setResult(null);

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        }

        // Simulated RNG based on weights
        setTimeout(() => {
            const rand = Math.random() * 100;
            let cum = 0;
            let selected = ROULETTE_EFFECTS[0];
            for (const effect of ROULETTE_EFFECTS) {
                cum += effect.chance;
                if (rand < cum) {
                    selected = effect;
                    break;
                }
            }

            setResult(selected);
            setIsSpinning(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            onResult(selected.id);
        }, 5000); // 5 second spin animation
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <audio ref={audioRef} src="/ruleta.mp3" preload="auto" />
                    <motion.div
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full max-w-lg gba-panel flex flex-col items-center"
                    >
                        <h2 className="text-4xl gba-text mb-8 tracking-widest text-shadow-sm">RULETA Z</h2>

                        <div className="relative w-64 h-64 mb-8">
                            <motion.div
                                animate={{ rotate: isSpinning ? 360 * 8 : 0 }}
                                transition={{ duration: 5, ease: 'easeOut' }}
                                className="w-full h-full rounded-full border-4 border-white overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                                style={{
                                    background: 'conic-gradient(' + ROULETTE_EFFECTS.map((e, i, arr) =>
                                        `${e.color} ${(i / arr.length) * 100}% ${((i + 1) / arr.length) * 100}%`
                                    ).join(', ') + ')'
                                }}
                            />
                            {/* Pointer */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg z-10" />
                        </div>

                        <div className="h-16 flex items-center justify-center w-full">
                            {result ? (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-2xl text-center px-6 py-3 gba-panel-dark rounded-lg border-2 font-bold transform transition-transform"
                                    style={{ borderColor: result.color, color: result.color }}
                                >
                                    {result.label}
                                </motion.div>
                            ) : (
                                <p className="text-xl gba-text text-[#808080]">Pulsa Girar para probar tu suerte</p>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8 w-full justify-center">
                            <button
                                onClick={onClose}
                                disabled={isSpinning}
                                className="gba-button disabled:opacity-50"
                            >
                                CERRAR
                            </button>
                            <button
                                onClick={spinRoulette}
                                disabled={isSpinning || result !== null}
                                className="gba-button-blue disabled:opacity-50 text-2xl px-6"
                            >
                                GIRAR
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface RouletteProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (effect: string) => void;
}

interface RouletteEffect {
    id: string;
    db_id: string;
    label: string;
    color: string;
    chance: number;
    description?: string;
    apiItem?: string;
}

const DEFAULT_EFFECTS: Partial<RouletteEffect>[] = [
    { label: 'REROLL POKEMON RUTA', color: '#000000', chance: 20, description: 'Reroll del primer Pokémon de ruta. Implica que tu siguiente Pokémon de ruta contará como el primero así que se sigue aplicando la norma (2). Aplica sí o sí a la siguiente zona de captura.' },
    { label: '2-3 NIVELES MAS', color: '#a52a2a', chance: 15, apiItem: 'rare-candy', description: 'Entre 2 y 3 niveles más para el gimnasio para la mitad del equipo. Se elige 2 o 3 mediante RNG. Si el número de pokemons es impar, se redondea a la baja y el 0.5 se compensa.' },
    { label: 'BANEAR POKEMON RIVAL', color: '#808080', chance: 5, description: 'Banear un Pokémon de un rival, sin RNG, que no podrá ir ni al gimnasio ni al Showdown.' },
    { label: 'REVIVIR POKEMON', color: '#00ff00', chance: 15, apiItem: 'revive', description: 'Revivir un Pokémon.' },
    { label: '1 POKEMON MENOS', color: '#ffa500', chance: 8, description: 'Un rival tendrá que usar 1 Pokémon menos en el siguiente gimnasio. Mediante RNG se elige el Pokémon del equipo a dejar en el PC.' },
    { label: 'CAPTURA LIBRE', color: '#ffc0cb', chance: 3, apiItem: 'master-ball', description: 'Poder capturar el pokémon que quieras MENOS REPETIDOS de las rutas visitadas o la inmediatamente siguiente.' },
    { label: 'BAN DE CAPTURA', color: '#800080', chance: 12, description: 'El ganador elige un rival y decidirá si el pokemon de ruta inmediatamente siguiente lo puede capturar o tiene que hacer reroll.' },
    { label: 'RES LOCKE', color: '#330033', chance: 1, apiItem: 'max-revive', description: 'Revivir el locke (+80 puntos) (1 %).' },
    { label: 'OBJETOS ADICIONALES', color: '#00008b', chance: 10, apiItem: 'potion', description: 'Para el lider de gimnasio puedes usar pociones y demas objetos sin penalizar (los encontrados, no comprados).' },
    { label: 'COMPRAR OBJETOS', color: '#008b8b', chance: 6, apiItem: 'fresh-water', description: 'Puedes comprar 5 objetos libres que curen estados o vida.' },
    { label: 'TIRAR POCIONES', color: '#8b0000', chance: 5, apiItem: 'potion', description: 'Se deshace de (1-3) pociones de más alto rango según el gimnasio actual.' },
];

export const Roulette: React.FC<RouletteProps> = ({ isOpen, onClose, onResult }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<RouletteEffect | null>(null);
    const [effects, setEffects] = useState<RouletteEffect[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Result details
    const [resultSprite, setResultSprite] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [availableItems, setAvailableItems] = useState<string[]>([]);

    // Form State
    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState('#ff0000');
    const [newChance, setNewChance] = useState(10);
    const [newDescription, setNewDescription] = useState('');
    const [newApiItem, setNewApiItem] = useState('');
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<RouletteEffect>>({});
    
    // Picker Modal State
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerCb, setPickerCb] = useState<((val: string) => void) | null>(null);
    const [pickerSearch, setPickerSearch] = useState('');

    const [currentRotation, setCurrentRotation] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Fetch master list of pokemon items
    useEffect(() => {
        fetch('https://pokeapi.co/api/v2/item?limit=2500')
            .then(r => r.json())
            .then(data => {
                if (data.results) setAvailableItems(data.results.map((i: any) => i.name));
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchEffects();
        } else {
            setIsSettingsOpen(false);
            setResult(null);
            setShowDetails(false);
            setPickerOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (result && result.apiItem) {
            setResultSprite(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${result.apiItem.toLowerCase().trim()}.png`);
        } else {
            setResultSprite(null);
        }
    }, [result]);

    const fetchEffects = async () => {
        const { data, error } = await supabase.from('rules').select('*').order('created_at', { ascending: true });

        if (!error && data) {
            const parsedEffects: RouletteEffect[] = [];
            data.forEach(rule => {
                const text = rule.rule_text;
                if (text.startsWith('RULETA_JSON:')) {
                    try {
                        const json = JSON.parse(text.replace('RULETA_JSON:', ''));
                        parsedEffects.push({
                            id: rule.id,
                            db_id: rule.id,
                            label: json.label,
                            color: json.color,
                            chance: Number(json.chance),
                            description: json.description || '',
                            apiItem: json.apiItem || ''
                        });
                    } catch (e) { console.error(e); }
                }
            });

            if (parsedEffects.length === 0) await seedDefaults();
            else setEffects(parsedEffects);
        }
    };

    const seedDefaults = async () => {
        const { data: existing } = await supabase.from('rules').select('id, rule_text');
        if (existing) {
            const toDel = existing.filter(r => r.rule_text.startsWith('RULETA_JSON:')).map(r => r.id);
            if (toDel.length > 0) await supabase.from('rules').delete().in('id', toDel);
        }
        const inserts = DEFAULT_EFFECTS.map(effect => ({ rule_text: 'RULETA_JSON:' + JSON.stringify(effect) }));
        await supabase.from('rules').insert(inserts);
        fetchEffects();
    };

    const handleAddEffect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        const effectData = { label: newLabel, color: newColor, chance: newChance, description: newDescription, apiItem: newApiItem };
        const tempId = Date.now().toString();
        
        setEffects(prev => [...prev, { id: tempId, db_id: tempId, ...effectData }]);
        setNewLabel(''); setNewDescription(''); setNewApiItem('');
        
        const { error } = await supabase.from('rules').insert({ rule_text: 'RULETA_JSON:' + JSON.stringify(effectData) });
        if (error) setEffects(prev => prev.filter(r => r.id !== tempId));
        else fetchEffects();
    };

    const handleDeleteEffect = async (id: string, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setEffects(prev => prev.filter(r => r.id !== id));
        await supabase.from('rules').delete().eq('id', id);
    };

    const startEdit = (effect: RouletteEffect) => {
        setEditingId(effect.id);
        setEditForm({ ...effect });
    };

    const saveEdit = async (id: string) => {
        if (!editForm.label?.trim()) { setEditingId(null); return; }
        const effectData = { label: editForm.label, color: editForm.color, chance: editForm.chance, description: editForm.description, apiItem: editForm.apiItem };
        setEffects(prev => prev.map(r => r.id === id ? { ...r, ...effectData } as RouletteEffect : r));
        setEditingId(null);
        await supabase.from('rules').update({ rule_text: 'RULETA_JSON:' + JSON.stringify(effectData) }).eq('id', id);
    };

    const spinRoulette = () => {
        if (isSpinning || effects.length === 0) return;
        setIsSpinning(true); setResult(null); setShowDetails(false);

        const totalChance = effects.reduce((acc, curr) => acc + curr.chance, 0);
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const rand = (randomBuffer[0] / (0xffffffff + 1)) * totalChance;
        
        let cum = 0, selected = effects[0], startCum = 0;
        for (const effect of effects) {
            startCum = cum; cum += effect.chance;
            if (rand < cum) { selected = effect; break; }
        }

        const startPercent = (startCum / totalChance) * 100;
        const endPercent = (cum / totalChance) * 100;
        const randomPointPercent = startPercent + (Math.random() * (endPercent - startPercent));
        const stopAngle = 360 - (randomPointPercent * 3.6);
        const baseRotation = Math.floor(currentRotation / 360) * 360;
        setCurrentRotation(baseRotation + (360 * 8) + stopAngle);

        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(console.error); }

        setTimeout(() => {
            setResult(selected); setIsSpinning(false);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            onResult(selected.id);
        }, 5000);
    };

    const wheelBackground = `conic-gradient(${(() => {
        const totalChance = effects.reduce((sum, e) => sum + e.chance, 0);
        let currentCum = 0;
        return effects.map(e => {
            const startP = (currentCum / totalChance) * 100;
            currentCum += e.chance;
            const endP = (currentCum / totalChance) * 100;
            return `${e.color} ${startP}% ${endP}%`;
        }).join(', ');
    })()})`;

    const openItemCombo = (cb: (v: string) => void) => {
        setPickerCb(() => cb);
        setPickerSearch('');
        setPickerOpen(true);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={(e) => {
                        // Cierra si se hace click en el fondo opaco y no esta girando
                        if (e.target === e.currentTarget && !isSpinning && !pickerOpen) {
                            onClose();
                        }
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
                >
                    <audio ref={audioRef} src="/ruleta.mp3" preload="auto" />
                    
                    {!isSettingsOpen ? (
                        <motion.div initial={{ scale: 0.8, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8, opacity: 0 }} className="w-[95%] md:w-full max-w-lg gba-panel flex flex-col items-center p-4 md:p-6 relative pointer-events-auto">
                            <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 right-4 text-2xl md:text-3xl hover:scale-110 transition-transform opacity-70 hover:opacity-100" title="Ajustes de Ruleta">⚙️</button>
                            <h2 className="text-3xl md:text-4xl gba-text mb-4 md:mb-6 tracking-widest text-[#306082]">RULETA Z</h2>

                            <div className="relative flex flex-col items-center mb-6 md:mb-8 w-full mt-4">
                                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                                    <div className="absolute inset-0 rounded-full border-[12px] md:border-[18px] border-[#c17743] bg-[#3a1d0d] shadow-[inset_0_0_0_4px_#3a1d0d,inset_0_0_10px_black]" />
                                    
                                    <div className="absolute inset-0 pointer-events-none z-20 rounded-full">
                                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                            <div key={i} className="absolute w-full h-full flex items-start justify-center" style={{ transform: `rotate(${angle}deg)` }}>
                                                <div className={`mt-1 md:mt-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black ${i % 3 === 0 ? 'bg-yellow-300' : i % 3 === 1 ? 'bg-[#ff6bc1]' : 'bg-[#40b0ff]'} shadow-[0_0_5px_rgba(255,255,255,0.9)]`} />
                                            </div>
                                        ))}
                                    </div>

                                    {effects.length > 0 ? (
                                        <motion.div animate={{ rotate: currentRotation }} transition={{ duration: 5, ease: 'easeOut' }} className="w-[calc(100%-24px)] h-[calc(100%-24px)] md:w-[calc(100%-36px)] md:h-[calc(100%-36px)] rounded-full overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] z-10">
                                            {/* Pixel art checkerboard overlay pattern */}
                                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }} />
                                            <div className="absolute inset-0 -z-10" style={{ background: wheelBackground }} />
                                            
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-4 md:border-[6px] border-[#2b2b2b] flex flex-col overflow-hidden shadow-2xl">
                                                <div className="w-full h-1/2 bg-[#ee1515] border-b-2 md:border-b-[3px] border-[#2b2b2b]"></div>
                                                <div className="w-full h-1/2 bg-white border-t-2 md:border-t-[3px] border-[#2b2b2b]"></div>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full border-4 md:border-[5px] border-[#2b2b2b] shadow-inner"></div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="w-[calc(100%-24px)] h-[calc(100%-24px)] md:w-[calc(100%-36px)] md:h-[calc(100%-36px)] rounded-full bg-gray-300 flex items-center justify-center text-center p-4 z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
                                            <p className="font-bold text-gray-500">Sin opciones</p>
                                        </div>
                                    )}
                                    
                                    <div className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_2px_rgba(0,0,0,0.6)] flex justify-center">
                                        <div className="absolute top-0 w-0 h-0 border-l-[18px] md:border-l-[24px] border-r-[18px] md:border-r-[24px] border-t-[40px] md:border-t-[50px] border-l-transparent border-r-transparent border-t-black" />
                                        <div className="absolute top-[4px] w-0 h-0 border-l-[13px] md:border-l-[18px] border-r-[13px] md:border-r-[18px] border-t-[30px] md:border-t-[40px] border-l-transparent border-r-transparent border-t-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-[4rem] w-full px-2 mb-4">
                                {result ? (
                                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col gap-2 items-center bg-black/5 p-3 rounded-lg border-2 border-black/20 w-full">
                                        <div className="flex items-center gap-3 w-full justify-center">
                                            {resultSprite && <img src={resultSprite} alt={result.label} className="w-10 h-10 pixelated drop-shadow-md" />}
                                            <h3 className="text-xl md:text-2xl font-bold text-center" style={{ color: result.color }}>{result.label}</h3>
                                        </div>
                                        {result.description && (
                                            <div className="w-full">
                                                <button onClick={() => setShowDetails(!showDetails)} className="text-sm font-bold text-blue-600 underline text-center w-full mb-1">
                                                    {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                                                </button>
                                                {showDetails && <p className="text-sm gba-text bg-white p-2 rounded border border-gray-300 w-full text-center max-h-24 overflow-y-auto shadow-inner">{result.description}</p>}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <p className="text-lg md:text-xl gba-text text-[#808080] text-center">{effects.length > 0 ? "Pulsa Girar para probar tu suerte" : "Añade opciones en los ajustes"}</p>
                                )}
                            </div>

                            <div className="flex gap-2 sm:gap-4 w-full justify-center">
                                <button onClick={onClose} disabled={isSpinning} className="gba-button disabled:opacity-50">CERRAR</button>
                                <button onClick={spinRoulette} disabled={isSpinning || effects.length === 0} className="gba-button-blue disabled:opacity-50 text-2xl px-6">GIRAR</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-[95%] md:w-full max-w-4xl max-h-[90vh] gba-panel flex flex-col p-4 md:p-6 overflow-hidden relative pointer-events-auto">
                            <div className="flex justify-between items-center mb-4 border-b-4 border-[#808080] pb-2 shrink-0">
                                <h2 className="text-xl md:text-2xl gba-text text-[#306082] mt-1">AJUSTES RULETA</h2>
                                <div className="flex gap-2">
                                    <button onClick={seedDefaults} className="text-xs gba-text text-red-600 hover:scale-110 mr-2">RESTAURAR</button>
                                    <button onClick={() => setIsSettingsOpen(false)} className="text-xl gba-text hover:scale-110">X</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 relative">
                                {effects.map(eff => (
                                    <div key={eff.id} className="bg-black/5 p-2 rounded border-2 border-black/10 flex flex-col gap-2 relative">
                                        {editingId === eff.id ? (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <input value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} className="flex-1 w-full p-2 border-2 border-green-500 rounded font-[var(--font-gba)] text-base" placeholder="Título corto" />
                                                    <div className="flex gap-3">
                                                        <input type="number" value={editForm.chance} onChange={e => setEditForm({...editForm, chance: Number(e.target.value)})} className="w-24 p-2 border-2 border-green-500 rounded font-[var(--font-gba)] text-base" placeholder="%" />
                                                        <input type="color" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="w-14 h-11 p-0 cursor-pointer rounded" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button type="button" onClick={() => openItemCombo((v) => setEditForm({...editForm, apiItem: v}))} className="flex-1 w-full flex items-center justify-start gap-2 p-2 border-2 border-green-500 bg-white rounded font-[var(--font-gba)] text-sm text-gray-600 overflow-hidden">
                                                        {editForm.apiItem ? (
                                                            <><img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${editForm.apiItem.toLowerCase()}.png`} className="w-6 h-6 pixelated" alt="icon"/> <span className="truncate">{editForm.apiItem}</span></>
                                                        ) : (
                                                            <><div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" /> <span className="truncate">Elegir ícono Pokémon...</span></>
                                                        )}
                                                    </button>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <button onClick={() => saveEdit(eff.id)} className="gba-button flex-1 sm:flex-none !py-2 !px-4 !bg-green-500 !text-sm">OK</button>
                                                        <button onClick={() => setEditingId(null)} className="gba-button flex-1 sm:flex-none !py-2 !px-4 !text-sm">X</button>
                                                    </div>
                                                </div>
                                                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-2 border-2 border-green-500 rounded font-[var(--font-gba)] text-sm min-h-[60px]" placeholder="Explicación detallada de la regla..." />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full border-2 border-black/50 shrink-0" style={{ backgroundColor: eff.color }} />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="gba-text text-base md:text-lg truncate">{eff.label} <span className="text-gray-400 text-sm">({eff.chance}%)</span></p>
                                                    {(eff.description || eff.apiItem) && (
                                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                            {eff.apiItem && <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${eff.apiItem}.png`} className="w-6 h-6 inline pixelated drop-shadow-md" alt="icon" />}
                                                            <span className="truncate">{eff.description}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <button onClick={() => startEdit(eff)} className="text-blue-600 font-bold px-3 py-2 shrink-0 hover:bg-blue-100 rounded text-xl">✎</button>
                                                <button onClick={() => handleDeleteEffect(eff.id, undefined)} className="text-red-500 font-bold px-3 py-2 shrink-0 hover:bg-red-100 rounded text-xl">X</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddEffect} className="bg-[#e0e0e0] p-3 rounded border-4 border-[#c0c0c0] flex flex-col gap-3 shrink-0">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input required type="text" placeholder="Título corto" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="flex-1 w-full p-2 border-2 border-gray-400 rounded text-base font-[var(--font-gba)]" />
                                    <div className="flex gap-3">
                                        <input required type="number" min="1" placeholder="%" value={newChance} onChange={e => setNewChance(Number(e.target.value))} className="w-24 p-2 border-2 border-gray-400 rounded text-base font-[var(--font-gba)]" />
                                        <input required type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-14 h-11 p-0 rounded" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button type="button" onClick={() => openItemCombo(setNewApiItem)} className="w-full sm:w-1/3 md:w-1/4 flex items-center justify-start gap-2 p-2 border-2 border-gray-400 bg-white rounded font-[var(--font-gba)] text-sm text-gray-600 overflow-hidden">
                                        {newApiItem ? (
                                            <><img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${newApiItem.toLowerCase()}.png`} className="w-6 h-6 pixelated" alt="icon"/> <span className="truncate">{newApiItem}</span></>
                                        ) : (
                                            <><div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" /> <span className="truncate">Buscar Icono...</span></>
                                        )}
                                    </button>
                                    <input type="text" placeholder="Descripción detallada" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="flex-1 w-full p-2 border-2 border-gray-400 rounded text-sm font-[var(--font-gba)]" />
                                </div>
                                <button type="submit" className="gba-button text-sm py-2 mt-2">AÑADIR A LA RULETA</button>
                            </form>

                            {/* Item Picker Modal (Inside Settings) */}
                            {pickerOpen && (
                                <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 rounded-lg backdrop-blur-sm pointer-events-auto">
                                    <div className="bg-white rounded border-4 border-gray-700 w-full max-w-2xl p-4 flex flex-col max-h-[90%]">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-lg">Selecciona un icono</h3>
                                            <button onClick={() => setPickerOpen(false)} className="text-red-500 font-bold hover:scale-110 px-2 text-xl">X</button>
                                        </div>
                                        <input 
                                            type="text" autoFocus placeholder="Empieza a escribir..." 
                                            value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} 
                                            className="w-full p-3 border-2 border-gray-300 rounded mb-3 text-base outline-none focus:border-blue-500" 
                                        />
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto bg-gray-100 p-4 rounded border border-gray-200" style={{ maxHeight: '60vh' }}>
                                            <button type="button" onClick={() => { pickerCb?.(''); setPickerOpen(false); }} className="col-span-3 sm:col-span-4 md:col-span-5 lg:col-span-6 p-2 text-sm font-bold text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-200 mb-2">
                                                LIMPIAR SELECCIÓN
                                            </button>
                                            {availableItems.filter(i => i.includes(pickerSearch.toLowerCase())).map(item => (
                                                <button 
                                                    key={item} type="button" 
                                                    onClick={() => { pickerCb?.(item); setPickerOpen(false); }} 
                                                    className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white hover:bg-blue-100 rounded border border-gray-300 transition-colors w-full h-full text-center" title={item}
                                                >
                                                    <img 
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item}.png`} 
                                                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain pixelated relative shrink-0 mx-auto" 
                                                        loading="lazy" 
                                                        alt={item} 
                                                        onError={(e) => {
                                                            const target = e.currentTarget as HTMLImageElement;
                                                            if (target.parentElement) {
                                                                target.parentElement.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                    <span className="hidden sm:block text-xs font-medium text-gray-600 mt-2 truncate w-full text-center">{item}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

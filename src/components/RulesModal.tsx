import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Rule {
    id: string;
    rule_text: string;
    created_at: string;
}

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [newRule, setNewRule] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchRules();
        }
    }, [isOpen]);

    const fetchRules = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('rules')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) {
            setRules(data);
        }
        setIsLoading(false);
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRule.trim()) return;

        // Optimistic UI update
        const tempId = Date.now().toString();
        const ruleToAdd = { id: tempId, rule_text: newRule, created_at: new Date().toISOString() };
        setRules(prev => [...prev, ruleToAdd]);
        setNewRule('');

        const { error } = await supabase
            .from('rules')
            .insert({ rule_text: ruleToAdd.rule_text });

        if (error) {
            // Revert on error
            setRules(prev => prev.filter(r => r.id !== tempId));
            console.error('Error adding rule:', error);
        } else {
            fetchRules(); // Refetch to get actual UUID
        }
    };

    const handleDeleteRule = async (id: string) => {
        // Optimistic UI update
        const previousRules = [...rules];
        setRules(prev => prev.filter(r => r.id !== id));

        const { error } = await supabase
            .from('rules')
            .delete()
            .eq('id', id);

        if (error) {
            // Revert on error
            setRules(previousRules);
            console.error('Error deleting rule:', error);
        }
    };
    
    const startEdit = (rule: Rule) => {
        setEditingId(rule.id);
        const text = rule.rule_text.toUpperCase().startsWith('RULETA:') 
            ? rule.rule_text.replace(/^RULETA:\s*/i, '')
            : rule.rule_text;
        setEditText(text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleSaveEdit = async (id: string, originalText: string) => {
        if (!editText.trim()) {
            cancelEdit();
            return;
        }

        const isRuleta = originalText.toUpperCase().startsWith('RULETA:');
        const finalRuleText = isRuleta ? `RULETA: ${editText}` : editText;

        // Optimistic update
        const previousRules = [...rules];
        setRules(prev => prev.map(r => r.id === id ? { ...r, rule_text: finalRuleText } : r));
        setEditingId(null);

        const { error } = await supabase
            .from('rules')
            .update({ rule_text: finalRuleText })
            .eq('id', id);

        if (error) {
            setRules(previousRules);
            console.error('Error updating rule:', error);
        }
    };

    // Filter out internal RULETA_JSON configurations. Old RULETA: strings are treated as general rules now.
    const generalRules = rules.filter(r => !r.rule_text.toUpperCase().startsWith('RULETA_JSON:'));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="gba-panel w-[95%] md:w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col p-4 md:p-6"
                    >
                        <div className="flex justify-between items-center mb-4 md:mb-6 border-b-4 border-[#808080] pb-2">
                            <h2 className="text-2xl md:text-3xl gba-text text-[#306082] leading-tight pr-2">REGLAS DEL RETO</h2>
                            <button
                                onClick={onClose}
                                className="text-2xl md:text-3xl gba-text text-red-600 hover:text-red-800 hover:scale-110 transition-transform shrink-0"
                            >
                                X
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6">
                            {isLoading ? (
                                <p className="text-center text-gray-500 italic py-4">Cargando reglas...</p>
                            ) : rules.length === 0 ? (
                                <p className="text-center text-gray-500 italic py-4">No hay reglas registradas aún.</p>
                            ) : (
                                <>
                                    {generalRules.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-xl md:text-2xl gba-text tracking-widest text-[#f5c786] border-b-2 border-black/20 pb-1" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 0 #000' }}>NORMAS GENERALES</h3>
                                            {generalRules.map((rule, idx) => (
                                                <div key={rule.id} className="bg-black/5 p-3 rounded border-2 border-black/10 flex justify-between items-start gap-4">
                                                    <div className="flex items-start gap-3 w-full">
                                                        <span className="gba-text text-[#306082] text-xl min-w-[24px] pt-1">{idx + 1}.</span>
                                                        {editingId === rule.id ? (
                                                            <div className="flex flex-col sm:flex-row gap-2 w-full items-start">
                                                                <textarea
                                                                    autoFocus
                                                                    value={editText}
                                                                    onChange={e => setEditText(e.target.value)}
                                                                    className="w-full p-2 border-2 border-green-500 rounded font-[var(--font-gba)] text-sm md:text-base outline-none min-h-[80px] resize-y"
                                                                />
                                                                <div className="flex gap-2 shrink-0">
                                                                    <button onClick={() => handleSaveEdit(rule.id, rule.rule_text)} className="gba-button !py-1 !px-2 !text-sm !bg-green-500">OK</button>
                                                                    <button onClick={cancelEdit} className="gba-button !py-1 !px-2 !text-sm">X</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-lg md:text-xl gba-text leading-tight mt-1 break-words w-full">{rule.rule_text}</p>
                                                        )}
                                                    </div>
                                                    {editingId !== rule.id && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => startEdit(rule)}
                                                                className="text-blue-500 hover:text-blue-700 font-bold text-lg px-2 hover:bg-blue-100 rounded transition-colors"
                                                                title="Editar regla"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRule(rule.id)}
                                                                className="text-red-500 hover:text-red-700 font-bold text-xl px-2 hover:bg-red-100 rounded transition-colors"
                                                                title="Eliminar regla"
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Add Rule Form */}
                        <form onSubmit={handleAddRule} className="bg-[#f0f0f0] p-3 md:p-4 rounded border-4 border-[#c0c0c0] flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Regla</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2 border-2 border-gray-400 rounded focus:border-blue-500 outline-none font-[var(--font-gba)] text-sm md:text-base"
                                    value={newRule}
                                    onChange={e => setNewRule(e.target.value)}
                                    placeholder="Escribe una regla para añadir..."
                                />
                            </div>
                            <button type="submit" className="gba-button text-sm px-4 py-2 w-full sm:w-auto mt-2 sm:mt-0 sm:self-end sm:mb-[2px]">
                                AÑADIR
                            </button>
                        </form>

                        <div className="mt-4 flex justify-end">
                            <button onClick={onClose} className="gba-button">
                                CERRAR
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


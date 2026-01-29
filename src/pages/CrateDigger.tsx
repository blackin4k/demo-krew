import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Zap,
    Wind,
    Flame,
    History,
    Music2,
    Sparkles,
    ArrowRight,
    ChevronLeft,
    Disc3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/playerStore';
import { browseApi, playerApi, songsApi } from '@/lib/api';
import { toast } from 'sonner';

type Step = 'energy' | 'era' | 'genre' | 'results';

const CrateDigger = () => {
    const [step, setStep] = useState<Step>('energy');
    const [selections, setSelections] = useState({
        energy: '',
        era: '',
        genre: ''
    });
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { playSong } = usePlayerStore();

    const energyOptions = [
        { id: 'chill', label: 'Chill & Low Key', icon: Wind, desc: 'Smooth vibes for relaxing' },
        { id: 'mid', label: 'Moderate Energy', icon: Zap, desc: 'Balanced rhythm for focus' },
        { id: 'hi', label: 'High Octane', icon: Flame, desc: 'Maximum energy for the hype' },
    ];

    const eraOptions = [
        { id: '90s', label: '90s Classics', icon: History },
        { id: '00s', label: '00s Anthems', icon: History },
        { id: '10s', label: '10s Hits', icon: History },
        { id: 'now', label: 'Fresh Cuts', icon: Sparkles },
    ];

    const genres = ['Hip Hop', 'Pop', 'R&B', 'Indie', 'Alternative', 'Rock', 'Electronic'];

    const handleDig = async () => {
        setLoading(true);
        setStep('results');
        try {
            // Simplified logic: combining genre and era for a search query
            const query = `${selections.genre} ${selections.era}`;
            const res = await songsApi.search(query);
            setResults(res.data.tracks || []);
        } catch (e) {
            toast.error("Digging failed. The crates are locked.");
        } finally {
            setLoading(false);
        }
    };

    const addToCrate = async () => {
        if (results.length === 0) return;
        try {
            await playerApi.modifyQueue('clear', {});
            playSong(results[0]);
            for (const s of results.slice(1)) {
                await usePlayerStore.getState().addToQueue(s);
            }
            toast.success("Crate added to your session!");
        } catch (e) {
            toast.error("Failed to load crate.");
        }
    };

    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto min-h-screen">
            <header className="mb-12 space-y-2">
                <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <Disc3 className="h-8 w-8 animate-spin-slow" />
                    </div>
                    Crate Digger
                </h1>
                <p className="text-muted-foreground text-lg italic">"Tell me the vibe, and I'll find the gold."</p>
            </header>

            <AnimatePresence mode="wait">
                {step === 'energy' && (
                    <motion.div
                        key="energy"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <h2 className="text-2xl font-bold">What's the energy level?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {energyOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setSelections({ ...selections, energy: opt.id });
                                        setStep('era');
                                    }}
                                    className="p-8 rounded-3xl glass-panel border border-white/10 hover:border-primary/50 transition-all text-left group"
                                >
                                    <opt.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-bold text-xl mb-2">{opt.label}</h3>
                                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'era' && (
                    <motion.div
                        key="era"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <button onClick={() => setStep('energy')} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to energy
                        </button>
                        <h2 className="text-2xl font-bold">Select a decade</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {eraOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setSelections({ ...selections, era: opt.id });
                                        setStep('genre');
                                    }}
                                    className="p-6 rounded-2xl glass-panel border border-white/10 hover:bg-primary/5 transition-all text-center"
                                >
                                    <opt.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                                    <span className="font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'genre' && (
                    <motion.div
                        key="genre"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <button onClick={() => setStep('era')} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to era
                        </button>
                        <h2 className="text-2xl font-bold">Pick your flavor</h2>
                        <div className="flex flex-wrap gap-3">
                            {genres.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setSelections({ ...selections, genre: g })}
                                    className={`px-6 py-3 rounded-full border transition-all ${selections.genre === g ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(127,95,255,0.4)]' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <Button
                            disabled={!selections.genre}
                            onClick={handleDig}
                            className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
                        >
                            Start Digging <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                )}

                {step === 'results' && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Your Curated Crate</h2>
                                <p className="text-muted-foreground capitalize">{selections.energy} · {selections.era} · {selections.genre}</p>
                            </div>
                            <Button variant="outline" onClick={() => setStep('energy')}>Redig</Button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Disc3 className="h-16 w-16 text-primary animate-spin" />
                                <p className="text-xl font-medium animate-pulse">Scanning the stacks...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.slice(0, 8).map((track) => (
                                    <div key={track.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                            {track.cover && <img src={track.cover.startsWith('http') ? track.cover : `${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/covers/${track.cover}`} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">{track.title}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                        </div>
                                        <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                                {results.length === 0 && <p className="col-span-2 text-center py-10 text-muted-foreground">No matches found. Try widening your search!</p>}
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <Button onClick={addToCrate} className="w-full h-16 text-xl font-bold rounded-2xl group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 flex items-center gap-2">
                                    <Music2 className="h-6 w-6" />
                                    Dig into Queue
                                </span>
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CrateDigger;

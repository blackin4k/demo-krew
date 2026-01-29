import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    FlaskConical,
    Music2,
    Waves,
    Zap,
    Disc3,
    Layers
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { motion } from 'framer-motion';

const BANDS = [
    { label: '32', freq: 32 },
    { label: '64', freq: 64 },
    { label: '125', freq: 125 },
    { label: '250', freq: 250 },
    { label: '500', freq: 500 },
    { label: '1k', freq: 1000 },
    { label: '2k', freq: 2000 },
    { label: '4k', freq: 4000 },
    { label: '8k', freq: 8000 },
    { label: '16k', freq: 16000 },
];

const TheLab = () => {
    const {
        eqGains,
        setEqBand,
        vinylMode,
        setVinylMode,
        crossfadeDuration,
        setCrossfadeDuration,
        aiDjMode,
        setAiDjMode
    } = usePlayerStore();

    const presets = [
        { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], icon: Music2 },
        { name: 'Bass Boost', gains: [6, 5, 4, 3, 1, 0, 0, 0, 0, 0], icon: Zap },
        { name: 'Vocal Pop', gains: [-2, -1, 0, 2, 4, 5, 3, 1, 0, 0], icon: Waves },
    ];

    return (
        <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8 md:mb-12"
            >
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        <FlaskConical className="h-8 w-8 md:h-10 md:w-10 text-primary animate-pulse" />
                        The Lab
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-lg">Professional Audio FX & EQ Workstation</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* EQ SECTION */}
                <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col bg-black/20 backdrop-blur-3xl overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <Waves className="h-6 w-6 text-primary" />
                        <h2 className="text-lg md:text-xl font-bold font-display">10-Band Equalizer</h2>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        {/* Scrollable Container for Sliders */}
                        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                            <div className="flex justify-between items-end h-[250px] md:h-[300px] gap-4 md:gap-4 mt-4 min-w-[600px] md:min-w-0">
                                {BANDS.map((band, i) => (
                                    <div key={band.label} className="flex-1 flex flex-col items-center gap-4 group/band h-full">
                                        <div className="relative flex-1 w-full flex justify-center py-2">
                                            <Slider
                                                orientation="vertical"
                                                min={-12}
                                                max={12}
                                                step={0.5}
                                                value={[eqGains[i]]}
                                                onValueChange={([val]) => setEqBand(i, val)}
                                                className="h-full"
                                            />
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground group-hover/band:text-primary transition-colors">
                                                {band.label}
                                            </span>
                                            <p className="text-xs font-mono text-white/40">
                                                {eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-8 md:mt-12 bg-white/5 p-2 rounded-2xl border border-white/5">
                        {presets.map((p) => (
                            <button
                                key={p.name}
                                onClick={() => p.gains.forEach((g, i) => setEqBand(i, g))}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10 flex items-center gap-2 group border border-transparent hover:border-white/10"
                            >
                                <p.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                {p.name}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-white/10 self-center" />
                        <button
                            onClick={() => BANDS.forEach((_, i) => setEqBand(i, 0))}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all border border-white/10"
                        >
                            Reset to Flat
                        </button>

                    </div>
                </div>

                {/* FX SECTION */}

                {/* FX SECTION */}
                <div className="flex flex-col gap-8">
                    {/* FX RACK */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-8 rounded-3xl glass-panel border border-white/10 space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Layers className="h-6 w-6 text-purple-400" />
                            <h3 className="font-bold font-display text-lg">Live FX Rack</h3>
                        </div>

                        {/* REVERB */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold tracking-wider uppercase text-muted-foreground">
                                <span>Space (Reverb)</span>
                                <span>{(usePlayerStore(state => state.fxReverbWet) * 100).toFixed(0)}%</span>
                            </div>
                            <Slider
                                value={[usePlayerStore(state => state.fxReverbWet)]}
                                max={1} step={0.05}
                                onValueChange={([v]) => usePlayerStore.getState().setFxReverb(v)}
                            />
                        </div>

                        {/* DELAY */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold tracking-wider uppercase text-muted-foreground">
                                <span>Echo (Delay)</span>
                                <span>{(usePlayerStore(state => state.fxDelayFeedback) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex gap-4">
                                <Slider
                                    className="flex-1"
                                    value={[usePlayerStore(state => state.fxDelayFeedback)]}
                                    max={0.9} step={0.1}
                                    onValueChange={([fb]) => usePlayerStore.getState().setFxDelay(usePlayerStore.getState().fxDelayTime, fb)}
                                />
                                <div className="w-24">
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-md text-xs px-2 py-1"
                                        value={usePlayerStore(state => state.fxDelayTime)}
                                        onChange={(e) => usePlayerStore.getState().setFxDelay(parseFloat(e.target.value), usePlayerStore.getState().fxDelayFeedback)}
                                    >
                                        <option value={0}>Off</option>
                                        <option value={0.125}>1/32</option>
                                        <option value={0.25}>1/16</option>
                                        <option value={0.5}>1/8</option>
                                        <option value={0.75}>1/4.T</option>
                                        <option value={1.0}>1/4</option>
                                    </select>
                                </div>
                            </div>
                        </div>


                    </motion.div>

                    {/* Vinyl Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden group ${vinylMode ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : 'glass-panel border-white/10'}`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl transition-all ${vinylMode ? 'bg-orange-500/20 text-orange-400 rotate-12' : 'bg-white/5 text-muted-foreground'}`}>
                                        <Disc3 className={`h-6 w-6 ${vinylMode ? 'animate-spin-slow' : ''}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold font-display text-lg">The Oven</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Vinyl Simulation</p>
                                    </div>
                                </div>
                                <Switch checked={vinylMode} onCheckedChange={setVinylMode} className="data-[state=checked]:bg-orange-500" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Applies warm analog saturation, 2kHz low-pass filter, and real-time procedural surface noise.
                            </p>
                        </div>
                        {vinylMode && (
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Music2 className="h-24 w-24" />
                            </div>
                        )}
                    </motion.div>

                    {/* Crossfade Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 bg-black/20 backdrop-blur-3xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold font-display text-lg">DJ Crossfade</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Gapless Flow</p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Auto-Overlap Duration</span>
                                <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary font-mono font-bold text-lg">
                                    {crossfadeDuration}s
                                </span>
                            </div>
                            <Slider
                                min={0}
                                max={12}
                                step={1}
                                value={[crossfadeDuration]}
                                onValueChange={([v]) => setCrossfadeDuration(v)}
                                className="py-4"
                            />
                        </div>
                    </motion.div>

                    {/* AI DJ Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden group ${aiDjMode ? 'bg-primary/10 border-primary/50 shadow-[0_0_40px_rgba(127,95,255,0.15)]' : 'glass-panel border-white/10'}`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl transition-all ${aiDjMode ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                                        <Zap className={`h-6 w-6 ${aiDjMode ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold font-display text-lg">AI DJ</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Automated Beatmatch</p>
                                    </div>
                                </div>
                                <Switch checked={aiDjMode} onCheckedChange={setAiDjMode} className="data-[state=checked]:bg-primary" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Analyzes BPM and aligns incoming tracks to the "1" count. Adjusts playback rate for a perfect professional sync.
                                </p>
                                {aiDjMode && (
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-primary/60 animate-pulse">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        Sync Engine Active
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div >
    );
};

export default TheLab;

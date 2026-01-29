import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi, API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, ZoomIn, ZoomOut, Play, Music, Star, MousePointer2, Orbit, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

interface StarNode {
    id: number;
    title: string;
    artist: string;
    genre: string;
    cover: string | null;
    x: number;
    y: number;
    size: number;
    color: string;
    glow: string;
}

const GENRE_COLORS: Record<string, { color: string, glow: string }> = {
    'Pop': { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },
    'Hip Hop': { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    'R&B': { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
    'Rock': { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
    'Electronic': { color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
    'Indie': { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    'Alternative': { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
    'Default': { color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' }
};

const SonicGalaxy = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stars, setStars] = useState<StarNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.75 });
    const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Mouse Drag Refs
    const dragRef = useRef({ lastX: 0, lastY: 0, totalDragDist: 0 });

    // Touch Refs
    const touchRef = useRef({
        lastX: 0,
        lastY: 0,
        initialDistance: 0,
        initialScale: 0.75,
        isPinching: false
    });

    const { playSong } = usePlayerStore();

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const res = await songsApi.getAll(1, 1000); // Fetch a good chunk
                const rawSongs = res.data.items || [];

                // Clustering Heuristic
                const genreCenters: Record<string, { x: number, y: number }> = {};
                const processedStars: StarNode[] = rawSongs.map((s: any) => {
                    const genre = s.genre || 'Unknown';
                    if (!genreCenters[genre]) {
                        genreCenters[genre] = {
                            x: (Math.random() - 0.5) * 3000,
                            y: (Math.random() - 0.5) * 2000
                        };
                    }

                    const center = genreCenters[genre];
                    const theme = GENRE_COLORS[genre] || GENRE_COLORS.Default;

                    return {
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        genre: genre,
                        cover: s.cover,
                        // Normal distribution around genre center
                        x: center.x + (Math.random() - 0.5) * 1200,
                        y: center.y + (Math.random() - 0.5) * 1200,
                        size: 3 + Math.random() * 5,
                        color: theme.color,
                        glow: theme.glow
                    };
                });

                setStars(processedStars);
                setLoading(false);
            } catch (err) {
                console.error("Galaxy load error:", err);
                toast.error("Failed to map the galaxy");
            }
        };

        fetchSongs();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
        ctx.scale(camera.scale, camera.scale);

        // Draw connections (subtle constellation lines)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1 / camera.scale;
        // Group by genre for clusters
        const byGenre = stars.reduce((acc, s) => {
            if (!acc[s.genre]) acc[s.genre] = [];
            acc[s.genre].push(s);
            return acc;
        }, {} as Record<string, StarNode[]>);

        Object.values(byGenre).forEach(cluster => {
            if (cluster.length < 2) return;
            for (let i = 0; i < cluster.length - 1; i++) {
                // Connect to nearest neighbor in cluster
                const s1 = cluster[i];
                const s2 = cluster[i + 1];
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
            }
        });
        ctx.stroke();

        // Draw Stars
        stars.forEach(star => {
            const isHovered = hoveredStar?.id === star.id;

            // Draw Glow
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * (isHovered ? 8 : 4));
            gradient.addColorStop(0, star.glow);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * (isHovered ? 8 : 4), 0, Math.PI * 2);
            ctx.fill();

            // Draw Core
            ctx.fillStyle = isHovered ? '#fff' : star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * (isHovered ? 1.5 : 1), 0, Math.PI * 2);
            ctx.fill();

            // Labels for large scale or hovered
            if (camera.scale > 1.2 || isHovered) {
                ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.5)';
                ctx.font = `${12 / camera.scale}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(star.title, star.x, star.y + (star.size + 15) / camera.scale);
            }
        });

        ctx.restore();
    }, [stars, camera, hoveredStar]);

    useEffect(() => {
        let frameId: number;
        const loop = () => {
            draw();
            frameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frameId);
    }, [draw]);

    // --- MOUSE EVENTS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragRef.current = { lastX: e.clientX, lastY: e.clientY, totalDragDist: 0 };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        // Hover detection
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - canvas.width / 2 - camera.x) / camera.scale;
        const my = (e.clientY - rect.top - canvas.height / 2 - camera.y) / camera.scale;

        const hit = stars.find(s => {
            const dx = s.x - mx;
            const dy = s.y - my;
            return Math.sqrt(dx * dx + dy * dy) < (s.size + 10) / camera.scale;
        });

        setHoveredStar(hit || null);

        if (isDragging) {
            const dx = e.clientX - dragRef.current.lastX;
            const dy = e.clientY - dragRef.current.lastY;

            dragRef.current.totalDragDist += Math.abs(dx) + Math.abs(dy);

            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            dragRef.current.lastX = e.clientX;
            dragRef.current.lastY = e.clientY;
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCamera(prev => ({
            ...prev,
            scale: Math.min(Math.max(prev.scale * delta, 0.1), 5)
        }));
    };

    const handleStarClick = () => {
        // Increased threshold to prevent accidental clicks while panning
        // User must click with minimal movement (< 50px drag) to play a song
        if (dragRef.current.totalDragDist > 50) return;

        if (hoveredStar) {
            playSong({
                id: hoveredStar.id,
                title: hoveredStar.title,
                artist: hoveredStar.artist,
                cover: hoveredStar.cover,
                genre: hoveredStar.genre
            } as any);
            toast.success(`Broadcasting ${hoveredStar.title}`);
        }
    };

    // --- TOUCH EVENTS ---

    const getTouchDistance = (touches: React.TouchList) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // e.preventDefault(); // allow default sometimes? No, for canvas games usually prevent default
        if (e.touches.length === 1) {
            const t = e.touches[0];
            setIsDragging(true);
            dragRef.current = { lastX: t.clientX, lastY: t.clientY, totalDragDist: 0 };
            touchRef.current.isPinching = false;
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            const dist = getTouchDistance(e.touches);
            touchRef.current.initialDistance = dist;
            touchRef.current.initialScale = camera.scale;
            touchRef.current.isPinching = true;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // prevent scrolling
        // e.preventDefault(); 

        if (e.touches.length === 1 && !touchRef.current.isPinching) {
            const t = e.touches[0];
            const dx = t.clientX - dragRef.current.lastX;
            const dy = t.clientY - dragRef.current.lastY;

            dragRef.current.totalDragDist += Math.abs(dx) + Math.abs(dy);

            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            dragRef.current.lastX = t.clientX;
            dragRef.current.lastY = t.clientY;

            // Also simple touch hit detection
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mx = (t.clientX - rect.left - canvas.width / 2 - camera.x) / camera.scale;
            const my = (t.clientY - rect.top - canvas.height / 2 - camera.y) / camera.scale;

            const hit = stars.find(s => {
                const diffX = s.x - mx;
                const diffY = s.y - my;
                return Math.sqrt(diffX * diffX + diffY * diffY) < (s.size + 20) / camera.scale; // larger hit area
            });
            setHoveredStar(hit || null);

        } else if (e.touches.length === 2) {
            const dist = getTouchDistance(e.touches);
            if (touchRef.current.initialDistance > 0) {
                const scaleFactor = dist / touchRef.current.initialDistance;
                const newScale = touchRef.current.initialScale * scaleFactor;
                setCamera(prev => ({
                    ...prev,
                    scale: Math.min(Math.max(newScale, 0.1), 5)
                }));
            }
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        touchRef.current.isPinching = false;

        // Increased threshold to prevent accidental taps while panning
        // Must be a deliberate tap with minimal movement (< 50px) to play
        if (dragRef.current.totalDragDist < 50 && hoveredStar) {
            playSong({
                id: hoveredStar.id,
                title: hoveredStar.title,
                artist: hoveredStar.artist,
                cover: hoveredStar.cover,
                genre: hoveredStar.genre
            } as any);
            toast.success(`Broadcasting ${hoveredStar.title}`);
        }
    };


    return (
        <div className="absolute inset-0 overflow-hidden bg-black select-none touch-none">
            {/* Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-black to-black pointer-events-none" />

            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleStarClick}

                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* UI Overlay */}
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent flex items-center gap-4">
                    <Orbit className="h-8 w-8 md:h-10 md:w-10 text-primary animate-spin-slow" />
                    Sonic Galaxy
                </h1>
                <p className="text-white/40 font-light flex items-center gap-2 text-xs md:text-sm">
                    <Fingerprint className="h-4 w-4" /> Pan & Pinch to explore • Tap star to play
                </p>
            </div>

            {/* Scale Controls */}
            <div className="absolute bottom-12 right-12 z-10 flex flex-col gap-2 pointer-events-auto">
                <button
                    onClick={() => setCamera(c => ({ ...c, scale: Math.min(c.scale * 1.2, 5) }))}
                    className="p-3 md:p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 backdrop-blur-xl text-white transition-all shadow-2xl active:scale-95"
                >
                    <ZoomIn className="h-6 w-6" />
                </button>
                <button
                    onClick={() => setCamera(c => ({ ...c, scale: Math.max(c.scale * 0.8, 0.1) }))}
                    className="p-3 md:p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 backdrop-blur-xl text-white transition-all shadow-2xl active:scale-95"
                >
                    <ZoomOut className="h-6 w-6" />
                </button>
            </div>

            {/* Loading State */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6"
                    >
                        <div className="h-24 w-24 rounded-full border-t-4 border-primary animate-spin" />
                        <p className="text-primary font-mono tracking-widest animate-pulse uppercase">Mapping Sonic Constellations...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hover Info Card */}
            <AnimatePresence>
                {hoveredStar && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-6 left-6 right-6 md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-auto glass-panel p-4 md:p-6 rounded-3xl border border-white/20 flex items-center gap-4 md:gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
                    >
                        <div className="relative">
                            <img
                                src={hoveredStar.cover ? (hoveredStar.cover.startsWith('http') ? hoveredStar.cover : `${API_URL}/covers/${hoveredStar.cover}`) : '/default-cover.png'}
                                className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover shadow-2xl"
                                alt=""
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg md:text-2xl font-black text-white truncate">{hoveredStar.title}</p>
                            <p className="text-sm md:text-base text-primary font-bold truncate">{hoveredStar.artist}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 md:px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold text-white/60 tracking-tighter">
                                    {hoveredStar.genre}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SonicGalaxy;

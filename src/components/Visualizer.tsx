import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

interface VisualizerProps {
    className?: string;
    colors?: string[];
    height?: string;
    mode?: 'wave' | 'bar' | 'circle';
}

export default function Visualizer({
    className = "absolute bottom-0 left-0 w-full h-[400px] pointer-events-none z-0 opacity-60",
    colors = ['rgba(59, 130, 246, 0.1)', 'rgba(96, 165, 250, 0.15)', 'rgba(147, 197, 253, 0.05)'],
    height,
    mode = 'wave'
}: VisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { analyser, isPlaying } = usePlayerStore();
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!analyser) return;

        const renderFrame = () => {
            const canvas = canvasRef.current;
            if (!canvas || !analyser) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                const width = canvas.width;
                const height = canvas.height;

                ctx.clearRect(0, 0, width, height);

                if (mode === 'bar') {
                    const barWidth = (width / bufferLength) * 2.5;
                    let barHeight;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        barHeight = (dataArray[i] / 255) * height * 0.8;

                        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                        if (colors[2]) {
                            gradient.addColorStop(0, colors[1]); // Top color (lighter)
                            gradient.addColorStop(1, colors[0]); // Bottom color (darker)
                        } else {
                            gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
                            gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
                        }

                        ctx.fillStyle = gradient;
                        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                        x += barWidth + 1;
                    }
                } else if (mode === 'circle') {
                    // Simple circular visualizer
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const radius = Math.min(width, height) / 2.2;

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.strokeStyle = colors[0] || 'rgba(255,255,255,0.1)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Bars around circle
                    const bars = 80; // More bars
                    const step = (Math.PI * 2) / bars;

                    for (let i = 0; i < bars; i++) {
                        const val = dataArray[i * 2] || 0;
                        const barH = (val / 255) * 80; // Taller bars
                        const angle = i * step;

                        const x1 = centerX + Math.cos(angle) * (radius + 5);
                        const y1 = centerY + Math.sin(angle) * (radius + 5);
                        const x2 = centerX + Math.cos(angle) * (radius + 5 + barH);
                        const y2 = centerY + Math.sin(angle) * (radius + 5 + barH);

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.strokeStyle = colors[1] || 'white';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                } else {
                    // WAVE MODE (Default)
                    const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
                    const scale = bass / 255;

                    const drawWave = (colorStr: string, offset: number, speed: number, amplitude: number) => {
                        ctx.beginPath();
                        ctx.moveTo(0, height);

                        let x = 0;
                        const points: { x: number, y: number }[] = [];

                        for (let i = 0; i <= width + 10; i += 20) {
                            const freqIdx = Math.floor((i / width) * (bufferLength / 2));
                            const smoothData = Math.floor(
                                ((dataArray[freqIdx - 1] || 0) +
                                    (dataArray[freqIdx] || 0) * 2 +
                                    (dataArray[freqIdx + 1] || 0)) / 4
                            );

                            const waveY = height * (1 - offset)
                                - Math.sin(i * 0.005 + Date.now() * speed) * amplitude
                                - (smoothData * 0.6 * scale * 2.0);

                            points.push({ x: i, y: waveY });
                        }

                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 0; i < points.length - 1; i++) {
                            const p0 = points[i];
                            const p1 = points[i + 1];
                            const midX = (p0.x + p1.x) / 2;
                            const midY = (p0.y + p1.y) / 2;
                            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
                        }

                        ctx.lineTo(width, height);
                        ctx.lineTo(0, height);
                        ctx.closePath();

                        const gradient = ctx.createLinearGradient(0, height * (1 - offset - 0.5), 0, height);
                        if (colorStr.startsWith('rgba')) {
                            const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                            if (match) {
                                const [_, r, g, b, a] = match;
                                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.0)`);
                                gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${Number(a) * 0.6})`);
                                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${Number(a)})`);
                            } else {
                                gradient.addColorStop(0, "transparent");
                                gradient.addColorStop(1, colorStr);
                            }
                        } else {
                            gradient.addColorStop(0, "transparent");
                            gradient.addColorStop(1, colorStr);
                        }

                        ctx.fillStyle = gradient;
                        ctx.fill();
                    };

                    drawWave(colors[0], 0.25, 0.0008, 40 + scale * 30);
                    drawWave(colors[1], 0.18, 0.0015, 30 + scale * 40);
                    drawWave(colors[2], 0.12, 0.0025, 15 + scale * 60);
                }

                animationRef.current = requestAnimationFrame(renderFrame);
            } catch (e) {
                // Prevent crash if canvas drawing fails due to NaN/Infinity
                console.warn("Visualizer Render Error:", e);
                animationRef.current = requestAnimationFrame(renderFrame);
            }
        };

        renderFrame();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, isPlaying, colors, mode]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={height ? { height } : undefined}
        />
    );
}

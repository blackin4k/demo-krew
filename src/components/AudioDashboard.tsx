import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

interface AudioDashboardProps {
    className?: string;
    color?: string;
}

const AudioDashboard: React.FC<AudioDashboardProps> = ({ className, color = '#7f5fff' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { analyser, isPlaying } = usePlayerStore();
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!analyser) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            try {
                if (!canvas || !ctx || !analyser) return;

                const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
                const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

                const bufferLength = analyser.frequencyBinCount;
                if (!bufferLength) throw new Error("Invalid buffer length");

                const dataArray = new Uint8Array(bufferLength);
                const timeData = new Uint8Array(bufferLength);

                analyser.getByteFrequencyData(dataArray);
                analyser.getByteTimeDomainData(timeData);

                ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

                // --- 1. SPECTRUM ANALYZER (Bottom) ---
                const barWidth = (canvas.offsetWidth / bufferLength) * 2.5;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * (canvas.offsetHeight * 0.4);
                    const fill = i % 2 === 0 ? color : `${color}88`;
                    ctx.fillStyle = fill;
                    ctx.fillRect(x, canvas.offsetHeight - barHeight, barWidth - 1, barHeight);
                    x += barWidth;
                }

                // --- 2. STEREO FIELD (Goniometer - Center) ---
                const centerX = canvas.offsetWidth / 2;
                const centerY = canvas.offsetHeight / 2 - 20;
                const radius = 80;

                // Draw background circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.stroke();

                // Draw Lissajous Path
                ctx.beginPath();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;

                for (let i = 0; i < bufferLength; i += 4) {
                    const v = timeData[i] / 128.0 - 1.0;
                    const vNext = timeData[(i + 1) % bufferLength] / 128.0 - 1.0;

                    const px = centerX + (v + vNext) * radius;
                    const py = centerY + (v - vNext) * radius;

                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;

                // --- 3. PEAK METERS (Sides) ---
                const drawMeter = (mx: number, sideColor: string) => {
                    const peak = Math.max(...Array.from(dataArray).slice(0, 20)) / 255;
                    const meterH = canvas.offsetHeight * 0.6;
                    const currentH = peak * meterH;

                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(mx, centerY - meterH / 2, 8, meterH);

                    const gradient = ctx.createLinearGradient(0, centerY + meterH / 2, 0, centerY - meterH / 2);
                    gradient.addColorStop(0, sideColor);
                    gradient.addColorStop(0.7, '#fcd34d'); // Warning
                    gradient.addColorStop(0.9, '#ef4444'); // Peak

                    ctx.fillStyle = gradient;
                    ctx.fillRect(mx, centerY + meterH / 2 - currentH, 8, currentH);
                };

                drawMeter(20, color);
                drawMeter(canvas.offsetWidth - 28, color);

                animationRef.current = requestAnimationFrame(render);
            } catch (e) {
                console.warn("AudioDashboard Render Error:", e);
                animationRef.current = requestAnimationFrame(render);
            }
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, color]);

    return (
        <div className={className}>
            <canvas
                ref={canvasRef}
                className="w-full h-full opacity-90 transition-opacity duration-1000"
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-8 text-[10px] items-center uppercase tracking-[0.2em] font-bold text-white/30">
                <span>Spectrum</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span>Goniometer</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span>Peak</span>
            </div>
        </div>
    );
};

export default AudioDashboard;

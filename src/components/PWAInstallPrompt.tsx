
import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PWAInstallPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 1. Check if iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // 2. Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

        // 3. Show only if iOS and NOT standalone
        if (isIOS && !isStandalone) {
            // Delay slightly so it doesn't pop up instantly
            const timeout = setTimeout(() => setShow(true), 500); // Faster for testing
            return () => clearTimeout(timeout);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm p-6 border-0 shadow-2xl relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#5f0079] via-[#800060] to-[#ff4fb6] opacity-90"></div>
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <span className="text-3xl">📲</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-xl tracking-wide">Install KREW</h3>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">iOS App Store</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setShow(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <p className="text-white/90 text-sm mb-6 leading-relaxed font-medium">
                        Tap the <strong>Share Button</strong> below and select <strong>"Add to Home Screen"</strong> to unlock the full app experience.
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-800/50 p-3 rounded-md">
                            <span>1. Tap</span>
                            <Share className="h-5 w-5 text-blue-400" />
                            <span>in Safari toolbar</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-800/50 p-3 rounded-md">
                            <span>2. Select</span>
                            <span className="font-semibold text-white">Add to Home Screen</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

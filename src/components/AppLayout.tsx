import { useState } from "react";
import { SidebarContent } from "./Sidebar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Player from "./Player";
import Visualizer from "./Visualizer";
import { JamManager } from "./JamManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Visualizer />
      {/* JamManager moved to App.tsx */}
      <Sidebar />

      {/* Mobile Sidebar Sheet (Controlled by UI Store) */}
      <div className="md:hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 border-r border-white/10 bg-black/90 backdrop-blur-3xl w-[80%] max-w-[300px]">
            <SidebarContent mode="mobile" onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area 
          - Left margin respects sidebar (64px w + padding) -> actually we will make sidebar wider and floating
          - Bottom padding respects player height
      */}
      <main className="absolute top-0 right-0 bottom-0 left-0 md:left-72 overflow-y-auto pb-40 md:pb-32 pt-0 pr-0 pl-0 md:pt-4 md:pr-4">
        {/* Helper to check if guest */}
        {(!isAuthenticated || !user) && (
          <div className="w-full bg-gradient-to-r from-purple-900 to-pink-900 text-white text-xs font-bold py-2 px-4 text-center z-50 sticky top-0 shadow-lg flex items-center justify-center gap-4">
            <span>🚀 You are in Guest Mode. Playback is limited to 30s.</span>
            <a href="https://kreewaux.xyz/" className="bg-white text-black px-3 py-1 rounded-full text-[10px] hover:scale-105 transition">Download for free</a>
          </div>
        )}

        {/* Inner Content Container - Glass effect for the "page" feel ONLY on desktop */}
        <div className="min-h-full w-full max-w-[1920px] mx-auto md:rounded-2xl md:border md:border-white/5 md:bg-black/20 md:shadow-xl overflow-hidden relative">
          {children}
        </div>
      </main>

      <MobileNav />

      {/* Player Slot - Positioned by Player component itself or wrapper? 
          We'll keep a wrapper for DOM order but let Player component control its 'floating-ness' 
          actually the plan says modify Player.tsx to be fixed. 
          But here we can just put it in the flow, usually Player uses portals or fixed.
          Let's just render it. The previous layout had a div wrapper. 
          We will remove the limiting wrapper.
      */}
      <Player />
    </div>
  );
}

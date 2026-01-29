import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Visualizer from "./Visualizer";
import { useDominantColor } from "@/hooks/useDominantColor";

import AudioDashboard from "./AudioDashboard";
import api, { songsApi, configureJamPlayback, playlistsApi, API_URL } from "@/lib/api";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  ChevronDown,
  X,
  PlusCircle,
  Plus,
  Check,
  Moon,
  Waves,
  Layers,
  Mic2,
  MoreHorizontal,
  Share2
} from "lucide-react"

import { Slider } from "@/components/ui/slider"
import { usePlayerStore } from "@/stores/playerStore"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function AddToPlaylist({ currentSong, children }: { currentSong: any, children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) {
      playlistsApi.getAll().then(res => setPlaylists(res.data)).catch(console.error)
    }
  }, [open])

  const handleCreate = async () => {
    if (!search.trim()) return
    try {
      const res = await playlistsApi.create(search)
      const newPlaylist = res.data
      await playlistsApi.addSong(newPlaylist.id, currentSong.id)
      toast.success(`Created "${newPlaylist.name}" and added song`)
      setOpen(false)
    } catch (e) {
      toast.error("Failed to create playlist")
    }
  }

  const handleSelect = async (playlist: any) => {
    try {
      await playlistsApi.addSong(playlist.id, currentSong.id)
      toast.success(`Added to "${playlist.name}"`)
      setOpen(false)
    } catch (e) {
      toast.error("Failed to add to playlist")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64 glass-panel" side="top" align="center" onClick={(e) => e.stopPropagation()}>
        <Command className="bg-transparent">
          <CommandInput placeholder="Search or create..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-2 px-2">
              <button
                className="flex items-center gap-2 w-full p-2 text-sm rounded-sm hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4" />
                Create "{search}"
              </button>
            </CommandEmpty>
            <CommandGroup heading="Playlists">
              {playlists.map((playlist) => (
                <CommandItem
                  key={playlist.id}
                  onSelect={() => handleSelect(playlist)}
                  className="cursor-pointer hover:bg-white/10"
                >
                  <span className="flex-1 truncate">{playlist.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const parseLyrics = (lrc: string) => {
  const lines = lrc.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = mins * 60 + secs + ms / (match[3].length === 3 ? 1000 : 100);
      const text = line.replace(timeRegex, '').trim();
      if (text) result.push({ time, text });
    }
  }
  return result;
};

function LyricsOverlay({ lyrics, progress, onSeek }: { lyrics: string | null, progress: number, onSeek: (time: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const parsedLines = useMemo(() => lyrics ? parseLyrics(lyrics) : [], [lyrics]);

  const activeIndex = parsedLines.findIndex((line, i) => {
    const nextLine = parsedLines[i + 1];
    return progress >= line.time && (!nextLine || progress < nextLine.time);
  });

  useEffect(() => {
    if (activeIndex !== -1 && scrollRef.current) {
      const activeElement = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  if (!lyrics) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 bg-black/80 backdrop-blur-3xl flex items-center justify-center">
      <div className="text-white/40 animate-pulse uppercase tracking-widest text-sm">Searching for lyrics...</div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-30 bg-black/80 backdrop-blur-3xl pt-32 flex flex-col items-center"
    >
      <div
        ref={scrollRef}
        className="max-w-4xl w-full text-center space-y-12 overflow-y-auto no-scrollbar h-full pb-32 px-12"
        style={{ scrollBehavior: 'smooth' }}
      >
        {parsedLines.length > 0 ? (
          parsedLines.map((line, i) => (
            <motion.div
              key={i}
              initial={false}
              onClick={() => onSeek(line.time)}
              animate={{
                opacity: i === activeIndex ? 1 : 0.2,
                scale: i === activeIndex ? 1.05 : 1,
                y: i === activeIndex ? 0 : (i < activeIndex ? -10 : 10)
              }}
              whileHover={{ scale: 1.05, opacity: 0.8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "text-2xl md:text-5xl font-bold transition-all font-display select-none leading-tight py-2 cursor-pointer",
                i === activeIndex ? "text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "text-white/30"
              )}
            >
              {line.text}
            </motion.div>
          ))
        ) : (
          <div className="text-xl md:text-3xl text-white/80 leading-relaxed whitespace-pre-wrap mt-20 font-medium px-8">
            {lyrics}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Player() {

  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    shuffle,
    repeat,
    togglePlay,
    next,
    prev,
    setVolume,
    setProgress,
    toggleShuffle,
    toggleRepeat,
    initAudio,
    isExpanded: expanded,
    setExpanded,
    sleepTimerEnd,
    setSleepTimer,
    cancelSleepTimer,
    visualizerColor,
    setVisualizerColor,
    lyrics,
    showLyrics,
    setShowLyrics
  } = usePlayerStore()

  const [muted, setMuted] = useState(false)
  const [liked, setLiked] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [visualizerMode, setVisualizerMode] = useState<'wave' | 'bar' | 'circle'>('wave')
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress)
    }
  }, [progress, isDragging])

  const handleSeek = (vals: number[]) => {
    setIsDragging(true)
    setLocalProgress(vals[0])
  }

  const handleSeekCommit = (vals: number[]) => {
    setIsDragging(false)
    setProgress(vals[0])
  }

  const previousVolume = useRef(volume)

  useEffect(() => {
    initAudio()
  }, [initAudio])

  useEffect(() => {
    configureJamPlayback({
      getAudio: () => usePlayerStore.getState().audio,
      getSrcForSong: (songId: number) => songsApi.stream(songId),
    });
  }, []);

  const coverUrl = useMemo(() => {
    if (!currentSong?.cover) return null;
    if (currentSong.cover.startsWith("http")) return currentSong.cover;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = currentSong.cover.startsWith('/') ? currentSong.cover.slice(1) : currentSong.cover;
    // Ensure API_URL doesn't have a trailing slash (it shouldn't, but safe to check)
    const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    return `${cleanApiUrl}/covers/${cleanPath}`;
  }, [currentSong]);

  const domColor = useDominantColor(coverUrl);

  const baseColor = (() => {
    if (visualizerColor) return null;
    if (!domColor) return { r: 255, g: 255, b: 255 };

    const brightness = (domColor.r * 299 + domColor.g * 587 + domColor.b * 114) / 1000;
    if (brightness < 80) {
      const lighten = (val: number) => Math.round(val + (255 - val) * 0.7);
      return { r: lighten(domColor.r), g: lighten(domColor.g), b: lighten(domColor.b) };
    }
    return domColor;
  })();

  const visualizerColors = visualizerColor
    ? [`${visualizerColor}33`, `${visualizerColor}66`, `${visualizerColor}99`]
    : baseColor
      ? [
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.25)`,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.5)`,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.75)`
      ]
      : undefined;

  const uiColor = visualizerColor || (baseColor ? `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})` : "#ffffff");

  useEffect(() => {
    if (!currentSong) return
    api
      .get(`/songs/${currentSong.id}/liked`)
      .then(res => setLiked(res.data.liked))
      .catch(() => setLiked(false))
  }, [currentSong])

  if (!currentSong) return null;

  const handleMute = () => {
    if (muted) {
      setVolume(previousVolume.current)
    } else {
      previousVolume.current = volume
      setVolume(0)
    }
    setMuted(!muted)
  }

  const toggleLike = async () => {
    if (!currentSong) return

    // Guest Check
    if (!localStorage.getItem('token')) {
      toast.error("Sign up to save your favorite tracks! 💖");
      return;
    }

    try {
      if (liked) {
        await api.post(`/songs/${currentSong.id}/unlike`)
        setLiked(false)
      } else {
        await api.post(`/songs/${currentSong.id}/like`)
        setLiked(true)
      }
    } catch (e) {
      console.error("Like error", e)
    }
  }


  /* ================= EXPANDED PLAYER (Full Screen Fix) ================= */

  const ExpandedPlayer = (
    <AnimatePresence>
      {expanded && (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }} // Snappier spring
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.2 }}
          dragMomentum={false} // Disable momentum for tighter control
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 300) { // Lower threshold
              setExpanded(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black flex flex-col will-change-transform" // Hardware acceleration hint
        >
          {/* BASE BACKGROUND */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900" />

          {/* BACKGROUND BLUR - Optimized for Mobile */}
          {coverUrl && (
            <img
              key={`blur-${currentSong.id}`}
              src={coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-20 will-change-transform"
            />
          )}

          {/* VISUALIZER - Disable pointer events and lower opacity for perf */}
          <div className="absolute bottom-0 left-0 w-full h-[30%] pointer-events-none z-0 opacity-50">
            <Visualizer
              className="w-full h-full"
              colors={visualizerColors}
              mode={visualizerMode}
            />
          </div>

          <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />

          {/* DASHBOARD OVERLAY */}
          <AnimatePresence>
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 pt-safe"
              >
                <button
                  onClick={() => setShowDashboard(false)}
                  className="absolute top-safe-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
                <div className="w-full h-full pt-12">
                  <AudioDashboard className="w-full h-full" color={uiColor} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LYRICS OVERLAY */}
          <AnimatePresence>
            {showLyrics && (
              <LyricsOverlay lyrics={lyrics} progress={progress} onSeek={props => {
                usePlayerStore.getState().seek(props);
                setProgress(props);
              }} />
            )}
            {showLyrics && (
              <button
                onClick={() => setShowLyrics(false)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            )}
          </AnimatePresence>

          {/* CONTENT CONTAINER - Flex Column, No Scroll */}
          <div className="relative z-20 flex flex-col h-full w-full px-6 pb-4 pt-safe">

            {/* 1. TOP BAR */}
            <div className="flex items-center justify-between h-16 shrink-0 mt-8 md:mt-0">
              <button onClick={() => setExpanded(false)} className="p-2 -ml-2 text-white/70 hover:text-white">
                <ChevronDown className="h-8 w-8" />
              </button>
              <div className="text-center">
                <span className="text-xs font-bold tracking-widest uppercase text-white/50">Playing from Library</span>
              </div>

              {/* Direct Lyrics Button (Replaces Options Menu) */}
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={cn("p-2 -mr-2 transition-colors", showLyrics ? "text-green-500" : "text-white/70 hover:text-white")}
              >
                <Mic2 className="h-6 w-6" />
              </button>
            </div>

            {/* 2. ARTWORK - Flex Grow to take available space */}
            <div className="flex-1 flex items-center justify-center py-4 min-h-0">
              <div className="relative aspect-square max-h-full w-auto h-auto max-w-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {coverUrl ? (
                  <img src={coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-6xl text-white/20">♪</div>
                )}
              </div>
            </div>

            {/* 3. TRACK INFO & CONTROLS - Fixed Bottom Section */}
            <div className="shrink-0 flex flex-col gap-6 pb-8">

              {/* Title Row */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h2 className="text-2xl font-bold text-white truncate leading-tight">{currentSong.title}</h2>
                  <p className="text-lg text-white/60 truncate">{currentSong.artist}</p>
                </div>
                <button onClick={toggleLike} className="shrink-0 p-2">
                  <Heart className={cn("h-7 w-7 transition", liked ? "fill-green-500 text-green-500" : "text-white/40")} />
                </button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <Slider
                  value={[isDragging ? localProgress : progress]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  onValueCommit={handleSeekCommit}
                  color={uiColor}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs font-medium text-white/40">
                  <span>{formatTime(isDragging ? localProgress : progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between px-2">
                <Shuffle
                  onClick={toggleShuffle}
                  className={cn("h-6 w-6 transition-colors", shuffle ? "text-green-500" : "text-white/40")}
                />
                <SkipBack onClick={prev} className="h-9 w-9 text-white fill-white" />

                <button
                  onClick={togglePlay}
                  className="h-16 w-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
                  style={{ backgroundColor: uiColor, color: 'black' }}
                >
                  {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                </button>

                <SkipForward onClick={next} className="h-9 w-9 text-white fill-white" />

                {repeat === 'one' ? (
                  <Repeat1 onClick={toggleRepeat} className="h-6 w-6 text-green-500" />
                ) : (
                  <Repeat onClick={toggleRepeat} className={cn("h-6 w-6 transition-colors", repeat !== 'off' ? "text-green-500" : "text-white/40")} />
                )}
              </div>

              {/* Volume (Hidden on small mobile, visible if space) */}
              <div className="hidden md:flex items-center gap-4 px-4">
                <Volume2 className="h-5 w-5 text-white/50" />
                <Slider value={[volume]} max={1} step={0.01} onValueChange={([v]) => setVolume(v)} color={uiColor} />
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const MiniPlayer = (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1, x: 0 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        // Swipe Left to Next
        if (info.offset.x < -100) {
          next();
        }
        // Swipe Right to Prev (Bonus)
        else if (info.offset.x > 100) {
          prev();
        }
      }}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-2 right-2 md:left-4 md:right-4 md:bottom-4 h-14 z-40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center px-2 overflow-hidden border border-white/5 cursor-grab active:cursor-grabbing"
      dragDirectionLock
      style={{
        backgroundColor: baseColor ? `rgb(${baseColor.r},${baseColor.g},${baseColor.b})` : '#0a0a0a',
        touchAction: 'pan-y' // Allow vertical scrolling on the page
      }}
      onClick={() => setExpanded(true)}
    >
      {/* Dark Gradient Overlay for readability & depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />

      {/* Glass shine */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />

      {/* Progress bar at VERY BOTTOM */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
        <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
      </div>

      <div className="h-10 w-10 rounded-md overflow-hidden bg-neutral-800 shrink-0 relative mr-3 z-10 shadow-sm">
        {coverUrl ? (
          <img src={coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs">♪</div>
        )}
      </div>

      <div className="flex-1 min-w-0 mr-2 z-10">
        <h4 className="font-medium text-sm text-white truncate leading-tight">{currentSong.title}</h4>
        <p className="text-[11px] text-white/70 truncate">{currentSong.artist}</p>
      </div>

      <div className="flex items-center gap-3 z-10 pr-1">
        <button onClick={(e) => { e.stopPropagation(); toggleLike(); }}>
          <Heart className={cn("h-5 w-5", liked ? "fill-white text-white" : "text-white/50")} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="h-8 w-8 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
        >
          {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
        </button>
      </div>
    </motion.div>
  )

  return (
    <>
      {MiniPlayer}
      {ExpandedPlayer}
    </>
  )
}

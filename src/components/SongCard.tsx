import { useState } from "react"
import { toast } from "sonner"
import AddToPlaylistModal from "@/components/AddToPlaylistModal"
import { MoreVertical, Play, Pause, Heart, Plus, Radio } from "lucide-react"
import { motion } from "framer-motion"
import { Song } from "@/types/music"
import { usePlayerStore } from "@/stores/playerStore"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SongCardProps {
  song: Song
  index?: number
  showIndex?: boolean
  compact?: boolean
  variant?: 'grid' | 'list'
  onSongAdded?: () => void
  onBecauseYouListened?: (songId: number, title: string) => void
}

import { API_URL } from "@/lib/api"

const SongCard = ({ song, index, showIndex, compact, variant = 'grid', onSongAdded, onBecauseYouListened }: SongCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore()
  const isCurrentSong = currentSong?.id === song.id


  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentSong) togglePlay()
    else playSong(song)
  }

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const coverUrl = song.cover
    ? song.cover.startsWith("http")
      ? song.cover
      : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${song.cover.startsWith('/') ? song.cover.slice(1) : song.cover}`
    : null

  if (compact) {
    // SPOTIFY STYLE "JUMP BACK IN" CARD (Tiny Grid Item)
    // - Rectangular background
    // - Image docked left (full height)
    // - Text in remaining space
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index ? index * 0.05 : 0 }}
          className={cn(
            "group flex items-center h-14 rounded-md bg-white/10 hover:bg-white/20 transition-colors overflow-hidden pr-2 cursor-pointer shadow-sm relative",
            isCurrentSong && "bg-primary/20"
          )}
          onClick={handlePlay}
        >
          {/* Cover - Full heigh docked left */}
          <div className="h-full w-14 shrink-0 relative">
            {coverUrl ? (
              <img src={coverUrl} alt={song.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-xs text-white/30">♪</div>
            )}
            {/* Overlay Play Icon (Always visible on current, or hover) */}
            {(isCurrentSong || isPlaying) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {isPlaying && isCurrentSong ? (
                  <div className="h-3 w-3 bg-primary animate-pulse rounded-sm" />
                ) : (
                  <Play className="h-5 w-5 fill-white text-white" />
                )}
              </div>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 px-3 flex flex-col justify-center">
            <h4 className={cn("font-bold text-[13px] leading-tight truncate", isCurrentSong ? "text-primary" : "text-white")}>
              {song.title}
            </h4>
          </div>

          {/* Hidden Play Button (only for accessibility/hover if needed, but the whole card clicks) */}
        </motion.div>

        <AddToPlaylistModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          songId={song.id}
          onSongAdded={onSongAdded}
        />
      </>
    )
  }

  // LIST VARIANT (New Spotify-like row)
  if (variant === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index ? index * 0.03 : 0 }}
          onClick={handlePlay}
          className={cn(
            "group flex items-center gap-3 p-2 rounded-lg active:bg-white/10 transition-colors w-full",
            isCurrentSong && "bg-white/5"
          )}
        >
          {/* Cover - Smaller than card, larger than compact */}
          <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-neutral-800">
            {coverUrl ? (
              <img src={coverUrl} alt={song.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/20">♪</div>
            )}

            {/* Overlay Play Icon (Always visible on current, or hover) */}
            {(isCurrentSong || isPlaying) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {isPlaying && isCurrentSong ? (
                  <div className="h-3 w-3 bg-primary animate-pulse rounded-sm" />
                ) : (
                  <Play className="h-5 w-5 fill-white text-white" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className={cn("font-medium text-sm truncate leading-tight", isCurrentSong ? "text-primary" : "text-white")}>
              {song.title}
            </h4>
            <p className="text-xs text-white/60 truncate mt-0.5">{song.artist}</p>
          </div>

          {/* More Options (Always visible on mobile usually, or dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-2 -mr-2 text-white/40 active:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-white/10">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); usePlayerStore.getState().playRadio(song.id); }}>
                <Radio className="w-4 h-4 mr-2" /> Start Radio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddToPlaylist}>
                <Plus className="w-4 h-4 mr-2" /> Add to Playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <AddToPlaylistModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          songId={song.id}
          onSongAdded={onSongAdded}
        />
      </>
    )
  }

  // DEFAULT GRID CARD
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index ? index * 0.05 : 0 }}
        className="group relative rounded-2xl bg-card shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-200 ease-out overflow-hidden border border-[#7f5fff]/10 focus-within:ring-2 focus-within:ring-[#7f5fff]/40"
        style={{ minWidth: 0 }}
      >
        {/* COVER */}
        <div className="aspect-square relative overflow-hidden rounded-t-2xl">

          {coverUrl ? (
            <img
              src={coverUrl}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
              ♪
            </div>
          )}

          {/* PLAY BUTTON OVERLAY - z-10 */}
          <button
            onClick={handlePlay}
            className="absolute inset-0 z-10 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition flex items-center justify-center"
          >
            <div className="p-4 rounded-full bg-primary shadow-lg ring-2 ring-primary/30">
              {isCurrentSong && isPlaying ? (
                <Pause className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
              )}
            </div>
          </button>

          {/* TOP BUTTONS - z-20 (above play overlay) */}
          <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
            {/* Add to Playlist Button */}
            <button
              onClick={handleAddToPlaylist}
              className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition"
              title="Add to playlist"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition"
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black/90 border-[#7f5fff]/20 backdrop-blur-xl">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    usePlayerStore.getState().playRadio(song.id)
                  }}
                  className="cursor-pointer hover:bg-white/10 text-white focus:bg-white/10 focus:text-white"
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Start Radio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsModalOpen(true)
                  }}
                  className="cursor-pointer hover:bg-white/10 text-white focus:bg-white/10 focus:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


        {/* TEXT */}
        <div className="p-4">
          <h3 className={cn("font-semibold truncate text-lg", isCurrentSong && "text-primary")}>
            {song.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
      </motion.div>

      <AddToPlaylistModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        songId={song.id}
        onSongAdded={onSongAdded}
      />
    </>
  )
}

export default SongCard
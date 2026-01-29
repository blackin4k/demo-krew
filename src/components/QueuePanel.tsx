import { useEffect, useState } from "react"
import { playerApi } from "@/lib/api"
import { Play, Shuffle, History, ListMusic, Sparkles } from "lucide-react"
import { usePlayerStore } from "@/stores/playerStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function QueuePanel() {
  const [queue, setQueue] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const { playSong } = usePlayerStore()

  const fetchQueue = () => {
    playerApi.queue().then(res => setQueue(res.data.queue || [])).catch(err => console.error(err))
  }

  const fetchHistory = () => {
    playerApi.getHistory().then(res => setHistory(res.data || [])).catch(err => console.error(err))
  }

  useEffect(() => {
    fetchQueue()
    // Poll queue occasionally or rely on other triggers? 
    // For now simple fetch on mount
  }, [])

  const handleSmartShuffle = async () => {
    try {
      const res = await playerApi.smartShuffle()
      toast.success(res.data.msg)
      fetchQueue()
    } catch (e) {
      toast.error("Failed to shuffle")
    }
  }

  const SongItem = ({ song, isHistory = false }: { song: any, isHistory?: boolean }) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 group transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <p className={cn("truncate font-medium", isHistory && "text-muted-foreground")}>{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        {isHistory && song.played_at && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {new Date(song.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <button
        onClick={() => playSong(song)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        title="Play"
      >
        <Play className="h-4 w-4 fill-white text-white" />
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-l border-white/5">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <ListMusic className="h-5 w-5" />
          Queue
        </h2>

        <Tabs defaultValue="queue" className="w-full" onValueChange={(val) => {
          if (val === 'history') fetchHistory()
          else fetchQueue()
        }}>
          <TabsList className="w-full grid grid-cols-2 bg-white/5">
            <TabsTrigger value="queue">Up Next</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="flex-1 h-full mt-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={handleSmartShuffle}
                className="text-xs flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Smart Shuffle
              </button>
            </div>
            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  Queue is empty
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.map((song, i) => (
                    <SongItem key={`${song.id}-${i}`} song={song} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 h-full mt-4">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  No history yet
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((song, i) => (
                    <SongItem key={`${song.id}-${i}`} song={song} isHistory />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

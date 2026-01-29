import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, ListMusic, Plus, Play, MoreHorizontal, FlaskConical, Shuffle } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { libraryApi, playlistsApi, API_URL } from '@/lib/api';
import { Song, Playlist } from '@/types/music';
import SongCard from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import PlaylistMixer from '@/components/PlaylistMixer';
import DuplicateFinder from '@/components/DuplicateFinder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Library = () => {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { playSong } = usePlayerStore();
  const { toast } = useToast();

  const tabs = [
    { to: '/library', label: 'All', icon: ListMusic },
    { to: '/library/liked', label: 'Liked', icon: Heart },
    { to: '/library/playlists', label: 'Playlists', icon: ListMusic },
    { to: '/library/recent', label: 'Recent', icon: Clock },
  ];

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const [likedRes, recentRes, playlistsRes] = await Promise.all([
          libraryApi.getLiked(),
          libraryApi.getRecent(),
          playlistsApi.getAll(),
        ]);

        setLikedSongs(likedRes.data || []);
        setRecentSongs(recentRes.data || []);
        setPlaylists(playlistsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const res = await playlistsApi.create(newPlaylistName);
      setPlaylists([...playlists, { id: res.data.id, name: res.data.name }]);
      setNewPlaylistName('');
      setDialogOpen(false);
      toast({ title: 'Playlist created!', description: `"${newPlaylistName}" has been created.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create playlist', variant: 'destructive' });
    }
  };

  const handlePlayLiked = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0]);
    }
  };

  const isMainLibrary = location.pathname === '/library';

  return (
    <div className="min-h-screen pb-40 md:pb-32 px-4 pt-12 md:px-8 md:pt-8 w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-display font-bold tracking-tight">Library</h1>

          <div className="flex items-center gap-2">

            {/* Mobile: Group Tools in Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreHorizontal className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-strong">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger className="flex items-center w-full">
                        <Plus className="h-4 w-4 mr-2" /> New Playlist
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Playlist</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            placeholder="Playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                          />
                          <Button onClick={handleCreatePlaylist} className="w-full">Create</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <DuplicateFinder />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <PlaylistMixer />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Visible Tools */}
            <div className="hidden md:flex gap-2">
              <DuplicateFinder />
              <PlaylistMixer />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New isMainLibrary
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                    <Button onClick={handleCreatePlaylist} className="w-full">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          </div>
        </div>

        {/* Tabs - Mobile Optimized Scrollable Chips */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-sides">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/library'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-secondary/50 text-foreground/70 border-white/5 hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-2">
              <div className="w-14 h-14 rounded bg-muted/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/20 rounded w-1/3" />
                <div className="h-3 bg-muted/20 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isMainLibrary ? (
        <div className="flex flex-col">
          {/* SEARCH & FILTERS (Placeholder for future, keeping clean for now) */}

          <div className="flex flex-col">
            {/* 1. LIKED SONGS ROW (Pinned) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/library/liked')}
              className="group flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-md flex items-center justify-center shrink-0 shadow-lg">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">Liked Songs</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <span className="text-green-400 font-medium">📌 Pinned</span>
                  <span>•</span>
                  <span>{likedSongs.length} songs</span>
                </div>
              </div>
            </motion.div>

            {/* 2. PLAYLISTS LIST */}
            {playlists.map((playlist, i) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
                className="group flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 bg-neutral-800 rounded-md overflow-hidden shrink-0 shadow-sm border border-white/5">
                  {playlist.cover ? (
                    <img
                      src={playlist.cover.startsWith('http') ? playlist.cover : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${playlist.cover.startsWith('/') ? playlist.cover.slice(1) : playlist.cover}`}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ListMusic className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate text-base">{playlist.name}</h3>
                  <p className="text-sm text-neutral-400 truncate">Playlist • {playlist.songs?.length || 0} songs</p>
                </div>
              </motion.div>
            ))}

            {/* 3. NEW PLAYLIST ROW */}
            <div onClick={() => setDialogOpen(true)} className="flex items-center gap-4 p-2 rounded-xl opacity-60 hover:opacity-100 transition-opacity cursor-pointer mt-2">
              <div className="w-16 h-16 rounded-md bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                <Plus className="w-6 h-6 text-white/50" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">Create new playlist</h3>
              </div>
            </div>

            {/* HIDDEN DIALOG FOR NEW PLAYLIST ROW */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  />
                  <Button onClick={handleCreatePlaylist} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>

          </div>

          <div className="h-20" />
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default Library;

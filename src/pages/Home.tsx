import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import SongCard from '@/components/SongCard';
import { songsApi, libraryApi, browseApi, radioApi, API_URL } from '@/lib/api';
import { Song, Genre } from '@/types/music';
import { usePlayerStore } from '@/stores/playerStore';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';

// Removed local API_URL definition


const Home = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [because, setBecause] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSong } = usePlayerStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, genresRes] = await Promise.all([
          songsApi.getAll(1, 12, 'random'),
          browseApi.genres(),
        ]);

        setSongs(songsRes.data.items || []);
        setGenres(genresRes.data || []);

        // Fetch authenticated data
        if (isAuthenticated) {
          try {
            const [recsRes, recentRes] = await Promise.all([
              libraryApi.getRecommendations(),
              libraryApi.getRecent(),
            ]);
            setRecommendations(recsRes.data || []);
            setRecentlyPlayed(recentRes.data || []);

            // Fetch 'Because You Listened' if recent exists
            if (recentRes.data && recentRes.data.length > 0) {
              const firstRecent = recentRes.data[0];
              // Use radioApi or direct axios if not exported
              const becauseRes = await radioApi.becauseYouListened(firstRecent.id);
              setBecause(becauseRes.data || []);
            }
          } catch {
            // User might not be authenticated
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0]);
    }
  };

  return (
    <div className="min-h-screen pb-32 relative">
      {/* Mobile Profile Trigger */}
      <div className="md:hidden absolute top-12 left-4 z-50">
        <Button
          onClick={() => useUIStore.getState().setSidebarOpen(true)}
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10"
        >
          {/* Use User's Avatar or Icon */}
          <User className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero Section - KREW branding, unique accent, spacing rhythm */}

      {/* Hero Section - KREW branding, unique accent, spacing rhythm */}
      <div className="relative min-h-[22rem] flex items-end overflow-hidden pt-12 pb-12 md:pt-20 md:pb-20">
        {/* KREW: animated/static bg, strong overlay, not Spotify green */}
        <div
          className="absolute inset-0 bg-cover bg-center animate-hero-waveform"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* KREW accent: deep blue-violet gradient, not Spotify green */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1446]/90 via-[#2d1e5f]/70 to-transparent" />
        {/* Content wrapper with max width and responsive padding */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-start px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* KREW: unique font, accent, and spacing */}
            <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight mb-2 text-white drop-shadow-lg">
              Your Music
            </h1>
            <p className="text-lg md:text-2xl font-medium text-[#b6aaff] mb-2">
              All your favorites, everywhere you go
            </p>
            <span className="block text-sm font-semibold text-white/40 mb-6">
              without ads
            </span>
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl">
              Discover new tracks, revisit favorites, and let the music take you on a journey.
            </p>
          </motion.div>
        </div>
      </div>


      <div className="p-4 md:p-8 space-y-8 pb-32">
        {/* Recently Played - Spotify Style "Jump Back In" (2-col grid) */}
        {recentlyPlayed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Jump back in</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentlyPlayed.slice(0, 6).map((song, i) => (
                <div key={`recent-${song.id}`} className="overflow-hidden">
                  <SongCard song={song} index={i} variant="list" compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Because You Listened - Horizontal Rail */}
        {because.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#a685fa]" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Because you listened</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 -mx-4 px-4 scrollbar-hide snap-x">
              {because.slice(0, 8).map((song, i) => (
                <div key={`because-${song.id}`} className="w-44 md:w-56 shrink-0 snap-start">
                  <SongCard song={song} index={i} variant="grid" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Made For You - Horizontal Rail */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Made For You</h2>
            <div className="flex overflow-x-auto pb-4 gap-4 -mx-4 px-4 scrollbar-hide snap-x">
              {recommendations.slice(0, 8).map((song, i) => (
                <div key={`rec-${song.id}`} className="w-44 md:w-56 shrink-0 snap-start">
                  <SongCard song={song} index={i} variant="grid" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Browse Genres - Horizontal Pills */}
        {genres.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Browse All</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {genres.slice(0, 8).map((genre, i) => (
                <motion.button
                  key={genre.genre}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/genre/${genre.genre}`)}
                  className="relative h-20 rounded-lg overflow-hidden bg-white/10"
                >
                  {genre.cover && (
                    <img
                      src={genre.cover.startsWith('http') ? genre.cover : `${API_URL}/covers/${genre.cover}`}
                      className="absolute right-[-10%] bottom-[-10%] w-16 h-16 rotate-[25deg] shadow-lg"
                    />
                  )}
                  <span className="absolute top-2 left-3 font-bold text-sm md:text-base">{genre.genre}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* All Songs - Vertical List (Keep as fallback) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">All Songs</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')} className="text-xs">
              View all
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {songs.slice(0, 8).map((song, i) => (
              <SongCard key={song.id} song={song} index={i} variant="list" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

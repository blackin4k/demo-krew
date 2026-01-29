import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SongCard from '@/components/SongCard';
import { songsApi, browseApi, API_URL } from '@/lib/api';
import { Song, Genre } from '@/types/music';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    browseApi.genres().then((res) => setGenres(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    const searchSongs = async () => {
      if (!query.trim() && !selectedGenre) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const res = await songsApi.search(query, selectedGenre || undefined);
        // Handle new response format { results: [], recommended: [] }
        if (Array.isArray(res.data)) {
          // Fallback for old API if needed
          setResults(res.data);
          setRecommended([]);
        } else {
          setResults(res.data.results || []);
          setRecommended(res.data.recommended || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchSongs, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedGenre]);

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre(null);
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen pb-40 md:pb-32 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold mb-6 pt-4">Search</h1>

        {/* Search input - Sleeker */}
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-12 h-12 text-base bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20 transition-all font-medium"
          />
          {(query || selectedGenre) && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Genre filters - Chips */}
        <div className="flex flex-wrap gap-2 mt-6">
          {genres.slice(0, 8).map((genre) => (
            <button
              key={genre.genre}
              onClick={() => setSelectedGenre(selectedGenre === genre.genre ? null : genre.genre)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all text-xs border',
                selectedGenre === genre.genre
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/10 hover:border-white/30'
              )}
            >
              {genre.genre}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results or Browse */}
      {hasSearched ? (
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-muted/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/20 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/50">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* LIST VIEW for Results - "Spotify Style" */}
              <div className="flex flex-col gap-1">
                {results.map((song, i) => (
                  <SongCard key={song.id} song={song} index={i} variant="list" />
                ))}
              </div>

              {/* Recommendations below results */}
              {recommended.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/5">
                  <h3 className="text-lg font-bold mb-4">You might also like</h3>
                  <div className="flex flex-col gap-1">
                    {recommended.map((song, i) => (
                      <SongCard key={`rec-${song.id}`} song={song} index={i} variant="list" />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : recommended.length > 0 ? (
            // Fallback Recs (No exact results)
            <div>
              <div className="text-center py-8">
                <p className="text-lg text-white mb-2 font-medium">
                  {(() => {
                    const partialMessages = [
                      "Close, but no exact match",
                      "Almost! Try these instead",
                      "No perfect match, but vibes aligned",
                      "Couldn't find that exact one",
                      "No dice on exact match",
                      "These are close enough, right?",
                      "Not exactly, but check these out",
                      "We got creative with your search"
                    ];
                    return partialMessages[Math.floor(Math.random() * partialMessages.length)];
                  })()}
                </p>
                <p className="text-sm text-white/50">Try these instead:</p>
              </div>
              <div className="flex flex-col gap-1">
                {recommended.map((song, i) => (
                  <SongCard key={song.id} song={song} index={i} variant="list" />
                ))}
              </div>
            </div>
          ) : (() => {
            // Fun randomized "no results" messages
            const noResultsMessages = [
              "We searched everywhere. Even places we shouldn't.",
              "No results. The song might be imaginary.",
              "That song is hiding from us.",
              "We found vibes, not songs.",
              "Are you sure that song exists? 👀",
              "Even Google said \"bro idk\".",
              "No tracks found. Try spelling with confidence.",
              "This search returned emotional damage.",
              "The database blinked twice and gave up.",
              "That song ghosted us.",
              "We searched the cloud. It was empty.",
              "Song not found. Maybe it's unreleased… or nonexistent.",
              "We asked the servers nicely. They said no.",
              "Nothing here but silence.",
              "Your search scared the songs away.",
              "No results. But respect the effort.",
              "We tried. The song didn't.",
              "That query unlocked absolutely nothing.",
              "The music gods declined this request.",
              "We searched high and low. Mostly low.",
              "This song is underground. Like, really underground.",
              "No songs found. Only disappointment.",
              "The internet shrugged.",
              "This search result is minimalist.",
              "Song not found. Start a band?",
              "The vibes are off. Try again.",
              "We searched. The song said \"later\".",
              "That track is playing hide and seek.",
              "Nothing came back. Not even crumbs.",
              "This is awkward… no results.",
              "That song is in another timeline.",
              "We checked the archives. Empty.",
              "Song not found. But nice taste tho.",
              "Even the servers are confused.",
              "This search returned thoughts.",
              "That track doesn't want to be perceived.",
              "No songs. Just imagination.",
              "We searched with passion. Still nothing.",
              "That song is shy.",
              "The playlist gods said \"nah\".",
              "No results. Try whispering it.",
              "This search hit rock bottom.",
              "Song missing. Probably character development.",
              "We tried autocomplete. It gave up too.",
              "That song is a myth.",
              "No tracks found. The silence is loud.",
              "This query unlocked freestyle mode.",
              "The servers looked at us funny.",
              "Song not found. Blame the universe.",
              "We searched aggressively. Nothing.",
              "That track is off-grid.",
              "Even the algorithms are lost.",
              "Search failed successfully.",
              "No results. But hey, new discovery arc?",
              "That song went out for milk.",
              "The database is judging you silently.",
              "Nothing found. Try a different reality.",
              "This search returned zero bangers.",
              "Song not found. Queue existential crisis.",
              "The servers said \"who?\"",
              "We searched everywhere except your head.",
              "No results. But the effort was real.",
              "That song is living rent-free somewhere else.",
              "This track chose invisibility.",
              "We tried our best. The song didn't exist.",
              "No songs found. But you're onto something.",
              "This search is a social experiment.",
              "The music evaporated.",
              "Song not found. Please don't sue us.",
              "Nothing here. Absolute cinema 🎬"
            ];
            const randomMessage = noResultsMessages[Math.floor(Math.random() * noResultsMessages.length)];

            return (
              <div className="text-center py-20 opacity-50">
                <p className="text-lg font-medium">{randomMessage}</p>
                <p className="text-sm mt-1">Try a different keyword</p>
              </div>
            );
          })()}
        </div>
      ) : null}

      {!hasSearched && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6">Browse All</h2>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {genres.map((genre, i) => (
              <motion.button
                key={genre.genre}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/genre/${genre.genre}`)}
                className="group relative aspect-[1.6/1] rounded-xl overflow-hidden active:scale-95 transition-transform"
              >
                {/* FIX: Correct API_URL usage for genre covers */}
                {genre.cover ? (
                  <img
                    src={genre.cover.startsWith('http') ? genre.cover : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${genre.cover.startsWith('/') ? genre.cover.slice(1) : genre.cover}`}
                    alt={genre.genre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rotate-0 group-hover:rotate-2"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(i * 45) % 360}, 60%, 40%), hsl(${(i * 45 + 50) % 360}, 50%, 25%))`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute top-3 left-3">
                  <h3 className="font-bold text-lg text-white leading-tight drop-shadow-md">{genre.genre}</h3>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;

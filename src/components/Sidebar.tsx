import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  ListMusic,
  LogOut,
  Disc3,
  Users,
  Radio,
  Upload,
  Music,
  Sparkles,
  FlaskConical,
  Orbit,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

// Reusable Content Component
export const SidebarContent = ({ onNavigate, mode = 'desktop' }: { onNavigate?: () => void, mode?: 'desktop' | 'mobile' }) => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate();
    navigate('/auth');
  };

  const { isAuthenticated, user } = useAuthStore();
  // Treat as Guest if not auth OR if user data is missing (stale token case)
  const isGuest = !isAuthenticated || !user;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/radio', icon: Radio, label: 'Radio' },
    { to: '/upload', icon: Upload, label: 'Upload' },
    { to: '/jam', icon: Users, label: 'Jam' },
    { to: '/the-lab', icon: FlaskConical, label: 'The Lab' },
    { to: '/dig', icon: Disc3, label: 'Crate Digger' },
    { to: '/galaxy', icon: Orbit, label: 'Sonic Galaxy' },
  ].filter(item => {
    if (isGuest) {
      // Guest: Only show Home and Search (as requested)
      return ['Home', 'Search'].includes(item.label);
    }
    if (mode === 'mobile') {
      // Hide Search, Library, and The Lab on mobile
      return !['Search', 'Library', 'The Lab'].includes(item.label);
    }
    return true;
  });

  const libraryItems = isGuest ? [] : [
    { to: '/library/liked', icon: Heart, label: 'Liked Songs' },
    { to: '/library/playlists', icon: ListMusic, label: 'Playlists' },
    { to: '/albums', icon: Disc3, label: 'Albums' },
    { to: '/artists', icon: Users, label: 'Artists' },
  ].filter(item => {
    if (mode === 'mobile') {
      return !['Liked Songs', 'Playlists'].includes(item.label);
    }
    return true;
  });

  const toolsItems = isGuest ? [] : [
    { to: '/queue', icon: Music, label: 'Queue' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative">
      {/* Profile Header */}
      <div className="pt-16 px-6 pb-2">
        {isGuest ? (
          <NavLink to="/auth" className="flex items-center gap-3 group bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">Sign In</span>
          </NavLink>
        ) : (
          <NavLink
            to="/profile"
            onClick={() => handleClick('/profile')}
            className="flex items-center gap-4 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="h-full w-full rounded-full bg-black/40 flex items-center justify-center overflow-hidden">
                {/* Placeholder or User Image */}
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white leading-tight">
                {useAuthStore(state => state.user?.username || 'Guest')}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                View profile
              </span>
            </div>
          </NavLink>
        )}
      </div>

      {/* Main nav */}
      <nav className="px-4 space-y-2 mb-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => handleClick(item.to)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium relative group overflow-hidden',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/20 border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 relative z-10 transition-transform duration-300", isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "group-hover:text-primary group-hover:scale-110")} />
                <span className="relative z-10 text-base tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Library section */}
      <div className="mt-2 px-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Library
          </span>
          <button className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-1">
          {libraryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => handleClick(item.to)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-transparent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Tools section */}
      <div className="mt-2 px-3 mb-6">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 block mb-2">
          Tools
        </span>
        <div className="space-y-1">
          {toolsItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => handleClick(item.to)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-transparent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {!isGuest && (
        <div className="px-6 pb-6 space-y-2">
          <NavLink
            to="/capsule"
            onClick={() => handleClick('/capsule')}
            className={({ isActive }) => cn(
              "w-full flex items-center px-4 py-2 rounded-lg transition-all duration-300 font-medium group",
              isActive
                ? "bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                : "text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-500/10"
            )}
          >
            <Sparkles className="h-4 w-4 mr-3" />
            Your Capsule
          </NavLink>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground pl-4"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden md:flex flex-col w-64 fixed left-4 top-4 bottom-24 z-40 overflow-y-auto no-scrollbar bg-black/40 backdrop-blur-3xl border border-sidebar-primary/20 shadow-2xl rounded-3xl"
    >
      <SidebarContent />
    </motion.aside>
  );
};

export default Sidebar;

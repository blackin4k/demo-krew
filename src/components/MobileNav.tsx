import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Library, Music2, Menu, ListMusic, Users, Radio, Upload, FlaskConical, Disc3, Orbit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const MobileNav = () => {
  const location = useLocation();

  const isGuest = !localStorage.getItem('token');
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'Library' },
  ].filter(item => isGuest ? item.label !== 'Library' : true);

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border pb-safe">
      <div className="flex items-center justify-around py-2 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;

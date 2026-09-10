'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Swords,
  Trophy,
  History,
  User,
  LogOut,
  Volume2,
  VolumeX,
  Menu,
  X,
  Sparkles,
  Bot,
  Users,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, isGuest, guestName } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSoundOn(soundManager.isEnabled());
  }, []);

  const toggleAudio = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
  };

  const navLinks = [
    { label: 'Play Online', href: '/play', icon: Swords },
    { label: 'Pass & Play / AI', href: '/local', icon: Users },
    { label: '🖐️ Hand Control', href: '/local?mode=hand', icon: Sparkles, isHighlight: true },
    { label: 'History', href: '/history', icon: History },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform duration-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Chess Arena Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                CHESS ARENA
              </span>
              <span className="text-[10px] tracking-wider uppercase text-emerald-400/90 font-semibold -mt-1">
                FIDE Standard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.isHighlight
                      ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-950/50 font-bold'
                      : isActive
                      ? 'bg-slate-800/90 text-emerald-400 border border-slate-700/80 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  {item.label}
                  {item.isHighlight && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Sound Mute/Unmute */}
            <button
              onClick={toggleAudio}
              aria-label="Toggle Sound"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/60"
            >
              {mounted && !soundOn ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Profile Dropdown or Sign In */}
            {user && profile ? (
              <div className="flex items-center gap-3">
                {/* Rating badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-xs font-bold text-amber-400 shadow-inner">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{profile.rating}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/50 transition-all">
                      <Avatar className="w-9 h-9 border border-emerald-500/60 shadow-md">
                        <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`} alt={profile.username} />
                        <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                          {profile.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl p-1.5">
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-white truncate">{profile.display_name || profile.username}</p>
                        <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
                        <p className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-1">
                          <Trophy className="w-3 h-3" /> ELO Rating: {profile.rating}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem
                      onClick={() => router.push('/profile')}
                      className="cursor-pointer hover:bg-slate-800 text-slate-200 focus:bg-slate-800 focus:text-white"
                    >
                      <User className="w-4 h-4 mr-2 text-emerald-400" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push('/history')}
                      className="cursor-pointer hover:bg-slate-800 text-slate-200 focus:bg-slate-800 focus:text-white"
                    >
                      <History className="w-4 h-4 mr-2 text-emerald-400" />
                      Game History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-400 hover:bg-red-950/50 hover:text-red-300 focus:bg-red-950/50 focus:text-red-300"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-950/40 text-xs sm:text-sm px-3.5"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </Button>
              </div>
            )}

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top duration-200">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/40"
              >
                <User className="w-4 h-4 text-emerald-400" />
                My Profile
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Authentication Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

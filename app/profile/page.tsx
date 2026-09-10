'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Trophy,
  Swords,
  Award,
  Calendar,
  Sparkles,
  Edit2,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, profile, updateProfile, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  // Preset avatar choices
  const presetAvatars = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=carlsen`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=kasparov`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=fischer`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=tal`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=capablanca`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=anand`,
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updateProfile({
      display_name: displayName.trim() || profile?.username,
      avatar_url: avatarUrl.trim() || profile?.avatar_url,
    });

    setSaving(false);
    if (error) {
      toast.error('Failed to update profile.');
    } else {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-slate-400 text-sm">Loading player profile...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Grandmaster Profile</h2>
        <p className="text-slate-400 max-w-sm mb-6 text-xs sm:text-sm">
          Sign in or create an account to view your career statistics, track your ELO rating, and customize your avatar.
        </p>
        <Button
          onClick={() => setAuthModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Sign In to View Profile
        </Button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const winRate = profile.games_played > 0 ? Math.round((profile.wins / profile.games_played) * 100) : 0;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-900/60 via-slate-900 to-amber-950/40 relative border-b border-slate-800" />

        <CardContent className="p-6 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-slate-950 bg-slate-800 shadow-xl ring-2 ring-emerald-500/50">
                <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`} />
                <AvatarFallback className="text-2xl font-bold text-white">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {profile.display_name || profile.username}
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold uppercase">
                    Active
                  </span>
                </div>
                <p className="text-sm text-slate-400">@{profile.username}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Button
              onClick={() => {
                setDisplayName(profile.display_name || profile.username);
                setAvatarUrl(profile.avatar_url || '');
                setIsEditing(!isEditing);
              }}
              size="sm"
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>

          {/* Edit Form Drawer */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-white">Customize Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Display Name</Label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Custom Avatar Image URL</Label>
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-900 border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Preset Avatars picker */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Or choose a Grandmaster Avatar:</Label>
                <div className="flex gap-2 flex-wrap">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`p-1 rounded-full border transition-all ${
                        avatarUrl === url ? 'border-emerald-500 scale-110' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={url} />
                      </Avatar>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Career Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Rating Card */}
        <Card className="bg-slate-900/80 border-slate-800 p-4 flex flex-col items-center justify-center text-center shadow-md">
          <Trophy className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-2xl font-black text-amber-400 font-mono">{profile.rating}</span>
          <span className="text-xs text-slate-400 mt-0.5">FIDE Elo Rating</span>
        </Card>

        {/* Matches Played */}
        <Card className="bg-slate-900/80 border-slate-800 p-4 flex flex-col items-center justify-center text-center shadow-md">
          <Swords className="w-6 h-6 text-teal-400 mb-1" />
          <span className="text-2xl font-black text-slate-100 font-mono">{profile.games_played}</span>
          <span className="text-xs text-slate-400 mt-0.5">Games Played</span>
        </Card>

        {/* Win Rate */}
        <Card className="bg-slate-900/80 border-slate-800 p-4 flex flex-col items-center justify-center text-center shadow-md">
          <Award className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-2xl font-black text-emerald-400 font-mono">{winRate}%</span>
          <span className="text-xs text-slate-400 mt-0.5">Win Rate</span>
        </Card>

        {/* W / D / L breakdown */}
        <Card className="bg-slate-900/80 border-slate-800 p-4 flex flex-col items-center justify-center text-center shadow-md">
          <div className="flex items-center gap-1.5 text-base font-bold font-mono">
            <span className="text-emerald-400">{profile.wins}W</span>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400">{profile.draws}D</span>
            <span className="text-slate-500">/</span>
            <span className="text-red-400">{profile.losses}L</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Wins / Draws / Losses</span>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'signin' }) => {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const { error } = await signIn(signInEmail.trim(), signInPassword);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Failed to sign in. Please verify your credentials.');
    } else {
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (signUpUsername.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(
      signUpEmail.trim(),
      signUpPassword,
      signUpUsername.trim(),
      signUpDisplayName.trim() || signUpUsername.trim()
    );
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Sign up failed. Please try again.');
    } else {
      setSuccessMessage('Account created successfully! You are now logged in.');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl p-6">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-2">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
            Chess Arena
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Sign in to track your rating, save game history, and play rated multiplayer matches.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-800/60 text-red-200 py-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-emerald-950/50 border-emerald-800/60 text-emerald-200 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-xs">{successMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={(val) => { setTab(val as 'signin' | 'signup'); setErrorMessage(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/80 border border-slate-700/50 p-1">
            <TabsTrigger value="signin" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium">
              Create Account
            </TabsTrigger>
          </TabsList>

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="mt-4 space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="grandmaster@chess.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="pl-9 pr-10 bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 shadow-lg shadow-emerald-950/40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="signup" className="mt-4 space-y-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    required
                    placeholder="magnus_carlsen"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value.replace(/\s+/g, '_'))}
                    className="pl-9 bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-300">Display Name (Optional)</Label>
                <Input
                  type="text"
                  placeholder="Magnus"
                  value={signUpDisplayName}
                  onChange={(e) => setSignUpDisplayName(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="magnus@worldchess.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="pl-9 pr-10 bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500 text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 shadow-lg shadow-emerald-950/40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Creating Account...' : 'Create Account (Start at 1200)'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

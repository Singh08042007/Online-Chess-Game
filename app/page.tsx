'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { set } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateProfile } from '@/components/CreateProfile'
import { Copy } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedName = localStorage.getItem('playerName');
    const storedId = localStorage.getItem('playerId');
    if (storedName) {
      setPlayerName(storedName);
    }
    if (storedId) {
      setPlayerId(storedId);
    } else {
      const newPlayerId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('playerId', newPlayerId);
      setPlayerId(newPlayerId);
    }
  }, []);

  const createNewGame = async () => {
    if (!playerId) return;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCreatedRoomCode(roomCode);
    router.push(`/game/${roomCode}?playerId=${playerId}&playerName=${encodeURIComponent(playerName!)}`);
  };

  const joinGame = () => {
    if (joinRoomCode && playerId && playerName) {
      router.push(`/game/${joinRoomCode}?playerId=${playerId}&playerName=${encodeURIComponent(playerName)}`);
    }
  };

  const copyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      toast({
        title: "Room code copied!",
        description: "The room code has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-amber-100 to-amber-200 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-amber-800 dark:text-amber-300">Chess Game Lobby</h1>
      {!playerName ? (
        <CreateProfile onProfileCreated={(name) => {
          setPlayerName(name);
          localStorage.setItem('playerName', name);
        }} />
      ) : (
        <Card className="w-full max-w-md bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Welcome, {playerName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-amber-700 dark:text-amber-300">Create New Game</h2>
                <Button
                  onClick={createNewGame}
                  className="w-full"
                >
                  Create New Game
                </Button>
              </div>
              {createdRoomCode && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Code:</p>
                  <div className="flex items-center mt-1">
                    <Input
                      type="text"
                      value={createdRoomCode}
                      readOnly
                      className="mr-2"
                    />
                    <Button onClick={copyRoomCode} size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold mb-2 text-amber-700 dark:text-amber-300">Join Existing Game</h2>
                <Input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter full room code"
                  maxLength={20}
                  className="mb-2"
                />
                <Button
                  onClick={joinGame}
                  className="w-full"
                  disabled={!joinRoomCode}
                >
                  Join Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


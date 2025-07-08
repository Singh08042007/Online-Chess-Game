'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChessBoard } from '@/components/ChessBoard';
import { ChatBox } from '@/components/ChatBox';
import { useChessGame } from '@/hooks/useChessGame';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Game() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const { 
    gameState, 
    messages, 
    createGame, 
    joinGame, 
    makeMove, 
    sendMessage, 
    resignGame, 
    canMakeMove, 
    getPlayerRole, 
    isPlayerInGame, 
    isValidMove, 
    isKingInCheck, 
    isPawnPromotion,
    calculatePossibleMoves,
    handlePromotion
  } = useChessGame(gameId, playerId, playerName);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    const storedPlayerName = localStorage.getItem('playerName');
    const urlPlayerId = searchParams.get('playerId');
    const urlPlayerName = searchParams.get('playerName');
    
    if (urlPlayerId && urlPlayerName) {
      setPlayerId(urlPlayerId);
      setPlayerName(decodeURIComponent(urlPlayerName));
    } else if (storedPlayerId && storedPlayerName) {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName);
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (playerId && playerName) {
      if (!gameState.players.white) {
        createGame(playerName);
      } else if (!gameState.players.black && gameState.players.white.id !== playerId) {
        joinGame(playerName);
      }
    }
  }, [playerId, playerName, gameState.players, createGame, joinGame]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const playerRole = getPlayerRole();

  useEffect(() => {
    console.log('Player role updated:', playerRole);
  }, [playerRole]);

  useEffect(() => {
    console.log('Game state updated:', {
      status: gameState.status,
      currentPlayer: gameState.currentPlayer,
      players: gameState.players,
      playerRole
    });
  }, [gameState, playerRole]);

  const handleResign = useCallback(() => {
    if (playerRole !== 'spectator') {
      resignGame(playerRole);
    }
  }, [playerRole, resignGame]);

  const handleBackToLobby = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!gameState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-blue-800 dark:text-blue-300">Chess Game</h1>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-8 text-purple-700 dark:text-purple-300">Room Code: {gameId}</h2>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full max-w-6xl">
        <Card className="w-full lg:w-[60%] bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-700 dark:text-blue-300">Game Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <p className="text-sm sm:text-lg font-semibold text-blue-600 dark:text-blue-300">
                White: {gameState.players.white?.name || 'Waiting...'} - {formatTime(gameState.whiteTime)}
              </p>
              <p className="text-sm sm:text-lg font-semibold text-blue-600 dark:text-blue-300">
                Black: {gameState.players.black?.name || 'Waiting...'} - {formatTime(gameState.blackTime)}
              </p>
            </div>
            <p className="mb-4 text-sm sm:text-lg font-semibold text-purple-600 dark:text-purple-300">
              Current Player: <span className="capitalize">{gameState.currentPlayer}</span>
              {gameState.isCheck && <span className="ml-2 text-red-600 dark:text-red-400 font-bold">(In Check!)</span>}
            </p>
            {playerRole !== 'spectator' && (
              <p className="mb-4 text-sm sm:text-lg font-semibold text-green-600 dark:text-green-400">You are playing as: {playerRole}</p>
            )}
            <div className="flex justify-center">
              <ChessBoard
                board={gameState.board}
                onMove={(from, to) => {
                  console.log('Move attempt in Game component:', from, 'to', to);
                  makeMove(from, to);
                }}
                canMakeMove={canMakeMove(playerRole)}
                calculatePossibleMoves={calculatePossibleMoves}
                promotionPending={gameState.promotionPending}
                promotionSquare={gameState.promotionSquare}
                onPromotion={handlePromotion}
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm sm:text-lg font-semibold text-purple-600 dark:text-purple-300">Game Status: {gameState.status}</p>
              {gameState.status === 'active' && playerRole !== 'spectator' && (
                <Button onClick={handleResign} className="bg-red-600 hover:bg-red-700 text-white">
                  Resign
                </Button>
              )}
            </div>
            {gameState.status !== 'active' && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Game Over</AlertTitle>
                <AlertDescription>
                  {gameState.status === 'checkmate' && `${gameState.winner === 'white' ? 'White' : 'Black'} wins by checkmate!`}
                  {gameState.status === 'stalemate' && 'The game ended in a stalemate.'}
                  {gameState.status === 'resigned' && `${gameState.winner === 'white' ? 'White' : 'Black'} wins by resignation!`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <div className="w-full lg:w-[40%] space-y-4">
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-center text-blue-700 dark:text-blue-300">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatBox
                messages={messages}
                onSendMessage={sendMessage}
                currentPlayerId={playerId}
              />
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-center text-blue-700 dark:text-blue-300">Move History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 dark:border-gray-700">
                <ul className="list-disc pl-4">
                  {gameState.moves && gameState.moves.map((move, index) => (
                    <li key={index} className="mb-2 text-purple-600 dark:text-purple-300">
                      {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          <Button onClick={handleBackToLobby} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}


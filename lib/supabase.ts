import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzrhtskpvlnjpipagwtg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6cmh0c2twdmxuanBpcGFnd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNDAyMTMsImV4cCI6MjEwNDYxNjIxM30.ZGm-uW_i69RIVDdGsYY3FKu07M6AKwihlMSJIVyDyOo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  rating: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
}

export interface GameRecord {
  id: string;
  room_code: string;
  white_player_id: string | null;
  black_player_id: string | null;
  white_player_name: string | null;
  black_player_name: string | null;
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout' | 'abandoned';
  current_turn: 'white' | 'black';
  fen: string;
  pgn: string;
  winner_id: string | null;
  winner_color: 'white' | 'black' | 'draw' | null;
  result: string | null;
  termination: string | null;
  time_control_minutes: number;
  white_time_seconds: number;
  black_time_seconds: number;
  last_move_at: string;
  draw_offered_by: 'white' | 'black' | null;
  is_rated: boolean;
  white_rating_change: number;
  black_rating_change: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface MoveRecord {
  id: number;
  game_id: string;
  player_id: string | null;
  move_number: number;
  player_color: 'white' | 'black';
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece: string | null;
  promotion_piece: string | null;
  san: string;
  fen_after: string;
  created_at: string;
}

export interface GameMessageRecord {
  id: number;
  game_id: string;
  sender_id: string | null;
  sender_name: string;
  message: string;
  created_at: string;
}

-- ==============================================================================
-- CHESS ARENA - FULL SUPABASE DATABASE SCHEMA & REALTIME SETUP
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  rating integer not null default 1200,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for leaderboard queries
create index if not exists idx_profiles_rating on public.profiles(rating desc, wins desc);
create index if not exists idx_profiles_username on public.profiles(username);

-- 2. Create Games Table
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  white_player_id uuid references public.profiles(id) on delete set null,
  black_player_id uuid references public.profiles(id) on delete set null,
  white_player_name text,
  black_player_name text,
  status text not null default 'waiting', -- 'waiting', 'active', 'checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'abandoned'
  current_turn text not null default 'white', -- 'white' | 'black'
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text not null default '',
  winner_id uuid references public.profiles(id) on delete set null,
  winner_color text, -- 'white' | 'black' | 'draw'
  result text default '*', -- '1-0', '0-1', '1/2-1/2', '*'
  termination text, -- 'checkmate', 'resignation', 'stalemate', 'timeout', 'agreement', 'abandoned'
  time_control_minutes integer not null default 10,
  white_time_seconds integer not null default 600,
  black_time_seconds integer not null default 600,
  last_move_at timestamptz default now(),
  draw_offered_by text, -- 'white' | 'black' | null
  is_rated boolean not null default true,
  white_rating_change integer default 0,
  black_rating_change integer default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

-- Index for games queries
create index if not exists idx_games_room_code on public.games(room_code);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_white_player on public.games(white_player_id);
create index if not exists idx_games_black_player on public.games(black_player_id);

-- 3. Create Moves Table
create table if not exists public.moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete set null,
  move_number integer not null,
  player_color text not null, -- 'white' | 'black'
  from_square text not null,
  to_square text not null,
  piece text not null,
  captured_piece text,
  promotion_piece text,
  san text not null,
  fen_after text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_moves_game_id on public.moves(game_id, move_number);

-- 4. Create In-Game Chat Messages Table
create table if not exists public.game_messages (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_game_id on public.game_messages(game_id, created_at);

-- ==============================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  desired_username text;
  final_username text;
  user_display text;
  avatar text;
begin
  desired_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  user_display := coalesce(new.raw_user_meta_data->>'display_name', desired_username);
  avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id
  );
  
  -- Ensure username is unique
  final_username := desired_username;
  if exists (select 1 from public.profiles where username = final_username) then
    final_username := desired_username || '_' || substring(new.id::text from 1 for 4);
  end if;

  insert into public.profiles (id, username, display_name, avatar_url, rating)
  values (new.id, final_username, user_display, avatar, 1200)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 6. AUTHORITATIVE ELO & GAME COMPLETION FUNCTION
-- ==============================================================================
create or replace function public.finish_game(
  p_game_id uuid,
  p_winner_color text, -- 'white' | 'black' | 'draw'
  p_termination text   -- 'checkmate', 'resignation', 'stalemate', 'timeout', 'agreement'
)
returns json as $$
declare
  v_game record;
  v_white_profile record;
  v_black_profile record;
  v_white_rating int;
  v_black_rating int;
  v_expected_white float;
  v_expected_black float;
  v_actual_white float;
  v_actual_black float;
  v_k_factor int := 32;
  v_white_change int := 0;
  v_black_change int := 0;
  v_result text;
  v_winner_id uuid := null;
begin
  -- Fetch the game
  select * into v_game from public.games where id = p_game_id;
  if not found then
    return json_build_object('error', 'Game not found');
  end if;

  -- If game is already finished, return current state
  if v_game.status in ('checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'abandoned') then
    return json_build_object('status', 'already_finished', 'game_id', p_game_id);
  end if;

  -- Determine result string and winner id
  if p_winner_color = 'white' then
    v_result := '1-0';
    v_winner_id := v_game.white_player_id;
    v_actual_white := 1.0;
    v_actual_black := 0.0;
  elsif p_winner_color = 'black' then
    v_result := '0-1';
    v_winner_id := v_game.black_player_id;
    v_actual_white := 0.0;
    v_actual_black := 1.0;
  else
    v_result := '1/2-1/2';
    v_winner_id := null;
    v_actual_white := 0.5;
    v_actual_black := 0.5;
  end if;

  -- Calculate ELO changes if both players are registered and game was rated
  if v_game.is_rated and v_game.white_player_id is not null and v_game.black_player_id is not null and v_game.white_player_id <> v_game.black_player_id then
    select * into v_white_profile from public.profiles where id = v_game.white_player_id;
    select * into v_black_profile from public.profiles where id = v_game.black_player_id;

    if found and v_white_profile.id is not null and v_black_profile.id is not null then
      v_white_rating := v_white_profile.rating;
      v_black_rating := v_black_profile.rating;

      -- Standard Elo Expected score formula: 1 / (1 + 10^((R_opponent - R_player) / 400))
      v_expected_white := 1.0 / (1.0 + power(10.0, (v_black_rating - v_white_rating)::float / 400.0));
      v_expected_black := 1.0 / (1.0 + power(10.0, (v_white_rating - v_black_rating)::float / 400.0));

      v_white_change := round(v_k_factor * (v_actual_white - v_expected_white));
      v_black_change := round(v_k_factor * (v_actual_black - v_expected_black));

      -- Update White profile
      update public.profiles
      set 
        rating = greatest(100, rating + v_white_change),
        games_played = games_played + 1,
        wins = wins + (case when v_actual_white = 1.0 then 1 else 0 end),
        losses = losses + (case when v_actual_white = 0.0 then 1 else 0 end),
        draws = draws + (case when v_actual_white = 0.5 then 1 else 0 end),
        updated_at = now()
      where id = v_game.white_player_id;

      -- Update Black profile
      update public.profiles
      set 
        rating = greatest(100, rating + v_black_change),
        games_played = games_played + 1,
        wins = wins + (case when v_actual_black = 1.0 then 1 else 0 end),
        losses = losses + (case when v_actual_black = 0.0 then 1 else 0 end),
        draws = draws + (case when v_actual_black = 0.5 then 1 else 0 end),
        updated_at = now()
      where id = v_game.black_player_id;
    end if;
  end if;

  -- Determine final status
  declare
    v_final_status text;
  begin
    if p_termination = 'checkmate' then
      v_final_status := 'checkmate';
    elsif p_termination = 'resignation' then
      v_final_status := 'resigned';
    elsif p_termination = 'stalemate' then
      v_final_status := 'stalemate';
    elsif p_termination = 'timeout' then
      v_final_status := 'timeout';
    else
      v_final_status := 'draw';
    end if;

    update public.games
    set 
      status = v_final_status,
      winner_id = v_winner_id,
      winner_color = p_winner_color,
      result = v_result,
      termination = p_termination,
      white_rating_change = v_white_change,
      black_rating_change = v_black_change,
      finished_at = now()
    where id = p_game_id;
  end;

  return json_build_object(
    'success', true,
    'white_change', v_white_change,
    'black_change', v_black_change,
    'result', v_result
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.moves enable row level security;
alter table public.game_messages enable row level security;

-- Profiles: Public read, user can update only own profile
create policy "Public read profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Games: Public read (allows spectating and matchmaking)
create policy "Public read games" on public.games
  for select using (true);

-- Anyone authenticated can create a game
create policy "Authenticated create games" on public.games
  for insert with check (true);

-- Players in the game or spectators can update state (move/join)
create policy "Players can update games" on public.games
  for update using (true);

-- Moves: Public read, players can insert
create policy "Public read moves" on public.moves
  for select using (true);

create policy "Authenticated insert moves" on public.moves
  for insert with check (true);

-- Messages: Public read, insert allowed
create policy "Public read messages" on public.game_messages
  for select using (true);

create policy "Insert messages" on public.game_messages
  for insert with check (true);

-- ==============================================================================
-- 8. ENABLE REALTIME SUBSCRIPTIONS
-- ==============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'moves'
  ) then
    alter publication supabase_realtime add table public.moves;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_messages'
  ) then
    alter publication supabase_realtime add table public.game_messages;
  end if;
end $$;

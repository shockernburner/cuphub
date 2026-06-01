create extension if not exists pgcrypto;

create table if not exists public.teams (
  id text primary key,
  name text not null,
  short_name text not null,
  fifa_code text not null unique,
  country_code text not null,
  group_code text not null
);

create table if not exists public.matches (
  id text primary key,
  stage text not null default 'Group Stage',
  group_code text not null,
  kickoff_utc timestamptz not null,
  stadium text not null,
  city text not null,
  status text not null check (status in ('upcoming', 'live', 'full-time')),
  home_score integer,
  away_score integer,
  home_team_id text not null references public.teams(id) on delete restrict,
  away_team_id text not null references public.teams(id) on delete restrict
);

create table if not exists public.watch_links (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  country_code text not null,
  provider_name text not null,
  provider_url text not null,
  platform_type text not null,
  is_official boolean not null default true,
  priority integer not null default 0
);

create table if not exists public.fan_rooms (
  id text primary key,
  title text not null,
  description text not null,
  match_id text not null references public.matches(id) on delete cascade,
  room_type text not null check (room_type in ('global', 'country', 'restaurant'))
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text,
  favorite_team_ids text[] not null default '{}',
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  predicted_winner_team_id text references public.teams(id) on delete set null,
  first_scorer text,
  submitted_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  country_code text not null,
  rank integer not null,
  total_points integer not null default 0,
  exact_scores integer not null default 0,
  correct_results integer not null default 0,
  streak_value integer not null default 0,
  scope text not null check (scope in ('country', 'friends'))
);

create table if not exists public.restaurants (
  id text primary key,
  name text not null,
  city text not null,
  country_code text not null,
  maps_url text not null,
  whatsapp_url text not null,
  social_url text not null,
  capacity integer not null default 0,
  offer_text text not null,
  approval_state text not null check (approval_state in ('pending', 'approved', 'rejected')),
  verified_status boolean not null default false,
  ambassador_code text not null,
  submitted_by uuid references auth.users(id) on delete set null,
  boosted boolean not null default false
);

create table if not exists public.restaurant_matches (
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  primary key (restaurant_id, match_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.fan_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  moderation_state text not null default 'clear' check (moderation_state in ('clear', 'flagged'))
);

alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.watch_links enable row level security;
alter table public.fan_rooms enable row level security;
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_matches enable row level security;
alter table public.chat_messages enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    or auth.jwt() ->> 'role' = 'service_role',
    false
  );
$$;

create policy if not exists "public read teams" on public.teams for select using (true);
create policy if not exists "public read matches" on public.matches for select using (true);
create policy if not exists "public read watch links" on public.watch_links for select using (true);
create policy if not exists "public read fan rooms" on public.fan_rooms for select using (true);
create policy if not exists "public read leaderboard" on public.leaderboard_entries for select using (true);
create policy if not exists "public read restaurants" on public.restaurants for select using (true);
create policy if not exists "public read restaurant matches" on public.restaurant_matches for select using (true);
create policy if not exists "public read chat messages" on public.chat_messages for select using (true);

create policy if not exists "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy if not exists "users read own profile" on public.profiles for select using (auth.uid() = id);

create policy if not exists "users manage own predictions" on public.predictions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "authenticated insert chat" on public.chat_messages for insert with check (auth.role() = 'authenticated');
create policy if not exists "authenticated submit restaurants" on public.restaurants for insert with check (auth.role() = 'authenticated');
create policy if not exists "authenticated submit restaurant matches" on public.restaurant_matches for insert with check (auth.role() = 'authenticated');
create policy if not exists "admin update restaurants" on public.restaurants for update using (public.is_admin()) with check (public.is_admin());
create policy if not exists "admin update matches" on public.matches for update using (public.is_admin()) with check (public.is_admin());
create policy if not exists "admin insert watch links" on public.watch_links for insert with check (public.is_admin());
create policy if not exists "admin update watch links" on public.watch_links for update using (public.is_admin()) with check (public.is_admin());
create policy if not exists "admin manage leaderboard" on public.leaderboard_entries for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.perform_leaderboard_recalculation()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.leaderboard_entries;

  with scored_predictions as (
    select
      p.user_id,
      coalesce(pr.display_name, 'CupHub Fan') as display_name,
      coalesce(pr.country_code, 'US') as country_code,
      case
        when p.predicted_home_score = m.home_score and p.predicted_away_score = m.away_score then 30
        when (p.predicted_home_score - p.predicted_away_score) = (m.home_score - m.away_score) then 15
        when (
          (p.predicted_home_score > p.predicted_away_score and m.home_score > m.away_score)
          or (p.predicted_home_score < p.predicted_away_score and m.home_score < m.away_score)
          or (p.predicted_home_score = p.predicted_away_score and m.home_score = m.away_score)
        ) then 10
        else 0
      end as awarded_points,
      case when p.predicted_home_score = m.home_score and p.predicted_away_score = m.away_score then 1 else 0 end as exact_hit,
      case when (
        (p.predicted_home_score > p.predicted_away_score and m.home_score > m.away_score)
        or (p.predicted_home_score < p.predicted_away_score and m.home_score < m.away_score)
        or (p.predicted_home_score = p.predicted_away_score and m.home_score = m.away_score)
      ) then 1 else 0 end as correct_result
    from public.predictions p
    join public.matches m on m.id = p.match_id
    left join public.profiles pr on pr.id = p.user_id
    where m.status = 'full-time'
  ),
  aggregated as (
    select
      user_id,
      max(display_name) as display_name,
      max(country_code) as country_code,
      sum(awarded_points) as total_points,
      sum(exact_hit) as exact_scores,
      sum(correct_result) as correct_results,
      0 as streak_value
    from scored_predictions
    group by user_id
  ),
  ranked_country as (
    select
      gen_random_uuid() as id,
      user_id,
      display_name,
      country_code,
      dense_rank() over (partition by country_code order by total_points desc, exact_scores desc, correct_results desc, display_name asc) as rank,
      total_points,
      exact_scores,
      correct_results,
      streak_value,
      'country'::text as scope
    from aggregated
  ),
  ranked_friends as (
    select
      gen_random_uuid() as id,
      user_id,
      display_name,
      country_code,
      dense_rank() over (order by total_points desc, exact_scores desc, correct_results desc, display_name asc) as rank,
      total_points,
      exact_scores,
      correct_results,
      streak_value,
      'friends'::text as scope
    from aggregated
  )
  insert into public.leaderboard_entries (id, user_id, display_name, country_code, rank, total_points, exact_scores, correct_results, streak_value, scope)
  select * from ranked_country
  union all
  select * from ranked_friends;
end;
$$;

create or replace function public.recalculate_leaderboards()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  perform public.perform_leaderboard_recalculation();
end;
$$;

create or replace function public.refresh_leaderboards_on_match_finalization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'full-time'
    and (
      old.status is distinct from new.status
      or old.home_score is distinct from new.home_score
      or old.away_score is distinct from new.away_score
    ) then
    perform public.perform_leaderboard_recalculation();
  end if;

  return new;
end;
$$;

drop trigger if exists matches_refresh_leaderboards on public.matches;

create trigger matches_refresh_leaderboards
after update of status, home_score, away_score on public.matches
for each row
execute function public.refresh_leaderboards_on_match_finalization();

alter publication supabase_realtime add table public.chat_messages;
import { createClient } from '@supabase/supabase-js';

const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? fail('SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL is required so the importer knows which Supabase project to target.'),
  supabaseServiceRoleKey: requiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY is required for server-side upserts.'),
  sportmonksApiToken: requiredEnv('SPORTMONKS_API_TOKEN', 'SPORTMONKS_API_TOKEN is required to call the Sportmonks API.'),
  fixturesUrl: process.env.SPORTMONKS_WORLD_CUP_FIXTURES_URL ?? process.env.SPORTMONKS_FIXTURES_URL ?? fail('SPORTMONKS_WORLD_CUP_FIXTURES_URL or SPORTMONKS_FIXTURES_URL must be set.'),
  fallbackFixturesUrl: process.env.SPORTMONKS_WORLD_CUP_FIXTURES_URL_FALLBACK ?? '',
  teamsUrl: process.env.SPORTMONKS_WORLD_CUP_TEAMS_URL ?? process.env.SPORTMONKS_TEAMS_URL ?? '',
  fallbackTeamsUrl: process.env.SPORTMONKS_WORLD_CUP_TEAMS_URL_FALLBACK ?? '',
  sourcePrefix: process.env.SPORTMONKS_SOURCE_PREFIX ?? 'sportmonks',
};

const SPORTMONKS_WORLD_CUP_FIXTURE_INCLUDES = [
  'fixtures',
  'fixtures.participants',
  'fixtures.state',
  'fixtures.venue',
  'fixtures.stage',
  'fixtures.round',
  'fixtures.group',
].join(';');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const fixtureSource = await loadFixtureSource();
  const fixtures = fixtureSource.fixtures;
  const teams = config.teamsUrl ? await loadTeamsSource() : extractTeamsFromFixtures(fixtures);

  const normalizedTeams = dedupeById(teams.map(normalizeTeam).filter(Boolean));
  const teamIdMap = new Map(normalizedTeams.map((team) => [String(team.sourceId), team.id]));
  const teamNameMap = new Map(normalizedTeams.map((team) => [team.id, team.short_name]));
  const normalizedMatches = dedupeById(fixtures.map((fixture) => normalizeMatch(fixture, teamIdMap)).filter(Boolean));
  const fanRooms = normalizedMatches.map((match) => createGlobalFanRoom(match, teamNameMap));

  await upsertRows('teams', normalizedTeams.map(({ sourceId, ...row }) => row), 'id');
  await upsertRows('matches', normalizedMatches, 'id');
  await upsertRows('fan_rooms', fanRooms, 'id');

  console.log(`Imported ${normalizedTeams.length} teams, ${normalizedMatches.length} matches, and ${fanRooms.length} fan rooms from Sportmonks using season ${fixtureSource.seasonId ?? 'unknown'}.`);
}

async function loadFixtureSource() {
  const candidates = [
    { url: config.fixturesUrl, label: 'primary' },
    ...(config.fallbackFixturesUrl ? [{ url: config.fallbackFixturesUrl, label: 'fallback' }] : []),
  ];

  const failures = [];

  for (const candidate of candidates) {
    try {
      const payload = await fetchResource(withFixtureIncludes(candidate.url));
      const seasonData = extractData(payload);
      const fixtures = extractFixtures(payload);

      assertFixturesAreImportable(fixtures, candidate.url, payload);

      return {
        fixtures,
        seasonId: seasonData?.id ?? null,
        seasonName: seasonData?.name ?? null,
        sourceUrl: candidate.url,
      };
    } catch (error) {
      failures.push(`${candidate.label}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Unable to load fixtures from any configured Sportmonks source. ${failures.join(' | ')}`);
  }

  throw new Error('Unable to load fixtures from any configured Sportmonks source.');
}

async function loadTeamsSource() {
  const candidates = [
    config.teamsUrl,
    ...(config.fallbackTeamsUrl ? [config.fallbackTeamsUrl] : []),
  ].filter(Boolean);

  const failures = [];

  for (const candidate of candidates) {
    try {
      const payload = await fetchResource(candidate);
      const teams = extractArrayData(payload);

      if (teams.length > 0) {
        return teams;
      }
    } catch (error) {
      failures.push(error.message);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Unable to load teams from any configured Sportmonks source. ${failures.join(' | ')}`);
  }

  return [];
}

function assertFixturesAreImportable(fixtures, fixturesUrl, payload) {
  const sample = fixtures.find(Boolean);
  const message = payload?.message ?? null;

  if (message) {
    throw new Error(`Sportmonks returned no usable fixtures for ${fixturesUrl}: ${message}`);
  }

  if (!sample) {
    throw new Error(`Sportmonks returned no fixtures for ${fixturesUrl}. Use a World Cup 2026 filtered fixtures URL before running the importer.`);
  }

  const hasParticipants = Array.isArray(sample?.participants) && sample.participants.length >= 2;
  const hasLegacyTeams = Boolean(sample?.homeTeam || sample?.awayTeam || sample?.localTeam || sample?.visitorTeam);

  if (!hasParticipants && !hasLegacyTeams) {
    throw new Error(
      'SPORTMONKS_FIXTURES_URL must return fixtures with team participants included. The generic /fixtures endpoint is not enough. Provide a World Cup-filtered fixtures URL that includes the home/away participants and related stage or round data.'
    );
  }
}

async function fetchCollection(initialUrl) {
  const collected = [];
  let nextUrl = initialUrl;
  let page = 0;

  while (nextUrl) {
    page += 1;
    const payload = await fetchResource(nextUrl);
    const data = extractArrayData(payload);
    collected.push(...data);
    nextUrl = resolveNextPageUrl(payload, nextUrl);

    if (page > 100) {
      throw new Error('Sportmonks pagination exceeded 100 pages. Check the supplied endpoint filters.');
    }
  }

  return collected;
}

async function fetchResource(initialUrl) {
  const url = new URL(initialUrl);
  if (!url.searchParams.has('api_token')) {
    url.searchParams.set('api_token', config.sportmonksApiToken);
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Sportmonks request failed (${response.status}) for ${url}: ${payload?.message ?? 'Unknown error'}`);
  }

  return payload;
}

function withFixtureIncludes(initialUrl) {
  const url = new URL(initialUrl);

  if (!url.searchParams.has('include')) {
    url.searchParams.set('include', SPORTMONKS_WORLD_CUP_FIXTURE_INCLUDES);
  }

  return url.toString();
}

function extractData(payload) {
  return payload?.data ?? null;
}

function extractArrayData(payload) {
  return Array.isArray(payload?.data) ? payload.data : [];
}

function extractFixtures(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.fixtures)) {
    return payload.data.fixtures;
  }

  return [];
}

function resolveNextPageUrl(payload, currentUrl) {
  const pagination = payload?.pagination;

  if (!pagination) {
    return null;
  }

  if (typeof pagination.next_page_url === 'string' && pagination.next_page_url) {
    return pagination.next_page_url;
  }

  if (typeof pagination.next_page === 'string' && pagination.next_page.startsWith('http')) {
    return pagination.next_page;
  }

  if (typeof pagination.next_page === 'number') {
    const url = new URL(currentUrl);
    url.searchParams.set('page', String(pagination.next_page));
    return url.toString();
  }

  return null;
}

function extractTeamsFromFixtures(fixtures) {
  return fixtures.flatMap((fixture) => {
    const participants = Array.isArray(fixture?.participants) ? fixture.participants : [];
    if (participants.length > 0) {
      return participants;
    }

    return [fixture?.homeTeam, fixture?.awayTeam, fixture?.localTeam, fixture?.visitorTeam].filter(Boolean);
  });
}

function normalizeTeam(rawTeam) {
  const sourceId = pickFirst(
    rawTeam?.id,
    rawTeam?.participant_id,
    rawTeam?.team_id,
    readPath(rawTeam, 'team.id')
  );

  if (!sourceId) {
    return null;
  }

  const name = pickFirst(rawTeam?.name, readPath(rawTeam, 'team.name'));

  if (!name) {
    return null;
  }

  const shortName = pickFirst(
    rawTeam?.short_name,
    rawTeam?.shortName,
    rawTeam?.code,
    rawTeam?.fifa_code,
    name
  );

  const countryCode = sanitizeCode(pickFirst(
    rawTeam?.country_code,
    rawTeam?.iso2,
    rawTeam?.iso_code,
    readPath(rawTeam, 'country.code'),
    readPath(rawTeam, 'country.iso2')
  ));

  return {
    sourceId: String(sourceId),
    id: `${config.sourcePrefix}-team-${sourceId}`,
    name,
    short_name: shortName,
    fifa_code: sanitizeCode(pickFirst(rawTeam?.fifa_code, rawTeam?.code, shortName)).slice(0, 3),
    country_code: countryCode || 'INT',
    group_code: pickFirst(readPath(rawTeam, 'group.name'), rawTeam?.group_name, 'TBD'),
  };
}

function normalizeMatch(rawFixture, teamIdMap) {
  const sourceId = pickFirst(rawFixture?.id, rawFixture?.fixture_id);
  const participants = getParticipants(rawFixture);
  const home = participants.home;
  const away = participants.away;

  if (!sourceId || !home || !away) {
    return null;
  }

  const homeSourceId = String(pickFirst(home?.id, home?.participant_id, home?.team_id, readPath(home, 'team.id')));
  const awaySourceId = String(pickFirst(away?.id, away?.participant_id, away?.team_id, readPath(away, 'team.id')));
  const homeTeamId = teamIdMap.get(homeSourceId);
  const awayTeamId = teamIdMap.get(awaySourceId);

  if (!homeTeamId || !awayTeamId) {
    return null;
  }

  const score = getScoreSnapshot(rawFixture, participants);
  const stage = pickFirst(
    readPath(rawFixture, 'stage.name'),
    readPath(rawFixture, 'round.name'),
    rawFixture?.stage,
    'Tournament'
  );

  return {
    id: `${config.sourcePrefix}-fixture-${sourceId}`,
    stage,
    group_code: pickFirst(readPath(rawFixture, 'group.name'), rawFixture?.group_name, null),
    kickoff_utc: normalizeKickoff(rawFixture),
    stadium: pickFirst(readPath(rawFixture, 'venue.name'), rawFixture?.venue_name, 'Venue TBC'),
    city: pickFirst(readPath(rawFixture, 'venue.city_name'), readPath(rawFixture, 'venue.city.name'), rawFixture?.city_name, 'City TBC'),
    status: mapMatchStatus(rawFixture),
    home_score: score.home,
    away_score: score.away,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
  };
}

function getParticipants(rawFixture) {
  const participants = Array.isArray(rawFixture?.participants) ? rawFixture.participants : [];
  const home = participants.find((entry) => String(entry?.meta?.location ?? entry?.location ?? '').toLowerCase() === 'home')
    ?? rawFixture?.homeTeam
    ?? rawFixture?.localTeam;
  const away = participants.find((entry) => String(entry?.meta?.location ?? entry?.location ?? '').toLowerCase() === 'away')
    ?? rawFixture?.awayTeam
    ?? rawFixture?.visitorTeam;

  return { home, away };
}

function getScoreSnapshot(rawFixture, participants) {
  const homeParticipantScore = pickFirst(readPath(participants.home, 'score.goals'), participants.home?.score, participants.home?.goals);
  const awayParticipantScore = pickFirst(readPath(participants.away, 'score.goals'), participants.away?.score, participants.away?.goals);
  const scoreArray = Array.isArray(rawFixture?.scores) ? rawFixture.scores : [];
  const homeScoreEntry = scoreArray.find((entry) => String(entry?.participant ?? entry?.description ?? entry?.type ?? '').toLowerCase().includes('home'));
  const awayScoreEntry = scoreArray.find((entry) => String(entry?.participant ?? entry?.description ?? entry?.type ?? '').toLowerCase().includes('away'));

  return {
    home: toNullableNumber(pickFirst(homeParticipantScore, homeScoreEntry?.score, rawFixture?.home_score)),
    away: toNullableNumber(pickFirst(awayParticipantScore, awayScoreEntry?.score, rawFixture?.away_score)),
  };
}

function mapMatchStatus(rawFixture) {
  const value = String(pickFirst(
    readPath(rawFixture, 'state.state'),
    readPath(rawFixture, 'state.name'),
    rawFixture?.status,
    rawFixture?.result_info,
    'upcoming'
  )).toLowerCase();

  if (value.includes('live') || value.includes('inplay') || value.includes('halftime')) {
    return 'live';
  }

  if (value.includes('finished') || value.includes('full') || value.includes('ft')) {
    return 'full-time';
  }

  return 'upcoming';
}

function normalizeKickoff(rawFixture) {
  const kickoff = pickFirst(
    rawFixture?.starting_at,
    rawFixture?.kickoff_at,
    readPath(rawFixture, 'time.starting_at.date_time'),
    readPath(rawFixture, 'starting_at.date_time')
  );

  if (!kickoff) {
    throw new Error(`Fixture ${rawFixture?.id ?? 'unknown'} is missing a kickoff timestamp.`);
  }

  return new Date(kickoff).toISOString();
}

function createGlobalFanRoom(match, teamNameMap) {
  const homeLabel = teamNameMap.get(match.home_team_id) ?? match.home_team_id;
  const awayLabel = teamNameMap.get(match.away_team_id) ?? match.away_team_id;

  return {
    id: `${match.id}-global`,
    title: `${homeLabel} vs ${awayLabel}`,
    description: 'Global live discussion powered by the latest imported World Cup fixture data.',
    match_id: match.id,
    room_type: 'global',
  };
}

async function upsertRows(table, rows, onConflict) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    throw new Error(`Supabase upsert failed for ${table}: ${error.message}`);
  }
}

function dedupeById(rows) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function readPath(value, path) {
  return path.split('.').reduce((current, segment) => (current && current[segment] !== undefined ? current[segment] : undefined), value);
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function sanitizeCode(value) {
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredEnv(name, message) {
  const value = process.env[name];
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function fail(message) {
  throw new Error(message);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
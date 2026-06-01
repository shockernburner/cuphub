import { ChatMessage, Country, FanRoom, LeaderboardEntry, Match, Product, Restaurant, Team, WatchLink } from '@/src/domain/models';

type TeamSeed = [string, string, string, string];

const stadiums = [
  ['MetLife Stadium', 'New York'],
  ['Rose Bowl', 'Los Angeles'],
  ['Azteca', 'Mexico City'],
  ['Hard Rock Stadium', 'Miami'],
  ['AT&T Stadium', 'Dallas'],
  ['Mercedes-Benz Stadium', 'Atlanta'],
  ['Lusail Stadium', 'Doha'],
  ['Wembley', 'London'],
];

export const countries: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'BR', name: 'Brazil' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'DE', name: 'Germany' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'QA', name: 'Qatar' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
];

const groupedTeams: [string, TeamSeed[]][] = [
  ['A', [['usa', 'United States', 'USA', 'US'], ['mex', 'Mexico', 'MEX', 'MX'], ['qat', 'Qatar', 'QAT', 'QA'], ['jpn', 'Japan', 'JPN', 'JP']]],
  ['B', [['eng', 'England', 'ENG', 'GB'], ['nga', 'Nigeria', 'NGA', 'NG'], ['ecu', 'Ecuador', 'ECU', 'EC'], ['kor', 'South Korea', 'KOR', 'KR']]],
  ['C', [['bra', 'Brazil', 'BRA', 'BR'], ['cmr', 'Cameroon', 'CMR', 'CM'], ['srb', 'Serbia', 'SRB', 'RS'], ['can', 'Canada', 'CAN', 'CA']]],
  ['D', [['fra', 'France', 'FRA', 'FR'], ['sen', 'Senegal', 'SEN', 'SN'], ['chi', 'Chile', 'CHI', 'CL'], ['mar', 'Morocco', 'MAR', 'MA']]],
  ['E', [['ger', 'Germany', 'GER', 'DE'], ['gha', 'Ghana', 'GHA', 'GH'], ['sui', 'Switzerland', 'SUI', 'CH'], ['crc', 'Costa Rica', 'CRC', 'CR']]],
  ['F', [['arg', 'Argentina', 'ARG', 'AR'], ['col', 'Colombia', 'COL', 'CO'], ['nor', 'Norway', 'NOR', 'NO'], ['civ', 'Ivory Coast', 'CIV', 'CI']]],
  ['G', [['esp', 'Spain', 'ESP', 'ES'], ['uru', 'Uruguay', 'URU', 'UY'], ['tun', 'Tunisia', 'TUN', 'TN'], ['aus', 'Australia', 'AUS', 'AU']]],
  ['H', [['por', 'Portugal', 'POR', 'PT'], ['ned', 'Netherlands', 'NED', 'NL'], ['usa2', 'Saudi Arabia', 'KSA', 'SA'], ['cro', 'Croatia', 'CRO', 'HR']]],
];

export const teams: Team[] = groupedTeams.flatMap(([groupCode, entries]) =>
  entries.map(([id, name, fifaCode, countryCode]) => ({
    id,
    name,
    shortName: name,
    fifaCode,
    countryCode,
    groupCode,
  }))
);

function buildMatches() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  start.setDate(start.getDate() - 2);

  const generated: Match[] = [];
  let matchIndex = 0;

  groupedTeams.forEach(([groupCode, entries], groupIndex) => {
    const groupTeams = entries.map(([id]) => teams.find((team) => team.id === id)!);
    const pairings = [
      [groupTeams[0], groupTeams[1]],
      [groupTeams[2], groupTeams[3]],
      [groupTeams[0], groupTeams[2]],
      [groupTeams[1], groupTeams[3]],
      [groupTeams[0], groupTeams[3]],
      [groupTeams[1], groupTeams[2]],
    ];

    pairings.forEach(([homeTeam, awayTeam], pairingIndex) => {
      const kickoff = new Date(start.getTime() + (matchIndex * 6 + groupIndex) * 60 * 60 * 1000);
      const elapsed = Date.now() - kickoff.getTime();
      const liveWindow = 2 * 60 * 60 * 1000;
      const status = elapsed < 0 ? 'upcoming' : elapsed <= liveWindow ? 'live' : 'full-time';
      const [stadium, city] = stadiums[(matchIndex + pairingIndex) % stadiums.length];
      generated.push({
        id: `match-${groupCode}-${pairingIndex + 1}`,
        stage: 'Group Stage',
        groupCode,
        kickoffUtc: kickoff.toISOString(),
        stadium,
        city,
        status,
        homeScore: status === 'upcoming' ? null : (matchIndex + pairingIndex) % 4,
        awayScore: status === 'upcoming' ? null : (matchIndex + pairingIndex + 2) % 3,
        homeTeam,
        awayTeam,
      });
      matchIndex += 1;
    });
  });

  return generated;
}

export const matches = buildMatches();

const providerMatrix: Record<string, { name: string; url: string }> = {
  US: { name: 'FOX Sports', url: 'https://www.foxsports.com/live' },
  GB: { name: 'BBC iPlayer', url: 'https://www.bbc.co.uk/iplayer' },
  BR: { name: 'Globoplay', url: 'https://globoplay.globo.com/' },
  NG: { name: 'SuperSport', url: 'https://supersport.com/' },
  DE: { name: 'ARD Mediathek', url: 'https://www.ardmediathek.de/' },
  AU: { name: 'SBS On Demand', url: 'https://www.sbs.com.au/ondemand/' },
  IN: { name: 'JioCinema', url: 'https://www.jiocinema.com/' },
  QA: { name: 'beIN Sports', url: 'https://www.beinsports.com/' },
  DEFAULT: { name: 'FIFA Broadcasters', url: 'https://www.fifa.com/' },
};

export const watchLinks: WatchLink[] = matches.flatMap((match) =>
  Object.entries(providerMatrix).map(([countryCode, provider], index) => ({
    id: `${match.id}-${countryCode}`,
    matchId: match.id,
    countryCode,
    providerName: provider.name,
    providerUrl: provider.url,
    platformType: 'Official streaming / broadcaster',
    isOfficial: true,
    priority: index,
  }))
);

export const leaderboardEntries: LeaderboardEntry[] = [
  { userId: 'u1', displayName: 'Ari M.', countryCode: 'US', rank: 1, totalPoints: 128, exactScores: 4, correctResults: 9, streakValue: 3, scope: 'country' },
  { userId: 'u2', displayName: 'Leah B.', countryCode: 'US', rank: 2, totalPoints: 112, exactScores: 3, correctResults: 8, streakValue: 2, scope: 'country' },
  { userId: 'u3', displayName: 'Kofi T.', countryCode: 'NG', rank: 3, totalPoints: 105, exactScores: 3, correctResults: 7, streakValue: 2, scope: 'country' },
  { userId: 'u4', displayName: 'Marta C.', countryCode: 'BR', rank: 4, totalPoints: 96, exactScores: 2, correctResults: 7, streakValue: 1, scope: 'country' },
  { userId: 'u5', displayName: 'Jay S.', countryCode: 'US', rank: 1, totalPoints: 68, exactScores: 2, correctResults: 5, streakValue: 2, scope: 'friends' },
  { userId: 'u6', displayName: 'Tolu O.', countryCode: 'NG', rank: 2, totalPoints: 64, exactScores: 2, correctResults: 5, streakValue: 1, scope: 'friends' },
  { userId: 'u7', displayName: 'Lina P.', countryCode: 'GB', rank: 3, totalPoints: 58, exactScores: 1, correctResults: 4, streakValue: 1, scope: 'friends' },
];

export const fanRooms: FanRoom[] = matches.slice(0, 8).map((match, index) => ({
  id: `room-${match.id}`,
  title: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
  description: index % 2 === 0 ? 'Global room for live reactions and official viewing chat.' : 'Country-aware room seeded for MVP moderation review.',
  matchId: match.id,
  roomType: index % 3 === 0 ? 'country' : 'global',
}));

export const chatMessages: ChatMessage[] = fanRooms.flatMap((room, index) => [
  {
    id: `${room.id}-1`,
    roomId: room.id,
    authorName: 'CupHub Mod',
    body: 'Keep it respectful. No gambling talk and no unauthorized stream links.',
    createdAt: new Date(Date.now() - index * 60000).toISOString(),
    moderationState: 'clear',
  },
  {
    id: `${room.id}-2`,
    roomId: room.id,
    authorName: 'FootballFiend',
    body: 'Prediction locked in. Going 2-1 here if the midfield holds.',
    createdAt: new Date(Date.now() - index * 45000).toISOString(),
    moderationState: 'clear',
  },
]);

export const restaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Final Whistle Social',
    city: 'Los Angeles',
    countryCode: 'US',
    mapsUrl: 'https://maps.google.com/?q=Los+Angeles+Stadium+Bar',
    whatsAppUrl: 'https://wa.me/13105550123',
    socialUrl: 'https://instagram.com/finalwhistlesocial',
    capacity: 180,
    offerText: 'Large projection wall, halftime platter, and early-kickoff breakfast combos.',
    approvalState: 'approved',
    verifiedStatus: true,
    ambassadorCode: 'LAKICKOFF',
    matchIds: matches.slice(0, 2).map((match) => match.id),
    boosted: true,
  },
  {
    id: 'rest-2',
    name: 'Offside Kitchen',
    city: 'London',
    countryCode: 'GB',
    mapsUrl: 'https://maps.google.com/?q=London+Offside+Kitchen',
    whatsAppUrl: 'https://wa.me/447700900100',
    socialUrl: 'https://instagram.com/offsidekitchen',
    capacity: 95,
    offerText: 'Family-safe cafe with projector room and post-match Q&A nights.',
    approvalState: 'approved',
    verifiedStatus: true,
    ambassadorCode: 'LDNROOM',
    matchIds: matches.slice(2, 4).map((match) => match.id),
    boosted: false,
  },
  {
    id: 'rest-3',
    name: 'Naija Matchday Hub',
    city: 'Lagos',
    countryCode: 'NG',
    mapsUrl: 'https://maps.google.com/?q=Lagos+Matchday+Hub',
    whatsAppUrl: 'https://wa.me/2348000000001',
    socialUrl: 'https://facebook.com/naijamatchdayhub',
    capacity: 220,
    offerText: 'Jollof specials, rooftop projector, and Nigeria fan-room host table.',
    approvalState: 'pending',
    verifiedStatus: false,
    ambassadorCode: 'LAGOSGOAL',
    matchIds: matches.slice(4, 6).map((match) => match.id),
    boosted: true,
  },
  {
    id: 'rest-4',
    name: 'Copacabana Corner',
    city: 'Rio de Janeiro',
    countryCode: 'BR',
    mapsUrl: 'https://maps.google.com/?q=Rio+Copacabana+Corner',
    whatsAppUrl: 'https://wa.me/5521999999999',
    socialUrl: 'https://instagram.com/copacabanacorner',
    capacity: 140,
    offerText: 'Beachside viewing terrace with themed menus for marquee fixtures.',
    approvalState: 'approved',
    verifiedStatus: true,
    ambassadorCode: 'RIO2026',
    matchIds: matches.slice(6, 8).map((match) => match.id),
    boosted: false,
  },
];

export const products: Product[] = [
  {
    code: 'ad-free-monthly',
    name: 'Ad-Free Monthly Pass',
    description: 'Removes banner placeholders across Today, Fixtures, Match Detail, and Restaurants.',
    priceLabel: '$2.99',
    entitlement: 'ad-free',
    bullets: ['No banner ads', 'Faster reading flow', 'Restore purchases placeholder'],
  },
  {
    code: 'world-cup-pass',
    name: 'World Cup Tournament Pass',
    description: 'All-event premium placeholder with future perks for exclusive fan-room cosmetics and deep stats.',
    priceLabel: '$9.99',
    entitlement: 'tournament-pass',
    bullets: ['Ad-free experience', 'Tournament-long premium placeholder', 'Future exclusive prediction badges'],
  },
  {
    code: 'fan-room-pack',
    name: 'Fan Room / Private League Pack',
    description: 'Commercial placeholder for enhanced room controls and private league surfaces.',
    priceLabel: '$4.99',
    entitlement: 'fan-room-pack',
    bullets: ['Private league placeholder', 'Custom room branding placeholder', 'Extended moderation tools placeholder'],
  },
  {
    code: 'restaurant-boost',
    name: 'Restaurant Match-Day Boost',
    description: 'Venue-facing paid placement placeholder after the first 1,000 verified listings.',
    priceLabel: '$19.99',
    entitlement: 'free',
    bullets: ['Boosted placement placeholder', 'Admin feature flag placeholder', 'Commercial listing upgrade path'],
  },
];
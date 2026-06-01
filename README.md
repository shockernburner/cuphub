# CupHub

CupHub is a World Cup companion app for fans to track matches, predict scores, challenge friends, join fan rooms, and discover restaurants showing the games. It does not host match streams. Users are directed to official broadcasters where available.

## Stack

- Expo Router + React Native + TypeScript
- Mock-first service layer with Supabase-ready interfaces
- Zustand + AsyncStorage for local session persistence
- Expo Notifications placeholder flow
- Google Maps deep-link placeholders
- AdMob and billing placeholders behind app-level abstractions

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment defaults if you want explicit local config:

```bash
cp .env.example .env
```

3. Start the project:

```bash
npm run start
```

4. Run on Android:

```bash
npm run android
```

## Useful scripts

- `npm run typecheck`
- `npm run lint`
- `npm run web`

## MVP surfaces included

- Guest-first onboarding
- Today screen with countdowns, local kickoff times, scores, prediction and watch CTAs
- Fixtures with group/date/team filters
- Match detail with prediction flow and official watch links
- Leaderboard with country and friends views
- Restaurant discovery list, detail, and onboarding form
- Fan room chat placeholder with report action
- Premium screen with product placeholders
- Notification permission flow placeholder
- In-app admin preview for restaurants, fixtures, watch links, and prediction counts

## Environment variables

Only add real keys when the corresponding integration is ready.

- `EXPO_PUBLIC_DATA_MODE`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID`
- `EXPO_PUBLIC_ADMOB_APP_ID_IOS`
- `EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID`
- `EXPO_PUBLIC_ADMOB_BANNER_ID_IOS`
- `EXPO_PUBLIC_REVENUECAT_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## AdMob foundation

CupHub now includes a real Google Mobile Ads integration path with safe fallbacks:

1. Native Android and iOS builds initialize Google Mobile Ads at startup.
2. If no banner unit IDs are configured yet, the app uses Google's test banner unit IDs by default on device builds.
3. Web keeps the existing placeholder rendering.
4. Premium users still suppress banners through the existing `premiumTier` gate.

For real ads, set these values in `.env` before creating a native build:

```bash
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=your-android-admob-app-id
EXPO_PUBLIC_ADMOB_APP_ID_IOS=your-ios-admob-app-id
EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID=your-android-banner-unit-id
EXPO_PUBLIC_ADMOB_BANNER_ID_IOS=your-ios-banner-unit-id
```

Until then, the project remains safe to run with test IDs and placeholder behavior.

## Supabase mode

CupHub still runs fully in mock mode by default. To switch to Supabase-backed auth, tables, and realtime chat:

1. Create a Supabase project.
2. Apply the schema in `supabase/schema.sql`.
3. Enable anonymous auth if you want guest mode to create Supabase sessions.
4. Set these variables in `.env`:

```bash
EXPO_PUBLIC_DATA_MODE=supabase
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart Expo.

What is wired now:

- Auth bootstrap with persisted sessions
- Anonymous guest continuation when enabled in Supabase
- Google OAuth service wiring through Expo browser auth flow
- Magic-link service wiring for email sign-in
- Table hydration for teams, matches, watch links, fan rooms, chat messages, restaurants, restaurant matches, leaderboard entries, and prediction counts
- Profile sync for onboarding country, favorite teams, and notification preferences
- Prediction upserts for authenticated or anonymous Supabase users
- Realtime chat subscription on `chat_messages`

What still remains product-side:

- A dedicated email input screen for magic-link auth
- Admin CRUD screens backed by live writes instead of placeholders
- Restaurant onboarding submission to Supabase
- Live leaderboard scoring jobs
- Production-ready moderation tooling and policies

## Compliance notes

- CupHub does not host streams or embed unauthorized feeds.
- Watch actions must route only to official broadcasters or platforms.
- Predictions use points and badges only. No real-money betting.
- Keep fan rooms family-safe and moderated.

## Current implementation notes

- The app runs fully in mock mode without backend credentials.
- Seeded fixtures are generated relative to the current date so Today always has content.
- Supabase auth, table hydration, profile/prediction sync, and realtime fan-room chat are wired behind the existing service layer when `EXPO_PUBLIC_DATA_MODE=supabase`.
- Premium purchases, AdMob, and embedded maps remain placeholder integrations.
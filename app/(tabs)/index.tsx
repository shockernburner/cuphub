import { router } from 'expo-router';

import { BannerAdPlaceholder } from '@/src/components/BannerAdPlaceholder';
import { Card } from '@/src/components/Card';
import { MatchCard } from '@/src/components/MatchCard';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAppDataStatus, useAppServices } from '@/src/services/mockApi';
import { useSessionStore } from '@/src/store/session';

export default function TodayScreen() {
  const appServices = useAppServices();
  const dataStatus = useAppDataStatus();
  const countryCode = useSessionStore((state) => state.countryCode || 'US');
  const todayMatches = appServices.matches.getTodayMatchesByCountry(countryCode);
  const heroMatch = todayMatches[0] ?? appServices.matches.getNextMatch();

  return (
    <Screen>
      <Screen.Hero
        eyebrow="Today"
        title="Your matchday pulse"
        description={dataStatus.mode === 'supabase' ? 'Countdowns, local kickoff times, predictions, and official watch routes loaded from Supabase.' : 'Countdowns, local kickoff times, predictions, and official watch routes tailored to your country.'}
      />

      {heroMatch ? (
        <Card tone="accent">
          <SectionHeader title="Next up" subtitle="Fast access to the match most relevant right now." />
          <MatchCard
            match={heroMatch}
            countryCode={countryCode}
            onOpen={() => router.push(`/match/${heroMatch.id}`)}
            onJoinRoom={() => router.push(`/fan-room/${heroMatch.id}`)}
          />
        </Card>
      ) : null}

      <BannerAdPlaceholder placement="Today" />

      <Card>
        <SectionHeader title="Today’s fixtures" subtitle="By default, kickoff times are shown in your local timezone." />
        {todayMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            countryCode={countryCode}
            onOpen={() => router.push(`/match/${match.id}`)}
            onJoinRoom={() => router.push(`/fan-room/${match.id}`)}
          />
        ))}
      </Card>

      <Card>
        <SectionHeader title="Responsible watch guidance" subtitle="CupHub does not host streams." />
        <Screen.Copy>
          Watch through official broadcasters where available. Country availability can vary and some links are sample placeholders until your live catalog is connected.
        </Screen.Copy>
      </Card>
    </Screen>
  );
}

const minute = 60 * 1000;
const hour = 60 * minute;

export function formatKickoffLocal(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatMatchDateLong(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function withinNextDays(iso: string, days: number) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * hour);
  const target = new Date(iso);
  return target >= now && target <= end;
}

export function matchCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();

  if (diff <= 0) {
    return 'Kickoff passed';
  }

  const hours = Math.floor(diff / hour);
  const minutes = Math.floor((diff % hour) / minute);
  return `${hours}h ${minutes}m`;
}
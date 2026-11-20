import { DailyStreakState } from '../types';

export const DAILY_STREAK_STORAGE_KEY = 'FLAPPY_PIXEL_DAILY_STREAK_V1';

export interface StreakTier {
  minDays: number;
  multiplier: number;
  label: string;
  perkSummary: string;
  accentColor: string;
}

export const STREAK_TIERS: StreakTier[] = [
  {
    minDays: 1,
    multiplier: 1,
    label: 'SPARK',
    perkSummary: 'Base 1x coins — keep playing daily!',
    accentColor: '#94a3b8',
  },
  {
    minDays: 2,
    multiplier: 1.25,
    label: 'WARMUP',
    perkSummary: '+25% bonus coins on every run',
    accentColor: '#f7d302',
  },
  {
    minDays: 4,
    multiplier: 1.5,
    label: 'HOT STREAK',
    perkSummary: '+50% bonus coins on every run',
    accentColor: '#fb923c',
  },
  {
    minDays: 7,
    multiplier: 2,
    label: 'WEEKLY BLAZE',
    perkSummary: '2x Double Coins on every run',
    accentColor: '#f97316',
  },
  {
    minDays: 14,
    multiplier: 3,
    label: 'INFERNO LEGEND',
    perkSummary: '3x Triple Coins on every run',
    accentColor: '#ef4444',
  },
];

export function getLocalDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateKey(now: Date = new Date()): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return getLocalDateKey(yesterday);
}

export function getStreakTier(streak: number): StreakTier {
  let matched = STREAK_TIERS[0];
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.minDays) {
      matched = tier;
    }
  }
  return matched;
}

export function getNextStreakTier(streak: number): StreakTier | null {
  for (const tier of STREAK_TIERS) {
    if (tier.minDays > Math.max(1, streak)) {
      return tier;
    }
  }
  return null;
}

export function getStreakMultiplier(streak: number): number {
  if (streak <= 0) return 1;
  return getStreakTier(streak).multiplier;
}

export function formatMultiplier(multiplier: number): string {
  return Number.isInteger(multiplier) ? `${multiplier}x` : `${multiplier}x`;
}

export function saveDailyStreak(state: DailyStreakState): void {
  try {
    localStorage.setItem(DAILY_STREAK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadDailyStreak(now: Date = new Date()): DailyStreakState {
  const today = getLocalDateKey(now);
  const yesterday = getYesterdayDateKey(now);
  const fallback: DailyStreakState = {
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
  };

  try {
    const raw = localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DailyStreakState>;
    const current = typeof parsed.currentStreak === 'number' && parsed.currentStreak >= 0
      ? Math.floor(parsed.currentStreak)
      : 0;
    const best = typeof parsed.bestStreak === 'number' && parsed.bestStreak >= 0
      ? Math.floor(parsed.bestStreak)
      : current;
    const lastPlayedDate = typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : null;

    if (!lastPlayedDate) {
      return { currentStreak: 0, bestStreak: best, lastPlayedDate: null };
    }

    // Streak remains active if played today or yesterday; otherwise it resets to 0
    if (lastPlayedDate === today || lastPlayedDate === yesterday) {
      return {
        currentStreak: current,
        bestStreak: Math.max(best, current),
        lastPlayedDate,
      };
    }

    const expiredState: DailyStreakState = {
      currentStreak: 0,
      bestStreak: Math.max(best, current),
      lastPlayedDate,
    };
    saveDailyStreak(expiredState);
    return expiredState;
  } catch {
    return fallback;
  }
}

export function hasPlayedToday(state: DailyStreakState, now: Date = new Date()): boolean {
  return state.lastPlayedDate === getLocalDateKey(now);
}

export function recordDailyStreakPlay(
  currentState: DailyStreakState,
  now: Date = new Date()
): {
  nextState: DailyStreakState;
  increased: boolean;
  unlockedNewMultiplier: boolean;
  newMultiplier: number;
} {
  const today = getLocalDateKey(now);
  const yesterday = getYesterdayDateKey(now);

  // Already counted for today
  if (currentState.lastPlayedDate === today && currentState.currentStreak > 0) {
    return {
      nextState: currentState,
      increased: false,
      unlockedNewMultiplier: false,
      newMultiplier: getStreakMultiplier(currentState.currentStreak),
    };
  }

  const prevMultiplier = getStreakMultiplier(currentState.currentStreak);
  const nextStreak =
    currentState.lastPlayedDate === yesterday
      ? currentState.currentStreak + 1
      : 1;

  const nextState: DailyStreakState = {
    currentStreak: nextStreak,
    bestStreak: Math.max(currentState.bestStreak, nextStreak),
    lastPlayedDate: today,
  };

  saveDailyStreak(nextState);

  const newMultiplier = getStreakMultiplier(nextStreak);
  return {
    nextState,
    increased: true,
    unlockedNewMultiplier: newMultiplier > prevMultiplier,
    newMultiplier,
  };
}

export function resetDailyStreak(): DailyStreakState {
  const empty: DailyStreakState = {
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
  };
  saveDailyStreak(empty);
  return empty;
}

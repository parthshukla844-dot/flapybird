import { BiomeType, DailyMission, DailyMissionDayRecord, DailyMissionsState, Difficulty } from '../types';

export const DAILY_MISSIONS_STORAGE_KEY = 'FLAPPY_PIXEL_DAILY_MISSIONS_V1';
export const DAILY_MISSIONS_HISTORY_STORAGE_KEY = 'FLAPPY_PIXEL_DAILY_MISSIONS_HISTORY_V1';

interface StoredMissionDaySummary {
  dateKey: string;
  completed: number;
  total: number;
  bonusCoinsEarned: number;
}

export function getTodayDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeUntilMidnightLabel(now: Date = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface MissionTemplate {
  id: string;
  type: DailyMission['type'];
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  biome?: BiomeType;
  difficulty?: Difficulty;
}

// Slot 1: Accessible daily run / score / coin milestone
const SLOT_1_POOL: MissionTemplate[] = [
  {
    id: 'coins-25',
    type: 'coins_total',
    title: 'Collect 25 Coins Today',
    description: 'Bank 25¢ across any realms or difficulties today.',
    target: 25,
    rewardCoins: 30,
  },
  {
    id: 'score-day-25',
    type: 'score_biome',
    title: 'Score 25 in Day Mode',
    description: 'Reach 25 points in a single flight in Sunny Day realm.',
    target: 25,
    rewardCoins: 30,
    biome: 'day',
  },
  {
    id: 'flights-4',
    type: 'games_played',
    title: 'Complete 4 Flights Today',
    description: 'Take off and finish 4 arcade runs in any realm.',
    target: 4,
    rewardCoins: 25,
  },
  {
    id: 'coins-40',
    type: 'coins_total',
    title: 'Collect 40 Coins Today',
    description: 'Gather 40¢ across your flights before midnight.',
    target: 40,
    rewardCoins: 45,
  },
];

// Slot 2: Combat / Advantage / Difficulty action milestone
const SLOT_2_POOL: MissionTemplate[] = [
  {
    id: 'laser-5',
    type: 'laser_destroy',
    title: 'Incinerate 5 Pipes with Laser',
    description: 'Blast 5 obstacles out of the sky using the Laser Cannon.',
    target: 5,
    rewardCoins: 40,
  },
  {
    id: 'powerup-4',
    type: 'powerup_collect',
    title: 'Grab 4 Advantage Orbs',
    description: 'Collect 4 power-up orbs (Shield, Slow-Mo, 2X, Mini, Laser).',
    target: 4,
    rewardCoins: 35,
  },
  {
    id: 'score-hard-20',
    type: 'score_difficulty',
    title: 'Score 20 on Hard Mode',
    description: 'Survive and pass 20 points in a single Hard difficulty run.',
    target: 20,
    rewardCoins: 50,
    difficulty: 'hard',
  },
  {
    id: 'laser-8',
    type: 'laser_destroy',
    title: 'Incinerate 8 Pipes with Laser',
    description: 'Destroy 8 pipes or hazards with laser beams today.',
    target: 8,
    rewardCoins: 55,
  },
];

// Slot 3: High-stakes Weather Realm milestone (including Volcano 50)
const SLOT_3_POOL: MissionTemplate[] = [
  {
    id: 'score-volcano-50',
    type: 'score_biome',
    title: 'Score 50 in Volcano Mode',
    description: 'Reach 50 points in a single run inside Volcanic Magma realm.',
    target: 50,
    rewardCoins: 75,
    biome: 'volcano',
  },
  {
    id: 'score-cyber-40',
    type: 'score_biome',
    title: 'Score 40 in Cyber Mode',
    description: 'Reach 40 points in a single run inside Neon Cyber City.',
    target: 40,
    rewardCoins: 60,
    biome: 'cyberpunk',
  },
  {
    id: 'score-sunset-35',
    type: 'score_biome',
    title: 'Score 35 in Sunset Mode',
    description: 'Reach 35 points in a single run inside Golden Sunset realm.',
    target: 35,
    rewardCoins: 45,
    biome: 'sunset',
  },
  {
    id: 'score-night-30',
    type: 'score_biome',
    title: 'Score 30 in Night Mode',
    description: 'Reach 30 points in a single run inside Starry Night realm.',
    target: 30,
    rewardCoins: 40,
    biome: 'night',
  },
  {
    id: 'score-winter-45',
    type: 'score_biome',
    title: 'Score 45 in Winter Mode',
    description: 'Reach 45 points in a single run inside Winter Wonderland.',
    target: 45,
    rewardCoins: 65,
    biome: 'winter',
  },
];

function toDailyMission(dateKey: string, tpl: MissionTemplate): DailyMission {
  return {
    id: `${dateKey}:${tpl.id}`,
    type: tpl.type,
    title: tpl.title,
    description: tpl.description,
    target: tpl.target,
    progress: 0,
    rewardCoins: tpl.rewardCoins,
    completed: false,
    claimed: false,
    biome: tpl.biome,
    difficulty: tpl.difficulty,
  };
}

export function generateDailyMissions(dateKey: string = getTodayDateKey()): DailyMissionsState {
  const seed = hashSeed(dateKey);
  const slot1 = SLOT_1_POOL[seed % SLOT_1_POOL.length];
  const slot2 = SLOT_2_POOL[(seed >>> 4) % SLOT_2_POOL.length];
  const slot3 = SLOT_3_POOL[(seed >>> 8) % SLOT_3_POOL.length];

  return {
    dateKey,
    missions: [
      toDailyMission(dateKey, slot1),
      toDailyMission(dateKey, slot2),
      toDailyMission(dateKey, slot3),
    ],
  };
}

function loadMissionHistoryMap(): Record<string, StoredMissionDaySummary> {
  try {
    const raw = localStorage.getItem(DAILY_MISSIONS_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredMissionDaySummary>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveMissionHistoryMap(map: Record<string, StoredMissionDaySummary>): void {
  try {
    // Keep the most recent 30 days to avoid unbounded storage growth
    const keys = Object.keys(map).sort().slice(-30);
    const trimmed: Record<string, StoredMissionDaySummary> = {};
    for (const k of keys) {
      trimmed[k] = map[k];
    }
    localStorage.setItem(DAILY_MISSIONS_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}

function upsertHistoryForState(state: DailyMissionsState): void {
  const completed = state.missions.filter((m) => m.completed).length;
  const total = state.missions.length || 3;
  const bonusCoinsEarned = state.missions
    .filter((m) => m.completed && m.claimed)
    .reduce((sum, m) => sum + m.rewardCoins, 0);

  const map = loadMissionHistoryMap();
  map[state.dateKey] = {
    dateKey: state.dateKey,
    completed,
    total,
    bonusCoinsEarned,
  };
  saveMissionHistoryMap(map);
}

function normalizeMissionState(state: DailyMissionsState): DailyMissionsState {
  return {
    ...state,
    missions: state.missions.map((m) => ({
      ...m,
      claimed: typeof m.claimed === 'boolean' ? m.claimed : Boolean(m.completed),
    })),
  };
}

export function loadOrInitDailyMissions(): DailyMissionsState {
  const today = getTodayDateKey();
  try {
    const raw = localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyMissionsState;
      if (parsed && parsed.dateKey === today && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
        const normalized = normalizeMissionState(parsed);
        upsertHistoryForState(normalized);
        return normalized;
      }
      // Preserve yesterday/previous day summary in history before rolling over
      if (parsed && parsed.dateKey && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
        upsertHistoryForState(normalizeMissionState(parsed));
      }
    }
  } catch {
    // ignore corrupted cache
  }
  const fresh = generateDailyMissions(today);
  saveDailyMissions(fresh);
  return fresh;
}

export function saveDailyMissions(state: DailyMissionsState): void {
  try {
    localStorage.setItem(DAILY_MISSIONS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
  upsertHistoryForState(state);
}

export function resetDailyMissionsHistory(): void {
  try {
    localStorage.removeItem(DAILY_MISSIONS_HISTORY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getLast7DaysMissionHistory(
  currentState: DailyMissionsState,
  now: Date = new Date()
): DailyMissionDayRecord[] {
  const historyMap = loadMissionHistoryMap();
  const todayKey = getTodayDateKey(now);
  const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const monthDayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const result: DailyMissionDayRecord[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = getTodayDateKey(d);
    const isToday = key === todayKey;

    if (isToday && currentState.dateKey === todayKey) {
      const completed = currentState.missions.filter((m) => m.completed).length;
      const total = currentState.missions.length || 3;
      const bonusCoinsEarned = currentState.missions
        .filter((m) => m.completed && m.claimed)
        .reduce((sum, m) => sum + m.rewardCoins, 0);
      result.push({
        dateKey: key,
        shortLabel: 'Today',
        monthDay: monthDayFmt.format(d),
        completed,
        total,
        bonusCoinsEarned,
        isToday: true,
      });
    } else {
      const saved = historyMap[key];
      result.push({
        dateKey: key,
        shortLabel: isToday ? 'Today' : weekdayFmt.format(d),
        monthDay: monthDayFmt.format(d),
        completed: saved ? Math.min(saved.total, Math.max(0, saved.completed)) : 0,
        total: saved && saved.total > 0 ? saved.total : 3,
        bonusCoinsEarned: saved ? saved.bonusCoinsEarned : 0,
        isToday,
      });
    }
  }

  return result;
}

export interface MissionProgressEvent {
  type: 'score' | 'coin' | 'laser_destroy' | 'powerup_collect' | 'game_over';
  value?: number;
  biome: BiomeType;
  difficulty: Difficulty;
}

export function applyMissionEvent(
  currentState: DailyMissionsState,
  event: MissionProgressEvent
): {
  nextState: DailyMissionsState;
  newlyCompleted: DailyMission[];
  changed: boolean;
} {
  const today = getTodayDateKey();
  const baseState = currentState.dateKey === today ? currentState : generateDailyMissions(today);
  let changed = currentState.dateKey !== today;
  const newlyCompleted: DailyMission[] = [];

  const updatedMissions = baseState.missions.map((mission) => {
    if (mission.completed) return mission;

    let nextProgress = mission.progress;

    if (event.type === 'score' && typeof event.value === 'number') {
      if (mission.type === 'score_biome' && mission.biome === event.biome) {
        nextProgress = Math.max(mission.progress, event.value);
      } else if (mission.type === 'score_difficulty' && mission.difficulty === event.difficulty) {
        nextProgress = Math.max(mission.progress, event.value);
      }
    } else if (event.type === 'coin' && mission.type === 'coins_total') {
      nextProgress = mission.progress + (event.value ?? 1);
    } else if (event.type === 'laser_destroy' && mission.type === 'laser_destroy') {
      nextProgress = mission.progress + (event.value ?? 1);
    } else if (event.type === 'powerup_collect' && mission.type === 'powerup_collect') {
      nextProgress = mission.progress + (event.value ?? 1);
    } else if (event.type === 'game_over' && mission.type === 'games_played') {
      nextProgress = mission.progress + 1;
    }

    const clampedProgress = Math.min(mission.target, nextProgress);
    if (clampedProgress === mission.progress) return mission;

    changed = true;
    const isDone = clampedProgress >= mission.target;
    const updated: DailyMission = {
      ...mission,
      progress: clampedProgress,
      completed: isDone,
      completedAt: isDone ? Date.now() : undefined,
      claimed: false,
    };

    if (isDone) {
      newlyCompleted.push(updated);
    }

    return updated;
  });

  if (!changed) {
    return { nextState: baseState, newlyCompleted, changed: false };
  }

  const nextState: DailyMissionsState = {
    dateKey: today,
    missions: updatedMissions,
  };
  saveDailyMissions(nextState);
  return { nextState, newlyCompleted, changed: true };
}

export function claimDailyMissionReward(
  currentState: DailyMissionsState,
  missionId: string
): {
  nextState: DailyMissionsState;
  rewardCoins: number;
  claimedMission: DailyMission | null;
} {
  let claimedMission: DailyMission | null = null;
  let rewardCoins = 0;

  const updatedMissions = currentState.missions.map((mission) => {
    if (mission.id !== missionId || !mission.completed || mission.claimed) {
      return mission;
    }
    claimedMission = {
      ...mission,
      claimed: true,
      claimedAt: Date.now(),
    };
    rewardCoins = mission.rewardCoins;
    return claimedMission;
  });

  if (!claimedMission) {
    return { nextState: currentState, rewardCoins: 0, claimedMission: null };
  }

  const nextState: DailyMissionsState = {
    ...currentState,
    missions: updatedMissions,
  };
  saveDailyMissions(nextState);
  return { nextState, rewardCoins, claimedMission };
}

export const FICTIONAL_GLOBAL_MISSION_AVERAGE = 12;

export function getTotalCompletedMissionsCount(currentState: DailyMissionsState): {
  totalCompleted: number;
  activeDays: number;
} {
  const historyMap = loadMissionHistoryMap();
  const todayCompleted = currentState.missions.filter((m) => m.completed).length;

  let totalCompleted = 0;
  let activeDays = 0;
  let countedCurrentDate = false;

  for (const [dateKey, entry] of Object.entries(historyMap)) {
    const count =
      dateKey === currentState.dateKey
        ? todayCompleted
        : Math.max(0, entry.completed || 0);
    if (dateKey === currentState.dateKey) {
      countedCurrentDate = true;
    }
    totalCompleted += count;
    if (count > 0) activeDays += 1;
  }

  if (!countedCurrentDate) {
    totalCompleted += todayCompleted;
    if (todayCompleted > 0) activeDays += 1;
  }

  return { totalCompleted, activeDays };
}


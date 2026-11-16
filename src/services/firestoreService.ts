import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';
import { BiomeType, Difficulty, HistoryEntry } from '../types';

export type MedalTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'OBSIDIAN'
  | 'NO MEDAL';

export interface CloudSaveData {
  uid: string;
  displayName: string;
  highScore: number;
  totalCoins: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  unlockedBiomes: string[];
  selectedBiome: BiomeType;
  difficulty: Difficulty;
  crtFilterEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LeaderboardRecord {
  uid: string;
  playerName: string;
  score: number;
  difficulty: Difficulty;
  skinId: string;
  biomeId: BiomeType;
  medalTier: MedalTier;
  updatedAtMs?: number;
}

const VALID_BIOMES: BiomeType[] = ['day', 'night', 'sunset', 'cyberpunk', 'volcano', 'winter'];
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const VALID_MEDALS: MedalTier[] = [
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'OBSIDIAN',
  'NO MEDAL',
];

function sanitizeId(raw: string, maxLen = 128, fallback = 'item'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : fallback;
}

function clampInt(val: number, min: number, max: number): number {
  const n = Math.floor(Number.isFinite(val) ? val : 0);
  return Math.max(min, Math.min(max, n));
}

function sanitizeText(raw: string, maxLen: number, fallback: string): string {
  const trimmed = (raw || '').trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function getMedalTierForScore(score: number): MedalTier {
  if (score >= 1500) return 'OBSIDIAN';
  if (score >= 1000) return 'DIAMOND';
  if (score >= 75) return 'PLATINUM';
  if (score >= 50) return 'GOLD';
  if (score >= 25) return 'SILVER';
  if (score >= 10) return 'BRONZE';
  return 'NO MEDAL';
}

export async function loadCloudSave(uid: string): Promise<CloudSaveData | null> {
  const safeUid = sanitizeId(uid, 128);
  const path = `users/${safeUid}`;
  try {
    const snap = await getDoc(doc(db, 'users', safeUid));
    if (!snap.exists()) return null;
    return snap.data() as CloudSaveData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertCloudSave(
  uid: string,
  payload: Omit<CloudSaveData, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const safeUid = sanitizeId(uid, 128);
  const path = `users/${safeUid}`;
  const ref = doc(db, 'users', safeUid);

  const sanitizedSkins = Array.from(
    new Set(
      (payload.unlockedSkins.length > 0 ? payload.unlockedSkins : ['pip'])
        .map((s) => sanitizeId(s, 40, 'pip'))
    )
  ).slice(0, 30);

  const sanitizedBiomes = Array.from(
    new Set(
      (payload.unlockedBiomes.length > 0 ? payload.unlockedBiomes : ['day'])
        .map((b) => sanitizeId(b, 20, 'day'))
    )
  ).slice(0, 20);

  const safeBiome: BiomeType = VALID_BIOMES.includes(payload.selectedBiome)
    ? payload.selectedBiome
    : 'day';
  const safeDifficulty: Difficulty = VALID_DIFFICULTIES.includes(payload.difficulty)
    ? payload.difficulty
    : 'medium';

  const baseFields = {
    displayName: sanitizeText(payload.displayName, 60, 'Pilot'),
    highScore: clampInt(payload.highScore, 0, 1000000),
    totalCoins: clampInt(payload.totalCoins, 0, 10000000),
    unlockedSkins: sanitizedSkins,
    selectedSkinId: sanitizeId(payload.selectedSkinId, 40, 'pip'),
    unlockedBiomes: sanitizedBiomes,
    selectedBiome: safeBiome,
    difficulty: safeDifficulty,
    crtFilterEnabled: Boolean(payload.crtFilterEnabled),
    soundEnabled: Boolean(payload.soundEnabled),
    musicEnabled: Boolean(payload.musicEnabled),
  };

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        uid: safeUid,
        ...baseFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...baseFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadCloudHistory(uid: string): Promise<HistoryEntry[]> {
  const safeUid = sanitizeId(uid, 128);
  const path = `users/${safeUid}/history`;
  try {
    const q = query(
      collection(db, 'users', safeUid, 'history'),
      where('uid', '==', safeUid),
      limit(50)
    );
    const snap = await getDocs(q);
    const entries: HistoryEntry[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({
        id: docSnap.id,
        type: data.type,
        timestamp: Number(data.timestamp) || Date.now(),
        title: String(data.title || ''),
        description: String(data.description || ''),
        details: {
          score: typeof data.score === 'number' ? data.score : undefined,
          coinsEarned: typeof data.coinsEarned === 'number' ? data.coinsEarned : undefined,
          cost: typeof data.cost === 'number' ? data.cost : undefined,
          medalTier: data.medalTier,
          difficulty: data.difficulty,
        },
      });
    });
    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncHistoryEntry(uid: string, entry: HistoryEntry): Promise<void> {
  const safeUid = sanitizeId(uid, 128);
  const safeEntryId = sanitizeId(entry.id, 128, `hist-${Date.now()}`);
  const path = `users/${safeUid}/history/${safeEntryId}`;

  const docData: Record<string, unknown> = {
    uid: safeUid,
    type: entry.type,
    timestamp: clampInt(entry.timestamp, 0, Number.MAX_SAFE_INTEGER),
    title: sanitizeText(entry.title, 100, 'Arcade Milestone'),
    description: sanitizeText(entry.description, 240, 'Recorded milestone'),
    createdAt: serverTimestamp(),
  };

  if (typeof entry.details?.score === 'number') {
    docData.score = clampInt(entry.details.score, 0, 1000000);
  }
  if (typeof entry.details?.coinsEarned === 'number') {
    docData.coinsEarned = clampInt(entry.details.coinsEarned, 0, 100000);
  }
  if (typeof entry.details?.cost === 'number') {
    docData.cost = clampInt(entry.details.cost, 0, 100000);
  }
  if (entry.details?.medalTier && VALID_MEDALS.includes(entry.details.medalTier)) {
    docData.medalTier = entry.details.medalTier;
  }
  if (entry.details?.difficulty && VALID_DIFFICULTIES.includes(entry.details.difficulty)) {
    docData.difficulty = entry.details.difficulty;
  }

  try {
    await setDoc(doc(db, 'users', safeUid, 'history', safeEntryId), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function publishLeaderboardScore(
  uid: string,
  entry: {
    playerName: string;
    score: number;
    difficulty: Difficulty;
    skinId: string;
    biomeId: BiomeType;
    medalTier: MedalTier;
  }
): Promise<void> {
  const safeUid = sanitizeId(uid, 128);
  const path = `leaderboard/${safeUid}`;
  const ref = doc(db, 'leaderboard', safeUid);

  const safeScore = clampInt(entry.score, 0, 1000000);
  const safeFields = {
    playerName: sanitizeText(entry.playerName, 40, 'Arcade Pilot'),
    score: safeScore,
    difficulty: VALID_DIFFICULTIES.includes(entry.difficulty) ? entry.difficulty : 'medium',
    skinId: sanitizeId(entry.skinId, 40, 'pip'),
    biomeId: VALID_BIOMES.includes(entry.biomeId) ? entry.biomeId : 'day',
    medalTier: VALID_MEDALS.includes(entry.medalTier)
      ? entry.medalTier
      : getMedalTierForScore(safeScore),
  };

  try {
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        uid: safeUid,
        ...safeFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const prevScore = Number(existing.data()?.score ?? 0);
      if (safeScore >= prevScore) {
        await updateDoc(ref, {
          ...safeFields,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLeaderboard(
  onEntries: (entries: LeaderboardRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: LeaderboardRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const ts = d.updatedAt as Timestamp | undefined;
        rows.push({
          uid: String(d.uid || docSnap.id),
          playerName: String(d.playerName || 'Arcade Pilot'),
          score: Number(d.score || 0),
          difficulty: VALID_DIFFICULTIES.includes(d.difficulty) ? d.difficulty : 'medium',
          skinId: String(d.skinId || 'pip'),
          biomeId: VALID_BIOMES.includes(d.biomeId) ? d.biomeId : 'day',
          medalTier: VALID_MEDALS.includes(d.medalTier) ? d.medalTier : 'NO MEDAL',
          updatedAtMs: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : undefined,
        });
      });
      onEntries(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrappedErr) {
        if (onError && wrappedErr instanceof Error) {
          onError(wrappedErr);
        }
      }
    }
  );
}

export async function wipeCloudSave(uid: string): Promise<void> {
  const safeUid = sanitizeId(uid, 128);
  const histPath = `users/${safeUid}/history`;
  try {
    const q = query(
      collection(db, 'users', safeUid, 'history'),
      where('uid', '==', safeUid),
      limit(100)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db, 'users', safeUid, 'history', d.id)))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, histPath);
  }

  try {
    await deleteDoc(doc(db, 'users', safeUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${safeUid}`);
  }

  try {
    await deleteDoc(doc(db, 'leaderboard', safeUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `leaderboard/${safeUid}`);
  }
}

import React, { useEffect, useState } from 'react';
import {
  Cloud,
  Trophy,
  X,
  RefreshCw,
  LogOut,
  Award,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Crown,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  LeaderboardRecord,
  subscribeLeaderboard,
} from '../services/firestoreService';
import { SKINS, BIOMES } from '../game/pixelArt';
import { retroAudio } from '../game/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  isSigningIn: boolean;
  authError: string | null;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  cloudError: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncNow: (customAlias?: string) => Promise<void>;
  localStats: {
    highScore: number;
    totalCoins: number;
    unlockedSkinsCount: number;
    unlockedBiomesCount: number;
    selectedSkinName: string;
    selectedBiomeName: string;
  };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  isSigningIn,
  authError,
  cloudSyncStatus,
  cloudError,
  onSignIn,
  onSignOut,
  onSyncNow,
  localStats,
}) => {
  const [entries, setEntries] = useState<LeaderboardRecord[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (firebaseUser) {
      const defaultHandle =
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Arcade Pilot';
      setAliasInput((prev) => (prev.trim() ? prev : defaultHandle.slice(0, 40)));
    }
  }, [firebaseUser]);

  // Only attach onSnapshot listener if modal is open AND user is authenticated
  useEffect(() => {
    if (!isOpen || !firebaseUser) {
      setEntries([]);
      setBoardError(null);
      return;
    }

    setLoadingBoard(true);
    setBoardError(null);
    const unsubscribe = subscribeLeaderboard(
      (rows) => {
        setEntries(rows);
        setLoadingBoard(false);
      },
      (err) => {
        setLoadingBoard(false);
        setBoardError(err.message);
      }
    );

    return () => unsubscribe();
  }, [isOpen, firebaseUser]);

  if (!isOpen) return null;

  const isQuotaError =
    (boardError || cloudError || '').toLowerCase().includes('quota exceeded');

  return (
    <div
      id="leaderboard-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono text-white select-text touch-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="leaderboard-modal-dialog"
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border-4 border-[#f7d302] bg-[#0d0d0d] shadow-[0_0_50px_rgba(247,211,2,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-[#f7d302] text-black shadow-[0_0_12px_rgba(247,211,2,0.5)]">
              <Cloud className="size-4 sm:size-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-mono text-base sm:text-xl font-black italic tracking-tighter text-white">
                CLOUD_RANKINGS<span className="text-[#f7d302]">.DB</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/50">
                {firebaseUser
                  ? `Cloud Sync Active • ${firebaseUser.displayName || firebaseUser.email || 'Pilot'}`
                  : 'Sign in with Google for Cloud Save & Global Leaderboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {firebaseUser && (
              <button
                type="button"
                onClick={() => {
                  retroAudio.playSelect();
                  onSignOut();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-white/80 hover:border-[#f25022] hover:text-[#f25022] cursor-pointer"
                title="Sign out of Cloud Save"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                retroAudio.playSelect();
                onClose();
              }}
              className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 hover:border-white hover:text-white cursor-pointer"
              title="Close Cloud Leaderboard"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Status / Error Banner */}
        {(authError || cloudError || boardError) && (
          <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-2 text-xs text-red-200 flex items-start gap-2 shrink-0">
            <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {isQuotaError
                  ? 'Daily Firestore free-tier quota exceeded. Quota resets tomorrow.'
                  : authError || cloudError || boardError}
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        {!firebaseUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-5">
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-[#f7d302]/60 bg-[#f7d302]/15 text-[#f7d302] shadow-[0_0_30px_rgba(247,211,2,0.2)]">
              <Trophy className="size-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-lg sm:text-xl font-black text-white">
                CLOUD SAVE & GLOBAL LEADERBOARD
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Sign in with Google to back up your coins ({localStats.totalCoins}¢), unlocked avatars ({localStats.unlockedSkinsCount}), weather realms ({localStats.unlockedBiomesCount}), and high score ({localStats.highScore}) across devices—and climb the live global rankings!
              </p>
            </div>

            <button
              type="button"
              id="btn-cloud-google-signin"
              className="gsi-material-button"
              disabled={isSigningIn}
              onClick={() => {
                retroAudio.playSelect();
                onSignIn();
              }}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
                <span style={{ display: 'none' }}>Sign in with Google</span>
              </div>
            </button>

            <p className="text-[10px] text-white/40 max-w-sm">
              If Google shows an &ldquo;app is currently being tested&rdquo; notice, click <strong>Continue</strong> to proceed with your test account.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            {/* Cloud Sync Status Card */}
            <div className="rounded-xl border-2 border-[#4ec0ca]/50 bg-[#4ec0ca]/10 p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {cloudSyncStatus === 'syncing' ? (
                    <Loader2 className="size-4 animate-spin text-[#4ec0ca]" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  )}
                  <span className="text-xs font-black text-white uppercase">
                    {cloudSyncStatus === 'syncing'
                      ? 'SYNCING TO FIRESTORE...'
                      : 'CLOUD SAVE SYNCED'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/80">
                  <span className="text-[#f7d302]">BEST: {localStats.highScore}</span>
                  <span>•</span>
                  <span className="text-[#f7d302]">{localStats.totalCoins}¢</span>
                  <span>•</span>
                  <span>{localStats.unlockedSkinsCount} AVATARS</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  maxLength={40}
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder="Leaderboard Pilot Handle..."
                  className="flex-1 rounded-lg border border-white/20 bg-black px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#f7d302] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={cloudSyncStatus === 'syncing'}
                  onClick={() => {
                    retroAudio.playSelect();
                    onSyncNow(aliasInput.trim() || undefined);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-[#f7d302] px-3.5 py-1.5 text-xs font-black text-black hover:bg-[#ffe338] cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  <span>SYNC & PUBLISH SCORE</span>
                </button>
              </div>
            </div>

            {/* Live Global Leaderboard */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#f7d302] flex items-center gap-1.5">
                  <Crown className="size-4" />
                  <span>LIVE GLOBAL TOP 25</span>
                </h3>
                <span className="text-[10px] text-white/40">REAL-TIME FIRESTORE</span>
              </div>

              {loadingBoard ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/50 gap-2">
                  <Loader2 className="size-6 animate-spin text-[#f7d302]" />
                  <span className="text-xs font-bold">LOADING RANKINGS...</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="rounded-xl border border-white/15 bg-black/60 py-10 text-center text-xs text-white/60">
                  No scores published yet. Click <strong>SYNC & PUBLISH SCORE</strong> to claim #1!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {entries.map((row, idx) => {
                    const isSelf = row.uid === firebaseUser.uid;
                    const skinName =
                      SKINS.find((s) => s.id === row.skinId)?.name || row.skinId;
                    const biomeName =
                      BIOMES[row.biomeId]?.name?.split(' ')[0] || row.biomeId;

                    return (
                      <div
                        key={row.uid}
                        className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 sm:p-3 ${
                          isSelf
                            ? 'border-[#f7d302] bg-[#f7d302]/15 shadow-[0_0_15px_rgba(247,211,2,0.18)]'
                            : 'border-white/10 bg-black/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex size-7 sm:size-8 items-center justify-center rounded-lg font-black text-xs shrink-0 ${
                              idx === 0
                                ? 'bg-[#f7d302] text-black'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-black text-white truncate">
                                {row.playerName}
                              </span>
                              {isSelf && (
                                <span className="rounded bg-[#f7d302] px-1 py-0.2 text-[8px] font-black text-black">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-white/50 truncate">
                              {skinName} • {biomeName} • {row.difficulty.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {row.medalTier !== 'NO MEDAL' && (
                            <span className="hidden sm:inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-[#f7d302]">
                              <Award className="size-2.5" />
                              {row.medalTier}
                            </span>
                          )}
                          <span className="font-mono text-base sm:text-lg font-black text-[#f7d302]">
                            {row.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

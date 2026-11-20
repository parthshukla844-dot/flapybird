import React from 'react';
import { Flame, X, CheckCircle2, Coins, Trophy, Play, Lock } from 'lucide-react';
import { DailyStreakState } from '../types';
import {
  STREAK_TIERS,
  getStreakTier,
  getNextStreakTier,
  getStreakMultiplier,
  formatMultiplier,
  hasPlayedToday,
} from '../game/dailyStreak';
import { retroAudio } from '../game/audio';

interface DailyStreakModalProps {
  isOpen: boolean;
  streakState: DailyStreakState;
  onClose: () => void;
  onPlayNow: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  streakState,
  onClose,
  onPlayNow,
}) => {
  if (!isOpen) return null;

  const playedToday = hasPlayedToday(streakState);
  const activeMultiplier = getStreakMultiplier(streakState.currentStreak);
  const currentTier = getStreakTier(streakState.currentStreak);
  const nextTier = getNextStreakTier(streakState.currentStreak);
  const daysToNext = nextTier ? Math.max(0, nextTier.minDays - streakState.currentStreak) : 0;

  return (
    <div
      id="daily-streak-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono text-white select-none"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="daily-streak-modal-dialog"
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl border-4 border-[#fb923c] bg-[#0d0d0d] shadow-[0_0_50px_rgba(251,146,60,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7d302] to-[#f97316] text-black shadow-[0_0_16px_rgba(249,115,22,0.6)]">
              <Flame className="size-5 fill-current" />
            </div>
            <div>
              <h2 className="font-mono text-base sm:text-xl font-black italic tracking-tighter text-white">
                DAILY_STREAK<span className="text-[#fb923c]">.BOOST</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/55">
                Play on consecutive days to unlock permanent coin multipliers
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-daily-streak"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 hover:border-white hover:text-white cursor-pointer"
            title="Close Daily Streak (ESC)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-[#141414] p-3 sm:p-4 shrink-0">
          <div className="rounded-xl border border-[#fb923c]/50 bg-black/80 p-2.5 text-center">
            <span className="block text-[9px] text-white/50 uppercase font-bold">CURRENT</span>
            <div className="mt-1 flex items-center justify-center gap-1 text-lg sm:text-2xl font-black text-[#fb923c]">
              <Flame className="size-4 sm:size-5 fill-current" />
              <span>{streakState.currentStreak}D</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#f7d302]/50 bg-black/80 p-2.5 text-center">
            <span className="block text-[9px] text-white/50 uppercase font-bold">COIN BOOST</span>
            <div className="mt-1 flex items-center justify-center gap-1 text-lg sm:text-2xl font-black text-[#f7d302]">
              <Coins className="size-4 sm:size-5" />
              <span>{formatMultiplier(activeMultiplier)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/80 p-2.5 text-center">
            <span className="block text-[9px] text-white/50 uppercase font-bold">BEST STREAK</span>
            <div className="mt-1 flex items-center justify-center gap-1 text-lg sm:text-2xl font-black text-white">
              <Trophy className="size-4 sm:size-5 text-[#f7d302]" />
              <span>{streakState.bestStreak}D</span>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          <div
            className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 ${
              playedToday
                ? 'border-[#73bf2e]/70 bg-[#73bf2e]/10 text-[#73bf2e]'
                : 'border-[#f7d302]/70 bg-[#f7d302]/10 text-[#f7d302]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {playedToday ? (
                <CheckCircle2 className="size-4 sm:size-5 shrink-0" />
              ) : (
                <Flame className="size-4 sm:size-5 shrink-0 animate-pulse" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-black uppercase">
                  {playedToday
                    ? 'TODAY LOGGED — STREAK SAFE!'
                    : streakState.currentStreak > 0
                    ? 'PLAY A FLIGHT TODAY TO EXTEND YOUR STREAK!'
                    : 'PLAY YOUR FIRST FLIGHT TO START DAY 1!'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/65">
                  {nextTier
                    ? `${daysToNext} more consecutive ${daysToNext === 1 ? 'day' : 'days'} to unlock ${formatMultiplier(nextTier.multiplier)} Coin Multiplier (${nextTier.label}).`
                    : `MAX TIER REACHED — ${currentTier.label} (${formatMultiplier(activeMultiplier)} Coins Active)!`}
                </p>
              </div>
            </div>

            {!playedToday && (
              <button
                type="button"
                onClick={() => {
                  retroAudio.playSelect();
                  onPlayNow();
                }}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-[#f7d302] px-2.5 py-1.5 text-[10px] font-black text-black hover:bg-[#ffe338] cursor-pointer shrink-0 shadow-[0_2px_0_#000]"
              >
                <Play className="size-3 fill-current" />
                <span>FLY</span>
              </button>
            )}
          </div>

          {/* Multiplier Tier Ladder */}
          <div className="space-y-2">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/55">
              COIN MULTIPLIER TIERS
            </h3>

            {STREAK_TIERS.map((tier) => {
              const unlocked = streakState.currentStreak >= tier.minDays;
              const isCurrent =
                streakState.currentStreak > 0 && currentTier.minDays === tier.minDays;

              return (
                <div
                  key={tier.minDays}
                  className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 transition-all ${
                    isCurrent
                      ? 'border-[#fb923c] bg-[#fb923c]/15 shadow-[0_0_16px_rgba(251,146,60,0.25)]'
                      : unlocked
                      ? 'border-[#73bf2e]/50 bg-[#73bf2e]/10'
                      : 'border-white/10 bg-black/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${
                        unlocked
                          ? 'border-[#fb923c] bg-[#fb923c]/20 text-[#fb923c]'
                          : 'border-white/15 bg-white/5 text-white/40'
                      }`}
                    >
                      {unlocked ? (
                        <Flame className="size-4 fill-current" />
                      ) : (
                        <Lock className="size-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">
                          {tier.minDays}+ {tier.minDays === 1 ? 'DAY' : 'DAYS'} • {tier.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-[#fb923c] px-1.5 py-0.5 text-[8px] font-black text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 truncate">
                        {tier.perkSummary}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg border px-2.5 py-1 text-xs font-black shrink-0 ${
                      unlocked
                        ? 'border-[#f7d302] bg-[#f7d302] text-black'
                        : 'border-white/20 bg-white/5 text-white/50'
                    }`}
                  >
                    {formatMultiplier(tier.multiplier)}¢
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/90 px-4 py-2.5 text-center text-[9px] sm:text-[10px] text-white/50 shrink-0">
          Streak multiplier stacks automatically with in-game 2X orbs and Sunset realm bonuses!
        </div>
      </div>
    </div>
  );
};

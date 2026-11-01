import React, { useState } from 'react';
import { HistoryEntry, HistoryEventType } from '../types';
import { 
  Award, 
  Sparkles, 
  CloudSun, 
  RotateCcw, 
  X, 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Coins, 
  Trophy, 
  Zap, 
  Tag, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { retroAudio } from '../game/audio';

interface HistoryModalProps {
  isOpen: boolean;
  history: HistoryEntry[];
  highScore: number;
  totalCoins: number;
  onClose: () => void;
  onRequestReset?: () => void;
}

type FilterOption = 'all' | 'medal' | 'avatar' | 'weather';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  highScore,
  totalCoins,
  onClose,
  onRequestReset,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  if (!isOpen) return null;

  // Sorting newest first
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const filteredHistory = sortedHistory.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Calculate quick stats
  const totalMedals = history.filter((h) => h.type === 'medal' && h.details?.medalTier !== 'NO MEDAL').length;
  const noMedalCount = history.filter((h) => h.type === 'medal' && h.details?.medalTier === 'NO MEDAL').length;
  const totalAvatars = history.filter((h) => h.type === 'avatar').length;
  const totalWeathers = history.filter((h) => h.type === 'weather').length;

  const medalTiers = {
    OBSIDIAN: history.filter((h) => h.details?.medalTier === 'OBSIDIAN').length,
    DIAMOND: history.filter((h) => h.details?.medalTier === 'DIAMOND').length,
    PLATINUM: history.filter((h) => h.details?.medalTier === 'PLATINUM').length,
    GOLD: history.filter((h) => h.details?.medalTier === 'GOLD').length,
    SILVER: history.filter((h) => h.details?.medalTier === 'SILVER').length,
    BRONZE: history.filter((h) => h.details?.medalTier === 'BRONZE').length,
  };

  const formatTimestamp = (ts: number) => {
    try {
      const d = new Date(ts);
      const dateStr = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return { dateStr, timeStr };
    } catch {
      return { dateStr: 'Recently', timeStr: '' };
    }
  };

  const getMedalStyle = (tier?: string) => {
    switch (tier) {
      case 'NO MEDAL':
        return {
          bg: 'bg-zinc-950/70 border-zinc-700 text-zinc-400',
          badge: 'bg-zinc-800 text-zinc-300 font-bold border border-zinc-600',
          glow: 'shadow-none',
          dot: 'bg-zinc-600',
        };
      case 'OBSIDIAN':
        return {
          bg: 'bg-purple-950/80 border-purple-500 text-purple-300',
          badge: 'bg-purple-500 text-white font-black',
          glow: 'shadow-[0_0_18px_rgba(192,132,252,0.45)]',
          dot: 'bg-purple-400',
        };
      case 'DIAMOND':
        return {
          bg: 'bg-cyan-950/80 border-cyan-400 text-cyan-300',
          badge: 'bg-cyan-400 text-black',
          glow: 'shadow-[0_0_15px_rgba(56,189,248,0.4)]',
          dot: 'bg-cyan-400',
        };
      case 'PLATINUM':
        return {
          bg: 'bg-slate-900/80 border-slate-300 text-slate-200',
          badge: 'bg-slate-200 text-black',
          glow: 'shadow-[0_0_15px_rgba(226,232,240,0.4)]',
          dot: 'bg-slate-200',
        };
      case 'GOLD':
        return {
          bg: 'bg-amber-950/80 border-amber-400 text-amber-400',
          badge: 'bg-[#f7d302] text-black',
          glow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]',
          dot: 'bg-[#f7d302]',
        };
      case 'SILVER':
        return {
          bg: 'bg-zinc-900/80 border-zinc-400 text-zinc-300',
          badge: 'bg-zinc-300 text-black',
          glow: 'shadow-[0_0_12px_rgba(148,163,184,0.3)]',
          dot: 'bg-zinc-400',
        };
      case 'BRONZE':
      default:
        return {
          bg: 'bg-amber-950/60 border-amber-700 text-amber-600',
          badge: 'bg-amber-700 text-white',
          glow: 'shadow-[0_0_10px_rgba(180,83,9,0.3)]',
          dot: 'bg-amber-600',
        };
    }
  };

  return (
    <div
      id="history-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 md:p-6 backdrop-blur-sm font-mono select-none overflow-hidden"
      onClick={onClose}
    >
      <div
        id="history-modal-dialog"
        className="relative w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[70vh] sm:max-h-[74vh] rounded-2xl md:rounded-3xl border-4 border-[#c084fc] bg-[#121212] p-3 sm:p-4 shadow-[0_0_40px_rgba(192,132,252,0.35)] text-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div id="history-modal-header" className="shrink-0 pb-2 border-b border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-[#a855f7]/20 border border-[#a855f7] text-[#c084fc] shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                <History className="size-4" />
              </div>
              <div>
                <h2 className="font-mono text-xs sm:text-sm md:text-base font-black italic tracking-tight text-white leading-none">
                  CAREER_HISTORY<span className="text-[#c084fc]">.LOG</span>
                </h2>
                <span className="font-mono text-[8px] sm:text-[9px] text-white/50 tracking-wider uppercase block">
                  PERMANENT RECORD // MEDAL VICTORIES & VAULT PURCHASES
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-close-history"
                onClick={() => {
                  retroAudio.playSelect();
                  onClose();
                }}
                className="flex size-7 sm:size-8 items-center justify-center rounded-lg border border-white/20 bg-black/80 text-white/60 transition-colors hover:border-white hover:text-white cursor-pointer shadow-sm"
                title="Close History Log"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Compact Immutability banner */}
          <div 
            id="history-immutable-banner"
            className="flex items-center gap-1.5 rounded-lg border border-[#c084fc]/30 bg-[#a855f7]/15 px-2.5 py-1 text-[8px] sm:text-[9px] text-[#e9d5ff]"
          >
            <ShieldAlert className="size-3.5 shrink-0 text-[#c084fc]" />
            <div className="truncate">
              <strong className="text-white font-bold">PERMANENT ARCHIVE:</strong>
              <span className="text-white/80 ml-1">Resets ONLY via RESTART GAME on home screen.</span>
            </div>
          </div>

          {/* Compact Quick Stats Chart (Coins, Best Score, Medals, Avatars, Weathers) */}
          <div className="grid grid-cols-5 gap-1 pt-0.5">
            {/* 1. COINS BANK */}
            <div 
              id="history-stat-coins-bank"
              className="rounded-lg border border-[#f7d302]/40 bg-[#f7d302]/10 p-1 sm:p-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#f7d302] uppercase truncate">
                <Coins className="size-2.5 shrink-0" />
                <span className="hidden sm:inline">Bank</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#f7d302] leading-tight">
                {totalCoins}¢
              </div>
            </div>

            {/* 2. BEST SCORE */}
            <div 
              id="history-stat-best-score"
              className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-1 sm:p-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-amber-300 uppercase truncate">
                <Trophy className="size-2.5 shrink-0 text-[#f7d302]" />
                <span className="hidden sm:inline">Best</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-300 leading-tight">
                {highScore}
              </div>
            </div>

            {/* 3. MEDALS WON */}
            <div 
              id="history-stat-medals"
              className="rounded-lg border border-white/20 bg-white/5 p-1 sm:p-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-white/90 uppercase truncate">
                <Award className="size-2.5 shrink-0 text-[#f7d302]" />
                <span className="hidden sm:inline">Medals</span>
              </div>
              <div className="text-xs sm:text-sm font-black leading-tight">
                {totalMedals > 0 ? (
                  <span className="text-[#f7d302]">{totalMedals}</span>
                ) : (
                  <span className="text-zinc-400 font-bold text-[9px] sm:text-[11px]">No Medal</span>
                )}
              </div>
              {totalMedals === 0 && (
                <div className="text-[7px] sm:text-[8px] text-zinc-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                  0 Won
                </div>
              )}
            </div>

            {/* 4. AVATARS */}
            <div 
              id="history-stat-avatars"
              className="rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 p-1 sm:p-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#c084fc] uppercase truncate">
                <Sparkles className="size-2.5 shrink-0" />
                <span className="hidden sm:inline">Avatars</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#c084fc] leading-tight">
                {totalAvatars}/19
              </div>
            </div>

            {/* 5. WEATHERS */}
            <div 
              id="history-stat-weathers"
              className="rounded-lg border border-[#4ec0ca]/30 bg-[#4ec0ca]/10 p-1 sm:p-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold text-[#4ec0ca] uppercase truncate">
                <CloudSun className="size-2.5 shrink-0" />
                <span className="hidden sm:inline">Atmosphere</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#4ec0ca] leading-tight">
                {totalWeathers}/5
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 overflow-x-auto scrollbar-none">
            <button
              id="filter-history-all"
              onClick={() => {
                retroAudio.playSelect();
                setActiveFilter('all');
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md border font-mono text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'border-white bg-white text-black shadow-sm'
                  : 'border-white/20 bg-black/60 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              ALL ({history.length})
            </button>

            <button
              id="filter-history-medals"
              onClick={() => {
                retroAudio.playSelect();
                setActiveFilter('medal');
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md border font-mono text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'medal'
                  ? 'border-[#f7d302] bg-[#f7d302] text-black shadow-sm'
                  : 'border-white/20 bg-black/60 text-white/70 hover:border-[#f7d302]/50 hover:text-[#f7d302]'
              }`}
            >
              <Trophy className="size-2.5" />
              <span>MEDALS ({totalMedals > 0 ? totalMedals : 'No Medal'})</span>
            </button>

            <button
              id="filter-history-avatars"
              onClick={() => {
                retroAudio.playSelect();
                setActiveFilter('avatar');
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md border font-mono text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'avatar'
                  ? 'border-[#c084fc] bg-[#c084fc] text-black shadow-sm'
                  : 'border-white/20 bg-black/60 text-white/70 hover:border-[#c084fc]/50 hover:text-[#c084fc]'
              }`}
            >
              <Sparkles className="size-2.5" />
              <span>AVATARS ({totalAvatars})</span>
            </button>

            <button
              id="filter-history-weathers"
              onClick={() => {
                retroAudio.playSelect();
                setActiveFilter('weather');
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md border font-mono text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'weather'
                  ? 'border-[#4ec0ca] bg-[#4ec0ca] text-black shadow-sm'
                  : 'border-white/20 bg-black/60 text-white/70 hover:border-[#4ec0ca]/50 hover:text-[#4ec0ca]'
              }`}
            >
              <CloudSun className="size-2.5" />
              <span>WEATHERS ({totalWeathers})</span>
            </button>
          </div>
        </div>

        {/* Scrollable History Log Feed */}
        <div 
          id="history-scrollable-feed"
          className="flex-1 overflow-y-auto pr-1 my-2 space-y-2 custom-scrollbar"
        >

          {filteredHistory.length === 0 ? (
            <div className="py-10 sm:py-14 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-14 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/30">
                <History className="size-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-mono text-sm sm:text-base font-bold text-white/80 uppercase">
                  {activeFilter === 'all'
                    ? 'NO CAREER LOG ENTRIES YET'
                    : activeFilter === 'medal'
                    ? totalMedals === 0
                      ? 'NO MEDAL ENTRIES YET (NO MEDAL)'
                      : 'NO MEDAL ENTRIES'
                    : `NO ${activeFilter.toUpperCase()} ENTRIES YET`}
                </h4>
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/80 border border-[#f7d302]/40 px-2.5 py-1 text-[10px] text-[#f7d302] font-bold flex-wrap justify-center">
                  <span>🏆 Best Score: {highScore}</span>
                  <span className="text-white/30">•</span>
                  <span>💰 Coins Bank: {totalCoins}¢</span>
                  <span className="text-white/30">•</span>
                  <span className={totalMedals > 0 ? 'text-[#f7d302]' : 'text-zinc-400 font-bold'}>
                    🎖️ {totalMedals > 0 ? `${totalMedals} Medals` : 'No Medal'}
                  </span>
                </div>
                <p className="font-mono text-[10px] sm:text-xs text-white/50 leading-relaxed">
                  {activeFilter === 'medal'
                    ? 'No Medal awarded for runs under 10 points. Fly through pipes to reach 10+ points to win Bronze (10+), Silver (25+), Gold (50+), Platinum (75-999), Diamond (1000+), or Obsidian (1500+) medals!'
                    : activeFilter === 'avatar'
                    ? 'Visit the Vault to purchase any of the 20 flapper avatars using coins earned from flying.'
                    : activeFilter === 'weather'
                    ? 'Visit the Vault to unlock weather atmospheres like Midnight Moon, Neon Cyber City, or Volcanic Cavern.'
                    : 'Fly high to earn medals or buy avatars and weathers from the shop! Every medal won and item purchased will be recorded here.'}
                </p>
              </div>
            </div>
          ) : (
            filteredHistory.map((item, index) => {
              const { dateStr, timeStr } = formatTimestamp(item.timestamp);
              const medalStyle = item.type === 'medal' ? getMedalStyle(item.details?.medalTier) : null;

              return (
                <div
                  key={item.id || index}
                  className={`rounded-xl border-2 p-2.5 sm:p-3 transition-all bg-black/70 hover:bg-black/90 ${
                    item.type === 'medal'
                      ? medalStyle?.bg || 'border-[#f7d302]/40'
                      : item.type === 'avatar'
                      ? 'border-[#a855f7]/40 text-purple-200'
                      : 'border-[#4ec0ca]/40 text-cyan-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      {/* Icon badge */}
                      <div
                        className={`size-7 sm:size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          item.type === 'medal'
                            ? `${medalStyle?.badge} border-white/30 font-black`
                            : item.type === 'avatar'
                            ? 'bg-[#a855f7] text-white border-[#c084fc]'
                            : 'bg-[#4ec0ca] text-black border-cyan-300'
                        }`}
                      >
                        {item.type === 'medal' && <Award className="size-3.5 sm:size-4 stroke-[2.5]" />}
                        {item.type === 'avatar' && <Sparkles className="size-3.5 sm:size-4" />}
                        {item.type === 'weather' && <CloudSun className="size-3.5 sm:size-4" />}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`font-mono text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              item.type === 'medal'
                                ? medalStyle?.badge
                                : item.type === 'avatar'
                                ? 'bg-[#a855f7]/30 text-[#e9d5ff] border border-[#a855f7]'
                                : 'bg-[#4ec0ca]/30 text-cyan-200 border border-[#4ec0ca]'
                            }`}
                          >
                            {item.type === 'medal' 
                              ? item.details?.medalTier === 'NO MEDAL'
                                ? 'NO MEDAL'
                                : `${item.details?.medalTier || 'MEDAL'} MEDAL`
                              : item.type.toUpperCase()}
                          </span>

                          <h3 className="font-mono text-xs sm:text-sm font-black text-white tracking-wide">
                            {item.title}
                          </h3>
                        </div>

                        <p className="font-mono text-[10px] sm:text-xs text-white/80 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Extra metadata tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[9px] sm:text-[10px] text-white/60">
                          {item.details?.score !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                              <Trophy className="size-2.5 text-[#f7d302]" />
                              Score: {item.details.score}
                            </span>
                          )}

                          {item.details?.difficulty && (
                            <span className="font-bold uppercase text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                              Mode: {item.details.difficulty}
                            </span>
                          )}

                          {item.details?.coinsEarned !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-[#f7d302] bg-[#f7d302]/10 px-1.5 py-0.5 rounded">
                              <Coins className="size-2.5" />
                              +{item.details.coinsEarned}¢
                            </span>
                          )}

                          {item.details?.cost !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-[#f7d302] bg-[#f7d302]/10 px-1.5 py-0.5 rounded">
                              <Coins className="size-2.5" />
                              Cost: {item.details.cost}¢
                            </span>
                          )}

                          {item.details?.perkName && (
                            <span className="flex items-center gap-1 font-bold text-[#4ec0ca] bg-[#4ec0ca]/10 px-1.5 py-0.5 rounded">
                              <Zap className="size-2.5" />
                              Perk: {item.details.perkName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="shrink-0 flex flex-col items-end text-right font-mono text-[8px] sm:text-[9px] text-white/40">
                      <span className="font-bold text-white/60">{dateStr}</span>
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div id="history-modal-footer" className="shrink-0 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-white/50">
            <span className="size-2 rounded-full bg-[#c084fc] animate-ping" />
            <span>Cannot be deleted manually • Resets ONLY via RESTART GAME</span>
          </div>

          <div className="flex items-center gap-2">
            {onRequestReset && (
              <button
                id="btn-history-trigger-restart"
                onClick={() => {
                  retroAudio.playSelect();
                  onClose();
                  onRequestReset();
                }}
                className="flex items-center gap-1 rounded-lg border border-[#f25022]/50 bg-[#f25022]/15 px-2.5 py-1.5 font-mono text-[9px] sm:text-[10px] font-black text-[#f25022] hover:bg-[#f25022] hover:text-white transition-colors cursor-pointer"
                title="Wipe & Restart Everything including History"
              >
                <RotateCcw className="size-3" />
                <span>RESTART GAME (WIPES HISTORY)</span>
              </button>
            )}

            <button
              id="btn-history-close-btn"
              onClick={() => {
                retroAudio.playSelect();
                onClose();
              }}
              className="px-3 sm:px-4 py-1.5 rounded-lg border border-white/30 bg-white/10 font-mono text-xs font-black text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

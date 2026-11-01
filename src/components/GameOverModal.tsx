import React from 'react';
import { Trophy, RotateCcw, Sparkles, Award, Home, CloudSun } from 'lucide-react';
import { retroAudio } from '../game/audio';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  coinsEarned: number;
  totalCoins: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onOpenShop: (tab?: 'avatars' | 'weathers') => void;
  onGoHome: () => void;
  onRequestReset?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  highScore,
  coinsEarned,
  totalCoins,
  isNewHighScore,
  onRestart,
  onOpenShop,
  onGoHome,
  onRequestReset,
}) => {
  if (!isOpen) return null;

  // Calculate medal award
  let medal: { name: string; color: string; bg: string; iconColor: string } | null = null;
  if (score >= 1500) {
    medal = { name: 'OBSIDIAN', color: '#C084FC', bg: 'bg-purple-950/90 border-purple-500 shadow-[0_0_25px_rgba(192,132,252,0.45)]', iconColor: 'text-purple-300' };
  } else if (score >= 1000) {
    medal = { name: 'DIAMOND', color: '#38BDF8', bg: 'bg-cyan-950/80 border-cyan-400', iconColor: 'text-cyan-300' };
  } else if (score >= 75) {
    medal = { name: 'PLATINUM', color: '#E2E8F0', bg: 'bg-slate-900/80 border-slate-300', iconColor: 'text-slate-200' };
  } else if (score >= 50) {
    medal = { name: 'GOLD', color: '#FACC15', bg: 'bg-amber-950/80 border-amber-400', iconColor: 'text-amber-400' };
  } else if (score >= 25) {
    medal = { name: 'SILVER', color: '#94A3B8', bg: 'bg-zinc-900/80 border-zinc-400', iconColor: 'text-zinc-300' };
  } else if (score >= 10) {
    medal = { name: 'BRONZE', color: '#B45309', bg: 'bg-amber-950/60 border-amber-700', iconColor: 'text-amber-600' };
  }

  return (
    <div 
      id="gameover-modal-backdrop"
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs font-mono select-none"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div 
        id="gameover-dialog-card"
        className="w-full max-w-[290px] sm:max-w-[340px] md:max-w-[370px] rounded-2xl border-4 border-white bg-[#121212] p-3 sm:p-4 md:p-5 shadow-[0_0_40px_rgba(0,0,0,0.9)] text-center text-white"
      >
        {/* Title */}
        <h2 
          id="gameover-title-text"
          className="font-mono text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-[#f25022] drop-shadow-[0_2px_0_#000000]"
        >
          GAME OVER
        </h2>

        {/* Score Board Box ("The Chart") - Shortened & Compact */}
        <div 
          id="gameover-score-board"
          className="my-2 sm:my-2.5 rounded-xl border-2 border-white/20 bg-black/90 p-2.5 sm:p-3 space-y-1 sm:space-y-1.5 shadow-inner text-left"
        >
          {/* Current Score */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1 sm:pb-1.5">
            <span className="font-mono text-[9px] sm:text-[10px] text-white/50 uppercase font-bold tracking-wider">SCORE</span>
            <span className="font-mono text-lg sm:text-xl md:text-2xl font-black text-white tracking-wider">{score}</span>
          </div>

          {/* High Score */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1 sm:pb-1.5">
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3 sm:size-3.5 text-[#f7d302]" />
              <span className="font-mono text-[9px] sm:text-[10px] text-[#f7d302] uppercase font-bold tracking-wider">BEST</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isNewHighScore && (
                <span className="rounded bg-[#f25022] px-1 py-0.5 font-mono text-[7px] sm:text-[8px] font-black text-white animate-bounce">
                  NEW!
                </span>
              )}
              <span className="font-mono text-sm sm:text-base font-black text-[#f7d302] tracking-wider">{highScore}</span>
            </div>
          </div>

          {/* Run Earnings */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1 sm:pb-1.5">
            <span className="font-mono text-[9px] sm:text-[10px] text-white/50 uppercase font-bold tracking-wider">CREDITS</span>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-[#f7d302]" />
              <span className="font-mono text-xs sm:text-sm font-bold text-[#f7d302]">+{coinsEarned}¢</span>
            </div>
          </div>

          {/* Medal Result directly in chart */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <Award className={`size-3 sm:size-3.5 ${medal ? medal.iconColor : 'text-zinc-500'}`} />
              <span className="font-mono text-[9px] sm:text-[10px] text-white/50 uppercase font-bold tracking-wider">MEDAL</span>
            </div>
            <span className={`font-mono text-[10px] sm:text-xs font-black ${medal ? 'text-white' : 'text-zinc-400'}`}>
              {medal ? `${medal.name} MEDAL!` : 'No Medal'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div id="gameover-actions-container" className="space-y-1.5 sm:space-y-2">
          <button
            id="btn-restart-game"
            onClick={() => {
              retroAudio.playSelect();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#f7d302] py-2 sm:py-2.5 font-mono text-xs sm:text-sm text-black font-black tracking-wider shadow-[0_3px_0_#000000] active:translate-y-0.5 active:shadow-none hover:bg-[#ffe338] cursor-pointer"
          >
            <RotateCcw className="size-3.5 sm:size-4 stroke-[2.5]" />
            PLAY AGAIN
          </button>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              id="btn-open-shop-avatars"
              onClick={() => {
                retroAudio.playSelect();
                onOpenShop('avatars');
              }}
              className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-black/80 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs text-white/80 tracking-wider hover:border-[#f7d302] hover:text-[#f7d302] cursor-pointer transition-all"
            >
              <Sparkles className="size-3 text-[#f7d302]" />
              AVATARS
            </button>

            <button
              id="btn-open-shop-weathers"
              onClick={() => {
                retroAudio.playSelect();
                onOpenShop('weathers');
              }}
              className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-black/80 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs text-white/80 tracking-wider hover:border-[#4ec0ca] hover:text-[#4ec0ca] cursor-pointer transition-all"
            >
              <CloudSun className="size-3 text-[#4ec0ca]" />
              WEATHERS
            </button>
          </div>

          <button
            id="btn-gameover-home"
            onClick={() => {
              retroAudio.playSelect();
              onGoHome();
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-black/80 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs text-white/80 tracking-wider hover:border-white hover:text-white cursor-pointer transition-colors"
          >
            <Home className="size-3 sm:size-3.5" />
            HOME SCREEN
          </button>

          {onRequestReset && (
            <button
              id="btn-gameover-reset-save"
              onClick={() => {
                retroAudio.playSelect();
                onRequestReset();
              }}
              className="w-full flex items-center justify-center gap-1 py-1 text-[8px] sm:text-[9px] font-mono text-[#f25022] hover:text-[#ff6438] hover:underline cursor-pointer transition-colors"
            >
              <RotateCcw className="size-2.5 sm:size-3" />
              <span>RESTART GAME FROM SCRATCH (0¢)</span>
            </button>
          )}
        </div>

        <p className="mt-1.5 sm:mt-2 font-mono text-[8px] sm:text-[9px] text-white/40 uppercase">
          PRESS SPACE OR TAP TO RESTART
        </p>
      </div>
    </div>
  );
};

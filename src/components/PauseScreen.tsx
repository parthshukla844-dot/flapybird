import React from 'react';
import { Play, Home, RotateCcw, HelpCircle } from 'lucide-react';
import { retroAudio } from '../game/audio';

interface PauseScreenProps {
  isOpen: boolean;
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  onOpenInstructions?: () => void;
  onRequestReset?: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  isOpen,
  score,
  onResume,
  onRestart,
  onQuitToMenu,
  onOpenInstructions,
  onRequestReset,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="pause-screen-backdrop"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs text-white font-mono select-none"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div 
        id="pause-screen-card"
        className="w-full max-w-xs sm:max-w-sm md:max-w-md rounded-2xl border-4 md:border-6 border-white bg-[#121212] p-5 sm:p-7 md:p-9 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center"
      >
        <h3 className="font-mono text-xl sm:text-2xl md:text-4xl text-white font-black italic tracking-tighter mb-1 md:mb-2">
          PAUSED<span className="text-[#f7d302]">.OS</span>
        </h3>
        <p className="font-mono text-[10px] sm:text-xs md:text-sm text-white/50 mb-4 sm:mb-6 uppercase tracking-widest">
          RUN SCORE: <span className="text-white font-bold text-xs sm:text-sm md:text-base">{score}</span>
        </p>

        <div className="space-y-2.5 sm:space-y-3.5 md:space-y-4">
          <button
            id="btn-pause-resume"
            onClick={() => {
              retroAudio.playSelect();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-black bg-[#f7d302] py-2.5 sm:py-3.5 md:py-4 font-mono text-xs sm:text-sm md:text-base text-black font-black tracking-wider shadow-[0_4px_0_#000000] md:shadow-[0_6px_0_#000000] transition-transform active:translate-y-1 active:shadow-none hover:bg-[#ffe338] cursor-pointer"
          >
            <Play className="size-4 sm:size-5 md:size-6 fill-black" />
            RESUME
          </button>

          <button
            id="btn-pause-restart"
            onClick={() => {
              retroAudio.playSelect();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-white/20 bg-black/80 py-2 sm:py-3 md:py-3.5 font-mono text-xs sm:text-sm md:text-base text-white/80 tracking-wider hover:border-white hover:text-white cursor-pointer transition-all"
          >
            <RotateCcw className="size-4 sm:size-5 md:size-6" />
            RESTART RUN
          </button>

          <button
            id="btn-pause-menu"
            onClick={() => {
              retroAudio.playSelect();
              onQuitToMenu();
            }}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-white/20 bg-black/80 py-2 sm:py-3 md:py-3.5 font-mono text-xs sm:text-sm md:text-base text-white/80 tracking-wider hover:border-[#f7d302] hover:text-[#f7d302] transition-colors cursor-pointer"
          >
            <Home className="size-4 sm:size-5 md:size-6" />
            HOME SCREEN
          </button>

          {onOpenInstructions && (
            <button
              id="btn-pause-instructions"
              onClick={() => {
                retroAudio.playSelect();
                onOpenInstructions();
              }}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-white/20 bg-black/80 py-2 sm:py-3 md:py-3.5 font-mono text-xs sm:text-sm md:text-base text-[#f7d302] tracking-wider hover:border-[#f7d302] hover:bg-[#f7d302]/10 transition-colors cursor-pointer"
            >
              <HelpCircle className="size-4 sm:size-5 md:size-6 text-[#f7d302]" />
              INSTRUCTIONS
            </button>
          )}

          {onRequestReset && (
            <button
              id="btn-pause-reset-save"
              onClick={() => {
                retroAudio.playSelect();
                onRequestReset();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] sm:text-xs md:text-sm font-mono text-[#f25022] hover:text-[#ff6438] hover:underline cursor-pointer transition-colors"
            >
              <RotateCcw className="size-3 md:size-4" />
              <span>RESTART ALL PROGRESS (0¢)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

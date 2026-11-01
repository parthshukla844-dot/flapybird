import React from 'react';
import { RotateCcw, AlertTriangle, X, Sparkles, CloudSun, Coins, History } from 'lucide-react';
import { retroAudio } from '../game/audio';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="reset-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm font-mono select-none"
      onClick={onClose}
    >
      <div 
        id="reset-modal-dialog"
        className="w-full max-w-sm rounded-2xl border-4 border-[#f25022] bg-[#121212] p-4 sm:p-5 shadow-[0_0_50px_rgba(242,80,34,0.6)] text-white text-center flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Warning Icon & Title */}
        <div className="flex items-center justify-between border-b border-[#f25022]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#f25022]/20 border border-[#f25022] text-[#f25022]">
              <AlertTriangle className="size-4 animate-bounce" />
            </div>
            <h2 className="font-mono text-sm sm:text-base font-black italic tracking-tight text-[#f25022]">
              HARD_RESTART<span className="text-white">.WARN</span>
            </h2>
          </div>
          <button 
            id="btn-close-reset-modal"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/80 text-white/60 hover:border-white hover:text-white cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Description Body */}
        <div className="my-3.5 space-y-2.5 text-left">
          <p className="font-mono text-xs text-white/90 font-bold leading-relaxed text-center">
            Are you sure you want to reset everything and start the game from scratch?
          </p>

          <div className="rounded-xl border border-white/15 bg-black/80 p-3 space-y-2 text-[10px] sm:text-[11px] text-white/80">
            <div className="flex items-center gap-2 text-[#f7d302]">
              <Coins className="size-3.5 shrink-0" />
              <span>Coins bank balance resets to <strong>0¢</strong></span>
            </div>

            <div className="flex items-center gap-2 text-[#f7d302]">
              <Sparkles className="size-3.5 shrink-0" />
              <span>All 19 unlocked Avatars locked again (Classic Pip only)</span>
            </div>

            <div className="flex items-center gap-2 text-[#4ec0ca]">
              <CloudSun className="size-3.5 shrink-0" />
              <span>All 5 unlocked Weathers locked again (Meadow Day only)</span>
            </div>

            <div className="flex items-center gap-2 text-[#c084fc]">
              <History className="size-3.5 shrink-0" />
              <span>Career History log wiped & restarted (Medals & purchases)</span>
            </div>

            <div className="flex items-center gap-2 text-[#f25022]">
              <RotateCcw className="size-3.5 shrink-0" />
              <span>High score & equips reset to start fresh!</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            id="btn-cancel-reset"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-white/20 bg-black/80 py-2.5 font-mono text-xs font-bold text-white hover:border-white hover:bg-white/10 active:scale-95 cursor-pointer transition-all"
          >
            CANCEL
          </button>

          <button
            id="btn-confirm-hard-reset"
            onClick={() => {
              onConfirmReset();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#f25022] bg-[#f25022] py-2.5 font-mono text-xs font-black text-white shadow-[0_3px_0_#9a2b0e] hover:bg-[#ff6438] active:translate-y-0.5 active:shadow-none active:scale-95 cursor-pointer transition-all"
          >
            <RotateCcw className="size-3.5 stroke-[2.5]" />
            WIPE & RESTART
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { CheckCircle2, Coins, Trophy } from 'lucide-react';
import { DailyMission } from '../types';

interface MissionToastProps {
  mission: DailyMission | null;
  completedCount: number;
  totalCount: number;
}

export const MissionToast: React.FC<MissionToastProps> = ({
  mission,
  completedCount,
  totalCount,
}) => {
  if (!mission) return null;

  return (
    <div
      id="mission-complete-toast"
      className="pointer-events-none absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[95] w-[92%] sm:w-auto sm:min-w-[340px] max-w-md rounded-xl border-2 border-[#73bf2e] bg-black/95 px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-white shadow-[0_0_32px_rgba(115,191,46,0.65)] backdrop-blur-md animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg border border-[#73bf2e] bg-[#73bf2e]/20 text-[#73bf2e] shadow-[0_0_12px_rgba(115,191,46,0.45)]">
            <Trophy className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[#73bf2e] shrink-0" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#73bf2e]">
                DAILY MISSION COMPLETE!
              </span>
            </div>
            <p className="text-xs sm:text-sm font-black text-white truncate">
              {mission.title}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[#f7d302]/90">
              {completedCount}/{totalCount} Milestones • Open Missions to Claim!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 rounded-lg border-2 border-[#f7d302] bg-[#f7d302]/20 px-2.5 py-1 text-[#f7d302] shadow-[0_0_12px_rgba(247,211,2,0.35)]">
          <Coins className="size-3.5 sm:size-4" />
          <span className="text-xs sm:text-sm font-black">
            +{mission.rewardCoins}¢
          </span>
        </div>
      </div>
    </div>
  );
};

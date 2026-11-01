import React from 'react';
import { ActivePowerUps, Difficulty } from '../types';
import { 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Music, 
  Shield, 
  Zap, 
  Sparkles, 
  Minimize, 
  Home, 
  Maximize2, 
  Minimize2, 
  HelpCircle,
  RotateCcw,
  CloudSun,
  History,
  Tv
} from 'lucide-react';
import { retroAudio } from '../game/audio';

interface ArcadeHUDProps {
  score: number;
  coins: number;
  totalCoins?: number;
  highScore: number;
  difficulty: Difficulty;
  activePowerUps: ActivePowerUps;
  isPaused: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  crtFilterEnabled?: boolean;
  isFullscreen?: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleCRT?: () => void;
  onToggleFullscreen?: () => void;
  onOpenInstructions?: () => void;
  onOpenShop?: (tab?: 'avatars' | 'weathers') => void;
  onOpenHistory?: () => void;
  onGoHome: () => void;
  onRestartRun?: () => void;
  onRequestReset?: () => void;
  onFireLaser?: () => void;
}

const ADVANTAGE_DURATION_MS = 10000;

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  score,
  coins,
  totalCoins = 0,
  highScore,
  difficulty,
  activePowerUps,
  isPaused,
  soundEnabled,
  musicEnabled,
  crtFilterEnabled,
  isFullscreen,
  onTogglePause,
  onToggleSound,
  onToggleMusic,
  onToggleCRT,
  onToggleFullscreen,
  onOpenInstructions,
  onOpenShop,
  onOpenHistory,
  onGoHome,
  onRestartRun,
  onRequestReset,
  onFireLaser,
}) => {
  const isHyperLaser = activePowerUps.laserTimer > 0;
  const laserAmmo = activePowerUps.laserAmmo ?? 3;
  const maxLaserAmmo = activePowerUps.maxLaserAmmo ?? 3;
  const rechargeProgress = activePowerUps.laserRechargeProgress ?? (laserAmmo < maxLaserAmmo ? 0.5 : 1);

  // Determine active advantages for the sliding bars
  const advantagesList = [
    {
      id: 'laser',
      name: 'HYPER LASER',
      active: activePowerUps.laserTimer > 0,
      timer: activePowerUps.laserTimer,
      maxDuration: 5000,
      icon: <Zap className="size-3.5 text-[#ef4444] shrink-0 fill-current" />,
      color: '#ef4444',
      barColor: 'bg-[#ef4444]',
      borderColor: 'border-[#ef4444]/70',
      glowShadow: '0 0 16px rgba(239,68,68,0.6)',
    },
    {
      id: 'shield',
      name: 'SHIELD',
      active: activePowerUps.shield && (activePowerUps.shieldTimer ?? 0) > 0,
      timer: activePowerUps.shieldTimer ?? 0,
      maxDuration: ADVANTAGE_DURATION_MS,
      icon: <Shield className="size-3.5 text-[#38bdf8] shrink-0" />,
      color: '#38bdf8',
      barColor: 'bg-[#38bdf8]',
      borderColor: 'border-[#38bdf8]/60',
      glowShadow: '0 0 12px rgba(56,189,248,0.4)',
    },
    {
      id: 'multiplier',
      name: '2X COINS',
      active: activePowerUps.multiplierTimer > 0,
      timer: activePowerUps.multiplierTimer,
      maxDuration: ADVANTAGE_DURATION_MS,
      icon: <Sparkles className="size-3.5 text-[#facc15] shrink-0" />,
      color: '#facc15',
      barColor: 'bg-[#facc15]',
      borderColor: 'border-[#facc15]/60',
      glowShadow: '0 0 12px rgba(250,204,21,0.4)',
    },
    {
      id: 'shrink',
      name: 'MINI BIRD',
      active: activePowerUps.shrinkTimer > 0,
      timer: activePowerUps.shrinkTimer,
      maxDuration: ADVANTAGE_DURATION_MS,
      icon: <Minimize className="size-3.5 text-[#34d399] shrink-0" />,
      color: '#34d399',
      barColor: 'bg-[#34d399]',
      borderColor: 'border-[#34d399]/60',
      glowShadow: '0 0 12px rgba(52,211,153,0.4)',
    },
    {
      id: 'slowmo',
      name: 'SLOW-MO',
      active: activePowerUps.slowmoTimer > 0,
      timer: activePowerUps.slowmoTimer,
      maxDuration: ADVANTAGE_DURATION_MS,
      icon: <Zap className="size-3.5 text-[#c084fc] shrink-0" />,
      color: '#c084fc',
      barColor: 'bg-[#c084fc]',
      borderColor: 'border-[#c084fc]/60',
      glowShadow: '0 0 12px rgba(192,132,252,0.4)',
    },
  ];

  const activeAdvantages = advantagesList.filter((adv) => adv.active);

  return (
    <div id="arcade-hud-container" className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4 md:p-6 lg:p-7 font-mono select-none">
      {/* Top Header Bar */}
      <div id="hud-top-bar" className="flex items-start justify-between relative gap-2">
        {/* Left: Coins & Difficulty Tag */}
        <div id="hud-coins-info" className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div 
              id="hud-coin-badge"
              className="flex items-center gap-1.5 md:gap-2 rounded-lg border-2 border-[#f7d302] bg-black/85 px-2 py-0.5 sm:px-3 sm:py-1 md:px-3.5 md:py-1.5 shadow-md"
            >
              <div className="size-2.5 sm:size-3 md:size-3.5 rounded-full bg-[#f7d302] border border-black shadow-[0_0_8px_#f7d302]" />
              <span className="font-mono font-black text-xs sm:text-sm md:text-base text-[#f7d302] tracking-wider">
                {coins}¢
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div 
              id="hud-difficulty-badge"
              className={`self-start rounded-lg border-2 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 md:px-3 md:py-1 bg-black/85 flex items-center gap-1 sm:gap-1.5 shadow-sm ${
                difficulty === 'easy'
                  ? 'border-[#73bf2e] text-[#73bf2e]'
                  : difficulty === 'medium'
                  ? 'border-[#f7d302] text-[#f7d302]'
                  : 'border-[#f25022] text-[#f25022]'
              }`}
            >
              <div 
                className={`size-1.5 sm:size-2 rounded-full ${
                  difficulty === 'easy'
                    ? 'bg-[#73bf2e] shadow-[0_0_6px_#73bf2e]'
                    : difficulty === 'medium'
                    ? 'bg-[#f7d302] shadow-[0_0_6px_#f7d302]'
                    : 'bg-[#f25022] shadow-[0_0_6px_#f25022]'
                }`}
              />
              <span className="font-mono font-black text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider">
                {difficulty}
              </span>
            </div>

            {/* Best Score Pill */}
            <div 
              id="hud-best-score-pill"
              className="rounded-lg border border-white/20 bg-black/80 px-2 py-0.5 text-[8px] sm:text-[10px] md:text-xs text-white/70 font-bold"
            >
              BEST: <span className="text-[#f7d302]">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Center: Clean Live Score Number */}
        <div id="hud-score-display" className="flex flex-col items-center pointer-events-none">
          <span 
            id="hud-score-number"
            className="font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_0_#000000]"
          >
            {score}
          </span>
        </div>

        {/* Right Section: Quick Controls & Top-Right Advantage Sliding Bars */}
        <div className="flex flex-col items-end gap-2">
          {/* Quick Action Controls (Complete suite: Home, Avatars, Weathers, History, Restart, Sound, CRT, Instructions, Pause) */}
          <div id="hud-controls-group" className="pointer-events-auto flex items-center flex-wrap justify-end gap-1 sm:gap-1.5 md:gap-2">
            {onGoHome && (
              <button
                id="btn-hud-home"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  onGoHome();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/85 text-white/80 transition-all active:scale-90 hover:border-white hover:text-white cursor-pointer shadow-md"
                title="Return to Home Screen"
              >
                <Home className="size-3.5 sm:size-4 md:size-4.5" />
              </button>
            )}

            {/* Career History Button */}
            {onOpenHistory && (
              <button
                id="btn-hud-history"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  onOpenHistory();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-[#c084fc]/50 bg-black/85 text-[#c084fc] transition-all active:scale-90 hover:border-[#c084fc] hover:bg-[#a855f7] hover:text-white cursor-pointer shadow-md"
                title="Career History Log"
              >
                <History className="size-3.5 sm:size-4 md:size-4.5" />
              </button>
            )}

            {/* RESTART RUN BUTTON - Always present in fullscreen & windowed so player can instantly restart */}
            {(onRestartRun || onRequestReset) && (
              <button
                id="btn-hud-restart"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  if (onRestartRun) {
                    onRestartRun();
                  } else if (onRequestReset) {
                    onRequestReset();
                  }
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-[#f25022]/70 bg-[#f25022]/20 text-[#f25022] transition-all active:scale-90 hover:border-[#f25022] hover:bg-[#f25022] hover:text-white cursor-pointer shadow-md"
                title="Restart Flight Run (R)"
              >
                <RotateCcw className="size-3.5 sm:size-4 md:size-4.5" />
              </button>
            )}

            <button
              id="btn-toggle-sound"
              onClick={(e) => {
                e.stopPropagation();
                retroAudio.playSelect();
                onToggleSound();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/85 text-white/80 transition-all active:scale-90 hover:border-white hover:text-white cursor-pointer shadow-md"
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            >
              {soundEnabled ? <Volume2 className="size-3.5 sm:size-4 md:size-4.5 text-[#73bf2e]" /> : <VolumeX className="size-3.5 sm:size-4 md:size-4.5 text-[#f25022]" />}
            </button>

            <button
              id="btn-toggle-music"
              onClick={(e) => {
                e.stopPropagation();
                retroAudio.playSelect();
                onToggleMusic();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/85 text-white/80 transition-all active:scale-90 hover:border-white hover:text-white cursor-pointer shadow-md"
              title={musicEnabled ? 'Mute Chiptune Music' : 'Enable Chiptune Music'}
            >
              <Music className={`size-3.5 sm:size-4 md:size-4.5 ${musicEnabled ? 'text-[#73bf2e]' : 'text-zinc-500'}`} />
            </button>

            {onToggleCRT && (
              <button
                id="btn-hud-crt"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  onToggleCRT();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={`hidden sm:flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 transition-all active:scale-90 cursor-pointer shadow-md ${
                  crtFilterEnabled
                    ? 'border-[#73bf2e] bg-[#73bf2e]/20 text-[#73bf2e]'
                    : 'border-white/20 bg-black/85 text-white/40 hover:border-white hover:text-white'
                }`}
                title="Toggle CRT Scanline Shader (C)"
              >
                <Tv className="size-3.5 sm:size-4 md:size-4.5" />
              </button>
            )}

            {onToggleFullscreen && (
              <button
                id="btn-hud-fullscreen"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  onToggleFullscreen();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/85 text-white/80 transition-all active:scale-90 hover:border-white hover:text-white cursor-pointer shadow-md"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4 md:size-4.5 text-[#f7d302]" /> : <Maximize2 className="size-3.5 sm:size-4 md:size-4.5" />}
              </button>
            )}

            {onOpenInstructions && (
              <button
                id="btn-hud-instructions"
                onClick={(e) => {
                  e.stopPropagation();
                  retroAudio.playSelect();
                  onOpenInstructions();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/85 text-white/80 transition-all active:scale-90 hover:border-[#f7d302] hover:text-[#f7d302] cursor-pointer shadow-md"
                title="How to Play / Instructions (I)"
              >
                <HelpCircle className="size-3.5 sm:size-4 md:size-4.5 text-[#f7d302]" />
              </button>
            )}

            <button
              id="btn-toggle-pause"
              onClick={(e) => {
                e.stopPropagation();
                retroAudio.playSelect();
                onTogglePause();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex size-7 sm:size-8 md:size-9 lg:size-10 items-center justify-center rounded-lg border-2 border-[#f7d302] bg-[#f7d302]/20 text-[#f7d302] transition-all active:scale-90 hover:bg-[#f7d302]/40 cursor-pointer shadow-[0_0_12px_rgba(247,211,2,0.3)]"
              title={isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? <Play className="size-3.5 sm:size-4 md:size-4.5 fill-[#f7d302]" /> : <Pause className="size-3.5 sm:size-4 md:size-4.5" />}
            </button>
          </div>

          {/* Top-Right: 10-Second Sliding Bars for Advantages (Hyper Laser, 2x, mini, slow motion, shield) */}
          {activeAdvantages.length > 0 && (
            <div 
              id="top-right-advantage-bars" 
              className="flex flex-col items-end gap-1.5 w-36 sm:w-44 md:w-52 transition-all duration-200"
            >
              {activeAdvantages.map((adv) => {
                const maxDur = adv.maxDuration ?? ADVANTAGE_DURATION_MS;
                const progressRatio = Math.max(0, Math.min(1, adv.timer / maxDur));
                const progressPercent = Math.round(progressRatio * 100);

                return (
                  <div
                    key={adv.id}
                    id={`top-right-sliding-bar-${adv.id}`}
                    className={`flex flex-col w-full rounded-lg border-2 ${adv.borderColor} bg-black/90 p-1.5 sm:p-2 shadow-lg backdrop-blur-sm transition-opacity duration-200`}
                    style={{ boxShadow: adv.glowShadow }}
                  >
                    {/* Perk Header: Icon and Name */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        {adv.icon}
                        <span 
                          className="font-mono text-[10px] sm:text-xs font-black tracking-wider uppercase"
                          style={{ color: adv.color }}
                        >
                          {adv.name}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-white/60">
                        {Math.ceil(adv.timer / 1000)}s
                      </span>
                    </div>

                    {/* 10-Second Sliding Gauge Track & Bar */}
                    <div className="relative h-2 sm:h-2.5 w-full overflow-hidden rounded bg-black/70 border border-white/10 p-[1px]">
                      <div
                        className={`h-full rounded-sm ${adv.barColor} transition-all duration-75 ease-linear shadow-[0_0_8px_currentColor]`}
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: adv.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Flappy Bird Laser Cannon Console & Hotkey Helper */}
      <div id="hud-bottom-row" className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left Side: Laser Ammo Gauge & Cannon Trigger Button */}
        <div id="hud-laser-cannon-console" className="flex flex-col gap-1 items-start">
          <button
            id="btn-hud-fire-laser"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFireLaser?.();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onFireLaser?.();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`group relative flex items-center gap-2 sm:gap-2.5 rounded-xl border-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-2xl transition-all cursor-pointer select-none active:scale-95 ${
              isHyperLaser
                ? 'border-[#00f0ff] bg-gradient-to-r from-red-600/90 via-purple-600/90 to-cyan-500/90 text-white shadow-[0_0_25px_rgba(0,240,255,0.7)] animate-pulse'
                : laserAmmo > 0
                ? 'border-[#ef4444] bg-black/90 hover:bg-[#ef4444]/25 text-white shadow-[0_0_18px_rgba(239,68,68,0.45)]'
                : 'border-zinc-700 bg-black/80 text-zinc-400 hover:border-zinc-500'
            }`}
            title="Fire Flappy Bird Laser Beam Cannon (1 at a time • 0.25s shot pause • Hotkey: X / L / Shift)"
          >
            {/* Blaster Icon with Glow */}
            <div className={`flex size-6 sm:size-7 items-center justify-center rounded-lg border transition-transform group-hover:scale-110 ${
              isHyperLaser
                ? 'bg-cyan-400 border-white text-black shadow-[0_0_12px_#00f0ff]'
                : laserAmmo > 0
                ? 'bg-[#ef4444] border-red-400 text-white shadow-[0_0_10px_#ef4444]'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}>
              <Zap className="size-3.5 sm:size-4 fill-current stroke-[2]" />
            </div>

            {/* Label & Ammo Cells */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-[10px] sm:text-xs font-black tracking-wider uppercase ${
                  isHyperLaser ? 'text-white' : laserAmmo > 0 ? 'text-[#ef4444]' : 'text-zinc-400'
                }`}>
                  {isHyperLaser ? 'HYPER LASER' : 'LASER BEAM'}
                </span>
                <span className="hidden sm:inline font-mono text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/80 font-bold border border-white/20">
                  KEY: X
                </span>
              </div>

              {/* 3 Laser Ammo Cells / Recharge Sliding Bar */}
              <div className="flex items-center gap-1 mt-0.5">
                {isHyperLaser ? (
                  <span className="text-[9px] font-mono font-black text-cyan-300 tracking-wider animate-pulse">
                    ⚡ UNLIMITED AMMO (5s RAPID FIRE)
                  </span>
                ) : (
                  <>
                    {[0, 1, 2].map((idx) => {
                      const isReady = idx < laserAmmo;
                      const isCharging = idx === laserAmmo;
                      return (
                        <div
                          key={idx}
                          className={`relative h-2 w-4 sm:w-5 rounded-xs border overflow-hidden ${
                            isReady
                              ? 'border-[#ef4444] bg-[#ef4444] shadow-[0_0_6px_#ef4444]'
                              : isCharging
                              ? 'border-red-900 bg-black/60'
                              : 'border-zinc-800 bg-zinc-900'
                          }`}
                        >
                          {isCharging && (
                            <div 
                              className="h-full bg-[#ef4444] transition-all duration-100 ease-linear shadow-[0_0_4px_#ef4444]"
                              style={{ width: `${Math.round(rechargeProgress * 100)}%` }}
                            />
                          )}
                        </div>
                      );
                    })}
                    <span className="font-mono text-[8px] sm:text-[9px] text-white/50 ml-1 font-bold">
                      {laserAmmo}/{maxLaserAmmo}
                      {laserAmmo < maxLaserAmmo && (
                        <span className="text-[#ef4444] ml-1 font-bold">
                          ⚡{Math.max(1, Math.ceil(60 * (1 - rechargeProgress)))}s (1m refill)
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Quick Helper Subtext */}
          <span className="font-mono text-[7px] sm:text-[8px] text-white/40 tracking-wider">
            FIRE: [X], [L], [SHIFT] OR RIGHT-CLICK • 1 MIN REFILL PER BAR
          </span>
        </div>

        {/* Right Side: Quick Jump / Flap Touch Assist for Mobile/Fullscreen */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-[9px] text-white/60">
            <span className="text-white font-bold">FLAP:</span>
            <span>SPACE / TAP / W</span>
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Difficulty, BiomeType, BirdSkin } from '../types';
import { BIOMES, BIOME_ITEMS } from '../game/pixelArt';
import { Play, Sparkles, Trophy, Tv, Volume2, VolumeX, Music, CloudSun, Lock, RotateCcw, Maximize2, Minimize2, HelpCircle, History } from 'lucide-react';
import { retroAudio } from '../game/audio';

interface MenuScreenProps {
  highScore: number;
  totalCoins: number;
  difficulty: Difficulty;
  selectedBiome: BiomeType;
  unlockedBiomes: string[];
  selectedSkin: BirdSkin;
  crtFilterEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  isFullscreen?: boolean;
  onStartGame: (diff?: Difficulty) => void;
  onOpenShop: (tab?: 'avatars' | 'weathers') => void;
  onOpenInstructions?: () => void;
  onOpenHistory?: () => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onSelectBiome: (biome: BiomeType) => void;
  onToggleCRT: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleFullscreen?: () => void;
  onRequestReset?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  highScore,
  totalCoins,
  difficulty,
  selectedBiome,
  unlockedBiomes,
  selectedSkin,
  crtFilterEnabled,
  soundEnabled,
  musicEnabled,
  isFullscreen,
  onStartGame,
  onOpenShop,
  onOpenInstructions,
  onOpenHistory,
  onSelectDifficulty,
  onSelectBiome,
  onToggleCRT,
  onToggleSound,
  onToggleMusic,
  onToggleFullscreen,
  onRequestReset,
}) => {
  const difficulties: {
    id: Difficulty;
    label: string;
    tag: string;
    desc: string;
    badge: string;
    border: string;
    bgHover: string;
    textColor: string;
    btnColor: string;
  }[] = [
    {
      id: 'easy',
      label: 'EASY',
      tag: 'GENTLE',
      desc: 'Forgiving gaps & floaty pace',
      badge: '★☆☆',
      border: 'border-[#73bf2e]',
      bgHover: 'hover:border-[#73bf2e] hover:bg-[#73bf2e]/10',
      textColor: 'text-[#73bf2e]',
      btnColor: 'bg-[#73bf2e] text-black shadow-[0_4px_0_#497c1d]',
    },
    {
      id: 'medium',
      label: 'MEDIUM',
      tag: 'CLASSIC',
      desc: 'Authentic arcade balance',
      badge: '★★☆',
      border: 'border-[#f7d302]',
      bgHover: 'hover:border-[#f7d302] hover:bg-[#f7d302]/10',
      textColor: 'text-[#f7d302]',
      btnColor: 'bg-[#f7d302] text-black shadow-[0_4px_0_#a88e00]',
    },
    {
      id: 'hard',
      label: 'HARD',
      tag: 'EXPERT',
      desc: 'High speed & dynamic hazards',
      badge: '★★★',
      border: 'border-[#f25022]',
      bgHover: 'hover:border-[#f25022] hover:bg-[#f25022]/10',
      textColor: 'text-[#f25022]',
      btnColor: 'bg-[#f25022] text-white shadow-[0_4px_0_#9a2b0e]',
    },
  ];

  return (
    <div 
      id="main-menu-overlay"
      className="absolute inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-5 md:p-7 lg:p-9 text-white bg-black/65 backdrop-blur-xs select-none font-mono overflow-y-auto"
    >
      {/* Top Bar: Bank & Toggles */}
      <div id="menu-top-bar" className="flex items-center justify-between">
        {/* Currency & Best Score */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div 
            id="menu-coin-pill"
            className="flex items-center gap-1.5 md:gap-2 rounded-lg border-2 border-[#f7d302] bg-black/90 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 shadow-sm"
          >
            <div className="size-2.5 md:size-3.5 rounded-full bg-[#f7d302] shadow-[0_0_8px_#f7d302]" />
            <span className="font-mono text-xs sm:text-sm md:text-base font-black text-[#f7d302]">{totalCoins}¢</span>
          </div>

          <div 
            id="menu-highscore-pill"
            className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-white/20 bg-black/90 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 shadow-sm"
          >
            <Trophy className="size-3 md:size-4 text-[#f7d302]" />
            <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-white/90">BEST: {highScore}</span>
          </div>
        </div>

        {/* Audio, CRT switches & Restart button */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          {onRequestReset && (
            <button
              id="btn-menu-restart-game"
              onClick={() => {
                retroAudio.playSelect();
                onRequestReset();
              }}
              className="flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 border-[#f25022]/60 bg-[#f25022]/15 text-[#f25022] transition-colors hover:border-[#f25022] hover:bg-[#f25022] hover:text-white cursor-pointer shadow-md"
              title="Restart Game from Beginning (Reset Weathers, Avatars & Coins to 0¢)"
            >
              <RotateCcw className="size-3.5 sm:size-4 md:size-5" />
            </button>
          )}

          {onOpenHistory && (
            <button
              id="btn-menu-history"
              onClick={() => {
                retroAudio.playSelect();
                onOpenHistory();
              }}
              className="flex h-7 sm:h-8 md:h-10 lg:h-11 items-center gap-1.5 sm:gap-2 rounded-lg border-2 border-[#c084fc]/60 bg-[#a855f7]/15 px-2 sm:px-2.5 md:px-3 text-[#c084fc] transition-all hover:border-[#c084fc] hover:bg-[#a855f7] hover:text-white cursor-pointer shadow-md group"
              title={`Career History — Best Score: ${highScore} pts, Coins Bank: ${totalCoins}¢ (Only resets via Restart button)`}
            >
              <History className="size-3.5 sm:size-4 md:size-5 shrink-0" />
              <span className="hidden md:inline font-mono text-[9px] lg:text-[11px] font-black tracking-wider uppercase">
                HISTORY
              </span>
            </button>
          )}

          <button
            id="btn-menu-crt"
            onClick={onToggleCRT}
            className={`flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 transition-colors cursor-pointer shadow-md ${
              crtFilterEnabled
                ? 'border-[#73bf2e] bg-[#73bf2e]/20 text-[#73bf2e] shadow-[0_0_10px_rgba(115,191,46,0.3)]'
                : 'border-white/20 bg-black/80 text-white/40'
            }`}
            title="Toggle CRT Scanline Shader"
          >
            <Tv className="size-3.5 sm:size-4 md:size-5" />
          </button>

          <button
            id="btn-menu-sound"
            onClick={onToggleSound}
            className="flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 border-white/20 bg-black/80 text-white/80 transition-colors hover:border-white hover:text-white cursor-pointer shadow-md"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="size-3.5 sm:size-4 md:size-5 text-white" /> : <VolumeX className="size-3.5 sm:size-4 md:size-5 text-[#f25022]" />}
          </button>

          <button
            id="btn-menu-music"
            onClick={onToggleMusic}
            className="flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 border-white/20 bg-black/80 text-white/80 transition-colors hover:border-white hover:text-white cursor-pointer shadow-md"
            title="Toggle Chiptune Music"
          >
            <Music className={`size-3.5 sm:size-4 md:size-5 ${musicEnabled ? 'text-[#73bf2e]' : 'text-zinc-500'}`} />
          </button>

          {onOpenInstructions && (
            <button
              id="btn-menu-instructions"
              onClick={() => {
                retroAudio.playSelect();
                onOpenInstructions();
              }}
              className="flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 border-white/20 bg-black/80 text-white/80 transition-colors hover:border-[#f7d302] hover:text-[#f7d302] cursor-pointer shadow-md"
              title="How to Play / Instructions (I)"
            >
              <HelpCircle className="size-3.5 sm:size-4 md:size-5 text-[#f7d302]" />
            </button>
          )}

          {onToggleFullscreen && (
            <button
              id="btn-menu-fullscreen"
              onClick={onToggleFullscreen}
              className="flex size-7 sm:size-8 md:size-10 lg:size-11 items-center justify-center rounded-lg border-2 border-white/20 bg-black/80 text-white/80 transition-colors hover:border-white hover:text-white cursor-pointer shadow-md"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4 md:size-5 text-[#f7d302]" /> : <Maximize2 className="size-3.5 sm:size-4 md:size-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Center: Title & Shop Triggers & 3 Difficulty Options */}
      <div id="menu-center-hero" className="flex flex-col items-center text-center my-auto w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto py-2">
        <div className="relative mb-1 md:mb-2">
          <h1 
            id="app-arcade-title"
            className="font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_0_#000000]"
          >
            FLAP_GEN<span className="text-[#f7d302]">.OS</span>
          </h1>
        </div>

        {/* Dual Vault Triggers: Avatars & Weathers */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 md:mb-3">
          <button
            id="btn-quick-hangar"
            onClick={() => {
              retroAudio.playSelect();
              onOpenShop('avatars');
            }}
            className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 rounded-xl border-2 border-[#f7d302] bg-black/90 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 text-xs sm:text-sm md:text-base text-[#f7d302] transition-all hover:bg-[#f7d302]/20 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(247,211,2,0.35)]"
          >
            <Sparkles className="size-3.5 sm:size-4 md:size-5 text-[#f7d302] animate-pulse" />
            <span className="font-mono font-black truncate max-w-[100px] sm:max-w-[130px] md:max-w-[180px]">{selectedSkin.name}</span>
            <span className="rounded bg-[#f7d302] text-black px-1.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-black">
              20 AVATARS
            </span>
          </button>

          <button
            id="btn-quick-weathers"
            onClick={() => {
              retroAudio.playSelect();
              onOpenShop('weathers');
            }}
            className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 rounded-xl border-2 border-[#4ec0ca] bg-black/90 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 text-xs sm:text-sm md:text-base text-[#4ec0ca] transition-all hover:bg-[#4ec0ca]/20 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(78,192,202,0.35)]"
          >
            <CloudSun className="size-3.5 sm:size-4 md:size-5 text-[#4ec0ca]" />
            <span className="font-mono font-black">
              {BIOMES[selectedBiome]?.name.split(' ')[0]}
            </span>
            <span className="rounded bg-[#4ec0ca] text-black px-1.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-black">
              6 WEATHERS
            </span>
          </button>
        </div>

        {/* Instructions / How to Play Button */}
        {onOpenInstructions && (
          <button
            id="btn-hero-instructions"
            onClick={() => {
              retroAudio.playSelect();
              onOpenInstructions();
            }}
            className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg border border-white/25 bg-black/75 hover:border-[#f7d302] hover:bg-[#f7d302]/15 text-white/90 hover:text-white transition-all text-[10px] sm:text-xs font-mono font-bold cursor-pointer mb-3 sm:mb-4 shadow-sm active:scale-95"
          >
            <HelpCircle className="size-3.5 sm:size-4 text-[#f7d302]" />
            <span>HOW TO PLAY / INSTRUCTIONS</span>
          </button>
        )}

        {/* 3 Difficulty Option Buttons */}
        <div className="w-full space-y-2 md:space-y-3">
          <p className="font-mono text-[9px] sm:text-[10px] md:text-xs text-white/60 uppercase tracking-[0.2em] font-bold mb-1 md:mb-2">
            CHOOSE DIFFICULTY TO PLAY
          </p>

          <div className="grid grid-cols-1 gap-2 sm:gap-2.5 md:gap-3 w-full">
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  id={`btn-diff-play-${d.id}`}
                  onClick={() => {
                    retroAudio.playSelect();
                    onSelectDifficulty(d.id);
                    onStartGame(d.id);
                  }}
                  className={`group relative flex items-center justify-between w-full px-3.5 py-2.5 sm:px-4 sm:py-3.5 md:px-6 md:py-4.5 rounded-xl md:rounded-2xl border-2 md:border-3 transition-all cursor-pointer text-left ${
                    isSelected
                      ? `${d.border} bg-black/90 shadow-[0_0_20px_rgba(255,255,255,0.18)] scale-[1.01]`
                      : `border-white/15 bg-black/80 ${d.bgHover}`
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className={`font-mono text-sm sm:text-base md:text-xl font-black tracking-wider ${d.textColor}`}>
                        {d.label}
                      </span>
                      <span className="font-mono text-[8px] sm:text-[9px] md:text-xs text-white/40 font-bold">
                        {d.badge}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] md:text-xs text-white/70 mt-0.5">
                      {d.desc}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 md:gap-2 px-3.5 py-1.5 sm:px-4.5 sm:py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-mono text-[10px] sm:text-xs md:text-sm font-black tracking-wider transition-transform group-hover:scale-105 group-active:scale-95 ${d.btnColor}`}>
                    <Play className="size-3 md:size-4 fill-current" />
                    <span>PLAY</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2.5 md:mt-4 flex items-center justify-between w-full px-1">
          <p className="animate-pulse font-mono text-[8px] sm:text-[9px] md:text-xs text-white/40 tracking-wider">
            SPACE • TAP • CLICK TO FLAP
          </p>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {onOpenHistory && (
              <button
                id="btn-menu-bottom-history"
                onClick={() => {
                  retroAudio.playSelect();
                  onOpenHistory();
                }}
                className="flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px] md:text-xs text-[#c084fc] hover:text-[#e9d5ff] hover:underline cursor-pointer"
                title={`View Permanent Career History (Best: ${highScore}, Coins Bank: ${totalCoins}¢)`}
              >
                <History className="size-2.5 md:size-3" />
                <span>CAREER HISTORY</span>
                <span className="hidden sm:inline bg-black/60 px-1.5 py-0.5 rounded border border-[#c084fc]/30 text-[7px] sm:text-[8px] text-[#f7d302] font-black">
                  BEST: {highScore} • BANK: {totalCoins}¢
                </span>
              </button>
            )}

            {onRequestReset && (
              <button
                id="btn-menu-bottom-reset"
                onClick={() => {
                  retroAudio.playSelect();
                  onRequestReset();
                }}
                className="flex items-center gap-1 font-mono text-[8px] sm:text-[9px] md:text-xs text-[#f25022] hover:text-[#ff7a54] hover:underline cursor-pointer"
              >
                <RotateCcw className="size-2.5 md:size-3" />
                <span>RESTART GAME FROM 0¢</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Weather & Biome Selector with Lock States - Hidden when playing in fullscreen */}
      {!isFullscreen && (
        <div id="menu-bottom-controls" className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <div className="mb-1 md:mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[8px] sm:text-[9px] md:text-xs text-white/50 uppercase tracking-wider font-bold">
              WEATHER REALMS (MULTIPLE OF 20¢)
            </span>
            <button
              onClick={() => onOpenShop('weathers')}
              className="font-mono text-[8px] sm:text-[9px] md:text-xs text-[#4ec0ca] hover:underline uppercase font-bold cursor-pointer"
            >
              {BIOMES[selectedBiome]?.name} (VAULT)
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {/* 6 Biomes with costs in multiples of 20 */}
            {BIOME_ITEMS.map((b) => {
              const isUnlocked = unlockedBiomes.includes(b.id) || b.cost === 0;
              const isSelected = selectedBiome === b.id;

              return (
                <button
                  key={b.id}
                  id={`btn-biome-${b.id}`}
                  onClick={() => {
                    retroAudio.playSelect();
                    if (isUnlocked) {
                      onSelectBiome(b.id);
                    } else {
                      onOpenShop('weathers');
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1.5 md:gap-2 rounded-lg border-2 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#4ec0ca] bg-[#4ec0ca] text-black font-black shadow-md'
                      : isUnlocked
                      ? 'border-white/15 bg-black/70 text-white/80 hover:border-white/40 hover:text-white'
                      : 'border-white/10 bg-black/50 text-white/40 hover:border-[#4ec0ca]/40'
                  }`}
                  title={isUnlocked ? b.name : `${b.name} - Unlock for ${b.cost}¢`}
                >
                  <span className="text-xs md:text-sm">{b.icon}</span>
                  <span className="font-mono text-[8px] sm:text-[9px] md:text-xs font-bold">
                    {b.name.split(' ')[0]}
                  </span>
                  {!isUnlocked && (
                    <span className="flex items-center text-[7px] sm:text-[8px] text-[#f7d302] font-black bg-black/60 px-1 py-0.5 rounded">
                      <Lock className="size-2 mr-0.5" />
                      {b.cost}¢
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

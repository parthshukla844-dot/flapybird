import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  HelpCircle, 
  Shield, 
  Sparkles, 
  Zap, 
  Minimize, 
  Keyboard, 
  Gamepad2, 
  Trophy, 
  CloudSun, 
  CheckCircle2, 
  MousePointer, 
  Tv, 
  RotateCcw,
  Sliders,
  Award,
  CircleSlash,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { retroAudio } from '../game/audio';
import { SKINS, BIOME_ITEMS } from '../game/pixelArt';
import { 
  AvatarPreviewCanvas, 
  WeatherPreviewCanvas, 
  FeatureDescriptionGraphic 
} from './FeatureDescriptionArt';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'controls' | 'advantages' | 'medals' | 'difficulty' | 'vault';

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('controls');
  const [featureTab, setFeatureTab] = useState<'avatars' | 'weathers'>('avatars');
  const [featureSearch, setFeatureSearch] = useState('');

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    progress: 0,
    thumbWidthPercent: 25,
  });

  const updateScrollMetrics = useCallback(() => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
    const thumbWidthPercent = scrollWidth > 0 
      ? Math.max(18, Math.min(50, (clientWidth / scrollWidth) * 100))
      : 25;

    setScrollMetrics({
      canScrollLeft: scrollLeft > 2,
      canScrollRight: scrollLeft < maxScroll - 2,
      progress,
      thumbWidthPercent,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateScrollMetrics();
    const handleResize = () => updateScrollMetrics();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateScrollMetrics]);

  const slideLeft = () => {
    if (!tabsContainerRef.current) return;
    retroAudio.playSelect();
    tabsContainerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
  };

  const slideRight = () => {
    if (!tabsContainerRef.current) return;
    retroAudio.playSelect();
    tabsContainerRef.current.scrollBy({ left: 140, behavior: 'smooth' });
  };

  const handleTrackPointer = (clientX: number) => {
    if (!tabsContainerRef.current || !sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = tabsContainerRef.current.scrollWidth - tabsContainerRef.current.clientWidth;
    tabsContainerRef.current.scrollLeft = ratio * maxScroll;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSlider(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleTrackPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    handleTrackPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSlider(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleTabClick = (tab: TabType, elementId: string) => {
    retroAudio.playSelect();
    setActiveTab(tab);
    const el = document.getElementById(elementId);
    if (el && tabsContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tabsContainerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="instructions-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 md:p-7 backdrop-blur-xs font-mono select-none text-white animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="instructions-modal-dialog"
        className="relative flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-2xl border-4 md:border-6 border-[#f7d302] bg-[#0d0d0d] shadow-[0_0_50px_rgba(247,211,2,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/90 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex size-7 sm:size-9 items-center justify-center rounded-lg bg-[#f7d302] text-black">
              <HelpCircle className="size-4 sm:size-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-mono text-base sm:text-xl md:text-2xl font-black italic tracking-tighter text-white">
                HOW_TO_PLAY<span className="text-[#f7d302]">.GUIDE</span>
              </h2>
              <p className="font-mono text-[9px] sm:text-[11px] text-white/50 tracking-wider">
                FLAP_GEN OS PILOT MANUAL
              </p>
            </div>
          </div>

          <button
            id="btn-close-instructions"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="flex size-8 sm:size-9 items-center justify-center rounded-lg border-2 border-white/20 bg-black text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Instructions"
          >
            <X className="size-4 sm:size-5" />
          </button>
        </div>

        {/* Tab Navigation with Horizontal Scroll */}
        <div
          ref={tabsContainerRef}
          onScroll={updateScrollMetrics}
          onWheel={handleTabsWheel}
          className="flex border-b border-white/15 bg-black/60 px-2 sm:px-4 shrink-0 overflow-x-auto scroll-smooth arcade-slider"
        >
          <button
            id="tab-instructions-controls"
            onClick={() => handleTabClick('controls', 'tab-instructions-controls')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black tracking-wider transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              activeTab === 'controls'
                ? 'border-[#f7d302] text-[#f7d302]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Gamepad2 className="size-3.5 sm:size-4" />
            <span>CONTROLS</span>
          </button>

          <button
            id="tab-instructions-advantages"
            onClick={() => handleTabClick('advantages', 'tab-instructions-advantages')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black tracking-wider transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              activeTab === 'advantages'
                ? 'border-[#38bdf8] text-[#38bdf8]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Sliders className="size-3.5 sm:size-4" />
            <span>ADVANTAGES (10S)</span>
          </button>

          <button
            id="tab-instructions-medals"
            onClick={() => handleTabClick('medals', 'tab-instructions-medals')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black tracking-wider transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              activeTab === 'medals'
                ? 'border-[#facc15] text-[#facc15]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Award className="size-3.5 sm:size-4" />
            <span>MEDALS</span>
          </button>

          <button
            id="tab-instructions-difficulty"
            onClick={() => handleTabClick('difficulty', 'tab-instructions-difficulty')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black tracking-wider transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              activeTab === 'difficulty'
                ? 'border-[#73bf2e] text-[#73bf2e]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Trophy className="size-3.5 sm:size-4" />
            <span>DIFFICULTY</span>
          </button>

          <button
            id="tab-instructions-vault"
            onClick={() => handleTabClick('vault', 'tab-instructions-vault')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black tracking-wider transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
              activeTab === 'vault'
                ? 'border-[#f7d302] text-[#f7d302]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Zap className="size-3.5 sm:size-4 text-[#f7d302]" />
            <span>SPECIAL FEATURES (26)</span>
          </button>
        </div>

        {/* Dedicated Interactive Retro Sliding Bar */}
        <div 
          id="instructions-tabs-sliding-bar"
          className="flex items-center gap-2 bg-[#121212] px-2.5 sm:px-4 py-1.5 border-b-2 border-white/15 select-none shrink-0"
        >
          <button
            id="btn-slide-tabs-left"
            onClick={slideLeft}
            disabled={!scrollMetrics.canScrollLeft}
            className={`flex size-6 sm:size-7 items-center justify-center rounded-md border font-black transition-all ${
              scrollMetrics.canScrollLeft
                ? 'border-[#f7d302]/60 bg-[#f7d302]/15 text-[#f7d302] hover:bg-[#f7d302] hover:text-black cursor-pointer shadow-[0_0_8px_rgba(247,211,2,0.3)]'
                : 'border-white/10 bg-black/40 text-white/20 cursor-not-allowed'
            }`}
            title="Slide Tabs Left"
          >
            <ChevronLeft className="size-3.5 sm:size-4" />
          </button>

          {/* Interactive Sliding Track */}
          <div
            ref={sliderTrackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative flex-1 h-3 sm:h-3.5 rounded-full bg-black/90 border border-white/25 hover:border-[#f7d302]/70 cursor-pointer overflow-hidden group shadow-inner touch-none"
            title="Drag or click sliding bar to slide tabs"
          >
            {/* Tick mark guides */}
            <div className="absolute inset-0 flex items-center justify-between px-3 opacity-25 pointer-events-none">
              <div className="size-1 rounded-full bg-white" />
              <div className="size-1 rounded-full bg-white" />
              <div className="size-1 rounded-full bg-white" />
              <div className="size-1 rounded-full bg-white" />
              <div className="size-1 rounded-full bg-white" />
            </div>

            {/* Glowing Active Sliding Thumb */}
            <div
              className="absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-[#f7d302] to-[#facc15] shadow-[0_0_10px_#f7d302] transition-[left] duration-75 flex items-center justify-center"
              style={{
                left: `${scrollMetrics.progress * (100 - scrollMetrics.thumbWidthPercent)}%`,
                width: `${scrollMetrics.thumbWidthPercent}%`,
              }}
            >
              <div className="w-2.5 h-1 rounded-full bg-black/50" />
            </div>
          </div>

          <button
            id="btn-slide-tabs-right"
            onClick={slideRight}
            disabled={!scrollMetrics.canScrollRight}
            className={`flex size-6 sm:size-7 items-center justify-center rounded-md border font-black transition-all ${
              scrollMetrics.canScrollRight
                ? 'border-[#f7d302]/60 bg-[#f7d302]/15 text-[#f7d302] hover:bg-[#f7d302] hover:text-black cursor-pointer shadow-[0_0_8px_rgba(247,211,2,0.3)]'
                : 'border-white/10 bg-black/40 text-white/20 cursor-not-allowed'
            }`}
            title="Slide Tabs Right"
          >
            <ChevronRight className="size-3.5 sm:size-4" />
          </button>

          <span className="font-mono text-[8px] sm:text-[9px] text-[#f7d302] font-black tracking-wider uppercase shrink-0">
            SLIDE TABS
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/15 bg-black/60 p-3 sm:p-4">
                <h3 className="font-mono text-xs sm:text-sm font-black text-[#f7d302] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Keyboard className="size-4 text-[#f7d302]" />
                  <span>PRIMARY FLIGHT CONTROLS</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2.5">
                    <span className="shrink-0 px-2 py-1 rounded bg-[#f7d302] text-black font-black text-[11px] shadow-sm">
                      SPACE / ↑ / W
                    </span>
                    <span className="text-white/80 font-bold">Flap wings & elevate upward</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2.5">
                    <span className="shrink-0 px-2 py-1 rounded bg-[#4ec0ca] text-black font-black text-[11px] shadow-sm flex items-center gap-1">
                      <MousePointer className="size-3" /> CLICK / TAP
                    </span>
                    <span className="text-white/80 font-bold">Tap screen or click anywhere to jump</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-2.5 sm:col-span-2">
                    <span className="shrink-0 px-2 py-1 rounded bg-[#ef4444] text-white font-black text-[11px] shadow-[0_0_8px_#ef4444] flex items-center gap-1">
                      <Zap className="size-3 fill-current" /> KEY: X / L / SHIFT
                    </span>
                    <span className="text-white/90 font-bold">
                      <strong>FLAPPY BIRD LASER BEAM CANNON:</strong> Obliterates incoming pipes, laser grids & hazards ahead! Earns +2 pts per destroyed obstacle. 3 ammo charges maximum (1 min refill per bar). <strong>RATE OF FIRE & PIPE FLOW: Can shoot only 1 laser at a time with a mandatory 0.25-second cooldown pause between shots. When shooting multiple lasers, pipes continue to spawn continuously ahead. If you shoot 4 pipes with the unlimited laser, the power-up effect smoothly concludes.</strong> Picking up the Hyper Laser advantage gives you unlimited laser beams for up to 2 seconds. (Or right-click / tap on-screen Laser button).
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/60 p-3 sm:p-4">
                <h3 className="font-mono text-xs sm:text-sm font-black text-white/90 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Gamepad2 className="size-4 text-white/80" />
                  <span>HOTKEYS & SYSTEM SHORTCUTS</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white/70">Pause / Resume</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/20 text-[#f7d302] font-black text-[10px]">
                      ESC / P
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white/70">CRT Scanline Shader</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/20 text-[#73bf2e] font-black text-[10px]">
                      C KEY
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white/70">Fullscreen Mode</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/20 text-white font-black text-[10px]">
                      F KEY
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-white/70">Open Instructions</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/20 text-[#38bdf8] font-black text-[10px]">
                      I / H KEY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADVANTAGES (10-SECOND POWER-UPS) */}
          {activeTab === 'advantages' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/10 p-3 sm:p-4 text-xs">
                <div className="flex items-center gap-2 text-[#38bdf8] font-black uppercase tracking-wider text-[11px] sm:text-xs mb-1">
                  <Sliders className="size-4" />
                  <span>10-SECOND TOP-RIGHT SLIDING BAR SYSTEM</span>
                </div>
                <p className="text-white/80 leading-relaxed text-[10px] sm:text-xs">
                  Whenever you grab an advantage orb, it stays active for <strong className="text-white">10 seconds</strong>.
                  A visual <strong className="text-[#38bdf8]">sliding gauge bar</strong> appears at the top-right of your screen,
                  smoothly counting down the remaining duration!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                {/* Shield */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#38bdf8]/60 bg-black/80 p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#38bdf8]/20 text-[#38bdf8]">
                      <Shield className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[#38bdf8] text-xs sm:text-sm">SHIELD</span>
                      <span className="block font-mono text-[9px] text-[#38bdf8]/80 font-bold">10 SECONDS</span>
                    </div>
                  </div>
                  <p className="text-white/75 text-[10px] sm:text-xs">
                    Absorbs 1 fatal collision against pipes or borders. Disappears automatically after 10 seconds or upon impact!
                  </p>
                </div>

                {/* 2X Coins */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#facc15]/60 bg-black/80 p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#facc15]/20 text-[#facc15]">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[#facc15] text-xs sm:text-sm">2X COINS</span>
                      <span className="block font-mono text-[9px] text-[#facc15]/80 font-bold">10 SECONDS</span>
                    </div>
                  </div>
                  <p className="text-white/75 text-[10px] sm:text-xs">
                    Doubles the value of every coin you collect for 10 seconds. Excellent for unlocking vault skins and weathers!
                  </p>
                </div>

                {/* Mini Bird */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#34d399]/60 bg-black/80 p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#34d399]/20 text-[#34d399]">
                      <Minimize className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[#34d399] text-xs sm:text-sm">MINI BIRD</span>
                      <span className="block font-mono text-[9px] text-[#34d399]/80 font-bold">10 SECONDS</span>
                    </div>
                  </div>
                  <p className="text-white/75 text-[10px] sm:text-xs">
                    Shrinks your bird to miniature size for 10 seconds, allowing effortless navigation through narrow pipe crevices.
                  </p>
                </div>

                {/* Slow-Mo */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#c084fc]/60 bg-black/80 p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#c084fc]/20 text-[#c084fc]">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[#c084fc] text-xs sm:text-sm">SLOW-MO</span>
                      <span className="block font-mono text-[9px] text-[#c084fc]/80 font-bold">10 SECONDS</span>
                    </div>
                  </div>
                  <p className="text-white/75 text-[10px] sm:text-xs">
                    Slows world obstacle movement speed by 35% for 10 seconds, giving you laser precision and reaction time.
                  </p>
                </div>

                {/* Hyper Laser */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#ef4444]/70 bg-gradient-to-br from-red-950/70 to-black p-3 shadow-[0_0_15px_rgba(239,68,68,0.35)] sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#ef4444]/25 text-[#ef4444] border border-[#ef4444]/40">
                      <Zap className="size-4 fill-current" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[#ef4444] text-xs sm:text-sm">HYPER LASER CANNON</span>
                      <span className="block font-mono text-[9px] text-[#ef4444]/90 font-bold">2 SECONDS • MAX 4 PIPES • 0.25s SHOT PAUSE • BALANCED DROP RATE</span>
                    </div>
                  </div>
                  <p className="text-white/85 text-[10px] sm:text-xs">
                    Unleashes Flappy Bird's high-tech plasma blaster! Grants up to 2 seconds of unlimited laser ammo to incinerate obstacles ahead (+2 pts bonus). <strong>Continuous Pipe Flow & Cap: Pipes will never stop spawning when firing. You can shoot only 1 laser at a time (with a 0.25s pause between shots); once you shoot 4 pipes, the unlimited laser effect is smoothly concluded.</strong> Has an equal, balanced drop rate (20%) alongside all other advantage power-ups. Standard laser charges take 1 full minute (60s) per bar to refill.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDALS & AWARDS */}
          {activeTab === 'medals' && (
            <div className="space-y-3 sm:space-y-4 text-xs">
              <div className="rounded-xl border border-[#f7d302]/40 bg-[#f7d302]/10 p-3 sm:p-4">
                <div className="flex items-center gap-2 text-[#f7d302] font-black uppercase tracking-wider text-[11px] sm:text-xs mb-1">
                  <Award className="size-4" />
                  <span>RUN MEDALS & SCORING THRESHOLDS</span>
                </div>
                <p className="text-white/80 leading-relaxed text-[10px] sm:text-xs">
                  At the end of every flight, your score is evaluated on the <strong className="text-white">GAME OVER</strong> screen.
                  Here is the breakdown of when you receive <strong className="text-purple-300">Obsidian</strong>, <strong className="text-cyan-300">Diamond</strong>, <strong className="text-slate-200">Platinum</strong>, <strong className="text-[#facc15]">Gold</strong>, <strong className="text-slate-300">Silver</strong>, <strong className="text-amber-500">Bronze</strong>, or <strong className="text-zinc-400">No Medal</strong>:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* NO MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-950/80 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                        <CircleSlash className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-zinc-400 text-xs sm:text-sm">NO MEDAL</span>
                        <span className="block font-mono text-[9px] text-zinc-500 font-bold">SCORE: 0 TO 9 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 text-[8px] font-black">
                      UNDER 10 PTS
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed mt-1">
                    When your run ends with a score under 10 points, no medal is awarded. Time your jumps rhythmically and cross at least 10 pipe columns to earn your first Bronze medal!
                  </p>
                </div>

                {/* BRONZE MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-amber-700 bg-amber-950/40 p-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-900/60 text-amber-500">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-amber-500 text-xs sm:text-sm">BRONZE MEDAL</span>
                        <span className="block font-mono text-[9px] text-amber-600/90 font-bold">SCORE: 10 TO 24 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-amber-900 text-amber-300 border border-amber-700 px-1.5 py-0.5 text-[8px] font-black">
                      10+ PTS
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mt-1">
                    Awarded when you reach <strong className="text-amber-400">10 or more points</strong> (up to 24 points). Demonstrates solid baseline reflexes, smooth altitude control, and flight pacing.
                  </p>
                </div>

                {/* SILVER MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-zinc-400 bg-zinc-900/80 p-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-zinc-200 text-xs sm:text-sm">SILVER MEDAL</span>
                        <span className="block font-mono text-[9px] text-zinc-400 font-bold">SCORE: 25 TO 49 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-zinc-800 text-zinc-100 border border-zinc-500 px-1.5 py-0.5 text-[8px] font-black">
                      25+ PTS
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mt-1">
                    Awarded when you reach <strong className="text-zinc-200">25 or more points</strong> (up to 49 points). Requires sustained focus, obstacle anticipation, and consistent gap clearing across changing terrain.
                  </p>
                </div>

                {/* GOLD MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-amber-400 bg-amber-950/70 p-3 shadow-[0_0_15px_rgba(250,204,21,0.25)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-[#facc15]">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-[#facc15] text-xs sm:text-sm">GOLD MEDAL</span>
                        <span className="block font-mono text-[9px] text-amber-400/90 font-bold">SCORE: 50 TO 74 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-[#facc15] text-black font-black px-1.5 py-0.5 text-[8px] shadow-sm">
                      50+ PTS
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mt-1">
                    Awarded when you conquer <strong className="text-[#facc15]">50 or more points</strong> (up to 74 points)! True classic arcade triumph, showcasing master-grade timing and intense endurance.
                  </p>
                </div>

                {/* PLATINUM MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-slate-300 bg-slate-950/80 p-3 shadow-[0_0_15px_rgba(226,232,240,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-slate-800 text-slate-100">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-slate-200 text-xs sm:text-sm">PLATINUM MEDAL</span>
                        <span className="block font-mono text-[9px] text-slate-400 font-bold">SCORE: 75 TO 999 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-slate-200 text-black font-black px-1.5 py-0.5 text-[8px] shadow-sm">
                      75-999 PTS
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mt-1">
                    Awarded when you reach an astonishing <strong className="text-slate-200">75 to 999 points</strong>! Flawless precision, supreme dodging reflexes, and masterful composure through moving hazards.
                  </p>
                </div>

                {/* DIAMOND MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-cyan-400 bg-cyan-950/70 p-3 shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-cyan-300 text-xs sm:text-sm">DIAMOND MEDAL</span>
                        <span className="block font-mono text-[9px] text-cyan-400/90 font-bold">SCORE: 1000 TO 1499 PTS</span>
                      </div>
                    </div>
                    <span className="rounded bg-cyan-400 text-black font-black px-1.5 py-0.5 text-[8px] shadow-sm">
                      1000+ PTS
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mt-1">
                    Awarded when you conquer the monumental quad-digit summit with <strong className="text-cyan-300">1000 or more points</strong> (up to 1499 points)! Demonstrates extraordinary endurance, rhythm, and arcade supremacy.
                  </p>
                </div>

                {/* OBSIDIAN RANK MEDAL */}
                <div className="flex flex-col gap-1.5 rounded-xl border-2 border-purple-500 bg-purple-950/80 p-3 shadow-[0_0_25px_rgba(192,132,252,0.45)] sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/25 text-purple-300 border border-purple-400/40">
                        <Award className="size-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-purple-300 text-xs sm:text-sm tracking-wide">OBSIDIAN RANK MEDAL</span>
                        <span className="block font-mono text-[9px] text-purple-400/90 font-bold">SCORE: 1500+ PTS (MYTHICAL TIER)</span>
                      </div>
                    </div>
                    <span className="rounded bg-purple-500 text-white font-black px-2 py-0.5 text-[8px] shadow-[0_0_12px_#c084fc]">
                      1500+ PTS
                    </span>
                  </div>
                  <p className="text-white/90 text-[10px] sm:text-xs leading-relaxed mt-1">
                    The supreme god-tier rank in FLAP_GEN! Awarded only to legendary flappers who shatter past <strong className="text-purple-300">1500 or more points</strong>. An ethereal cosmic achievement etched permanently into your career history log.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIFFICULTY */}
          {activeTab === 'difficulty' && (
            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1 rounded-xl border-2 border-[#73bf2e] bg-[#73bf2e]/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#73bf2e] text-sm sm:text-base">★☆☆ EASY (GENTLE)</span>
                  <span className="rounded bg-[#73bf2e] text-black px-1.5 py-0.5 text-[9px] font-black">RELAXED</span>
                </div>
                <p className="text-white/80 text-[10px] sm:text-xs">
                  Generous pipe gaps, gentle gravity, and a calm flight pace. Perfect for beginners and collecting coins.
                </p>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border-2 border-[#f7d302] bg-[#f7d302]/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#f7d302] text-sm sm:text-base">★★☆ MEDIUM (CLASSIC)</span>
                  <span className="rounded bg-[#f7d302] text-black px-1.5 py-0.5 text-[9px] font-black">ARCADE</span>
                </div>
                <p className="text-white/80 text-[10px] sm:text-xs">
                  The original arcade calibration. Balanced gap sizes, authentic momentum, and rewarding coin placement.
                </p>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border-2 border-[#f25022] bg-[#f25022]/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#f25022] text-sm sm:text-base">★★★ HARD (EXPERT)</span>
                  <span className="rounded bg-[#f25022] text-white px-1.5 py-0.5 text-[9px] font-black">INTENSE</span>
                </div>
                <p className="text-white/80 text-[10px] sm:text-xs">
                  Tight pipe clearances, high velocities, and dynamic vertically oscillating obstacles for true masters.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: VAULT & SPECIAL FEATURES */}
          {activeTab === 'vault' && (() => {
            const searchNormalized = featureSearch.trim().toLowerCase();
            const displayedSkins = SKINS.filter((skin) => {
              if (!searchNormalized) return true;
              return (
                skin.name.toLowerCase().includes(searchNormalized) ||
                skin.specialFeature.name.toLowerCase().includes(searchNormalized) ||
                skin.specialFeature.tag.toLowerCase().includes(searchNormalized) ||
                skin.specialFeature.description.toLowerCase().includes(searchNormalized)
              );
            });

            const displayedBiomes = BIOME_ITEMS.filter((biome) => {
              if (!searchNormalized) return true;
              return (
                biome.name.toLowerCase().includes(searchNormalized) ||
                biome.weatherName.toLowerCase().includes(searchNormalized) ||
                biome.specialFeature.name.toLowerCase().includes(searchNormalized) ||
                biome.specialFeature.tag.toLowerCase().includes(searchNormalized) ||
                biome.specialFeature.description.toLowerCase().includes(searchNormalized)
              );
            });

            const rarityBadges: Record<string, string> = {
              common: 'text-zinc-400 border-zinc-700 bg-zinc-900',
              rare: 'text-[#38BDF8] border-[#0284C7]/40 bg-[#0284C7]/15',
              epic: 'text-[#C084FC] border-[#7E22CE]/40 bg-[#7E22CE]/15',
              legendary: 'text-[#FBBF24] border-[#D97706]/40 bg-[#D97706]/15',
              mythic: 'text-[#F472B6] border-[#DB2777]/40 bg-[#DB2777]/15',
            };

            return (
              <div className="space-y-3.5 text-xs">
                {/* Intro Overview Banner */}
                <div className="rounded-xl border-2 border-[#f7d302] bg-[#f7d302]/10 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-[#f7d302] text-black">
                      <Zap className="size-3.5 sm:size-4 fill-black stroke-[2]" />
                    </div>
                    <h3 className="font-mono text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      EVERY UNLOCK HAS A UNIQUE SPECIAL FEATURE
                    </h3>
                  </div>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed">
                    Whenever you buy a new <strong className="text-[#f7d302]">Avatar</strong> or <strong className="text-[#4ec0ca]">Weather Realm</strong> in the Vault with your collected coins, you unlock a permanently active special feature! Every single purchase provides a different gameplay mechanic, passive advantage, or coin perk.
                  </p>
                </div>

                {/* Subcategory Navigation: Avatars vs Weathers */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      id="subtab-instructions-avatars"
                      onClick={() => {
                        retroAudio.playSelect();
                        setFeatureTab('avatars');
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                        featureTab === 'avatars'
                          ? 'bg-[#f7d302] text-black shadow-sm'
                          : 'bg-black/60 text-white/60 border border-white/15 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      <span>🐤 20 AVATARS ({SKINS.length})</span>
                    </button>

                    <button
                      id="subtab-instructions-weathers"
                      onClick={() => {
                        retroAudio.playSelect();
                        setFeatureTab('weathers');
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                        featureTab === 'weathers'
                          ? 'bg-[#4ec0ca] text-black shadow-sm'
                          : 'bg-black/60 text-white/60 border border-white/15 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      <span>🌦️ 6 WEATHERS ({BIOME_ITEMS.length})</span>
                    </button>
                  </div>

                  {/* Filter Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/40" />
                    <input
                      type="text"
                      value={featureSearch}
                      onChange={(e) => setFeatureSearch(e.target.value)}
                      placeholder="Filter perks (e.g. magnet, shield)..."
                      className="w-full sm:w-56 rounded-lg border border-white/20 bg-black/80 pl-7 pr-3 py-1.5 font-mono text-[10px] text-white placeholder-white/40 focus:border-[#f7d302] focus:outline-none"
                    />
                    {featureSearch && (
                      <button
                        onClick={() => setFeatureSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtab View: 20 AVATARS */}
                {featureTab === 'avatars' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
                      <span>SHOWING {displayedSkins.length} OF {SKINS.length} AVATAR FEATURES</span>
                      <span>ALL PRICED IN MULTIPLES OF 30 (0¢ TO 570¢)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {displayedSkins.map((skin) => (
                        <div
                          key={skin.id}
                          className="flex flex-col justify-between rounded-xl border border-white/15 bg-black/85 p-3 hover:border-white/35 transition-colors shadow-sm"
                        >
                          <div>
                            {/* Avatar Card Header with Animated Canvas */}
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                              <div className="flex items-center gap-2.5">
                                <AvatarPreviewCanvas skin={skin} size={46} />
                                <div className="flex flex-col">
                                  <span className="font-mono font-black text-white text-xs leading-tight">
                                    {skin.name}
                                  </span>
                                  <span className="font-mono text-[8px] text-white/50 line-clamp-1 mt-0.5">
                                    {skin.description}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase ${rarityBadges[skin.rarity || 'common']}`}>
                                  {skin.rarity}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[8px] font-black">
                                  {skin.cost}¢
                                </span>
                              </div>
                            </div>

                            {/* Special Feature Content Box with Description Image */}
                            <div className="rounded-lg border border-white/10 bg-white/5 p-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] font-black text-amber-300">
                                  {skin.specialFeature.name}
                                </span>
                                <span
                                  className="font-mono text-[7px] font-black uppercase px-1.5 py-0.5 rounded text-black shrink-0"
                                  style={{
                                    backgroundColor: skin.specialFeature.badgeColor || '#f7d302',
                                  }}
                                >
                                  {skin.specialFeature.tag}
                                </span>
                              </div>

                              {/* Dedicated Visual Image for this description */}
                              <FeatureDescriptionGraphic id={skin.id} type="avatar" />

                              <p className="font-mono text-[9px] sm:text-[10px] text-white/80 leading-relaxed pt-0.5">
                                {skin.specialFeature.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] text-white/40">
                            <span>ID: {skin.id.toUpperCase()}</span>
                            <span>BUY IN ARCADE VAULT</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {displayedSkins.length === 0 && (
                      <div className="py-6 text-center text-white/40 font-mono text-xs">
                        NO AVATARS FOUND MATCHING "{featureSearch}"
                      </div>
                    )}
                  </div>
                )}

                {/* Subtab View: 6 WEATHERS */}
                {featureTab === 'weathers' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
                      <span>SHOWING {displayedBiomes.length} OF {BIOME_ITEMS.length} WEATHER REALM PERKS</span>
                      <span>ALL PRICED IN MULTIPLES OF 20 (0¢ TO 100¢)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {displayedBiomes.map((biome) => (
                        <div
                          key={biome.id}
                          className="flex flex-col justify-between rounded-xl border border-[#4ec0ca]/30 bg-black/85 p-3 hover:border-[#4ec0ca]/60 transition-colors shadow-sm"
                        >
                          <div>
                            {/* Weather Card Header with Animated Sky Canvas */}
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                              <div className="flex items-center gap-2.5">
                                <WeatherPreviewCanvas biome={biome} width={64} height={46} />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-white text-xs block leading-tight">
                                      {biome.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[8px] text-[#4ec0ca] font-bold">
                                    {biome.weatherName}
                                  </span>
                                  <span className="font-mono text-[8px] text-white/50 line-clamp-1 mt-0.5">
                                    {biome.description}
                                  </span>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-[8px] font-black shrink-0">
                                {biome.cost}¢
                              </span>
                            </div>

                            {/* Special Feature Content Box with Description Image */}
                            <div className="rounded-lg border border-[#4ec0ca]/20 bg-[#4ec0ca]/5 p-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] font-black text-[#4ec0ca]">
                                  {biome.specialFeature.name}
                                </span>
                                <span
                                  className="font-mono text-[7px] font-black uppercase px-1.5 py-0.5 rounded text-black shrink-0"
                                  style={{
                                    backgroundColor: biome.specialFeature.badgeColor || '#4ec0ca',
                                  }}
                                >
                                  {biome.specialFeature.tag}
                                </span>
                              </div>

                              {/* Dedicated Visual Image for this weather description */}
                              <FeatureDescriptionGraphic id={biome.id} type="weather" />

                              <p className="font-mono text-[9px] sm:text-[10px] text-white/80 leading-relaxed pt-0.5">
                                {biome.specialFeature.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] text-white/40">
                            <span>REALM: {biome.id.toUpperCase()}</span>
                            <span>ATMOSPHERIC PASSIVE</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {displayedBiomes.length === 0 && (
                      <div className="py-6 text-center text-white/40 font-mono text-xs">
                        NO WEATHERS FOUND MATCHING "{featureSearch}"
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Tip & Restart Reminder */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 flex items-center justify-between text-[9px] text-white/60">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-3.5 text-[#f7d302] shrink-0" />
                    <span>Special features are permanently unlocked when bought and activate upon equipping!</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/40">
                    <RotateCcw className="size-3 text-[#f25022]" />
                    <span>Reset progress anytime via red reset button</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between border-t-2 border-white/15 bg-black/90 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-white/50 hidden sm:inline">
            PRESS <strong className="text-[#f7d302]">SPACE</strong> OR <strong className="text-[#f7d302]">ESC</strong> TO CLOSE
          </span>

          <button
            id="btn-instructions-got-it"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#f7d302] px-5 py-2.5 sm:px-7 sm:py-3 font-mono text-xs sm:text-sm font-black text-black tracking-wider shadow-[0_4px_0_#000000] hover:bg-[#ffe338] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-4 stroke-[2.5]" />
            <span>GOT IT • PLAY NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};

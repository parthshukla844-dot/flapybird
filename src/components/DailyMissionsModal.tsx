import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Target,
  X,
  CheckCircle2,
  Coins,
  Clock,
  Flame,
  Zap,
  Sparkles,
  Play,
  Lock,
  Trophy,
  CloudSun,
  BarChart3,
  Gift,
  Info,
} from 'lucide-react';
import { BiomeItem, BiomeType, DailyMission, DailyMissionsState, Difficulty } from '../types';
import { BIOME_ITEMS } from '../game/pixelArt';
import { getLast7DaysMissionHistory, getTimeUntilMidnightLabel } from '../game/dailyMissions';
import { retroAudio } from '../game/audio';
import { MissionProgressChart } from './MissionProgressChart';

interface DailyMissionsModalProps {
  isOpen: boolean;
  missionsState: DailyMissionsState;
  unlockedBiomes: string[];
  selectedBiome: BiomeType;
  onClose: () => void;
  onClaimReward: (missionId: string) => void;
  onPlayBiome: (biome: BiomeType) => void;
  onPlayDifficulty: (diff: Difficulty) => void;
  onPlayNow: () => void;
  onOpenWeatherVault: () => void;
  onOpenLeaderboard?: () => void;
}

interface GoldConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  flutterPhase: number;
  flutterSpeed: number;
  color: string;
  shape: 'rect' | 'diamond' | 'circle';
  age: number;
  maxAge: number;
  gravity: number;
  drag: number;
}

interface BurstRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  age: number;
  maxAge: number;
}

interface FloatingCoinBurst {
  id: number;
  x: number;
  y: number;
  amount: number;
}

const GOLD_CONFETTI_COLORS = [
  '#f7d302', // arcade gold
  '#fde047', // bright yellow gold
  '#fbbf24', // amber gold
  '#f59e0b', // deep warm gold
  '#fffbeb', // glint highlight
  '#eab308', // rich bullion gold
];

interface MissionTooltipGuide {
  typeLabel: string;
  howToComplete: string;
  proTip: string;
  accentColor: string;
}

interface ActiveMissionTooltip {
  missionId: string;
  guide: MissionTooltipGuide;
  top: number;
  left: number;
  placement: 'above' | 'below';
}

function getMissionTooltipGuide(
  mission: DailyMission,
  biomeItem: BiomeItem | null | undefined
): MissionTooltipGuide {
  switch (mission.type) {
    case 'powerup_collect':
      return {
        typeLabel: 'POWERUP COLLECTOR',
        howToComplete:
          'Fly through glowing Advantage Orbs floating between pipes during any run. Shield, Slow-Mo, 2X Multiplier, Mini-Bird, and Hyper Laser orbs all count—and multiple advantages stack simultaneously.',
        proTip: 'CUMULATIVE: Collect orbs across multiple runs today; progress saves automatically.',
        accentColor: '#c084fc',
      };
    case 'laser_destroy':
      return {
        typeLabel: 'LASER PRECISION',
        howToComplete:
          'Fire your Laser Cannon with X, L, E, Z, Shift, Right-Click, or the HUD Fire button to vaporize incoming pipes and hazards. Each destroyed obstacle counts immediately.',
        proTip: 'AMMO RECHARGES AUTOMATICALLY — grab Hyper Laser orbs for rapid-fire blasts.',
        accentColor: '#ef4444',
      };
    case 'score_biome': {
      const realmName = biomeItem ? biomeItem.name : (mission.biome ?? 'Target').toUpperCase();
      const perkTip = biomeItem
        ? `REALM PERK (${biomeItem.specialFeature.name}): ${biomeItem.specialFeature.description}`
        : 'SINGLE RUN: Your best single-flight score in this weather realm counts.';
      return {
        typeLabel: `${realmName.toUpperCase()} REALM CHALLENGE`,
        howToComplete: `Equip ${realmName} (or click Play ${mission.biome?.toUpperCase() ?? 'Now'}) and clear ${mission.target} pipes in a single flight. Unlock locked realms in the Weather Vault first.`,
        proTip: perkTip,
        accentColor: mission.biome === 'volcano' ? '#f97316' : '#4ec0ca',
      };
    }
    case 'score_difficulty': {
      const diffName = (mission.difficulty ?? 'hard').toUpperCase();
      return {
        typeLabel: `${diffName} MODE CHALLENGE`,
        howToComplete: `Switch difficulty to ${diffName} (or click Play ${diffName}) and survive past ${mission.target} obstacles in a single flight with faster pipe speed and tighter gaps.`,
        proTip: 'TIP: Use Shield, Slow-Mo, or Mini-Bird advantages to breeze through tight gaps.',
        accentColor: '#73bf2e',
      };
    }
    case 'coins_total':
      return {
        typeLabel: 'COIN RUSH',
        howToComplete: `Collect spinning gold coins floating along the flight path across any weather realm or difficulty until you bank ${mission.target}¢ today.`,
        proTip: 'BOOST IT: Grab 2X Multiplier orbs or build a Daily Streak to earn coins faster.',
        accentColor: '#f7d302',
      };
    case 'games_played':
    default:
      return {
        typeLabel: 'ARCADE FLIGHT LOG',
        howToComplete: `Launch and complete ${mission.target} arcade flights in any weather realm or difficulty today. Each finished run is logged automatically at Game Over.`,
        proTip: 'CUMULATIVE: Every completed flight before midnight adds +1 to your progress.',
        accentColor: '#73bf2e',
      };
  }
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  missionsState,
  unlockedBiomes,
  selectedBiome,
  onClose,
  onClaimReward,
  onPlayBiome,
  onPlayDifficulty,
  onPlayNow,
  onOpenWeatherVault,
  onOpenLeaderboard,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'progress'>('missions');
  const [resetCountdown, setResetCountdown] = useState<string>(() =>
    getTimeUntilMidnightLabel()
  );
  const [floatingBursts, setFloatingBursts] = useState<FloatingCoinBurst[]>([]);
  const [recentlyClaimedIds, setRecentlyClaimedIds] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<ActiveMissionTooltip | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<GoldConfettiParticle[]>([]);
  const ringsRef = useRef<BurstRing[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const burstCounterRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);

  const stopParticleLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    particlesRef.current = [];
    ringsRef.current = [];
    const canvas = particleCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const runParticleLoop = useCallback((timestamp: number) => {
    const canvas = particleCanvasRef.current;
    const dialog = dialogRef.current;
    if (!canvas || !dialog) {
      rafIdRef.current = null;
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = dialog.clientWidth;
    const displayH = dialog.clientHeight;
    if (
      canvas.width !== Math.round(displayW * dpr) ||
      canvas.height !== Math.round(displayH * dpr)
    ) {
      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafIdRef.current = null;
      return;
    }

    const dt = lastFrameTimeRef.current
      ? Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.05)
      : 0.016;
    lastFrameTimeRef.current = timestamp;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayW, displayH);

    // Update and draw expanding gold pulse rings around the clicked button
    const nextRings: BurstRing[] = [];
    for (const ring of ringsRef.current) {
      ring.age += dt;
      if (ring.age >= ring.maxAge) continue;
      const progress = ring.age / ring.maxAge;
      const eased = 1 - Math.pow(1 - progress, 3);
      ring.radius = 12 + (ring.maxRadius - 12) * eased;
      const alpha = (1 - progress) * 0.75;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(247, 211, 2, ${alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 3 * (1 - progress));
      ctx.stroke();
      ctx.restore();

      nextRings.push(ring);
    }
    ringsRef.current = nextRings;

    // Update and draw local gold confetti particles
    const nextParticles: GoldConfettiParticle[] = [];
    for (const p of particlesRef.current) {
      p.age += dt;
      if (p.age >= p.maxAge) continue;

      const dragFactor = Math.pow(p.drag, dt * 60);
      p.vx *= dragFactor;
      p.vy = p.vy * dragFactor + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;
      p.flutterPhase += p.flutterSpeed * dt;

      const lifeRatio = p.age / p.maxAge;
      const alpha = lifeRatio < 0.65 ? 1 : Math.max(0, 1 - (lifeRatio - 0.65) / 0.35);
      const flutterScale = 0.35 + 0.65 * Math.abs(Math.cos(p.flutterPhase));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.scale(1, flutterScale);
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        // Subtle bright specular highlight edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, Math.max(1, p.height * 0.28));
      } else if (p.shape === 'diamond') {
        const s = p.width * 0.65;
        ctx.scale(flutterScale, 1);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.72, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.72, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.width * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      nextParticles.push(p);
    }
    particlesRef.current = nextParticles;

    ctx.restore();

    if (particlesRef.current.length > 0 || ringsRef.current.length > 0) {
      rafIdRef.current = window.requestAnimationFrame(runParticleLoop);
    } else {
      rafIdRef.current = null;
      lastFrameTimeRef.current = 0;
    }
  }, []);

  const triggerLocalGoldConfetti = useCallback(
    (buttonEl: HTMLButtonElement, mission: DailyMission) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const dialogRect = dialog.getBoundingClientRect();
      const btnRect = buttonEl.getBoundingClientRect();
      const centerX = btnRect.left - dialogRect.left + btnRect.width / 2;
      const centerY = btnRect.top - dialogRect.top + btnRect.height / 2;
      const halfBtnW = Math.min(btnRect.width * 0.42, 68);
      const halfBtnH = Math.min(btnRect.height * 0.35, 14);

      // Expanding gold halo ring centered on the Claim Reward button
      ringsRef.current.push({
        x: centerX,
        y: centerY,
        radius: 10,
        maxRadius: Math.max(btnRect.width * 0.58, 62),
        age: 0,
        maxAge: 0.34,
      });

      // Spawn 34 gold confetti particles tightly around the button
      const particleCount = 34;
      for (let i = 0; i < particleCount; i++) {
        const angle =
          (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.32;
        const speed = 95 + Math.random() * 195;
        const spawnOffsetX = (Math.random() - 0.5) * 2 * halfBtnW;
        const spawnOffsetY = (Math.random() - 0.5) * 2 * halfBtnH;
        const roll = Math.random();
        const shape: GoldConfettiParticle['shape'] =
          roll < 0.62 ? 'rect' : roll < 0.85 ? 'diamond' : 'circle';

        particlesRef.current.push({
          x: centerX + spawnOffsetX,
          y: centerY + spawnOffsetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (65 + Math.random() * 65),
          width: shape === 'rect' ? 5 + Math.random() * 4.5 : 4 + Math.random() * 3.5,
          height: shape === 'rect' ? 3 + Math.random() * 3 : 4 + Math.random() * 3.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 14,
          flutterPhase: Math.random() * Math.PI * 2,
          flutterSpeed: 9 + Math.random() * 11,
          color:
            GOLD_CONFETTI_COLORS[
              Math.floor(Math.random() * GOLD_CONFETTI_COLORS.length)
            ],
          shape,
          age: 0,
          maxAge: 0.58 + Math.random() * 0.34,
          gravity: 360 + Math.random() * 140,
          drag: 0.945 + Math.random() * 0.02,
        });
      }

      if (rafIdRef.current === null) {
        lastFrameTimeRef.current = 0;
        rafIdRef.current = window.requestAnimationFrame(runParticleLoop);
      }

      // Trigger local floating "+XX¢" coin burst indicator above the button
      const burstId = ++burstCounterRef.current;
      setFloatingBursts((prev) => [
        ...prev,
        { id: burstId, x: centerX, y: centerY, amount: mission.rewardCoins },
      ]);
      const floatTimer = window.setTimeout(() => {
        setFloatingBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 820);
      timersRef.current.push(floatTimer);

      // Briefly highlight the newly transitioned CLAIMED badge
      setRecentlyClaimedIds((prev) => ({ ...prev, [mission.id]: true }));
      const badgeTimer = window.setTimeout(() => {
        setRecentlyClaimedIds((prev) => {
          const next = { ...prev };
          delete next[mission.id];
          return next;
        });
      }, 750);
      timersRef.current.push(badgeTimer);
    },
    [runParticleLoop]
  );

  const showMissionTooltip = useCallback(
    (cardEl: HTMLElement, mission: DailyMission, biomeItem: BiomeItem | null | undefined) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const dialogRect = dialog.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();
      const cardTop = cardRect.top - dialogRect.top;
      const cardBottom = cardRect.bottom - dialogRect.top;
      const cardCenterX = cardRect.left - dialogRect.left + cardRect.width / 2;

      const spaceAbove = cardTop;
      const spaceBelow = dialogRect.height - cardBottom;
      const placement: 'above' | 'below' =
        spaceAbove >= 148 || spaceAbove >= spaceBelow ? 'above' : 'below';

      const top =
        placement === 'above'
          ? Math.max(12, cardTop - 8)
          : Math.min(dialogRect.height - 12, cardBottom + 8);
      const halfTooltipWidth = Math.min(dialogRect.width * 0.44, 210);
      const left = Math.max(
        halfTooltipWidth + 12,
        Math.min(dialogRect.width - halfTooltipWidth - 12, cardCenterX)
      );

      setActiveTooltip({
        missionId: mission.id,
        guide: getMissionTooltipGuide(mission, biomeItem),
        top,
        left,
        placement,
      });
    },
    []
  );

  const hideMissionTooltip = useCallback((missionId?: string) => {
    setActiveTooltip((prev) => {
      if (!prev) return null;
      if (missionId && prev.missionId !== missionId) return prev;
      return null;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopParticleLoop();
      setFloatingBursts([]);
      setRecentlyClaimedIds({});
      setActiveTooltip(null);
      return;
    }
    setResetCountdown(getTimeUntilMidnightLabel());
    const id = window.setInterval(() => {
      setResetCountdown(getTimeUntilMidnightLabel());
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [isOpen, stopParticleLoop]);

  useEffect(() => {
    return () => {
      stopParticleLoop();
      for (const t of timersRef.current) {
        window.clearTimeout(t);
      }
      timersRef.current = [];
    };
  }, [stopParticleLoop]);

  if (!isOpen) return null;

  const history7Days = getLast7DaysMissionHistory(missionsState);
  const completedCount = missionsState.missions.filter((m) => m.completed).length;
  const unclaimedCount = missionsState.missions.filter((m) => m.completed && !m.claimed).length;
  const totalBonusClaimed = missionsState.missions
    .filter((m) => m.completed && m.claimed)
    .reduce((sum, m) => sum + m.rewardCoins, 0);
  const totalBonusPossible = missionsState.missions.reduce(
    (sum, m) => sum + m.rewardCoins,
    0
  );

  const getMissionIcon = (mission: DailyMission) => {
    if (mission.type === 'score_biome') {
      return mission.biome === 'volcano' ? (
        <Flame className="size-4 sm:size-5 text-[#f97316]" />
      ) : (
        <CloudSun className="size-4 sm:size-5 text-[#4ec0ca]" />
      );
    }
    if (mission.type === 'laser_destroy') {
      return <Zap className="size-4 sm:size-5 text-[#ef4444]" />;
    }
    if (mission.type === 'powerup_collect') {
      return <Sparkles className="size-4 sm:size-5 text-[#c084fc]" />;
    }
    if (mission.type === 'coins_total') {
      return <Coins className="size-4 sm:size-5 text-[#f7d302]" />;
    }
    return <Trophy className="size-4 sm:size-5 text-[#73bf2e]" />;
  };

  const getCategoryTag = (mission: DailyMission) => {
    if (mission.type === 'score_biome' && mission.biome) {
      return `${mission.biome.toUpperCase()} REALM`;
    }
    if (mission.type === 'score_difficulty' && mission.difficulty) {
      return `${mission.difficulty.toUpperCase()} MODE`;
    }
    if (mission.type === 'laser_destroy') return 'LASER COMBAT';
    if (mission.type === 'powerup_collect') return 'ADVANTAGES';
    if (mission.type === 'coins_total') return 'COIN RUSH';
    return 'FLIGHT MILESTONE';
  };

  return (
    <div
      id="daily-missions-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono text-white select-none"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="daily-missions-modal-dialog"
        ref={dialogRef}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border-4 border-[#f7d302] bg-[#0d0d0d] shadow-[0_0_50px_rgba(247,211,2,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Local Gold Confetti Particle Overlay */}
        <canvas
          id="daily-missions-confetti-canvas"
          ref={particleCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        />

        {/* Floating +Coins Reward Bursts */}
        {floatingBursts.map((burst) => (
          <div
            key={burst.id}
            aria-hidden="true"
            className="pointer-events-none absolute z-40 flex items-center gap-1 rounded-full border border-[#f7d302] bg-black/90 px-2.5 py-0.5 text-xs font-black text-[#f7d302] shadow-[0_0_16px_rgba(247,211,2,0.75)] animate-claim-coin-float"
            style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
          >
            <Coins className="size-3.5" />
            <span>+{burst.amount}¢</span>
          </div>
        ))}

        {/* Informative Mission Hover Tooltip (Rendered at Modal Layer to Avoid Scroll Clipping) */}
        {activeTab === 'missions' && activeTooltip && (
          <div
            id={`mission-tooltip-${activeTooltip.missionId}`}
            role="tooltip"
            className="pointer-events-none absolute z-40 w-[min(88%,420px)] rounded-xl border-2 bg-[#09090d]/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.9)] backdrop-blur-md transition-opacity duration-150"
            style={{
              left: `${activeTooltip.left}px`,
              top: `${activeTooltip.top}px`,
              transform:
                activeTooltip.placement === 'above'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0%)',
              borderColor: activeTooltip.guide.accentColor,
              boxShadow: `0 12px 30px rgba(0,0,0,0.9), 0 0 18px ${activeTooltip.guide.accentColor}40`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Info
                className="size-3.5 shrink-0"
                style={{ color: activeTooltip.guide.accentColor }}
              />
              <span
                className="text-[10px] font-black tracking-wider uppercase"
                style={{ color: activeTooltip.guide.accentColor }}
              >
                {activeTooltip.guide.typeLabel} — HOW TO COMPLETE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] leading-relaxed text-white/90">
              {activeTooltip.guide.howToComplete}
            </p>
            <div className="mt-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-[#f7d302]">
              {activeTooltip.guide.proTip}
            </div>
          </div>
        )}
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-[#f7d302] text-black shadow-[0_0_14px_rgba(247,211,2,0.5)]">
              <Target className="size-4 sm:size-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-mono text-base sm:text-xl font-black italic tracking-tighter text-white">
                DAILY_MISSIONS<span className="text-[#f7d302]">.SYS</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/55 flex items-center gap-1.5">
                <Clock className="size-3 text-[#4ec0ca]" />
                <span>RESETS IN {resetCountdown}</span>
                <span>•</span>
                <span>{missionsState.dateKey}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-daily-missions"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 hover:border-white hover:text-white cursor-pointer"
            title="Close Daily Missions (ESC)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-black/75 px-3 sm:px-5 shrink-0">
          <div className="flex items-center">
            <button
              type="button"
              id="tab-daily-missions-today"
              onClick={() => {
                retroAudio.playSelect();
                setActiveTooltip(null);
                setActiveTab('missions');
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black tracking-wider uppercase border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'missions'
                  ? 'border-[#f7d302] text-[#f7d302]'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Target className="size-3.5" />
              <span>TODAY&apos;S MISSIONS</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px]">
                {completedCount}/{missionsState.missions.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-daily-missions-progress"
              onClick={() => {
                retroAudio.playSelect();
                setActiveTooltip(null);
                setActiveTab('progress');
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black tracking-wider uppercase border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'progress'
                  ? 'border-[#4ec0ca] text-[#4ec0ca]'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>MISSION PROGRESS</span>
              <span className="rounded bg-[#4ec0ca]/15 border border-[#4ec0ca]/40 px-1.5 py-0.5 text-[9px] text-[#4ec0ca]">
                7D
              </span>
            </button>
          </div>

          {onOpenLeaderboard && (
            <button
              type="button"
              id="btn-view-missions-leaderboard"
              onClick={() => {
                retroAudio.playSelect();
                onOpenLeaderboard();
              }}
              className="my-1.5 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#4ec0ca] bg-[#4ec0ca]/15 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black tracking-wider text-[#4ec0ca] uppercase transition-all hover:bg-[#4ec0ca] hover:text-black hover:shadow-[0_0_14px_rgba(78,192,202,0.5)] cursor-pointer shrink-0"
              title="Compare your total daily missions completed against the global average"
            >
              <Trophy className="size-3.5" />
              <span>VIEW LEADERBOARD</span>
            </button>
          )}
        </div>

        {/* Summary Strip (Today Tab) */}
        {activeTab === 'missions' && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#141414] px-4 py-2.5 sm:px-5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-white/60 uppercase">
                TODAY&apos;S PROGRESS:
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] sm:text-xs font-black ${
                  completedCount === missionsState.missions.length
                    ? 'bg-[#73bf2e] text-black'
                    : 'bg-[#f7d302]/20 border border-[#f7d302]/60 text-[#f7d302]'
                }`}
              >
                {completedCount} / {missionsState.missions.length} COMPLETE
              </span>
              {unclaimedCount > 0 && (
                <span className="rounded bg-[#f7d302] px-2 py-0.5 text-[10px] font-black text-black animate-pulse">
                  {unclaimedCount} READY TO CLAIM!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-[#f7d302]">
              <Coins className="size-3.5" />
              <span>
                BONUS CLAIMED: {totalBonusClaimed}¢ / {totalBonusPossible}¢
              </span>
            </div>
          </div>
        )}

        {/* Tab Body */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3"
          onScroll={() => hideMissionTooltip()}
        >
          {activeTab === 'progress' ? (
            <MissionProgressChart data={history7Days} />
          ) : (
            missionsState.missions.map((mission) => {
            const pct = Math.min(
              100,
              Math.round((mission.progress / Math.max(1, mission.target)) * 100)
            );
            const biomeItem = mission.biome
              ? BIOME_ITEMS.find((b) => b.id === mission.biome)
              : null;
            const isBiomeLocked =
              Boolean(mission.biome) &&
              biomeItem &&
              biomeItem.cost > 0 &&
              !unlockedBiomes.includes(mission.biome!);
            const isTooltipActive = activeTooltip?.missionId === mission.id;

            return (
              <div
                key={mission.id}
                id={`daily-mission-card-${mission.id}`}
                data-mission-card="true"
                aria-describedby={isTooltipActive ? `mission-tooltip-${mission.id}` : undefined}
                onMouseEnter={(e) => showMissionTooltip(e.currentTarget, mission, biomeItem)}
                onMouseLeave={() => hideMissionTooltip(mission.id)}
                className={`rounded-xl border-2 p-3 sm:p-4 transition-all ${
                  mission.completed
                    ? 'border-[#73bf2e]/80 bg-[#73bf2e]/10 shadow-[0_0_20px_rgba(115,191,46,0.2)]'
                    : 'border-white/15 bg-black/80 hover:border-[#f7d302]/60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border ${
                        mission.completed
                          ? 'border-[#73bf2e] bg-[#73bf2e]/20'
                          : 'border-white/15 bg-white/5'
                      }`}
                    >
                      {mission.completed ? (
                        <CheckCircle2 className="size-5 text-[#73bf2e]" />
                      ) : (
                        getMissionIcon(mission)
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black tracking-wider text-white/75 uppercase">
                          {getCategoryTag(mission)}
                        </span>
                        <button
                          type="button"
                          id={`btn-mission-guide-${mission.id}`}
                          onFocus={(e) => {
                            const card = e.currentTarget.closest(
                              '[data-mission-card="true"]'
                            ) as HTMLElement | null;
                            showMissionTooltip(card ?? e.currentTarget, mission, biomeItem);
                          }}
                          onBlur={() => hideMissionTooltip(mission.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTooltipActive) {
                              hideMissionTooltip(mission.id);
                            } else {
                              const card = e.currentTarget.closest(
                                '[data-mission-card="true"]'
                              ) as HTMLElement | null;
                              showMissionTooltip(card ?? e.currentTarget, mission, biomeItem);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black tracking-wider uppercase border transition-colors cursor-help ${
                            isTooltipActive
                              ? 'border-[#4ec0ca] bg-[#4ec0ca]/25 text-[#4ec0ca]'
                              : 'border-white/15 bg-white/5 text-white/55 hover:border-[#4ec0ca]/70 hover:text-[#4ec0ca]'
                          }`}
                          aria-label={`How to complete ${mission.title}`}
                        >
                          <Info className="size-2.5" />
                          <span>HOW TO</span>
                        </button>
                        {mission.type === 'score_biome' &&
                          mission.biome === selectedBiome &&
                          !mission.completed && (
                            <span className="rounded bg-[#4ec0ca]/20 border border-[#4ec0ca]/50 px-1.5 py-0.5 text-[8px] font-black text-[#4ec0ca]">
                              EQUIPPED
                            </span>
                          )}
                      </div>
                      <h3 className="text-xs sm:text-sm md:text-base font-black text-white">
                        {mission.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-white/60 leading-snug mt-0.5">
                        {mission.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward Pill */}
                  <div
                    className={`flex items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-xs font-black shrink-0 ${
                      mission.completed
                        ? 'border-[#73bf2e] bg-[#73bf2e] text-black'
                        : 'border-[#f7d302] bg-[#f7d302]/15 text-[#f7d302]'
                    }`}
                  >
                    <Coins className="size-3.5" />
                    <span>+{mission.rewardCoins}¢</span>
                  </div>
                </div>

                {/* Progress Bar & Action */}
                <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-white/60 uppercase">
                        {mission.completed ? 'MILESTONE REACHED' : 'PROGRESS'}
                      </span>
                      <span
                        className={
                          mission.completed ? 'text-[#73bf2e]' : 'text-[#f7d302]'
                        }
                      >
                        {mission.progress} / {mission.target} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-md border border-white/15 bg-zinc-900 p-[1px]">
                      <div
                        className={`h-full rounded-xs transition-all duration-300 ${
                          mission.completed
                            ? 'bg-[#73bf2e] shadow-[0_0_8px_#73bf2e]'
                            : 'bg-[#f7d302] shadow-[0_0_8px_#f7d302]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {mission.completed && !mission.claimed ? (
                    <button
                      type="button"
                      id={`btn-claim-mission-${mission.id}`}
                      onClick={(e) => {
                        triggerLocalGoldConfetti(e.currentTarget, mission);
                        onClaimReward(mission.id);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-[#73bf2e] px-3.5 py-1.5 text-[10px] sm:text-xs font-black text-black hover:bg-[#84d838] cursor-pointer shrink-0 shadow-[0_2px_0_#000,0_0_16px_rgba(115,191,46,0.5)] active:translate-y-0.5 active:shadow-none transition-all animate-pulse"
                    >
                      <Gift className="size-3.5 stroke-[2.5]" />
                      <span>CLAIM REWARD (+{mission.rewardCoins}¢)</span>
                    </button>
                  ) : mission.completed && mission.claimed ? (
                    <span
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-[10px] font-black shrink-0 transition-all duration-300 ${
                        recentlyClaimedIds[mission.id]
                          ? 'border-[#f7d302] bg-[#f7d302]/25 text-[#fde047] shadow-[0_0_18px_rgba(247,211,2,0.65)] scale-105'
                          : 'border-[#73bf2e]/50 bg-[#73bf2e]/15 text-[#73bf2e]'
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      CLAIMED
                    </span>
                  ) : isBiomeLocked && biomeItem ? (
                    <button
                      type="button"
                      onClick={() => {
                        retroAudio.playSelect();
                        onOpenWeatherVault();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#4ec0ca] bg-[#4ec0ca]/15 px-3 py-1.5 text-[10px] sm:text-xs font-black text-[#4ec0ca] hover:bg-[#4ec0ca] hover:text-black cursor-pointer shrink-0 transition-colors"
                    >
                      <Lock className="size-3" />
                      <span>UNLOCK ({biomeItem.cost}¢)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        retroAudio.playSelect();
                        if (mission.type === 'score_biome' && mission.biome) {
                          onPlayBiome(mission.biome);
                        } else if (
                          mission.type === 'score_difficulty' &&
                          mission.difficulty
                        ) {
                          onPlayDifficulty(mission.difficulty);
                        } else {
                          onPlayNow();
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-[#f7d302] px-3 py-1.5 text-[10px] sm:text-xs font-black text-black hover:bg-[#ffe338] cursor-pointer shrink-0 shadow-[0_2px_0_#000] active:translate-y-0.5 active:shadow-none"
                    >
                      <Play className="size-3 fill-current" />
                      <span>
                        {mission.type === 'score_biome' && mission.biome
                          ? `PLAY ${mission.biome.toUpperCase()}`
                          : mission.type === 'score_difficulty' && mission.difficulty
                          ? `PLAY ${mission.difficulty.toUpperCase()}`
                          : 'PLAY NOW'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-white/10 bg-black/90 px-4 py-2.5 text-center text-[9px] sm:text-[10px] text-white/50 shrink-0">
          {activeTab === 'progress'
            ? 'Daily completion logs are saved automatically each day as you finish milestones.'
            : 'Hover any mission (or tap HOW TO) for completion tips — then click Claim Reward to bank your bonus coins!'}
        </div>
      </div>
    </div>
  );
};

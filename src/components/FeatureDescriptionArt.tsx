import React, { useEffect, useRef } from 'react';
import { BirdSkin, BiomeItem } from '../types';
import { drawPixelBird, BIOMES } from '../game/pixelArt';

// ==========================================
// 1. ANIMATED AVATAR PREVIEW CANVAS
// ==========================================
interface AvatarPreviewCanvasProps {
  skin: BirdSkin;
  size?: number;
}

export const AvatarPreviewCanvas: React.FC<AvatarPreviewCanvasProps> = ({ skin, size = 56 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const flap = Math.floor((frame / 9) % 3);
      // Center the bird in the canvas
      drawPixelBird(ctx, canvas.width / 2, canvas.height / 2 + 1, skin, 0, flap, 1.15);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [skin]);

  return (
    <div 
      className="relative flex items-center justify-center rounded-xl border border-white/20 bg-black/80 shadow-inner overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="relative z-10 image-rendering-pixelated"
      />
    </div>
  );
};

// ==========================================
// 2. ANIMATED WEATHER REALM PREVIEW CANVAS
// ==========================================
interface WeatherPreviewCanvasProps {
  biome: BiomeItem;
  width?: number;
  height?: number;
}

export const WeatherPreviewCanvas: React.FC<WeatherPreviewCanvasProps> = ({ 
  biome, 
  width = 84, 
  height = 56 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = BIOMES[biome.id] || BIOMES.day;
    let frame = 0;
    let animId: number;

    // Generate static / reusable particles
    const particles = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 2,
    }));

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, config.skyTop);
      grad.addColorStop(1, config.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Distant Hills / Mountains silhouette
      ctx.fillStyle = config.mountainColor;
      ctx.beginPath();
      ctx.moveTo(0, height - 14);
      ctx.lineTo(width * 0.3, height - 22);
      ctx.lineTo(width * 0.6, height - 16);
      ctx.lineTo(width, height - 24);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Ground Base
      ctx.fillStyle = config.groundTop;
      ctx.fillRect(0, height - 10, width, 3);
      ctx.fillStyle = config.groundBody;
      ctx.fillRect(0, height - 7, width, 7);

      // Mini Retro Pipe in background
      const pipeX = width - 20;
      ctx.fillStyle = config.pipeMain;
      ctx.fillRect(pipeX, height - 28, 12, 18);
      ctx.fillStyle = config.pipeHighlight;
      ctx.fillRect(pipeX + 2, height - 28, 2, 18);
      ctx.fillStyle = config.pipeRim;
      ctx.fillRect(pipeX - 2, height - 32, 16, 5);

      // Dynamic Weather Particles
      if (biome.weatherEffect === 'rain') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        particles.forEach((p) => {
          p.y = (p.y + p.speed * 2) % height;
          p.x = (p.x - 0.5 + width) % width;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1, p.y + 4);
          ctx.stroke();
        });
      } else if (biome.weatherEffect === 'snow') {
        ctx.fillStyle = '#ffffff';
        particles.forEach((p) => {
          p.y = (p.y + p.speed * 0.6) % height;
          p.x = (p.x + Math.sin(frame * 0.05 + p.y) * 0.4 + width) % width;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      } else if (biome.weatherEffect === 'embers') {
        ctx.fillStyle = '#f97316';
        particles.forEach((p) => {
          p.y = (p.y - p.speed * 0.8 + height) % height;
          p.x = (p.x + Math.cos(frame * 0.06 + p.y) * 0.5 + width) % width;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      } else if (biome.weatherEffect === 'stars') {
        particles.forEach((p, idx) => {
          const alpha = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.08 + idx));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(p.x, (p.y * 0.6) % (height - 15), 1.5, 1.5);
        });
      } else {
        // Floating clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const cloudX = (frame * 0.3) % (width + 30) - 20;
        ctx.fillRect(cloudX, 8, 18, 6);
        ctx.fillRect(cloudX + 4, 4, 10, 5);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [biome, width, height]);

  return (
    <div 
      className="relative flex items-center justify-center rounded-xl border border-[#4ec0ca]/30 bg-black/80 shadow-inner overflow-hidden shrink-0"
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="relative z-10 image-rendering-pixelated"
      />
      <div className="absolute top-1 right-1 z-20 text-sm filter drop-shadow">
        {biome.icon}
      </div>
    </div>
  );
};

// ==========================================
// 3. SPECIAL FEATURE DESCRIPTION ILLUSTRATION
// ==========================================
interface FeatureGraphicProps {
  id: string;
  type: 'avatar' | 'weather';
}

export const FeatureDescriptionGraphic: React.FC<FeatureGraphicProps> = ({ id, type }) => {
  if (type === 'avatar') {
    switch (id) {
      case 'pip':
        // Agile Pioneer: Golden arcade wings with trajectory arch
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/60 via-yellow-900/30 to-black/80 border border-yellow-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">ARCADE DYNAMICS</span>
              <span className="text-[10px] font-black text-white">BALANCED WING RECOVERY</span>
              <span className="text-[7px] text-white/60">Standard 2.6 gravity / -7.8 flap impulse</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <path d="M 10 50 Q 50 10 90 40" stroke="#F8D800" strokeWidth="2.5" strokeDasharray="3 3" />
              <circle cx="90" cy="40" r="3.5" fill="#F8D800" />
              <path d="M 30 35 L 42 22 L 54 35 Z" fill="#F85800" />
              <path d="M 50 28 L 62 18 L 74 30 Z" fill="#F8D800" />
              <circle cx="20" cy="45" r="2.5" fill="#ffffff" />
            </svg>
          </div>
        );

      case 'emerald':
        // Coin Magnet: Horseshoe magnet pulling gold coins
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-950/70 via-green-900/30 to-black/80 border border-emerald-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">55PX MAGNETIC FIELD</span>
              <span className="text-[10px] font-black text-white">COIN ATTRACTION PULL</span>
              <span className="text-[7px] text-white/60">Draws all nearby coins directly to bird</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Horseshoe magnet */}
              <path d="M 65 15 C 65 35 35 35 35 15" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" />
              <line x1="35" y1="12" x2="35" y2="18" stroke="#E2E8F0" strokeWidth="7" />
              <line x1="65" y1="12" x2="65" y2="18" stroke="#38BDF8" strokeWidth="7" />
              {/* Magnetic waves */}
              <path d="M 40 40 A 15 15 0 0 0 60 40" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M 33 46 A 23 23 0 0 0 67 46" stroke="#86EFAC" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Gold Coins being pulled */}
              <circle cx="20" cy="48" r="5" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
              <text x="18" y="51" fill="#713F12" fontSize="6" fontWeight="bold">¢</text>
              <circle cx="80" cy="50" r="5" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
              <text x="78" y="53" fill="#713F12" fontSize="6" fontWeight="bold">¢</text>
            </svg>
          </div>
        );

      case 'robin':
        // Crimson Surge: Upward rocket boost flame
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-red-950/70 via-rose-900/30 to-black/80 border border-red-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">+12% ELEVATION FLAP</span>
              <span className="text-[10px] font-black text-white">CRIMSON SURGE JUMP</span>
              <span className="text-[7px] text-white/60">Rapid vertical climb through narrow heights</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <path d="M 50 10 L 60 25 L 40 25 Z" fill="#EF4444" />
              <path d="M 50 25 L 58 37 L 42 37 Z" fill="#F97316" />
              <path d="M 50 37 L 56 47 L 44 47 Z" fill="#FBBF24" />
              <path d="M 47 48 L 50 58 L 53 48 Z" fill="#FEF08A" />
              {/* Thrust lines */}
              <line x1="30" y1="52" x2="30" y2="40" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="70" y1="52" x2="70" y2="40" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />
              <text x="72" y="28" fill="#EF4444" fontSize="8" fontWeight="black">+12%</text>
            </svg>
          </div>
        );

      case 'jay':
        // Glide Drift: Aerodynamic glider with soft clouds
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-sky-950/70 via-cyan-900/30 to-black/80 border border-sky-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">15% LOWER GRAVITY</span>
              <span className="text-[10px] font-black text-white">GLIDE DRIFT FLOAT</span>
              <span className="text-[7px] text-white/60">Extended airtime & smooth altitude pacing</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <path d="M 15 38 Q 40 20 65 38 Q 85 20 95 38" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 25 46 Q 50 32 75 46" stroke="#7DD3FC" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Glider feather */}
              <path d="M 45 15 C 60 18 68 28 65 38 C 55 35 48 25 45 15 Z" fill="#0EA5E9" />
              <line x1="45" y1="15" x2="65" y2="38" stroke="#FFFFFF" strokeWidth="1" />
              <text x="12" y="22" fill="#38BDF8" fontSize="8" fontWeight="bold">-15% G</text>
            </svg>
          </div>
        );

      case 'violet':
        // Wisdom Scout: Mystical owl eye + bonus coin every 5 pts
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-purple-950/70 via-violet-900/30 to-black/80 border border-purple-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">+1¢ EVERY 5 PTS</span>
              <span className="text-[10px] font-black text-white">WISDOM RADAR EYE</span>
              <span className="text-[7px] text-white/60">Passive bonus revenue & gap illumination</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <ellipse cx="45" cy="30" rx="18" ry="12" stroke="#A855F7" strokeWidth="2" />
              <circle cx="45" cy="30" r="7" fill="#8B5CF6" />
              <circle cx="45" cy="30" r="3" fill="#FDE047" />
              <circle cx="78" cy="24" r="7" fill="#FACC15" stroke="#A855F7" strokeWidth="1.5" />
              <text x="75" y="27" fill="#581C87" fontSize="8" fontWeight="black">+1¢</text>
              <line x1="60" y1="26" x2="69" y2="25" stroke="#C084FC" strokeWidth="1.5" strokeDasharray="2 1" />
            </svg>
          </div>
        );

      case 'shades':
        // Swag Cashback: Sunglasses + 3rd pipe clearance bonus
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/70 via-yellow-900/30 to-black/80 border border-yellow-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">EVERY 3RD PIPE</span>
              <span className="text-[10px] font-black text-white">SWAG CASHBACK +1¢</span>
              <span className="text-[7px] text-white/60">Instant bonus coins rewarded on obstacle pass</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* 8-bit shades */}
              <rect x="25" y="16" width="22" height="12" fill="#000000" rx="2" />
              <rect x="53" y="16" width="22" height="12" fill="#000000" rx="2" />
              <line x1="47" y1="20" x2="53" y2="20" stroke="#000000" strokeWidth="3" />
              <line x1="28" y1="20" x2="38" y2="20" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="56" y1="20" x2="66" y2="20" stroke="#FFFFFF" strokeWidth="2" />
              {/* Pipe & coin */}
              <rect x="25" y="40" width="8" height="14" fill="#73BF2E" stroke="#000" strokeWidth="1" />
              <rect x="45" y="36" width="8" height="18" fill="#73BF2E" stroke="#000" strokeWidth="1" />
              <rect x="65" y="42" width="8" height="12" fill="#73BF2E" stroke="#000" strokeWidth="1" />
              <circle cx="69" cy="34" r="5" fill="#FACC15" stroke="#000" strokeWidth="1" />
              <text x="67" y="36.5" fill="#000" fontSize="5" fontWeight="bold">¢</text>
            </svg>
          </div>
        );

      case 'blaze':
        // Molten Phoenix: Start-of-run Flame Shield
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-red-950/80 via-orange-950/40 to-black/80 border border-orange-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">STARTS RUN PROTECTED</span>
              <span className="text-[10px] font-black text-white">10-SECOND FLAME SHIELD</span>
              <span className="text-[7px] text-white/60">Spawns with instant active invulnerability barrier</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <circle cx="50" cy="30" r="18" stroke="#EA580C" strokeWidth="3" fill="#DC2626" fillOpacity="0.25" />
              <circle cx="50" cy="30" r="22" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 2" />
              <path d="M 45 35 Q 50 16 55 35 Q 50 28 45 35 Z" fill="#FDE047" />
              <path d="M 48 35 Q 50 22 52 35 Z" fill="#EF4444" />
              <text x="18" y="16" fill="#F97316" fontSize="7" fontWeight="black">10s SHIELD</text>
            </svg>
          </div>
        );

      case 'cyber':
        // Cyber: Overclock battery +3s to all powerups
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-cyan-950/70 via-blue-950/40 to-black/80 border border-cyan-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">+3S ADVANTAGE DURATION</span>
              <span className="text-[10px] font-black text-white">OVERCLOCK BATTERY CELL</span>
              <span className="text-[7px] text-white/60">Shield, Multiplier, Mini & Slow-Mo last 13 seconds</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Battery body */}
              <rect x="30" y="20" width="36" height="20" rx="3" stroke="#06B6D4" strokeWidth="2" fill="#083344" />
              <rect x="66" y="25" width="4" height="10" rx="1" fill="#06B6D4" />
              {/* Battery charge bars */}
              <rect x="34" y="24" width="7" height="12" rx="1" fill="#22D3EE" />
              <rect x="43" y="24" width="7" height="12" rx="1" fill="#22D3EE" />
              <rect x="52" y="24" width="7" height="12" rx="1" fill="#06B6D4" />
              <text x="36" y="52" fill="#06B6D4" fontSize="8" fontWeight="black">+3 SECONDS</text>
            </svg>
          </div>
        );

      case 'phantom':
        // Ghost Phase: +50% recovery i-frames
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-slate-950/80 via-zinc-900/40 to-black/80 border border-slate-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">+50% LONGER I-FRAMES</span>
              <span className="text-[10px] font-black text-white">PHANTOM GHOST PHASE</span>
              <span className="text-[7px] text-white/60">Extended recovery grace period after damage</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <path d="M 35 45 C 30 20 70 20 65 45 C 60 40 55 45 50 40 C 45 45 40 40 35 45 Z" fill="#E2E8F0" fillOpacity="0.4" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="44" cy="30" r="2.5" fill="#38BDF8" />
              <circle cx="56" cy="30" r="2.5" fill="#38BDF8" />
              {/* Phase ripples */}
              <path d="M 25 45 C 20 12 80 12 75 45" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3 3" />
              <text x="32" y="56" fill="#94A3B8" fontSize="7" fontWeight="bold">+50% PHASE</text>
            </svg>
          </div>
        );

      case 'king':
        // King: Midas Royal Treasury 2¢/3¢ coins
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/80 via-yellow-950/40 to-black/80 border border-amber-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">2¢ & 3¢ RICH COINS</span>
              <span className="text-[10px] font-black text-white">MIDAS ROYAL TREASURY</span>
              <span className="text-[7px] text-white/60">Replaces bronze coins with double/triple value gold</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Crown */}
              <path d="M 36 28 L 40 18 L 50 24 L 60 18 L 64 28 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
              <circle cx="40" cy="17" r="1.5" fill="#EF4444" />
              <circle cx="50" cy="23" r="1.5" fill="#38BDF8" />
              <circle cx="60" cy="17" r="1.5" fill="#EF4444" />
              {/* Gold Coins Stack */}
              <circle cx="42" cy="42" r="7" fill="#FACC15" stroke="#B45309" strokeWidth="1.5" />
              <text x="39" y="45" fill="#78350F" fontSize="8" fontWeight="black">2¢</text>
              <circle cx="58" cy="42" r="8" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
              <text x="54" y="45.5" fill="#78350F" fontSize="9" fontWeight="black">3¢</text>
            </svg>
          </div>
        );

      case 'ninja':
        // Ninja: -15% smaller hitbox
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-zinc-950 via-rose-950/30 to-black/80 border border-rose-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">-15% HITBOX SIZE</span>
              <span className="text-[10px] font-black text-white">SHADOW SLIPSTREAM</span>
              <span className="text-[7px] text-white/60">Ultra-compact collision model for threading tight gaps</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Shuriken */}
              <path d="M 50 14 L 54 26 L 66 30 L 54 34 L 50 46 L 46 34 L 34 30 L 46 26 Z" fill="#E11D48" />
              <circle cx="50" cy="30" r="3" fill="#18181B" />
              {/* Precision Target Box */}
              <rect x="36" y="16" width="28" height="28" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 2" />
              <text x="33" y="54" fill="#EF4444" fontSize="7" fontWeight="black">TIGHT FIT</text>
            </svg>
          </div>
        );

      case 'cosmo':
        // Astro: Zero-G parachute speed limit
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-indigo-950/80 via-blue-950/40 to-black/80 border border-indigo-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">MAX DIVE CAPPED AT 6.0</span>
              <span className="text-[10px] font-black text-white">ZERO-G PARACHUTE</span>
              <span className="text-[7px] text-white/60">Cushions rapid plunges and prevents high-speed crashes</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Parachute dome */}
              <path d="M 30 25 A 20 14 0 0 1 70 25 Z" fill="#6366F1" stroke="#818CF8" strokeWidth="1.5" />
              <line x1="30" y1="25" x2="50" y2="44" stroke="#C7D2FE" strokeWidth="1" />
              <line x1="43" y1="25" x2="50" y2="44" stroke="#C7D2FE" strokeWidth="1" />
              <line x1="57" y1="25" x2="50" y2="44" stroke="#C7D2FE" strokeWidth="1" />
              <line x1="70" y1="25" x2="50" y2="44" stroke="#C7D2FE" strokeWidth="1" />
              {/* Astro helmet */}
              <circle cx="50" cy="46" r="6" fill="#E0E7FF" stroke="#312E81" strokeWidth="1" />
              <rect x="47" y="44" width="6" height="4" rx="1" fill="#38BDF8" />
            </svg>
          </div>
        );

      case 'sakura':
        // Sakura: +14px wider clearances
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-pink-950/80 via-rose-950/40 to-black/80 border border-pink-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest">+14PX WIDER SAFETY CLEARANCE</span>
              <span className="text-[10px] font-black text-white">ZEN SAKURA PETALS</span>
              <span className="text-[7px] text-white/60">25% chance for pipe obstacles to spawn with wide gaps</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Expanding pipes */}
              <rect x="25" y="6" width="10" height="16" fill="#73BF2E" stroke="#000" strokeWidth="1" />
              <rect x="25" y="38" width="10" height="16" fill="#73BF2E" stroke="#000" strokeWidth="1" />
              <line x1="30" y1="22" x2="30" y2="38" stroke="#F472B6" strokeWidth="2" strokeDasharray="2 2" />
              {/* Sakura flower */}
              <circle cx="68" cy="30" r="5" fill="#FDE047" />
              <circle cx="68" cy="22" r="4.5" fill="#F472B6" />
              <circle cx="76" cy="27" r="4.5" fill="#F472B6" />
              <circle cx="73" cy="36" r="4.5" fill="#F472B6" />
              <circle cx="63" cy="36" r="4.5" fill="#F472B6" />
              <circle cx="60" cy="27" r="4.5" fill="#F472B6" />
            </svg>
          </div>
        );

      case 'frost':
        // Blizzard Falcon: Hazards move 25% slower
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-cyan-950/80 via-sky-950/40 to-black/80 border border-cyan-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-cyan-300 uppercase tracking-widest">-25% HAZARD VELOCITY</span>
              <span className="text-[10px] font-black text-white">GLACIAL CHILL FREEZE</span>
              <span className="text-[7px] text-white/60">Slows moving & oscillating obstacles on screen</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Snowflake */}
              <line x1="50" y1="12" x2="50" y2="48" stroke="#38BDF8" strokeWidth="2" />
              <line x1="32" y1="30" x2="68" y2="30" stroke="#38BDF8" strokeWidth="2" />
              <line x1="38" y1="18" x2="62" y2="42" stroke="#38BDF8" strokeWidth="2" />
              <line x1="38" y1="42" x2="62" y2="18" stroke="#38BDF8" strokeWidth="2" />
              <circle cx="50" cy="30" r="4" fill="#CFFAFE" />
              <text x="25" y="55" fill="#67E8F9" fontSize="7" fontWeight="black">-25% SPEED</text>
            </svg>
          </div>
        );

      case 'party':
        // Fiesta Pip: Confetti Jackpot at 10th pipe (+5¢)
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-yellow-950/80 via-rose-950/40 to-black/80 border border-rose-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">MILESTONE JACKPOT</span>
              <span className="text-[10px] font-black text-white">CONFETTI BONUS (+5¢)</span>
              <span className="text-[7px] text-white/60">Triggers burst & bonus coins on every 10th pipe</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Party popper */}
              <path d="M 28 48 L 46 36 L 40 30 Z" fill="#F43F5E" />
              {/* Confetti streamers */}
              <circle cx="54" cy="22" r="2" fill="#FBBF24" />
              <circle cx="68" cy="18" r="2.5" fill="#38BDF8" />
              <circle cx="62" cy="32" r="2" fill="#34D399" />
              <rect x="72" y="28" width="4" height="2" rx="1" fill="#F472B6" transform="rotate(25 72 28)" />
              {/* Big bonus coin */}
              <circle cx="76" cy="42" r="8" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
              <text x="71" y="45.5" fill="#78350F" fontSize="9" fontWeight="black">+5¢</text>
            </svg>
          </div>
        );

      case 'toxic':
        // Slime: Ground impact bounce
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-lime-950/80 via-green-950/40 to-black/80 border border-lime-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-lime-400 uppercase tracking-widest">GROUND TRAMPOLINE</span>
              <span className="text-[10px] font-black text-white">SLIME IMPACT BOUNCE</span>
              <span className="text-[7px] text-white/60">Cushions bottom terrain collision and bounces upward</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Slime puddle */}
              <ellipse cx="50" cy="46" rx="28" ry="6" fill="#84CC16" />
              <ellipse cx="50" cy="44" rx="22" ry="4" fill="#BEF264" />
              {/* Upward bounce arc */}
              <path d="M 35 44 Q 50 14 65 44" stroke="#84CC16" strokeWidth="2.5" strokeDasharray="3 2" />
              <polygon points="50,14 45,22 55,22" fill="#84CC16" />
              <text x="32" y="14" fill="#BEF264" fontSize="7" fontWeight="black">BOUNCE!</text>
            </svg>
          </div>
        );

      case 'angel':
        // Seraphim: Divine Second Chance Revival
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/70 via-yellow-900/30 to-black/80 border border-yellow-300/40 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-yellow-300 uppercase tracking-widest">ONCE PER FLIGHT</span>
              <span className="text-[10px] font-black text-white">DIVINE HOLY REVIVAL</span>
              <span className="text-[7px] text-white/60">Resurrects fallen bird with invulnerable halo shield</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Halo */}
              <ellipse cx="50" cy="18" rx="16" ry="5" stroke="#FDE047" strokeWidth="2.5" fill="none" />
              {/* Angel wings */}
              <path d="M 50 36 C 30 24 20 44 48 42 Z" fill="#FFFFFF" opacity="0.8" />
              <path d="M 50 36 C 70 24 80 44 52 42 Z" fill="#FFFFFF" opacity="0.8" />
              {/* Heart revival */}
              <path d="M 50 48 L 44 41 C 41 38 41 34 45 34 C 48 34 50 37 50 37 C 50 37 52 34 55 34 C 59 34 59 38 56 41 Z" fill="#EF4444" />
              <text x="31" y="57" fill="#FEF08A" fontSize="7" fontWeight="bold">REVIVES 1X</text>
            </svg>
          </div>
        );

      case 'goggles':
        // Aeronaut: Power-Up Radar Magnet
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/80 via-stone-900/40 to-black/80 border border-amber-600/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">ORB PULL RADAR</span>
              <span className="text-[10px] font-black text-white">AERONAUT POWER SCANNER</span>
              <span className="text-[7px] text-white/60">Pulls Shield, Slow-Mo, 2X & Mini orbs from afar</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Radar dish & pulses */}
              <path d="M 32 40 A 18 18 0 0 1 32 20" stroke="#D97706" strokeWidth="2" />
              <path d="M 40 46 A 28 28 0 0 1 40 14" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 48 52 A 38 38 0 0 1 48 8" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* Power-up orbs drawn in */}
              <circle cx="70" cy="18" r="4.5" fill="#38BDF8" />
              <circle cx="82" cy="30" r="4.5" fill="#FACC15" />
              <circle cx="72" cy="44" r="4.5" fill="#34D399" />
              <text x="68" y="32" fill="#C084FC" fontSize="6" fontWeight="bold">ORBS</text>
            </svg>
          </div>
        );

      case 'mecha':
        // Mecha: Titanium Laser Deflector Armor
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-slate-950 via-zinc-900/40 to-black/80 border border-sky-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">LASER IMMUNITY + 1 PT</span>
              <span className="text-[10px] font-black text-white">TITANIUM MECHA ARMOR</span>
              <span className="text-[7px] text-white/60">Deflects laser beams & starts flight with 1 score point</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Shield Plate */}
              <path d="M 52 14 L 66 22 L 66 38 L 52 48 L 38 38 L 38 22 Z" fill="#334155" stroke="#38BDF8" strokeWidth="2" />
              {/* Laser beam reflected */}
              <line x1="14" y1="28" x2="38" y2="28" stroke="#EF4444" strokeWidth="2.5" />
              <line x1="38" y1="28" x2="20" y2="12" stroke="#F87171" strokeWidth="2" strokeDasharray="3 2" />
              {/* Spark deflector */}
              <circle cx="38" cy="28" r="3" fill="#FDE047" />
              <text x="44" y="34" fill="#38BDF8" fontSize="8" fontWeight="black">+1</text>
            </svg>
          </div>
        );

      case 'prism':
        // Prism: Chroma Overdrive 2X advantage orbs
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-pink-950/80 via-purple-950/40 to-black/80 border border-pink-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest">2X ADVANTAGE ORB RATE</span>
              <span className="text-[10px] font-black text-white">CHROMA PRISM OVERDRIVE</span>
              <span className="text-[7px] text-white/60">Doubles frequency of all power-up orbs appearing</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Prism Triangle */}
              <polygon points="40,16 26,44 54,44" fill="#8B5CF6" fillOpacity="0.4" stroke="#C084FC" strokeWidth="2" />
              {/* Rainbow rays */}
              <line x1="50" y1="28" x2="80" y2="16" stroke="#EF4444" strokeWidth="2" />
              <line x1="52" y1="32" x2="82" y2="24" stroke="#F59E0B" strokeWidth="2" />
              <line x1="53" y1="36" x2="84" y2="32" stroke="#10B981" strokeWidth="2" />
              <line x1="52" y1="40" x2="82" y2="40" stroke="#06B6D4" strokeWidth="2" />
              <line x1="50" y1="44" x2="80" y2="48" stroke="#EC4899" strokeWidth="2" />
              <text x="28" y="55" fill="#F472B6" fontSize="7" fontWeight="black">2X ORBS</text>
            </svg>
          </div>
        );

      default:
        return null;
    }
  }

  // ==========================================
  // WEATHER FEATURES
  // ==========================================
  if (type === 'weather') {
    switch (id) {
      case 'day':
        // Meadow Day: Gentle Breezes
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-950/70 via-teal-950/40 to-black/80 border border-emerald-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">TEMPERATE ATMOSPHERE</span>
              <span className="text-[10px] font-black text-white">GENTLE BREEZES</span>
              <span className="text-[7px] text-white/60">Balanced winds & standard obstacle distribution</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              <circle cx="28" cy="22" r="9" fill="#FACC15" />
              <path d="M 20 46 C 40 38 60 48 80 44" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
              <path d="M 35 34 C 55 26 70 36 88 30" stroke="#6EE7B7" strokeWidth="1.5" strokeDasharray="3 2" />
              <path d="M 45 42 Q 52 38 56 42" stroke="#A7F3D0" strokeWidth="1.5" />
            </svg>
          </div>
        );

      case 'night':
        // Midnight Moon: Starlight Navigation
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-blue-950/80 via-indigo-950/40 to-black/80 border border-sky-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">STARLIT CLEARANCE</span>
              <span className="text-[10px] font-black text-white">STARLIGHT NAVIGATION</span>
              <span className="text-[7px] text-white/60">Illuminated pipe gaps + 10% coin attraction</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Crescent moon */}
              <path d="M 75 14 A 12 12 0 1 0 85 36 A 15 15 0 0 1 75 14 Z" fill="#FDE047" />
              {/* Glowing Gap Beacon */}
              <line x1="34" y1="12" x2="34" y2="48" stroke="#38BDF8" strokeWidth="2" strokeDasharray="2 3" />
              <circle cx="34" cy="30" r="4" fill="#38BDF8" />
              {/* Twinkles */}
              <circle cx="50" cy="20" r="1.5" fill="#FFFFFF" />
              <circle cx="62" cy="38" r="1.5" fill="#FFFFFF" />
              <circle cx="20" cy="35" r="1" fill="#FFFFFF" />
              <text x="18" y="55" fill="#7DD3FC" fontSize="7" fontWeight="bold">+10% MAGNET</text>
            </svg>
          </div>
        );

      case 'sunset':
        // Retro Sunset: Golden Hour Surplus (+1¢ every coin)
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-orange-950/80 via-amber-950/40 to-black/80 border border-amber-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">+1¢ SURPLUS PER COIN</span>
              <span className="text-[10px] font-black text-white">GOLDEN HOUR WEALTH</span>
              <span className="text-[7px] text-white/60">Every coin collected awards +1 extra bonus coin</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Sun dipping */}
              <circle cx="50" cy="38" r="14" fill="#FB923C" />
              <line x1="20" y1="38" x2="80" y2="38" stroke="#7C2D12" strokeWidth="2" />
              {/* Sun rays */}
              <line x1="50" y1="18" x2="50" y2="12" stroke="#F59E0B" strokeWidth="2" />
              <line x1="36" y1="24" x2="32" y2="20" stroke="#F59E0B" strokeWidth="2" />
              <line x1="64" y1="24" x2="68" y2="20" stroke="#F59E0B" strokeWidth="2" />
              {/* Coin surplus */}
              <circle cx="76" cy="42" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
              <text x="72" y="45" fill="#78350F" fontSize="8" fontWeight="black">+1¢</text>
            </svg>
          </div>
        );

      case 'cyberpunk':
        // Neon Cyber City: Overclocked Matrix (+1.5s powerups)
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-purple-950/80 via-fuchsia-950/40 to-black/80 border border-fuchsia-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-fuchsia-400 uppercase tracking-widest">+1.5S POWER-UP BOOST</span>
              <span className="text-[10px] font-black text-white">OVERCLOCK MATRIX</span>
              <span className="text-[7px] text-white/60">Amplifies all advantage orbs with extended duration</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Cyber grid lines */}
              <line x1="20" y1="46" x2="80" y2="46" stroke="#D946EF" strokeWidth="1" />
              <line x1="25" y1="46" x2="35" y2="20" stroke="#D946EF" strokeWidth="1" />
              <line x1="50" y1="46" x2="50" y2="20" stroke="#D946EF" strokeWidth="1" />
              <line x1="75" y1="46" x2="65" y2="20" stroke="#D946EF" strokeWidth="1" />
              {/* Rain drops */}
              <line x1="30" y1="12" x2="28" y2="22" stroke="#06B6D4" strokeWidth="1.5" />
              <line x1="60" y1="10" x2="58" y2="20" stroke="#06B6D4" strokeWidth="1.5" />
              <text x="32" y="56" fill="#F472B6" fontSize="7" fontWeight="black">+1.5S ADVANTAGE</text>
            </svg>
          </div>
        );

      case 'volcano':
        // Molten Cavern: Magma Surge Forcefield
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-red-950/90 via-orange-950/40 to-black/80 border border-red-500/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">AMBIENT HEAT SHIELD</span>
              <span className="text-[10px] font-black text-white">MAGMA SURGE FORCEFIELD</span>
              <span className="text-[7px] text-white/60">Thermal updrafts absorb 1 hazard collision during run</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Lava crater */}
              <path d="M 20 48 L 40 32 L 60 32 L 80 48 Z" fill="#7F1D1D" />
              <ellipse cx="50" cy="32" rx="10" ry="3" fill="#EF4444" />
              {/* Forcefield dome */}
              <path d="M 32 36 A 20 18 0 0 1 68 36" stroke="#F97316" strokeWidth="2.5" fill="#DC2626" fillOpacity="0.2" />
              <circle cx="50" cy="20" r="2" fill="#FBBF24" />
              <text x="28" y="56" fill="#F87171" fontSize="7" fontWeight="bold">ABSORBS 1 HIT</text>
            </svg>
          </div>
        );

      case 'winter':
        // Winter Wonderland: Sub-Zero Chill -8% speed
        return (
          <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-r from-cyan-950/80 via-blue-950/40 to-black/80 border border-cyan-400/30 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-cyan-300 uppercase tracking-widest">-8% SCROLL SPEED</span>
              <span className="text-[10px] font-black text-white">SUB-ZERO CHILL</span>
              <span className="text-[7px] text-white/60">Icy air slows obstacles for superior dodging reaction</span>
            </div>
            <svg className="w-20 h-14" viewBox="0 0 100 60" fill="none">
              {/* Thermometer / snowflake */}
              <circle cx="35" cy="40" r="6" fill="#38BDF8" />
              <rect x="33" y="16" width="4" height="20" rx="2" fill="#38BDF8" />
              <line x1="58" y1="20" x2="58" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
              <line x1="48" y1="30" x2="68" y2="30" stroke="#FFFFFF" strokeWidth="1.5" />
              <line x1="51" y1="23" x2="65" y2="37" stroke="#FFFFFF" strokeWidth="1.5" />
              <line x1="51" y1="37" x2="65" y2="23" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="25" y="55" fill="#CFFAFE" fontSize="8" fontWeight="black">-8% SPEED</text>
            </svg>
          </div>
        );

      default:
        return null;
    }
  }

  return null;
};

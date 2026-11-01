import { BiomeType, BirdSkin, Obstacle, CoinItem, PowerUpItem, ActivePowerUps, SpecialFeature } from '../types';

export const SKINS: BirdSkin[] = [
  {
    id: 'pip',
    name: 'Classic Pip',
    description: 'The iconic yellow feathered flyer from the arcade original.',
    cost: 0,
    unlocked: true,
    rarity: 'common',
    accessory: 'none',
    specialFeature: {
      name: 'Agile Pioneer',
      tag: 'BALANCED',
      description: 'Authentic arcade flight dynamics with perfect baseline wing recovery.',
      badgeColor: '#F8D800',
    },
    colorScheme: {
      body: '#F8D800',
      belly: '#FFF8B0',
      wing: '#FFFFFF',
      wingFlap: '#E2E8F0',
      beak: '#F85800',
      eye: '#FFFFFF',
      outline: '#000000',
      trailColor: '#F8D800',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Sprite',
    description: 'Vibrant forest green flyer blessed by nature spirits.',
    cost: 30,
    unlocked: false,
    rarity: 'common',
    accessory: 'none',
    specialFeature: {
      name: 'Coin Magnet',
      tag: 'MAGNETIC',
      description: 'Attracts and pulls nearby gold coins from up to 55px away directly to your bird!',
      badgeColor: '#22C55E',
    },
    colorScheme: {
      body: '#22C55E',
      belly: '#86EFAC',
      wing: '#FDE047',
      wingFlap: '#EAB308',
      beak: '#F97316',
      eye: '#FFFFFF',
      outline: '#14532D',
      trailColor: '#22C55E',
    },
    specialEffect: 'sparkles',
  },
  {
    id: 'robin',
    name: 'Ruby Robin',
    description: 'Bold scarlet adventurer with warm autumn feathers.',
    cost: 60,
    unlocked: false,
    rarity: 'common',
    accessory: 'none',
    specialFeature: {
      name: 'Crimson Surge',
      tag: 'AEROBATIC',
      description: '+12% higher flap jump force for rapid vertical climbs through steep gaps.',
      badgeColor: '#EF4444',
    },
    colorScheme: {
      body: '#EF4444',
      belly: '#FECACA',
      wing: '#B91C1C',
      wingFlap: '#991B1B',
      beak: '#F59E0B',
      eye: '#FFFFFF',
      outline: '#450A0A',
      trailColor: '#EF4444',
    },
  },
  {
    id: 'jay',
    name: 'Sky Bluejay',
    description: 'Azure feathered glider that blends into the open sky.',
    cost: 90,
    unlocked: false,
    rarity: 'common',
    accessory: 'none',
    specialFeature: {
      name: 'Glide Drift',
      tag: 'FLOATY',
      description: '15% lower gravity for smooth, floaty gliding and relaxed altitude control.',
      badgeColor: '#0EA5E9',
    },
    colorScheme: {
      body: '#0EA5E9',
      belly: '#BAE6FD',
      wing: '#FFFFFF',
      wingFlap: '#E2E8F0',
      beak: '#0284C7',
      eye: '#FFFFFF',
      outline: '#082F49',
      trailColor: '#38BDF8',
    },
  },
  {
    id: 'violet',
    name: 'Amethyst Owl',
    description: 'Mystic nocturnal flyer draped in deep royal purple.',
    cost: 120,
    unlocked: false,
    rarity: 'rare',
    accessory: 'none',
    specialFeature: {
      name: 'Wisdom Scout',
      tag: 'BONUS ¢',
      description: 'Awards +1 bonus coin every 5 points scored, plus illuminates narrow gaps.',
      badgeColor: '#8B5CF6',
    },
    colorScheme: {
      body: '#8B5CF6',
      belly: '#DDD6FE',
      wing: '#6D28D9',
      wingFlap: '#5B21B6',
      beak: '#F43F5E',
      eye: '#FDE047',
      outline: '#2E1065',
      trailColor: '#A78BFA',
    },
    specialEffect: 'glow',
  },
  {
    id: 'shades',
    name: 'Cool Swag Pip',
    description: 'Retro 8-bit shades that make every pipe clearance stylish.',
    cost: 150,
    unlocked: false,
    rarity: 'rare',
    accessory: 'sunglasses',
    specialFeature: {
      name: 'Swag Cashback',
      tag: 'LOOTER',
      description: 'Generates +1 extra coin on every 3rd pipe obstacle successfully cleared.',
      badgeColor: '#FACC15',
    },
    colorScheme: {
      body: '#FACC15',
      belly: '#FEF08A',
      wing: '#FFFFFF',
      wingFlap: '#E2E8F0',
      beak: '#EA580C',
      eye: '#FFFFFF',
      outline: '#000000',
      trailColor: '#FACC15',
    },
  },
  {
    id: 'blaze',
    name: 'Molten Phoenix',
    description: 'Born from volcanic magma, leaves burning ember trails.',
    cost: 180,
    unlocked: false,
    rarity: 'rare',
    accessory: 'horns',
    specialFeature: {
      name: 'Phoenix Flame Shield',
      tag: 'SAFETY',
      description: 'Spawns with an active 10-second Flame Shield right at the start of every run!',
      badgeColor: '#DC2626',
    },
    colorScheme: {
      body: '#DC2626',
      belly: '#F97316',
      wing: '#7F1D1D',
      wingFlap: '#450A0A',
      beak: '#FBBF24',
      eye: '#FEF08A',
      outline: '#290505',
      trailColor: '#EF4444',
    },
    specialEffect: 'fire',
  },
  {
    id: 'cyber',
    name: 'Cyber Synthwave',
    description: 'High-tech cyber bird equipped with glowing laser visor.',
    cost: 210,
    unlocked: false,
    rarity: 'epic',
    accessory: 'visor',
    specialFeature: {
      name: 'Overclock Battery',
      tag: 'EXTENDED',
      description: 'All advantage power-ups last +3 seconds longer (13-second advantage duration)!',
      badgeColor: '#06B6D4',
    },
    colorScheme: {
      body: '#06B6D4',
      belly: '#A5F3FC',
      wing: '#EC4899',
      wingFlap: '#BE185D',
      beak: '#F43F5E',
      eye: '#22D3EE',
      outline: '#083344',
      trailColor: '#06B6D4',
    },
    specialEffect: 'glow',
  },
  {
    id: 'phantom',
    name: 'Ghost Specter',
    description: 'Translucent ethereal phantom drifting between dimensions.',
    cost: 240,
    unlocked: false,
    rarity: 'epic',
    accessory: 'none',
    specialFeature: {
      name: 'Ghost Phase',
      tag: 'I-FRAMES',
      description: '+50% longer invulnerability recovery frames after shield break or ground rebounds.',
      badgeColor: '#94A3B8',
    },
    colorScheme: {
      body: '#E2E8F0',
      belly: '#F8FAFC',
      wing: '#94A3B8',
      wingFlap: '#64748B',
      beak: '#38BDF8',
      eye: '#0284C7',
      outline: '#1E293B',
      trailColor: '#93C5FD',
    },
    specialEffect: 'stars',
  },
  {
    id: 'king',
    name: 'Royal King Pip',
    description: 'Coronated monarch adorned with a sparkling golden crown.',
    cost: 270,
    unlocked: false,
    rarity: 'epic',
    accessory: 'crown',
    specialFeature: {
      name: 'Midas Royal Treasury',
      tag: 'RICHES',
      description: 'Turns standard 1¢ bronze coins into opulent 2¢ or 3¢ shimmering gold coins!',
      badgeColor: '#F59E0B',
    },
    colorScheme: {
      body: '#F59E0B',
      belly: '#FEF3C7',
      wing: '#D97706',
      wingFlap: '#B45309',
      beak: '#DC2626',
      eye: '#FFFFFF',
      outline: '#451A03',
      trailColor: '#FDE68A',
    },
    specialEffect: 'sparkles',
  },
  {
    id: 'ninja',
    name: 'Shinobi Shadow',
    description: 'Silent midnight assassin wearing a crimson ninja bandana.',
    cost: 300,
    unlocked: false,
    rarity: 'epic',
    accessory: 'ninja',
    specialFeature: {
      name: 'Shadow Slipstream',
      tag: 'TINY HITBOX',
      description: 'Ultra-compact aerodynamic hitbox (-15% smaller) for effortlessly threading tight crevices.',
      badgeColor: '#E11D48',
    },
    colorScheme: {
      body: '#18181B',
      belly: '#3F3F46',
      wing: '#27272A',
      wingFlap: '#09090B',
      beak: '#DC2626',
      eye: '#EF4444',
      outline: '#000000',
      trailColor: '#EF4444',
    },
  },
  {
    id: 'cosmo',
    name: 'Astro Cosmo',
    description: 'Deep space explorer in pressurized astro bubble helmet.',
    cost: 330,
    unlocked: false,
    rarity: 'epic',
    accessory: 'helmet',
    specialFeature: {
      name: 'Zero-G Parachute',
      tag: 'SAFE FALL',
      description: 'Terminal dive speed is capped at 6.0, preventing fatal high-speed downward plunges.',
      badgeColor: '#6366F1',
    },
    colorScheme: {
      body: '#6366F1',
      belly: '#C7D2FE',
      wing: '#4338CA',
      wingFlap: '#312E81',
      beak: '#34D399',
      eye: '#F472B6',
      outline: '#1E1B4B',
      trailColor: '#818CF8',
    },
    specialEffect: 'stars',
  },
  {
    id: 'sakura',
    name: 'Sakura Blossom',
    description: 'Delicate pastel spring bird crowned with sakura petals.',
    cost: 360,
    unlocked: false,
    rarity: 'epic',
    accessory: 'flower',
    specialFeature: {
      name: 'Zen Petals',
      tag: 'WIDER GAPS',
      description: '25% chance for obstacles to spawn with +14px wider safety clearances.',
      badgeColor: '#F472B6',
    },
    colorScheme: {
      body: '#F472B6',
      belly: '#FCE7F3',
      wing: '#FB7185',
      wingFlap: '#E11D48',
      beak: '#F59E0B',
      eye: '#FFFFFF',
      outline: '#831843',
      trailColor: '#FBCFE8',
    },
    specialEffect: 'sparkles',
  },
  {
    id: 'frost',
    name: 'Blizzard Falcon',
    description: 'Glacial frostbird cloaked in falling crystalline snow.',
    cost: 390,
    unlocked: false,
    rarity: 'legendary',
    accessory: 'none',
    specialFeature: {
      name: 'Glacial Chill',
      tag: 'SLOW HAZARDS',
      description: 'Moving obstacles and oscillating hazards move 25% slower on screen.',
      badgeColor: '#38BDF8',
    },
    colorScheme: {
      body: '#67E8F9',
      belly: '#E0F2FE',
      wing: '#38BDF8',
      wingFlap: '#0284C7',
      beak: '#0369A1',
      eye: '#FFFFFF',
      outline: '#0C4A6E',
      trailColor: '#E0F2FE',
    },
    specialEffect: 'snow',
  },
  {
    id: 'party',
    name: 'Fiesta Pip',
    description: 'Always ready to celebrate with confetti and a party hat!',
    cost: 420,
    unlocked: false,
    rarity: 'legendary',
    accessory: 'party_hat',
    specialFeature: {
      name: 'Confetti Jackpot',
      tag: 'JACKPOT',
      description: 'Reaching every 10th milestone pipe triggers confetti and instantly awards +5 bonus coins!',
      badgeColor: '#F43F5E',
    },
    colorScheme: {
      body: '#FACC15',
      belly: '#FEF08A',
      wing: '#FB923C',
      wingFlap: '#EA580C',
      beak: '#DC2626',
      eye: '#FFFFFF',
      outline: '#000000',
      trailColor: '#F43F5E',
    },
    specialEffect: 'sparkles',
  },
  {
    id: 'toxic',
    name: 'Radioactive Slime',
    description: 'Bioluminescent toxic flyer surging with atomic glow.',
    cost: 450,
    unlocked: false,
    rarity: 'legendary',
    accessory: 'none',
    specialFeature: {
      name: 'Slime Bounce',
      tag: 'BOUNCE',
      description: 'Elastic slime body cushions ground impacts and bounces you upward on first contact!',
      badgeColor: '#84CC16',
    },
    colorScheme: {
      body: '#84CC16',
      belly: '#D9F99D',
      wing: '#4D7C0F',
      wingFlap: '#365314',
      beak: '#EAB308',
      eye: '#FACC15',
      outline: '#1A2E05',
      trailColor: '#84CC16',
    },
    specialEffect: 'toxic',
  },
  {
    id: 'angel',
    name: 'Seraphim Pip',
    description: 'Heavenly archangel with an enlightened floating gold halo.',
    cost: 480,
    unlocked: false,
    rarity: 'legendary',
    accessory: 'halo',
    specialFeature: {
      name: 'Divine Second Chance',
      tag: 'REVIVAL',
      description: 'Miraculously revives your bird once per run with a holy shield when fatal collision occurs!',
      badgeColor: '#FEF08A',
    },
    colorScheme: {
      body: '#FFFFFF',
      belly: '#F8FAFC',
      wing: '#E2E8F0',
      wingFlap: '#CBD5E1',
      beak: '#F59E0B',
      eye: '#0284C7',
      outline: '#334155',
      trailColor: '#FEF08A',
    },
    specialEffect: 'glow',
  },
  {
    id: 'goggles',
    name: 'Steampunk Aviator',
    description: 'Brass aeronaut sporting vintage leather flying goggles.',
    cost: 510,
    unlocked: false,
    rarity: 'legendary',
    accessory: 'goggles',
    specialFeature: {
      name: 'Aeronaut Radar',
      tag: 'PERK MAGNET',
      description: 'Draws and pulls all advantage power-up orbs (Shield, Slow-Mo, 2X, Mini) from afar.',
      badgeColor: '#D97706',
    },
    colorScheme: {
      body: '#B45309',
      belly: '#FDE68A',
      wing: '#78350F',
      wingFlap: '#451A03',
      beak: '#D97706',
      eye: '#38BDF8',
      outline: '#290F02',
      trailColor: '#D97706',
    },
  },
  {
    id: 'mecha',
    name: 'Mecha Iron-Wing',
    description: 'Armored titanium combat automaton with targeting HUD.',
    cost: 540,
    unlocked: false,
    rarity: 'mythic',
    accessory: 'visor',
    specialFeature: {
      name: 'Titanium Armor',
      tag: 'DEFLECTOR',
      description: 'Immune to laser hazard damage, and starts every run with +1 free score point!',
      badgeColor: '#38BDF8',
    },
    colorScheme: {
      body: '#475569',
      belly: '#94A3B8',
      wing: '#334155',
      wingFlap: '#1E293B',
      beak: '#EF4444',
      eye: '#EF4444',
      outline: '#0F172A',
      trailColor: '#EF4444',
    },
    specialEffect: 'glitch',
  },
  {
    id: 'prism',
    name: 'Rainbow Chroma',
    description: 'Mythic spectrum flyer radiating pure prismatic aura.',
    cost: 570,
    unlocked: false,
    rarity: 'mythic',
    accessory: 'crown',
    specialFeature: {
      name: 'Chroma Overdrive',
      tag: '2X PERKS',
      description: 'Doubles the frequency of advantage power-up orbs appearing along the flight path!',
      badgeColor: '#EC4899',
    },
    colorScheme: {
      body: '#EC4899',
      belly: '#F472B6',
      wing: '#8B5CF6',
      wingFlap: '#6366F1',
      beak: '#FBBF24',
      eye: '#38BDF8',
      outline: '#312E81',
      trailColor: '#F43F5E',
    },
    specialEffect: 'rainbow',
  },
];

export interface BiomeConfig {
  name: string;
  skyTop: string;
  skyBottom: string;
  groundTop: string;
  groundBody: string;
  groundStripe: string;
  mountainColor: string;
  cloudColor: string;
  pipeMain: string;
  pipeHighlight: string;
  pipeShadow: string;
  pipeRim: string;
  pipeOutline: string;
  weatherType: 'none' | 'rain' | 'snow' | 'embers' | 'stars';
}

export interface BiomeItemData {
  id: BiomeType;
  name: string;
  description: string;
  cost: number;
  icon: string;
  weatherName: string;
  weatherEffect: 'none' | 'rain' | 'snow' | 'embers' | 'stars';
  specialFeature: SpecialFeature;
}

export const BIOME_ITEMS: BiomeItemData[] = [
  {
    id: 'day',
    name: 'Meadow Day',
    description: 'Classic clear skies over gentle green rolling hills.',
    cost: 0,
    icon: '☀️',
    weatherName: 'Clear Sky',
    weatherEffect: 'none',
    specialFeature: {
      name: 'Gentle Breezes',
      tag: 'BALANCED',
      description: 'Temperate winds and balanced baseline obstacle distribution.',
      badgeColor: '#73bf2e',
    },
  },
  {
    id: 'night',
    name: 'Midnight Moon',
    description: 'Starlit nocturnal skyline filled with twinkling constellations.',
    cost: 20,
    icon: '🌙',
    weatherName: 'Star Shower',
    weatherEffect: 'stars',
    specialFeature: {
      name: 'Starlight Navigation',
      tag: 'GLOW GAPS',
      description: 'Star showers illuminate pipe gaps with soft sparkles, and coins glow with +10% magnetic pull.',
      badgeColor: '#38bdf8',
    },
  },
  {
    id: 'sunset',
    name: 'Retro Sunset',
    description: 'Warm glowing amber horizon bathed in vintage twilight hues.',
    cost: 40,
    icon: '🌅',
    weatherName: 'Golden Twilight',
    weatherEffect: 'none',
    specialFeature: {
      name: 'Golden Hour Surplus',
      tag: '+1¢ EVERY COIN',
      description: 'Every single coin collected during Golden Hour yields +1 additional bonus coin (+1¢)!',
      badgeColor: '#f59e0b',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyber City',
    description: 'Futuristic synthwave metropolis drenched in neon rain showers.',
    cost: 60,
    icon: '🌆',
    weatherName: 'Neon Downpour',
    weatherEffect: 'rain',
    specialFeature: {
      name: 'Neon Overdrive',
      tag: 'SLOWER DECAY',
      description: 'All advantage sliding gauge bars drain 15% slower, granting extended advantage uptime!',
      badgeColor: '#ec4899',
    },
  },
  {
    id: 'volcano',
    name: 'Molten Cavern',
    description: 'Subterranean inferno realm raining fiery volcanic embers.',
    cost: 80,
    icon: '🌋',
    weatherName: 'Ash & Embers',
    weatherEffect: 'embers',
    specialFeature: {
      name: 'Thermal Updraft',
      tag: 'GROUND CUSHION',
      description: 'Rising volcanic heat currents gently push your bird upward if descending dangerously low.',
      badgeColor: '#f25022',
    },
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    description: 'Freezing sub-zero glacial expanse under gentle falling snow.',
    cost: 100,
    icon: '❄️',
    weatherName: 'Blizzard Snowfall',
    weatherEffect: 'snow',
    specialFeature: {
      name: 'Sub-Zero Chill',
      tag: '-8% SPEED',
      description: 'Icy air cools world scrolling speed by 8%, giving you superior reaction and dodging time!',
      badgeColor: '#4ec0ca',
    },
  },
];

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  day: {
    name: 'Meadow Day',
    skyTop: '#4ec0ca',
    skyBottom: '#4ec0ca',
    groundTop: '#73bf2e',
    groundBody: '#ded895',
    groundStripe: '#c7c17b',
    mountainColor: '#3ea8b1',
    cloudColor: '#FFFFFF',
    pipeMain: '#73bf2e',
    pipeHighlight: '#8ed945',
    pipeShadow: '#53971c',
    pipeRim: '#3d7710',
    pipeOutline: '#000000',
    weatherType: 'none',
  },
  night: {
    name: 'Midnight Moon',
    skyTop: '#090D16',
    skyBottom: '#1E293B',
    groundTop: '#10B981',
    groundBody: '#334155',
    groundStripe: '#1E293B',
    mountainColor: '#0F172A',
    cloudColor: '#475569',
    pipeMain: '#10B981',
    pipeHighlight: '#6EE7B7',
    pipeShadow: '#047857',
    pipeRim: '#064E3B',
    pipeOutline: '#022C22',
    weatherType: 'stars',
  },
  sunset: {
    name: 'Retro Sunset',
    skyTop: '#7C2D12',
    skyBottom: '#FB923C',
    groundTop: '#F59E0B',
    groundBody: '#78350F',
    groundStripe: '#451A03',
    mountainColor: '#9A3412',
    cloudColor: '#FED7AA',
    pipeMain: '#EA580C',
    pipeHighlight: '#FDBA74',
    pipeShadow: '#C2410C',
    pipeRim: '#9A3412',
    pipeOutline: '#431407',
    weatherType: 'none',
  },
  cyberpunk: {
    name: 'Neon Cyber City',
    skyTop: '#0F051D',
    skyBottom: '#2E1065',
    groundTop: '#06B6D4',
    groundBody: '#1E1B4B',
    groundStripe: '#4C1D95',
    mountainColor: '#1E1B4B',
    cloudColor: '#6B21A8',
    pipeMain: '#D946EF',
    pipeHighlight: '#F472B6',
    pipeShadow: '#A21CAF',
    pipeRim: '#701A75',
    pipeOutline: '#3B0764',
    weatherType: 'rain',
  },
  volcano: {
    name: 'Molten Cavern',
    skyTop: '#18181B',
    skyBottom: '#450A0A',
    groundTop: '#EF4444',
    groundBody: '#27272A',
    groundStripe: '#18181B',
    mountainColor: '#3F3F46',
    cloudColor: '#71717A',
    pipeMain: '#DC2626',
    pipeHighlight: '#FCA5A5',
    pipeShadow: '#991B1B',
    pipeRim: '#7F1D1D',
    pipeOutline: '#450A0A',
    weatherType: 'embers',
  },
  winter: {
    name: 'Winter Wonderland',
    skyTop: '#67E8F9',
    skyBottom: '#CFFAFE',
    groundTop: '#FFFFFF',
    groundBody: '#0284C7',
    groundStripe: '#0369A1',
    mountainColor: '#93C5FD',
    cloudColor: '#F8FAFC',
    pipeMain: '#38BDF8',
    pipeHighlight: '#E0F2FE',
    pipeShadow: '#0284C7',
    pipeRim: '#0369A1',
    pipeOutline: '#0C4A6E',
    weatherType: 'snow',
  },
};

/**
 * Pixel Art Drawing Helpers
 */

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  pixelSize = 1
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

/**
 * Draw Animated Pixel Bird Sprite with 8-bit aesthetic
 */
export function drawPixelBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  skin: BirdSkin,
  rotation: number,
  flapFrame: number, // 0 = up, 1 = mid, 2 = down
  scale = 1,
  activePowerUps?: ActivePowerUps
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  const finalScale = activePowerUps?.shrinkTimer && activePowerUps.shrinkTimer > 0 ? scale * 0.65 : scale;
  ctx.scale(finalScale, finalScale);

  // Pixel Grid Dimensions (17 x 12 pixels at pixel size 2.5)
  const ps = 2.5;
  const offsetX = -21;
  const offsetY = -15;

  const { body, belly, wing, wingFlap, beak, eye, outline } = skin.colorScheme;
  const cheekColor = skin.id === 'pip' ? '#F87830' : belly;
  const darkBeak = skin.id === 'pip' ? '#D83800' : beak;

  // Power-up Glow Aura
  if (activePowerUps?.shield) {
    const isEnding = activePowerUps.shieldTimer !== undefined && activePowerUps.shieldTimer > 0 && activePowerUps.shieldTimer < 1000;
    const shouldDraw = !isEnding || Math.floor(Date.now() / 100) % 2 === 0;
    if (shouldDraw) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284C7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  if (activePowerUps?.multiplierTimer && activePowerUps.multiplierTimer > 0) {
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hyper Laser PowerUp Aura
  if (activePowerUps?.laserTimer && activePowerUps.laserTimer > 0) {
    ctx.strokeStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Real Flappy Bird Pixel Matrix (17x12)
  // 0: transparent, 1: outline, 2: body yellow, 3: belly cream, 4: eye white, 5: pupil, 6: eye specular, 7: top beak, 8: bottom beak, 9: blush cheek
  const baseSprite = [
    [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,2,2,2,2,1,4,1,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,1,4,4,4,1,0,0,0],
    [0,0,1,2,2,2,2,2,2,1,4,5,6,1,0,0,0],
    [0,1,2,2,2,2,2,2,2,2,1,4,4,1,1,1,1],
    [0,1,2,2,2,2,2,2,2,2,2,1,1,7,7,7,1],
    [1,2,2,2,2,2,2,9,9,2,2,1,7,7,7,7,1],
    [1,2,2,2,2,3,9,9,3,3,1,1,1,1,1,1,1],
    [1,2,2,2,3,3,3,3,3,3,1,8,8,8,8,1,0],
    [0,1,2,3,3,3,3,3,3,1,1,8,8,8,1,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,1,1,1,0,0,0],
  ];

  // Draw Base Body
  for (let r = 0; r < baseSprite.length; r++) {
    for (let c = 0; c < baseSprite[r].length; c++) {
      const p = baseSprite[r][c];
      if (p === 0) continue;

      let color = outline;
      if (p === 1) color = outline;
      else if (p === 2) color = body;
      else if (p === 3) color = belly;
      else if (p === 4) color = eye;
      else if (p === 5) color = '#000000';
      else if (p === 6) color = '#FFFFFF';
      else if (p === 7) color = beak;
      else if (p === 8) color = darkBeak;
      else if (p === 9) color = cheekColor;

      ctx.fillStyle = color;
      ctx.fillRect(offsetX + c * ps, offsetY + r * ps, ps, ps);
    }
  }

  // Draw Dynamic Wing according to Flap Frame (0 = Up, 1 = Mid, 2 = Down)
  const wingColor = flapFrame === 0 ? wingFlap : wing;
  const wingPositions: Record<number, [number, number][]> = {
    0: [ // Wing UP
      [2, 3], [3, 2], [4, 1], [5, 1], [6, 2],
      [2, 4], [3, 3], [4, 2], [5, 2], [6, 3],
      [1, 5], [2, 5], [3, 4], [4, 3], [5, 3]
    ],
    1: [ // Wing MID
      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
      [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
      [2, 6], [3, 6], [4, 6]
    ],
    2: [ // Wing DOWN
      [1, 5], [2, 6], [3, 7], [4, 8],
      [2, 5], [3, 6], [4, 7], [5, 8],
      [3, 5], [4, 6], [5, 7]
    ],
  };

  const wingPixels = wingPositions[flapFrame] || wingPositions[1];

  // Wing outline and fill
  ctx.fillStyle = outline;
  wingPixels.forEach(([c, r]) => {
    ctx.fillRect(offsetX + (c - 0.4) * ps, offsetY + (r - 0.4) * ps, ps * 1.4, ps * 1.4);
  });

  ctx.fillStyle = wingColor;
  wingPixels.forEach(([c, r]) => {
    ctx.fillRect(offsetX + c * ps, offsetY + r * ps, ps, ps);
  });

  // Draw Accessories on top of bird
  if (skin.accessory === 'crown') {
    // Golden 3-pointed Crown
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(offsetX + 6 * ps, offsetY - 3 * ps, 7 * ps, ps);
    ctx.fillRect(offsetX + 6 * ps, offsetY - 4 * ps, ps, ps);
    ctx.fillRect(offsetX + 9 * ps, offsetY - 5 * ps, ps, 2 * ps);
    ctx.fillRect(offsetX + 12 * ps, offsetY - 4 * ps, ps, ps);
    // Jewels
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(offsetX + 9 * ps, offsetY - 3 * ps, ps, ps);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(offsetX + 7 * ps, offsetY - 3 * ps, ps, ps);
    ctx.fillRect(offsetX + 11 * ps, offsetY - 3 * ps, ps, ps);
  } else if (skin.accessory === 'sunglasses') {
    // 8-bit Black Sunglasses
    ctx.fillStyle = '#000000';
    ctx.fillRect(offsetX + 8 * ps, offsetY + 3 * ps, 6 * ps, 2 * ps);
    ctx.fillRect(offsetX + 6 * ps, offsetY + 3 * ps, 2 * ps, ps);
    // Specular shine
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(offsetX + 9 * ps, offsetY + 3 * ps, ps, ps);
    ctx.fillRect(offsetX + 12 * ps, offsetY + 3 * ps, ps, ps);
  } else if (skin.accessory === 'ninja') {
    // Crimson Ninja Headband
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(offsetX + 5 * ps, offsetY + 2 * ps, 7 * ps, ps * 1.5);
    // Ribbon tails behind head
    ctx.fillRect(offsetX + 2 * ps, offsetY + 3 * ps, 3 * ps, ps);
    ctx.fillRect(offsetX + 1 * ps, offsetY + 4 * ps, 2 * ps, ps);
  } else if (skin.accessory === 'halo') {
    // Celestial Floating Golden Halo
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(offsetX + 6 * ps, offsetY - 5 * ps, 7 * ps, 2 * ps);
  } else if (skin.accessory === 'helmet') {
    // Space Bubble Dome Helmet
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
    ctx.beginPath();
    ctx.arc(offsetX + 10 * ps, offsetY + 4 * ps, 9 * ps, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (skin.accessory === 'visor') {
    // Neon Cyber Visor
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(offsetX + 8 * ps, offsetY + 2.5 * ps, 6 * ps, 2.5 * ps);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(offsetX + 9 * ps, offsetY + 3 * ps, 4 * ps, ps);
  } else if (skin.accessory === 'flower') {
    // Sakura Blossom Petals
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(offsetX + 6 * ps, offsetY - 2 * ps, 2 * ps, 2 * ps);
    ctx.fillRect(offsetX + 8 * ps, offsetY - 3 * ps, 2 * ps, 2 * ps);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(offsetX + 7.5 * ps, offsetY - 1.5 * ps, ps, ps);
  } else if (skin.accessory === 'party_hat') {
    // Colorful Party Cone Hat
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(offsetX + 7 * ps, offsetY - 2 * ps, 4 * ps, ps);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(offsetX + 8 * ps, offsetY - 4 * ps, 2 * ps, 2 * ps);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(offsetX + 8.5 * ps, offsetY - 6 * ps, ps, 2 * ps);
    // Pom-pom on top
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(offsetX + 8 * ps, offsetY - 7 * ps, 2 * ps, ps);
  } else if (skin.accessory === 'goggles') {
    // Vintage Brass Aviator Goggles
    ctx.fillStyle = '#78350F';
    ctx.fillRect(offsetX + 7 * ps, offsetY + 2.5 * ps, 7 * ps, 2 * ps);
    ctx.fillStyle = '#D97706';
    ctx.fillRect(offsetX + 9 * ps, offsetY + 2.5 * ps, 2.5 * ps, 2 * ps);
    ctx.fillRect(offsetX + 12.5 * ps, offsetY + 2.5 * ps, 2.5 * ps, 2 * ps);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(offsetX + 9.5 * ps, offsetY + 3 * ps, 1.5 * ps, ps);
    ctx.fillRect(offsetX + 13 * ps, offsetY + 3 * ps, 1.5 * ps, ps);
  } else if (skin.accessory === 'horns') {
    // Molten Horns
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(offsetX + 6 * ps, offsetY - 3 * ps, 2 * ps, 3 * ps);
    ctx.fillRect(offsetX + 5 * ps, offsetY - 5 * ps, ps, 2 * ps);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(offsetX + 5 * ps, offsetY - 6 * ps, ps, ps);
  }

  // Special effects per skin
  if (skin.specialEffect === 'fire') {
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(offsetX - ps * 2, offsetY + 5 * ps, ps * 2, ps);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(offsetX - ps * 3, offsetY + 6 * ps, ps * 2, ps);
  } else if (skin.specialEffect === 'toxic') {
    ctx.fillStyle = '#84CC16';
    ctx.fillRect(offsetX - ps * 2, offsetY + 4 * ps, ps * 1.5, ps * 1.5);
    ctx.fillStyle = '#D9F99D';
    ctx.fillRect(offsetX - ps * 3.5, offsetY + 2 * ps, ps, ps);
  } else if (skin.specialEffect === 'snow') {
    ctx.fillStyle = '#CFFAFE';
    ctx.fillRect(offsetX - ps * 2, offsetY + 2 * ps, ps, ps);
    ctx.fillRect(offsetX - ps * 3, offsetY + 6 * ps, ps, ps);
  } else if (skin.specialEffect === 'rainbow') {
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(offsetX - ps * 1.5, offsetY + 3 * ps, ps, ps);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(offsetX - ps * 2.5, offsetY + 4.5 * ps, ps, ps);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(offsetX - ps * 3.5, offsetY + 6 * ps, ps, ps);
  } else if (skin.specialEffect === 'sparkles') {
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(offsetX - ps * 2, offsetY + 2 * ps, ps, ps);
    ctx.fillRect(offsetX - ps * 3, offsetY + 7 * ps, ps, ps);
  }

  ctx.restore();
}

/**
 * Draw Procedural Obstacle (Pipes, Moving, Lasers, Crushers, Spiked Cogs)
 */
export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  biome: BiomeConfig,
  viewHeight: number,
  gameTime: number
) {
  const { x, width, topHeight, gapSize, type } = obs;
  const bottomY = topHeight + gapSize;
  const bottomHeight = viewHeight - bottomY;

  // 1. Draw Pipe / Pillar body and cap (Top & Bottom)
  const drawPipeBlock = (px: number, py: number, pw: number, ph: number, isTop: boolean) => {
    if (ph <= 0) return;

    // Body Outline
    ctx.fillStyle = biome.pipeOutline;
    ctx.fillRect(px - 2, py, pw + 4, ph);

    // Body Base Fill
    ctx.fillStyle = biome.pipeMain;
    ctx.fillRect(px, py, pw, ph);

    // Body Left Highlight
    ctx.fillStyle = biome.pipeHighlight;
    ctx.fillRect(px + 4, py, 8, ph);
    ctx.fillRect(px + 14, py, 3, ph);

    // Body Right Shadow
    ctx.fillStyle = biome.pipeShadow;
    ctx.fillRect(px + pw - 12, py, 12, ph);
    ctx.fillStyle = biome.pipeRim;
    ctx.fillRect(px + pw - 4, py, 4, ph);

    // Pipe Cap Rim (Lip)
    const capHeight = 24;
    const capOverhang = 5;
    const capX = px - capOverhang;
    const capW = pw + capOverhang * 2;
    const capY = isTop ? py + ph - capHeight : py;

    // Cap Outline
    ctx.fillStyle = biome.pipeOutline;
    ctx.fillRect(capX - 2, capY - 2, capW + 4, capHeight + 4);

    // Cap Fill
    ctx.fillStyle = biome.pipeMain;
    ctx.fillRect(capX, capY, capW, capHeight);

    // Cap Highlight
    ctx.fillStyle = biome.pipeHighlight;
    ctx.fillRect(capX + 4, capY + 2, 9, capHeight - 4);
    ctx.fillRect(capX + 16, capY + 2, 3, capHeight - 4);

    // Cap Shadow
    ctx.fillStyle = biome.pipeShadow;
    ctx.fillRect(capX + capW - 14, capY + 2, 14, capHeight - 4);

    // Cap Rivet / Pixel studs
    ctx.fillStyle = biome.pipeOutline;
    ctx.fillRect(capX + 6, capY + capHeight / 2 - 2, 4, 4);
    ctx.fillRect(capX + capW - 10, capY + capHeight / 2 - 2, 4, 4);
  };

  // Render the structural pipes
  drawPipeBlock(x, 0, width, topHeight, true);
  drawPipeBlock(x, bottomY, width, bottomHeight, false);

  // 2. Specialized Obstacle Features
  if (type === 'moving') {
    // Moving Pipe: Draw pulsing kinetic guide rail on the side
    ctx.fillStyle = '#06B6D4';
    ctx.shadowColor = '#22D3EE';
    ctx.shadowBlur = 8;
    const pulseOffset = (gameTime * 5) % 20;
    for (let py = 0; py < viewHeight; py += 24) {
      const arrowY = (py + pulseOffset) % viewHeight;
      ctx.fillRect(x + width / 2 - 2, arrowY, 4, 8);
    }
    ctx.shadowBlur = 0;
  }

  if (type === 'laser') {
    // Laser Obstacle: High energy beam pulsing in the gap
    const active = obs.laserActive ?? true;
    const warn = obs.warningTimer && obs.warningTimer > 0;

    if (active) {
      // Full deadly laser beam
      const beamAlpha = 0.8 + Math.sin(gameTime * 20) * 0.2;
      ctx.fillStyle = `rgba(239, 68, 68, ${beamAlpha})`;
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 15;
      ctx.fillRect(x + width / 2 - 8, topHeight, 16, gapSize);

      // Core white laser beam
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + width / 2 - 3, topHeight, 6, gapSize);
      ctx.shadowBlur = 0;

      // Spark particles at emitter nodes
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(x + width / 2 - 6, topHeight + 2, 12, 6);
      ctx.fillRect(x + width / 2 - 6, bottomY - 8, 12, 6);
    } else if (warn) {
      // Warning flicker wire
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + Math.sin(gameTime * 30) * 0.4})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x + width / 2, topHeight);
      ctx.lineTo(x + width / 2, bottomY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  if (type === 'spiked_cog') {
    // Spiked Rotating Cog floating inside or near the gap
    const cogY = obs.cogY || (topHeight + gapSize / 2);
    const cogAngle = obs.cogAngle || (gameTime * 3);
    const cogRadius = obs.cogRadius || 18;

    ctx.save();
    ctx.translate(x + width / 2, cogY);
    ctx.rotate(cogAngle);

    // Center Gear body
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, cogRadius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Spikes (8 teeth)
    const teeth = 8;
    ctx.fillStyle = '#EF4444';
    for (let i = 0; i < teeth; i++) {
      const angle = (i * Math.PI * 2) / teeth;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillRect(-3, cogRadius - 8, 6, 12);
      // Spike tip
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(-2, cogRadius + 2, 4, 4);
      ctx.restore();
    }

    // Core Bolt
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  if (type === 'crusher') {
    // Crusher spikes on top & bottom lips
    const spikeCount = 4;
    const spikeW = width / spikeCount;
    ctx.fillStyle = '#E11D48';
    for (let i = 0; i < spikeCount; i++) {
      // Top spikes pointing down
      ctx.beginPath();
      ctx.moveTo(x + i * spikeW, topHeight);
      ctx.lineTo(x + (i + 0.5) * spikeW, topHeight + 10);
      ctx.lineTo(x + (i + 1) * spikeW, topHeight);
      ctx.fill();

      // Bottom spikes pointing up
      ctx.beginPath();
      ctx.moveTo(x + i * spikeW, bottomY);
      ctx.lineTo(x + (i + 0.5) * spikeW, bottomY - 10);
      ctx.lineTo(x + (i + 1) * spikeW, bottomY);
      ctx.fill();
    }
  }
}

/**
 * Draw Collectible Coin with 8-bit Shimmer
 */
export function drawCoin(
  ctx: CanvasRenderingContext2D,
  coin: CoinItem,
  gameTime: number
) {
  if (coin.collected) return;

  const { x, y, radius, value } = coin;
  const bobY = y + Math.sin(gameTime * 6 + x) * 3;
  const shimmerFrame = Math.floor((gameTime * 10) % 4);

  ctx.save();
  ctx.translate(x, bobY);

  // Width scales to simulate 3D rotation
  const scaleX = [1, 0.6, 0.15, 0.6][shimmerFrame];
  ctx.scale(scaleX, 1);

  // Outer Golden Ring
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = value > 1 ? '#F59E0B' : '#FACC15';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-radius / 2, -radius / 2, radius, radius / 2);

  // Inner Symbol ($ or 5)
  if (scaleX > 0.5) {
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value > 1 ? '5' : '$', 0, 1);
  }

  ctx.restore();
}

/**
 * Draw Power-Up Item Orb
 */
export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUpItem,
  gameTime: number
) {
  if (powerUp.collected) return;

  const { x, y, radius, type } = powerUp;
  const bobY = y + Math.sin(gameTime * 4 + powerUp.bobOffset) * 5;

  ctx.save();
  ctx.translate(x, bobY);

  // Pulsing Outer Aura
  let color = '#38BDF8';
  let label = 'S';
  if (type === 'shield') {
    color = '#0284C7';
    label = '🛡';
  } else if (type === 'slowmo') {
    color = '#8B5CF6';
    label = '⏳';
  } else if (type === 'multiplier') {
    color = '#F59E0B';
    label = '2x';
  } else if (type === 'shrink') {
    color = '#10B981';
    label = 'MINI';
  } else if (type === 'laser') {
    color = '#EF4444';
    label = '⚡';
  }

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pixel Inner Icon
  ctx.fillStyle = '#FFFFFF';
  ctx.font = type === 'shrink' ? 'bold 7px "Press Start 2P"' : 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);

  ctx.restore();
}

/**
 * Draw Parallax Pixel Background & Scrolling Ground
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeConfig,
  groundOffset: number,
  groundHeight: number,
  gameTime: number
) {
  // 1. Sky Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height - groundHeight);
  grad.addColorStop(0, biome.skyTop);
  grad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Celestial Body (Sun/Moon/Neon Grid)
  if (biome.name.includes('Moon') || biome.name.includes('Night')) {
    // Pixel Moon
    ctx.fillStyle = '#FEF08A';
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(width - 70, 70, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Craters
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(width - 80, 64, 6, 6);
    ctx.fillRect(width - 66, 76, 8, 8);
    ctx.fillRect(width - 60, 60, 5, 5);
  } else if (biome.name.includes('Cyber')) {
    // Cyberpunk Synthwave Sun
    const sunY = height - groundHeight - 80;
    const sunGrad = ctx.createLinearGradient(0, sunY - 50, 0, sunY + 50);
    sunGrad.addColorStop(0, '#F43F5E');
    sunGrad.addColorStop(1, '#FBBF24');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width / 2, sunY, 55, 0, Math.PI * 2);
    ctx.fill();

    // Synthwave Horizontal scan stripes across sun
    ctx.fillStyle = biome.skyBottom;
    for (let s = 0; s < 6; s++) {
      ctx.fillRect(width / 2 - 60, sunY + s * 9, 120, 2 + s * 0.8);
    }
  } else if (biome.name.includes('Day') || biome.name.includes('Sunset')) {
    // Golden Pixel Sun
    ctx.fillStyle = biome.name.includes('Sunset') ? '#FB923C' : '#FDE047';
    ctx.beginPath();
    ctx.arc(width - 80, 80, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Distant Parallax Pixel Mountains & City Skyline
  const mountainScroll = (groundOffset * 0.2) % 300;
  ctx.fillStyle = biome.mountainColor;
  for (let mx = -300; mx < width + 300; mx += 150) {
    const px = mx - mountainScroll;
    const my = height - groundHeight - 120;
    ctx.beginPath();
    ctx.moveTo(px, height - groundHeight);
    ctx.lineTo(px + 75, my);
    ctx.lineTo(px + 150, height - groundHeight);
    ctx.fill();

    // Snowcap on mountains if winter/day
    if (biome.weatherType === 'snow' || biome.name.includes('Day')) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(px + 50, my + 40);
      ctx.lineTo(px + 75, my);
      ctx.lineTo(px + 100, my + 40);
      ctx.fill();
      ctx.fillStyle = biome.mountainColor;
    }
  }

  // 4. Parallax Floating Clouds
  const cloudScroll = (groundOffset * 0.4) % 400;
  ctx.fillStyle = biome.cloudColor;
  for (let cx = -400; cx < width + 400; cx += 220) {
    const cloudX = cx - cloudScroll;
    const cloudY = 50 + ((cx * 37) % 80);
    // 3-part pixel cloud block
    ctx.fillRect(cloudX, cloudY + 10, 60, 20);
    ctx.fillRect(cloudX + 12, cloudY, 36, 30);
    ctx.fillRect(cloudX + 44, cloudY + 8, 24, 18);
  }

  // 5. Weather Effects
  if (biome.weatherType === 'snow') {
    ctx.fillStyle = '#FFFFFF';
    for (let s = 0; s < 30; s++) {
      const sx = ((s * 47) + gameTime * 50) % width;
      const sy = ((s * 83) + gameTime * 120) % (height - groundHeight);
      ctx.fillRect(sx, sy, 3, 3);
    }
  } else if (biome.weatherType === 'rain') {
    ctx.fillStyle = '#38BDF8';
    for (let r = 0; r < 40; r++) {
      const rx = ((r * 39) + gameTime * 100) % width;
      const ry = ((r * 71) + gameTime * 400) % (height - groundHeight);
      ctx.fillRect(rx, ry, 2, 8);
    }
  } else if (biome.weatherType === 'embers') {
    ctx.fillStyle = '#F97316';
    for (let e = 0; e < 25; e++) {
      const ex = ((e * 53) + Math.sin(gameTime * 3 + e) * 20) % width;
      const ey = height - groundHeight - (((e * 61) + gameTime * 80) % (height - groundHeight));
      ctx.fillRect(ex, ey, 3, 3);
    }
  } else if (biome.weatherType === 'stars') {
    ctx.fillStyle = '#F8FAFC';
    for (let st = 0; st < 35; st++) {
      const stx = (st * 59) % width;
      const sty = (st * 31) % (height - groundHeight - 100);
      const twinkle = Math.sin(gameTime * 5 + st) > 0;
      if (twinkle) {
        ctx.fillRect(stx, sty, 2, 2);
      }
    }
  }

  // 6. Ground & Dirt Terrain
  const groundY = height - groundHeight;

  // Ground Top Turf Layer
  ctx.fillStyle = biome.groundTop;
  ctx.fillRect(0, groundY, width, 14);
  // Grass Blades / pixel border
  ctx.fillStyle = '#14532D';
  ctx.fillRect(0, groundY + 12, width, 2);

  // Dirt Core Layer
  ctx.fillStyle = biome.groundBody;
  ctx.fillRect(0, groundY + 14, width, groundHeight - 14);

  // Scrolling Soil Texture Striping (45-degree angled pixel bricks)
  const stripeW = 20;
  const offset = groundOffset % (stripeW * 2);
  ctx.fillStyle = biome.groundStripe;
  for (let x = -stripeW * 2; x < width + stripeW * 2; x += stripeW * 2) {
    const rx = x - offset;
    ctx.beginPath();
    ctx.moveTo(rx, groundY + 14);
    ctx.lineTo(rx + stripeW, groundY + 14);
    ctx.lineTo(rx, groundY + groundHeight);
    ctx.lineTo(rx - stripeW, groundY + groundHeight);
    ctx.fill();
  }
}

/**
 * Draw Flappy Bird Laser Cannon Beam & Impact Flare
 */
export function drawLaserBeam(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  hitX: number,
  gameTime: number,
  isHyper: boolean
) {
  ctx.save();

  const glowColor = isHyper ? '#00F0FF' : '#FF1744';
  const midColor = isHyper ? '#38BDF8' : '#F43F5E';
  const beamWidth = Math.max(0, hitX - originX);

  if (beamWidth <= 0) {
    ctx.restore();
    return;
  }

  // 1. Muzzle Starburst Flare at beak
  const muzzleSize = isHyper ? 16 : 12;
  const pulse = Math.sin(gameTime * 40) * 3;
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(originX, originY, (muzzleSize / 2) + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(originX, originY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Wide Outer Laser Corona
  ctx.lineWidth = isHyper ? 18 : 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = isHyper ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 23, 68, 0.45)';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isHyper ? 25 : 18;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(hitX, originY);
  ctx.stroke();

  // 3. Mid Plasma Sheath
  ctx.lineWidth = isHyper ? 8 : 6;
  ctx.strokeStyle = midColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(hitX, originY);
  ctx.stroke();

  // 4. Pure Incandescent Core
  ctx.lineWidth = isHyper ? 3.5 : 2.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(hitX, originY);
  ctx.stroke();

  // 5. Quantum Energy Waveform (Sine pulse along beam)
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = isHyper ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 220, 230, 0.85)';
  ctx.beginPath();
  const step = 8;
  for (let x = originX; x <= hitX; x += step) {
    const yOff = Math.sin((x * 0.12) - (gameTime * 35)) * (isHyper ? 4 : 2.5);
    if (x === originX) {
      ctx.moveTo(x, originY + yOff);
    } else {
      ctx.lineTo(x, originY + yOff);
    }
  }
  ctx.stroke();

  // 6. Impact Explosion Flare & Starburst at hit point
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(hitX, originY, (isHyper ? 22 : 16) + pulse, 0, Math.PI * 2);
  ctx.fill();

  // White Hot Plasma Core
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(hitX, originY, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Searing Cross Flares (Horizontal & Vertical Spike Ray Bursts)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(hitX - 22, originY);
  ctx.lineTo(hitX + 22, originY);
  ctx.moveTo(hitX, originY - 22);
  ctx.lineTo(hitX, originY + 22);
  ctx.stroke();

  // Diagonal Radiating Burst Spikes
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(hitX - 14, originY - 14);
  ctx.lineTo(hitX + 14, originY + 14);
  ctx.moveTo(hitX - 14, originY + 14);
  ctx.lineTo(hitX + 14, originY - 14);
  ctx.stroke();

  ctx.restore();
}


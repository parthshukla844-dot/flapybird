export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type BiomeType = 'day' | 'night' | 'sunset' | 'cyberpunk' | 'volcano' | 'winter';

export interface SpecialFeature {
  name: string;
  tag: string;
  description: string;
  badgeColor?: string;
}

export interface BiomeItem {
  id: BiomeType;
  name: string;
  description: string;
  cost: number;
  icon: string;
  weatherName: string;
  specialFeature: SpecialFeature;
}

export interface BirdSkin {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  tag?: string;
  specialFeature: SpecialFeature;
  accessory?: 'none' | 'sunglasses' | 'crown' | 'ninja' | 'helmet' | 'flower' | 'party_hat' | 'halo' | 'visor' | 'goggles' | 'horns';
  colorScheme: {
    body: string;
    belly: string;
    wing: string;
    wingFlap: string;
    beak: string;
    eye: string;
    outline: string;
    trailColor: string;
  };
  specialEffect?: 'glow' | 'fire' | 'stars' | 'glitch' | 'snow' | 'rainbow' | 'sparkles' | 'toxic';
}

export type PowerUpType = 'shield' | 'slowmo' | 'multiplier' | 'shrink' | 'laser';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  duration: number; // in seconds
  bobOffset: number;
}

export interface CoinItem {
  id: string;
  x: number;
  y: number;
  value: number;
  radius: number;
  collected: boolean;
  frame: number;
}

export type ObstacleType = 
  | 'standard' 
  | 'moving' 
  | 'laser' 
  | 'crusher' 
  | 'spiked_cog'
  | 'narrow_double';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  width: number;
  topHeight: number;
  gapSize: number;
  passed: boolean;
  // Specific behaviors
  speedY?: number;
  minY?: number;
  maxY?: number;
  oscillationPhase?: number;
  laserActive?: boolean;
  laserTimer?: number;
  warningTimer?: number;
  cogY?: number;
  cogAngle?: number;
  cogRadius?: number;
  crushPhase?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'square' | 'circle' | 'feather' | 'sparkle' | 'pixel';
  gravity?: number;
  drag?: number;
  bounce?: number;
  rotation?: number;
  vRot?: number;
  flicker?: boolean;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface GameStats {
  highScore: number;
  totalCoins: number;
  totalFlaps: number;
  totalPipesPassed: number;
  gamesPlayed: number;
  unlockedSkins: string[];
  selectedSkin: string;
  crtFilterEnabled: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: Difficulty;
  selectedBiome: BiomeType;
}

export interface ActivePowerUps {
  shield: boolean;
  shieldTimer: number; // remaining ms (for 4s advantage duration)
  slowmoTimer: number; // remaining ms
  multiplierTimer: number; // remaining ms
  shrinkTimer: number; // remaining ms
  laserTimer: number; // remaining ms (for 2s Hyper Laser advantage)
  laserAmmo: number; // current laser charges (0 to 3)
  maxLaserAmmo: number; // maximum laser charges (3)
  isLaserFiring: boolean; // whether laser beam is currently active
  laserRechargeProgress?: number; // 0 to 1 recharge ratio for ammo bar
  laserCooldownRemaining?: number; // remaining shot pause timer (0 to 0.25s)
}

export type HistoryEventType = 'medal' | 'avatar' | 'weather';

export interface HistoryEntry {
  id: string;
  type: HistoryEventType;
  timestamp: number; // Date.now()
  title: string;
  description: string;
  details?: {
    medalTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'OBSIDIAN' | 'NO MEDAL';
    score?: number;
    coinsEarned?: number;
    cost?: number;
    itemId?: string;
    itemName?: string;
    perkName?: string;
    perkDescription?: string;
    difficulty?: Difficulty;
    biomeName?: string;
    skinName?: string;
  };
}

import { Difficulty, Obstacle, ObstacleType, CoinItem, PowerUpItem, PowerUpType } from '../types';

export interface ProceduralConfig {
  speed: number;
  gapSize: number;
  spacing: number;
  minTopHeight: number;
  maxDeltaY: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, ProceduralConfig> = {
  easy: {
    speed: 1.6,
    gapSize: 200,
    spacing: 320,
    minTopHeight: 65,
    maxDeltaY: 65,
  },
  medium: {
    speed: 2.1,
    gapSize: 160,
    spacing: 270,
    minTopHeight: 55,
    maxDeltaY: 95,
  },
  hard: {
    speed: 2.85,
    gapSize: 132,
    spacing: 220,
    minTopHeight: 45,
    maxDeltaY: 130,
  },
};

export class ProceduralGenerator {
  private lastGapCenter = 240;
  private pipeWidth = 54;
  private nextObstacleId = 1;

  public reset(initialCenter = 240) {
    this.lastGapCenter = initialCenter;
    this.nextObstacleId = 1;
  }

  /**
   * Generates next obstacle procedurally with progressive difficulty & fair physics
   */
  public generateNextObstacle(
    spawnX: number,
    viewHeight: number,
    groundHeight: number,
    difficulty: Difficulty,
    score: number,
    skinId?: string,
    biomeId?: string
  ): {
    obstacle: Obstacle;
    coins: CoinItem[];
    powerUps: PowerUpItem[];
  } {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const playableHeight = viewHeight - groundHeight;

    // 1. Dynamic Gap Size calculation (gentle scaling)
    let gap = config.gapSize;
    if (difficulty === 'medium') {
      gap = Math.max(148, config.gapSize - Math.floor(score / 20) * 2);
    } else if (difficulty === 'hard') {
      gap = Math.max(120, config.gapSize - Math.floor(score / 15) * 3);
    }

    // Sakura Blossom perk: 25% chance for +14px wider safety gaps
    if (skinId === 'sakura' && Math.random() < 0.25) {
      gap += 14;
    }

    // 2. Calculate fair gap vertical position within maxDeltaY
    const minCenter = config.minTopHeight + gap / 2;
    const maxCenter = playableHeight - config.minTopHeight - gap / 2;

    const deltaY = (Math.random() * 2 - 1) * config.maxDeltaY;
    let targetCenter = this.lastGapCenter + deltaY;
    targetCenter = Math.max(minCenter, Math.min(maxCenter, targetCenter));
    this.lastGapCenter = targetCenter;

    const topHeight = Math.floor(targetCenter - gap / 2);

    // 3. Determine Obstacle Archetype based on score and randomness
    let type: ObstacleType = 'standard';
    const rand = Math.random();

    if (difficulty === 'hard') {
      if (score >= 20 && rand < 0.2) {
        type = 'laser';
      } else if (score >= 15 && rand < 0.35) {
        type = 'spiked_cog';
      } else if (score >= 10 && rand < 0.5) {
        type = 'crusher';
      } else if (score >= 5 && rand < 0.65) {
        type = 'moving';
      }
    } else if (difficulty === 'medium') {
      // Medium mode is predominantly classic pipes for an authentic, accessible feel
      if (score >= 15 && rand < 0.25) {
        type = 'moving';
      }
    } else if (difficulty === 'easy') {
      // Easy is relaxing and friendly
      if (score >= 18 && rand < 0.12) {
        type = 'moving';
      }
    }

    const obsId = `obs-${this.nextObstacleId++}`;
    const obstacle: Obstacle = {
      id: obsId,
      type,
      x: spawnX,
      width: this.pipeWidth,
      topHeight,
      gapSize: gap,
      passed: false,
    };

    // Specific Archetype parameters
    if (type === 'moving') {
      const speedMult = skinId === 'frost' ? 0.75 : 1.0;
      obstacle.speedY = (0.8 + Math.random() * 0.5) * speedMult;
      obstacle.minY = Math.max(50, topHeight - 40);
      obstacle.maxY = Math.min(playableHeight - gap - 50, topHeight + 40);
      obstacle.oscillationPhase = Math.random() * Math.PI * 2;
    } else if (type === 'laser') {
      obstacle.laserActive = false;
      obstacle.warningTimer = 50; // generous warning frames before firing
      obstacle.laserTimer = 180; // total cycle frames
    } else if (type === 'spiked_cog') {
      obstacle.cogY = topHeight + gap / 2;
      obstacle.cogRadius = 14;
      obstacle.cogAngle = 0;
    } else if (type === 'crusher') {
      obstacle.crushPhase = 0;
    }

    // 4. Procedural Pickups (Coins and Power-Ups)
    const coins: CoinItem[] = [];
    const powerUps: PowerUpItem[] = [];

    // Coin spawn chance (85% standard coin, 20% high-value coin)
    if (Math.random() < 0.85 && type !== 'laser') {
      const isFive = Math.random() < 0.2;
      let coinVal = isFive ? 5 : 1;
      // Royal King Pip perk: Midas Royal Treasury upgrades coins to 2¢, 3¢ or 5¢
      if (skinId === 'king' && !isFive) {
        coinVal = Math.random() < 0.5 ? 2 : 3;
      }

      coins.push({
        id: `coin-${obsId}`,
        x: spawnX + this.pipeWidth / 2,
        y: targetCenter + (Math.random() * 16 - 8),
        value: coinVal,
        radius: isFive ? 10 : 8,
        collected: false,
        frame: 0,
      });
    }

    // Power-Up spawn chance (more frequent to help the player!)
    const powerUpTypes: PowerUpType[] = ['shield', 'slowmo', 'multiplier', 'shrink', 'laser'];
    let powerUpChance = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.25 : 0.18;

    // Rainbow Chroma perk: doubles advantage power-up spawn frequency!
    if (skinId === 'prism') {
      powerUpChance = Math.min(0.70, powerUpChance * 2);
    }

    if (Math.random() < powerUpChance && type === 'standard') {
      // Balanced equal probability across all 5 power-up advantages (20% each)
      const selectedType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

      powerUps.push({
        id: `pw-${obsId}`,
        type: selectedType,
        x: spawnX + this.pipeWidth / 2,
        y: targetCenter,
        radius: 12,
        collected: false,
        duration: selectedType === 'laser' ? 2 : 10, // 2s for unlimited laser, 10s for other advantages
        bobOffset: Math.random() * 10,
      });
    }

    return { obstacle, coins, powerUps };
  }
}

import { 
  GameState, 
  Difficulty, 
  BiomeType, 
  BirdSkin, 
  Obstacle, 
  CoinItem, 
  PowerUpItem, 
  Particle, 
  ScorePopup, 
  ActivePowerUps 
} from '../types';
import { 
  BIOMES, 
  SKINS,
  drawBackground, 
  drawObstacle, 
  drawCoin, 
  drawPowerUp, 
  drawPixelBird,
  drawLaserBeam 
} from './pixelArt';
import { DIFFICULTY_CONFIGS, ProceduralGenerator } from './procedural';
import { retroAudio } from './audio';
import confetti from 'canvas-confetti';

export interface GameEngineCallbacks {
  onScoreChange: (score: number) => void;
  onCoinsChange: (coins: number) => void;
  onStateChange: (state: GameState) => void;
  onGameOver: (finalScore: number, coinsEarned: number, newHighScore: boolean) => void;
}

export class FlappyEngine {
  // Canvas & Render
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Viewport dimensions
  public width = 480;
  public height = 640;
  public groundHeight = 84;

  // Game State
  public state: GameState = 'MENU';
  public difficulty: Difficulty = 'medium';
  public selectedBiome: BiomeType = 'day';
  public selectedSkin: BirdSkin = SKINS[0];

  // Physical Properties
  public birdX = 90;
  public birdY = 280;
  public birdVy = 0;
  public birdRotation = 0;
  public birdFlapFrame = 1;
  private flapTimer = 0;
  private invulnerableTimer = 0;
  private usedAngelRevival = false;
  private slimeBounceCooldown = 0;

  // Physics constants - tuned for smooth, forgiving, easy gameplay
  private gravity = 0.28;
  private jumpForce = -5.4;
  private maxFallSpeed = 7.2;

  // Obstacles, Items, Particles
  public obstacles: Obstacle[] = [];
  public coins: CoinItem[] = [];
  public powerUps: PowerUpItem[] = [];
  public particles: Particle[] = [];
  public scorePopups: ScorePopup[] = [];

  // Laser Cannon System
  public laserAmmo = 3;
  public maxLaserAmmo = 3;
  private laserRechargeTimer = 0;
  public laserFiringTimer = 0;
  public laserCooldownTimer = 0; // 0.25s mandatory pause between consecutive laser shots
  public laserBeamHitX = 0;
  public laserBeamHitY = 0;
  private readonly maxParticles = 180; // Hard cap for 60fps canvas performance
  private lastSpawnX = 0; // Track spawn position so pipes never stop spawning
  private hyperLaserPipesDestroyed = 0; // Track pipes destroyed by unlimited laser (max 4)

  // Active Power-ups
  public activePowerUps: ActivePowerUps = {
    shield: false,
    shieldTimer: 0,
    slowmoTimer: 0,
    multiplierTimer: 0,
    shrinkTimer: 0,
    laserTimer: 0,
    laserAmmo: 3,
    maxLaserAmmo: 3,
    isLaserFiring: false,
  };

  // Run Stats
  public score = 0;
  public runCoins = 0;
  public totalFlaps = 0;
  public highScore = 0;

  // Scroll & Generator
  private groundOffset = 0;
  private gameTime = 0;
  private generator = new ProceduralGenerator();
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private screenShake = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;

    this.resizeCanvas();
  }

  public resizeCanvas(customWidth?: number, customHeight?: number) {
    let aspect = 0.75; // default 3:4 aspect
    if (customWidth && customHeight && customHeight > 0) {
      aspect = Math.max(0.42, Math.min(3.5, customWidth / customHeight));
      this.height = 640;
      this.width = Math.round(640 * aspect);
    } else if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const cssW = rect.width || this.canvas.clientWidth || 480;
      const cssH = rect.height || this.canvas.clientHeight || 640;
      aspect = Math.max(0.42, Math.min(3.5, cssW / (cssH || 1)));
      this.height = 640;
      this.width = Math.round(640 * aspect);
    } else {
      this.width = 480;
      this.height = 640;
    }

    if (this.canvas.width !== this.width || this.canvas.height !== this.height) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx.imageSmoothingEnabled = false;
    }
    
    // Scale bird horizontal placement smoothly based on device aspect ratio:
    // - On narrow portrait phones (aspect < 0.75): placed comfortably at ~18-20% width (min 65px) for reaction distance
    // - On landscape/desktop displays (aspect >= 0.75): placed at ~22% width, capped at 240px
    if (aspect < 0.75) {
      this.birdX = Math.round(Math.max(65, Math.min(110, this.width * 0.20)));
    } else {
      this.birdX = Math.round(Math.max(90, Math.min(240, this.width * 0.22)));
    }

    if (this.state !== 'PLAYING') {
      this.render();
    }
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  public setBiome(biome: BiomeType) {
    this.selectedBiome = biome;
  }

  public setSkin(skin: BirdSkin) {
    this.selectedSkin = skin;
  }

  public setHighScore(hs: number) {
    this.highScore = hs;
  }

  /**
   * Start a new game session
   */
  public start(diff?: Difficulty) {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (diff) {
      this.difficulty = diff;
    }
    this.state = 'PLAYING';
    this.score = 0;
    this.runCoins = 0;
    this.birdY = this.height / 2 - 40;
    this.birdVy = 0;
    this.birdRotation = 0;
    this.invulnerableTimer = 0;
    this.usedAngelRevival = false;
    this.slimeBounceCooldown = 0;

    this.laserAmmo = 3;
    this.laserFiringTimer = 0;
    this.laserRechargeTimer = 0;

    this.activePowerUps = {
      shield: false,
      shieldTimer: 0,
      slowmoTimer: 0,
      multiplierTimer: 0,
      shrinkTimer: 0,
      laserTimer: 0,
      laserAmmo: 3,
      maxLaserAmmo: 3,
      isLaserFiring: false,
    };

    // Phoenix Flame Shield perk: Starts with active 10s Flame Shield!
    if (this.selectedSkin.id === 'blaze') {
      this.activePowerUps.shield = true;
      this.activePowerUps.shieldTimer = 10000;
    }

    // Mecha Iron-Wing perk: Starts with +1 score bonus point!
    if (this.selectedSkin.id === 'mecha') {
      this.score = 1;
    }

    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.particles = [];
    this.scorePopups = [];
    this.screenShake = 0;
    this.groundOffset = 0;
    this.gameTime = 0;
    this.laserAmmo = this.maxLaserAmmo;
    this.laserRechargeTimer = 0;
    this.laserFiringTimer = 0;
    this.laserCooldownTimer = 0;
    this.lastSpawnX = 0;
    this.hyperLaserPipesDestroyed = 0;

    this.generator.reset(this.height / 2 - 30);

    // Initial obstacle setup
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const initialSpawn = this.width + 100;
    const initialCount = Math.max(3, Math.ceil(this.width / config.spacing) + 1);
    for (let i = 0; i < initialCount; i++) {
      const spawnX = initialSpawn + i * config.spacing;
      const { obstacle, coins, powerUps } = this.generator.generateNextObstacle(
        spawnX,
        this.height,
        this.groundHeight,
        this.difficulty,
        this.score,
        this.selectedSkin.id,
        this.selectedBiome
      );
      this.obstacles.push(obstacle);
      this.coins.push(...coins);
      this.powerUps.push(...powerUps);
      this.lastSpawnX = spawnX;
    }

    this.callbacks.onScoreChange(this.score);
    this.callbacks.onCoinsChange(0);
    this.callbacks.onStateChange('PLAYING');

    if (this.selectedSkin.id === 'blaze') {
      this.addScorePopup(this.birdX, this.birdY - 20, 'PHOENIX SHIELD!', '#DC2626');
    }
    if (this.selectedSkin.id === 'mecha') {
      this.addScorePopup(this.birdX, this.birdY - 20, 'TITANIUM +1!', '#38BDF8');
    }

    retroAudio.playSelect();
    retroAudio.startMusic();

    this.lastTimestamp = performance.now();
    this.loop();
  }

  /**
   * Flap / Jump Action
   */
  public flap() {
    if (this.state === 'MENU' || this.state === 'GAMEOVER') {
      this.start();
      return;
    }

    if (this.state === 'PAUSED') {
      this.resume();
      return;
    }

    if (this.state !== 'PLAYING') return;

    // Apply Jump Impulse (Ruby Robin perk: Crimson Surge +12% jump force)
    const effectiveJumpForce = this.selectedSkin.id === 'robin' ? -6.05 : this.jumpForce;
    this.birdVy = effectiveJumpForce;
    this.birdRotation = -0.45; // ~25 deg tilt upwards
    this.birdFlapFrame = 0; // Wing UP
    this.flapTimer = 8;
    this.totalFlaps++;

    retroAudio.playFlap();

    // Spawn subtle jump feather / exhaust particles
    this.createJumpParticles();

    // Gentle haptic feedback if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Fire Flappy Bird Laser Cannon Beam!
   * Rule: Shoots 1 laser at a time. After shooting, there is a mandatory 0.25s pause before the next shot.
   * This cooldown applies to both standard laser and unlimited Hyper Laser mode.
   */
  public fireLaser(force = false): boolean {
    if (this.state !== 'PLAYING') return false;

    // Can only shoot 1 laser at a time; 0.25-second cooldown pause between shots
    if (this.laserCooldownTimer > 0 || this.laserFiringTimer > 0) {
      return false;
    }

    const isHyper = this.activePowerUps.laserTimer > 0;
    if (!force && !isHyper && this.laserAmmo <= 0) {
      retroAudio.playLaserDepleted();
      this.addScorePopup(this.birdX + 20, this.birdY - 15, 'NO AMMO (1 MIN REFILL)', '#EF4444');
      return false;
    }

    let justDepletedAllAmmo = false;
    if (!isHyper && !force) {
      if (this.laserAmmo >= this.maxLaserAmmo) {
        this.laserRechargeTimer = 0;
      }
      this.laserAmmo = Math.max(0, this.laserAmmo - 1);
      if (this.laserAmmo === 0) {
        justDepletedAllAmmo = true;
      }
    }

    // Enforce 0.25s pause after shooting 1 laser (beam visible for 0.20s, full 0.25s pause before next shot)
    this.laserCooldownTimer = 0.25;
    this.laserFiringTimer = 0.20;
    retroAudio.playLaser();
    if (justDepletedAllAmmo) {
      retroAudio.playLaserDepleted(0.12);
    }
    this.screenShake = 5;

    // Origin at bird beak
    const originX = this.birdX + 16;
    const originY = this.birdY;
    let hitX = this.width + 40;
    let hitY = originY;
    let hitObstacleIdx = -1;

    // Laser beam collision detection with obstacles ahead
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (obs.x + obs.width > originX) {
        // Exact horizontal impact coordinate on the leading face of the obstacle
        hitX = Math.max(originX + 20, Math.min(this.width + 10, obs.x + 4));
        hitY = originY;
        hitObstacleIdx = i;
        break;
      }
    }

    this.laserBeamHitX = hitX;
    this.laserBeamHitY = hitY;

    // If obstacle was hit, incinerate it with a canvas-optimized particle explosion at (hitX, hitY)!
    if (hitObstacleIdx >= 0) {
      const targetObs = this.obstacles[hitObstacleIdx];
      retroAudio.playLaserExplosion();
      this.screenShake = 12;

      // Spawn multi-layered particle explosion right at exact point of impact
      this.spawnLaserExplosion(hitX, hitY, targetObs);

      // Award bonus points and score popup
      this.score += 2;
      this.callbacks.onScoreChange(this.score);
      this.addScorePopup(hitX, hitY - 24, '+2 LASER DESTROY!', '#F43F5E');

      // Obliterate the obstacle!
      this.obstacles.splice(hitObstacleIdx, 1);

      // If in unlimited laser mode, track pipes destroyed and smoothly remove the effect after 4 pipes
      if (this.activePowerUps.laserTimer > 0) {
        this.hyperLaserPipesDestroyed++;
        if (this.hyperLaserPipesDestroyed >= 4) {
          this.activePowerUps.laserTimer = 0;
          this.laserAmmo = this.maxLaserAmmo;
          this.addScorePopup(this.birdX + 24, this.birdY - 25, 'HYPER OVER (4 PIPES CLEARED)!', '#38BDF8');
          this.createSparkleParticles(this.birdX, this.birdY, '#38BDF8');
        }
      }
    } else {
      // Muzzle sparks and end-of-screen impact burst
      this.createSparkleParticles(originX, originY, isHyper ? '#00F0FF' : '#FF1744');
      this.spawnLaserExplosion(this.width - 4, originY);
    }

    this.activePowerUps.laserAmmo = this.laserAmmo;
    this.activePowerUps.isLaserFiring = true;
    return true;
  }

  private pushParticle(p: Particle) {
    if (this.particles.length >= this.maxParticles) {
      // Overwrite oldest particle to avoid allocations and maintain 60fps
      this.particles[Math.floor(Math.random() * 24)] = p;
    } else {
      this.particles.push(p);
    }
  }

  private spawnLaserExplosion(x: number, y: number, obs?: Obstacle) {
    const isHyper = this.activePowerUps.laserTimer > 0;
    const plasmaColors = isHyper 
      ? ['#00F0FF', '#38BDF8', '#FFFFFF', '#67E8F9', '#A5F3FC', '#C084FC']
      : ['#FF1744', '#F43F5E', '#FFFFFF', '#FB7185', '#FACC15', '#FF9100', '#FFD54F'];

    // 1. High-Velocity Incandescent Plasma Shards at exact impact coordinate (x, y)
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 9.0;
      const size = (3 + Math.random() * 4) | 0;
      const color = plasmaColors[(Math.random() * plasmaColors.length) | 0];
      
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 1,
        life: 0,
        maxLife: 24 + ((Math.random() * 18) | 0),
        shape: i % 3 === 0 ? 'sparkle' : 'pixel',
        gravity: 0.18,
        drag: 0.94,
        bounce: 0.4,
      });
    }

    // 2. High-Speed Shockwave Ring (Expanding Symmetrical Perimeter from impact point)
    const ringCount = 16;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 6.5 + Math.random() * 3.5;
      this.pushParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: isHyper ? '#E0F2FE' : '#FFF9C4',
        alpha: 1,
        life: 0,
        maxLife: 16 + ((Math.random() * 6) | 0),
        shape: 'sparkle',
        gravity: 0,
        drag: 0.92,
      });
    }

    // 3. Vaporized Pipe & Obstacle Debris (Chunky Pixel Fragments along obstacle rims)
    const isStandardPipe = !obs?.type || obs.type === 'standard' || obs.type === 'moving' || obs.type === 'narrow_double';
    const debrisColors = isStandardPipe
      ? ['#15803D', '#22C55E', '#4ADE80', '#166534', '#14532D', '#86EFAC']
      : ['#EF4444', '#94A3B8', '#F59E0B', '#E2E8F0', '#64748B'];

    const topRimY = obs ? obs.topHeight : y - 24;
    const bottomRimY = obs ? obs.topHeight + obs.gapSize : y + 24;

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 6.5;
      const color = debrisColors[(Math.random() * debrisColors.length) | 0];
      const size = (3 + Math.random() * 3.5) | 0;
      const originDebrisY = i < 10 ? y + (Math.random() - 0.5) * 20 : (i % 2 === 0 ? topRimY : bottomRimY);

      this.pushParticle({
        x: x + (Math.random() - 0.5) * 14,
        y: originDebrisY,
        vx: Math.cos(angle) * speed - 1.0,
        vy: Math.sin(angle) * speed - 1.8,
        size,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30 + ((Math.random() * 20) | 0),
        shape: 'pixel',
        gravity: 0.26,
        drag: 0.96,
        bounce: 0.45,
      });
    }

    // 4. Lingering Thermal Smoke Embers at impact coordinate
    for (let i = 0; i < 8; i++) {
      this.pushParticle({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -0.8 - Math.random() * 1.6,
        size: 3,
        color: isHyper ? '#67E8F9' : '#F97316',
        alpha: 0.9,
        life: 0,
        maxLife: 32 + ((Math.random() * 18) | 0),
        shape: 'sparkle',
        gravity: -0.04,
        drag: 0.96,
      });
    }
  }

  public pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.callbacks.onStateChange('PAUSED');
      retroAudio.stopMusic();
      this.render();
    }
  }

  public resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.callbacks.onStateChange('PLAYING');
      this.lastTimestamp = performance.now();
      retroAudio.startMusic();
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  /**
   * Main Engine Update Loop
   */
  private loop = () => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.05); // cap delta
    this.lastTimestamp = now;

    if (this.state === 'PLAYING') {
      this.update(dt);
    } else if (this.state === 'GAMEOVER' && this.particles.length > 0) {
      this.updateParticles(true);
    }

    this.render();

    if (this.state === 'PLAYING' || (this.state === 'GAMEOVER' && this.particles.length > 0)) {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    retroAudio.stopMusic();
  }

  /**
   * Update Physics and Game Logic
   */
  private update(dt: number) {
    this.gameTime += dt;
    const config = DIFFICULTY_CONFIGS[this.difficulty];

    // Power-up Time Dilation (Slow-mo) & Weather Speed Modifier
    const timeScale = this.activePowerUps.slowmoTimer > 0 ? 0.55 : 1.0;
    const effectiveDt = dt * timeScale;
    let currentSpeed = config.speed * (this.activePowerUps.slowmoTimer > 0 ? 0.65 : 1.0);

    // Winter Wonderland perk: Sub-Zero Chill cools world scrolling speed by 8%
    if (this.selectedBiome === 'winter') {
      currentSpeed *= 0.92;
    }

    // Update advantage timers (Neon Cyber City perk: Neon Overdrive drains 15% slower)
    const decayRate = (this.selectedBiome === 'cyberpunk' ? 0.85 : 1.0) * dt * 1000;
    if (this.activePowerUps.shieldTimer > 0) {
      this.activePowerUps.shieldTimer = Math.max(0, this.activePowerUps.shieldTimer - decayRate);
      if (this.activePowerUps.shieldTimer <= 0) {
        this.activePowerUps.shield = false;
      }
    }
    if (this.activePowerUps.slowmoTimer > 0) {
      this.activePowerUps.slowmoTimer = Math.max(0, this.activePowerUps.slowmoTimer - decayRate);
    }
    if (this.activePowerUps.multiplierTimer > 0) {
      this.activePowerUps.multiplierTimer = Math.max(0, this.activePowerUps.multiplierTimer - decayRate);
    }
    if (this.activePowerUps.shrinkTimer > 0) {
      this.activePowerUps.shrinkTimer = Math.max(0, this.activePowerUps.shrinkTimer - decayRate);
    }
    if (this.activePowerUps.laserTimer > 0) {
      this.activePowerUps.laserTimer = Math.max(0, this.activePowerUps.laserTimer - decayRate);
    }

    // Laser ammo recharge logic (recharges 1 cell every 60s / 1 min when not in Hyper Laser mode)
    if (this.activePowerUps.laserTimer > 0) {
      this.laserAmmo = this.maxLaserAmmo;
      this.activePowerUps.laserRechargeProgress = 1;
    } else if (this.laserAmmo < this.maxLaserAmmo) {
      this.laserRechargeTimer += dt;
      this.activePowerUps.laserRechargeProgress = Math.min(1, this.laserRechargeTimer / 60);
      if (this.laserRechargeTimer >= 60) {
        this.laserAmmo = Math.min(this.maxLaserAmmo, this.laserAmmo + 1);
        this.laserRechargeTimer = 0;
        this.activePowerUps.laserRechargeProgress = this.laserAmmo < this.maxLaserAmmo ? 0 : 1;
        retroAudio.playLaserRecharge();
        this.addScorePopup(
          this.birdX + 16,
          this.birdY - 20,
          this.laserAmmo >= this.maxLaserAmmo ? 'LASER FULL (3/3)!' : `+1 LASER CHARGED (${this.laserAmmo}/${this.maxLaserAmmo})!`,
          '#38BDF8'
        );
        this.createSparkleParticles(this.birdX, this.birdY, '#38BDF8');
      }
    } else {
      this.activePowerUps.laserRechargeProgress = 1;
    }

    // Update active laser beam firing timer and 0.25s shot cooldown pause
    if (this.laserFiringTimer > 0) {
      this.laserFiringTimer = Math.max(0, this.laserFiringTimer - dt);
    }
    if (this.laserCooldownTimer > 0) {
      this.laserCooldownTimer = Math.max(0, this.laserCooldownTimer - dt);
    }

    this.activePowerUps.laserAmmo = this.laserAmmo;
    this.activePowerUps.maxLaserAmmo = this.maxLaserAmmo;
    this.activePowerUps.isLaserFiring = this.laserFiringTimer > 0;
    this.activePowerUps.laserCooldownRemaining = this.laserCooldownTimer;
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt * 1000);
    }
    if (this.slimeBounceCooldown > 0) {
      this.slimeBounceCooldown--;
    }

    // 1. Bird Physics
    // Sky Bluejay perk: Glide Drift (15% lower gravity)
    const effectiveGravity = this.selectedSkin.id === 'jay' ? 0.238 : this.gravity;
    // Astro Cosmo perk: Zero-G Parachute (caps terminal fall speed at 6.0)
    const effectiveMaxFall = this.selectedSkin.id === 'cosmo' ? 6.0 : this.maxFallSpeed;

    this.birdVy += effectiveGravity;
    if (this.birdVy > effectiveMaxFall) {
      this.birdVy = effectiveMaxFall;
    }

    // Molten Cavern perk: Thermal Updraft gently pushes bird upward if descending dangerously low
    const playableBottom = this.height - this.groundHeight;
    const distToGround = playableBottom - this.birdY;
    if (this.selectedBiome === 'volcano' && distToGround < 70 && this.birdVy > 0) {
      this.birdVy = Math.max(-1.5, this.birdVy - 0.25);
    }

    this.birdY += this.birdVy * (effectiveDt * 60);

    // Bird Rotation Interpolation (Nose down when falling)
    if (this.birdVy > 1.5) {
      this.birdRotation = Math.min(1.2, this.birdRotation + 0.045);
    }

    // Wing Flap animation frame
    if (this.flapTimer > 0) {
      this.flapTimer--;
      if (this.flapTimer <= 4) this.birdFlapFrame = 1; // Mid
    } else {
      // Periodic gliding flap in air
      const cycle = Math.floor((this.gameTime * 12) % 3);
      this.birdFlapFrame = cycle;
    }

    // Ground Scroll
    this.groundOffset += currentSpeed;

    // 2. Obstacles Update & Recycling
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= currentSpeed;

      // Dynamic behaviors (Moving, Lasers, Cogs, Crushers)
      if (obs.type === 'moving' && obs.speedY && obs.minY && obs.maxY) {
        if (obs.oscillationPhase !== undefined) {
          obs.oscillationPhase += 0.04 * timeScale;
          const range = (obs.maxY - obs.minY) / 2;
          const center = obs.minY + range;
          obs.topHeight = center + Math.sin(obs.oscillationPhase) * range;
        }
      }

      if (obs.type === 'laser') {
        if (obs.warningTimer && obs.warningTimer > 0) {
          obs.warningTimer--;
        } else {
          // Toggle laser state
          obs.laserTimer = (obs.laserTimer || 160) - 1;
          if (obs.laserTimer <= 0) {
            obs.laserTimer = 160;
            obs.laserActive = false;
            obs.warningTimer = 40;
          } else if (obs.laserTimer <= 120) {
            obs.laserActive = true;
          }
        }
      }

      if (obs.type === 'spiked_cog') {
        obs.cogAngle = (obs.cogAngle || 0) + 0.05 * timeScale;
        obs.cogY = obs.topHeight + obs.gapSize / 2 + Math.sin(this.gameTime * 3 + obs.x * 0.01) * 20;
      }

      // Check passing obstacle to award points
      if (!obs.passed && obs.x + obs.width < this.birdX) {
        obs.passed = true;
        const multiplier = this.activePowerUps.multiplierTimer > 0 ? 2 : 1;
        const addScore = 1 * multiplier;
        this.score += addScore;
        this.callbacks.onScoreChange(this.score);

        retroAudio.playScore();
        this.addScorePopup(this.birdX + 20, this.birdY - 15, `+${addScore}`, multiplier > 1 ? '#FACC15' : '#FFFFFF');

        // Cool Swag Pip perk: Swag Cashback (+1 coin on every 3rd pipe)
        if (this.selectedSkin.id === 'shades' && this.score % 3 === 0) {
          this.runCoins += 1;
          this.callbacks.onCoinsChange(this.runCoins);
          this.addScorePopup(this.birdX + 25, this.birdY - 28, '+1¢ SWAG!', '#FACC15');
        }

        // Amethyst Owl perk: Wisdom Scout (+1 coin every 5 points)
        if (this.selectedSkin.id === 'violet' && this.score % 5 === 0) {
          this.runCoins += 1;
          this.callbacks.onCoinsChange(this.runCoins);
          this.addScorePopup(this.birdX + 25, this.birdY - 28, '+1¢ WISDOM!', '#8B5CF6');
        }

        // Fiesta Pip perk: Confetti Jackpot (+5 coins every 10 points)
        if (this.selectedSkin.id === 'party' && this.score % 10 === 0) {
          this.runCoins += 5;
          this.callbacks.onCoinsChange(this.runCoins);
          this.addScorePopup(this.birdX + 25, this.birdY - 32, '+5¢ JACKPOT!', '#F43F5E');
        }

        // Milestone fireworks
        if (this.score > 0 && this.score % 10 === 0) {
          try {
            confetti({
              particleCount: 25,
              spread: 60,
              origin: { y: 0.35 },
            });
          } catch {
            // ignore
          }
        }
      }

      // Recycle offscreen obstacles
      if (obs.x + obs.width < -40) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles seamlessly - guarantees pipes NEVER stop spawning even when destroyed by lasers
    this.lastSpawnX -= currentSpeed;
    if (this.obstacles.length > 0) {
      this.lastSpawnX = Math.max(this.lastSpawnX, this.obstacles[this.obstacles.length - 1].x);
    }

    while (this.obstacles.length < 3 || this.lastSpawnX < this.width + 80) {
      const prevX = this.obstacles.length > 0 
        ? this.obstacles[this.obstacles.length - 1].x 
        : Math.max(this.width + 40, this.lastSpawnX);
      const spawnX = prevX + config.spacing;
      const { obstacle, coins, powerUps } = this.generator.generateNextObstacle(
        spawnX,
        this.height,
        this.groundHeight,
        this.difficulty,
        this.score,
        this.selectedSkin.id,
        this.selectedBiome
      );
      this.lastSpawnX = obstacle.x;
      this.obstacles.push(obstacle);
      this.coins.push(...coins);
      this.powerUps.push(...powerUps);
    }

    // 3. Update Coins & Collection
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= currentSpeed;

      // Emerald Sprite or Midnight Moon coin magnet attraction
      if (!coin.collected) {
        if (this.selectedSkin.id === 'emerald' || this.selectedBiome === 'night') {
          const magnetReach = this.selectedSkin.id === 'emerald' ? 65 : 45;
          const dx = this.birdX - coin.x;
          const dy = this.birdY - coin.y;
          const dist = Math.hypot(dx, dy);
          if (dist < magnetReach) {
            coin.x += (dx / dist) * 7.5;
            coin.y += (dy / dist) * 7.5;
          }
        }

        const dx = coin.x - this.birdX;
        const dy = (coin.y + Math.sin(this.gameTime * 6 + coin.x) * 3) - this.birdY;
        const dist = Math.hypot(dx, dy);
        const hitRadius = (this.activePowerUps.shrinkTimer > 0 ? 10 : 14) + coin.radius;

        if (dist < hitRadius) {
          coin.collected = true;
          const multiplier = this.activePowerUps.multiplierTimer > 0 ? 2 : 1;
          // Retro Sunset perk: Golden Hour Surplus (+1¢ to every coin collected)
          const extraSunsetCoin = this.selectedBiome === 'sunset' ? 1 : 0;
          const coinVal = (coin.value + extraSunsetCoin) * multiplier;
          this.runCoins += coinVal;
          this.callbacks.onCoinsChange(this.runCoins);
          retroAudio.playCoin();

          this.addScorePopup(coin.x, coin.y - 10, `+${coinVal}¢`, '#FACC15');
          this.createSparkleParticles(coin.x, coin.y, '#FDE047');
        }
      }

      if (coin.x < -30 || coin.collected) {
        this.coins.splice(i, 1);
      }
    }

    // 4. Update Power-Ups & Collection
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pw = this.powerUps[i];
      pw.x -= currentSpeed;

      // Steampunk Aviator perk: Aeronaut Radar (attracts power-ups from 85px away)
      if (!pw.collected) {
        if (this.selectedSkin.id === 'goggles') {
          const dx = this.birdX - pw.x;
          const dy = this.birdY - pw.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 85) {
            pw.x += (dx / dist) * 6.5;
            pw.y += (dy / dist) * 6.5;
          }
        }

        const dx = pw.x - this.birdX;
        const dy = (pw.y + Math.sin(this.gameTime * 4 + pw.bobOffset) * 5) - this.birdY;
        const dist = Math.hypot(dx, dy);
        const hitRadius = (this.activePowerUps.shrinkTimer > 0 ? 10 : 14) + pw.radius;

        if (dist < hitRadius) {
          pw.collected = true;
          this.applyPowerUp(pw.type);
          retroAudio.playPowerUp();
          this.createSparkleParticles(pw.x, pw.y, '#38BDF8');
        }
      }

      if (pw.x < -30 || pw.collected) {
        this.powerUps.splice(i, 1);
      }
    }

    // 5. Update Particles
    this.updateParticles();

    // 6. Update Score Popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y -= 0.8;
      sp.life++;
      sp.alpha = Math.max(0, 1 - sp.life / 35);
      if (sp.life >= 35) {
        this.scorePopups.splice(i, 1);
      }
    }

    // 7. Check Collisions (Top & Bottom Edges, Pipes, Hazards)
    this.checkCollisions();
  }

  /**
   * Apply Acquired Power-Up Effect (Cyber Synthwave perk: 13-Second Overclock Duration)
   */
  private applyPowerUp(type: PowerUpItem['type']) {
    const POWERUP_DURATION_MS = this.selectedSkin.id === 'cyber' ? 13000 : 10000;
    if (type === 'shield') {
      this.activePowerUps.shield = true;
      this.activePowerUps.shieldTimer = POWERUP_DURATION_MS;
      this.addScorePopup(this.birdX, this.birdY - 20, 'SHIELD UP!', '#38BDF8');
    } else if (type === 'slowmo') {
      this.activePowerUps.slowmoTimer = POWERUP_DURATION_MS;
      this.addScorePopup(this.birdX, this.birdY - 20, 'SLOW-MO!', '#A78BFA');
    } else if (type === 'multiplier') {
      this.activePowerUps.multiplierTimer = POWERUP_DURATION_MS;
      this.addScorePopup(this.birdX, this.birdY - 20, '2X POINTS!', '#FACC15');
    } else if (type === 'shrink') {
      this.activePowerUps.shrinkTimer = POWERUP_DURATION_MS;
      this.addScorePopup(this.birdX, this.birdY - 20, 'MINI BIRD!', '#34D399');
    } else if (type === 'laser') {
      const LASER_POWERUP_DURATION_MS = this.selectedSkin.id === 'cyber' ? 5000 : 2000;
      this.activePowerUps.laserTimer = LASER_POWERUP_DURATION_MS;
      this.hyperLaserPipesDestroyed = 0;
      this.laserAmmo = this.maxLaserAmmo;
      this.addScorePopup(this.birdX, this.birdY - 20, 'UNLIMITED LASER (2s / 4 PIPES)!', '#EF4444');
      this.fireLaser(true);
    }
  }

  /**
   * Precise & Fair Collision Detection (Generous & Forgiving)
   */
  private checkCollisions() {
    // Shinobi Shadow perk: Shadow Slipstream (-15% smaller hitbox)
    const baseRadius = this.activePowerUps.shrinkTimer > 0 ? 5.5 : 8.5;
    const birdRadius = baseRadius * (this.selectedSkin.id === 'ninja' ? 0.85 : 1.0);
    const playableBottom = this.height - this.groundHeight;

    // Bottom Edge / Ground Collision
    if (this.birdY + birdRadius >= playableBottom) {
      // Radioactive Slime perk: Slime Bounce cushions and launches upward
      if (this.selectedSkin.id === 'toxic' && this.slimeBounceCooldown <= 0) {
        this.slimeBounceCooldown = 40;
        this.birdY = playableBottom - birdRadius - 8;
        this.birdVy = -6.2;
        retroAudio.playFlap();
        this.addScorePopup(this.birdX, playableBottom - 25, 'SLIME BOUNCE!', '#84CC16');
        this.createSparkleParticles(this.birdX, playableBottom - 4, '#84CC16');
        return;
      }

      if (this.activePowerUps.shield) {
        this.activePowerUps.shield = false;
        this.activePowerUps.shieldTimer = 0;
        // Ghost Specter perk: +50% longer i-frames
        this.invulnerableTimer = this.selectedSkin.id === 'phantom' ? 1800 : 1200;
        retroAudio.playShieldBreak();
        this.addScorePopup(this.birdX, playableBottom - 30, 'SHIELD SAVED!', '#38BDF8');
        this.createPixelExplosion(this.birdX, playableBottom - birdRadius, false, false);
        this.birdY = playableBottom - birdRadius - 6;
        this.birdVy = -6.5; // Rebound upward
        return;
      }

      if (this.invulnerableTimer > 0) {
        this.birdY = playableBottom - birdRadius - 4;
        this.birdVy = -5.0;
        return;
      }

      this.handleFatalHit();
      return;
    }

    // Top Edge / Ceiling Collision
    if (this.birdY - birdRadius <= 0) {
      if (this.activePowerUps.shield) {
        this.activePowerUps.shield = false;
        this.activePowerUps.shieldTimer = 0;
        this.invulnerableTimer = this.selectedSkin.id === 'phantom' ? 1800 : 1200;
        retroAudio.playShieldBreak();
        this.addScorePopup(this.birdX, 30, 'SHIELD SAVED!', '#38BDF8');
        this.createPixelExplosion(this.birdX, birdRadius, false, false);
        this.birdY = birdRadius + 6;
        this.birdVy = 3.0; // Rebound downward
        return;
      }

      if (this.invulnerableTimer > 0) {
        this.birdY = birdRadius + 4;
        this.birdVy = 2.0;
        return;
      }

      this.handleFatalHit();
      return;
    }

    // If invulnerable (e.g. from shield break), skip obstacle damage
    if (this.invulnerableTimer > 0) {
      return;
    }

    // Obstacle Hitbox checks with generous safety padding
    const edgeCushion = 4; // 4px margin of safety
    for (const obs of this.obstacles) {
      const pipeLeft = obs.x + edgeCushion;
      const pipeRight = obs.x + obs.width - edgeCushion;

      // Optimization: Only check if bird is within pipe horizontal span
      if (this.birdX + birdRadius > pipeLeft && this.birdX - birdRadius < pipeRight) {
        const topPipeBottom = obs.topHeight - edgeCushion;
        const bottomPipeTop = obs.topHeight + obs.gapSize + edgeCushion;

        // Top Pipe Collision
        if (this.birdY - birdRadius < topPipeBottom) {
          this.handleHit();
          return;
        }

        // Bottom Pipe Collision
        if (this.birdY + birdRadius > bottomPipeTop) {
          this.handleHit();
          return;
        }

        // Specialized Hazard Collisions
        if (obs.type === 'laser' && obs.laserActive) {
          // Mecha Iron-Wing perk: Titanium Armor deflects laser hazards!
          if (this.selectedSkin.id === 'mecha') {
            this.createSparkleParticles(this.birdX, this.birdY, '#38BDF8');
          } else {
            this.handleHit();
            return;
          }
        }

        if (obs.type === 'spiked_cog') {
          const cogY = obs.cogY || (obs.topHeight + obs.gapSize / 2);
          const cogX = obs.x + obs.width / 2;
          const cogRadius = (obs.cogRadius || 14) * 0.75;
          const dist = Math.hypot(this.birdX - cogX, this.birdY - cogY);
          if (dist < birdRadius + cogRadius) {
            this.handleHit();
            return;
          }
        }
      }
    }
  }

  private handleHit() {
    // If shield active, absorb damage
    if (this.activePowerUps.shield) {
      this.activePowerUps.shield = false;
      this.activePowerUps.shieldTimer = 0;
      // Ghost Specter perk: Ghost Phase gives 1.8s invulnerability frames
      this.invulnerableTimer = this.selectedSkin.id === 'phantom' ? 1800 : 1200;
      retroAudio.playShieldBreak();
      this.addScorePopup(this.birdX, this.birdY - 20, 'SHIELD BROKE!', '#38BDF8');
      this.createPixelExplosion(this.birdX, this.birdY, false, true);
      return;
    }

    this.handleFatalHit();
  }

  private handleFatalHit() {
    // Seraphim Pip perk: Divine Second Chance (Revives once per run!)
    if (this.selectedSkin.id === 'angel' && !this.usedAngelRevival) {
      this.usedAngelRevival = true;
      this.activePowerUps.shield = true;
      this.activePowerUps.shieldTimer = 10000;
      this.invulnerableTimer = 2200;
      this.birdVy = -4.5;
      retroAudio.playPowerUp();
      this.addScorePopup(this.birdX, this.birdY - 25, 'DIVINE REVIVAL!', '#FEF08A');
      this.createSparkleParticles(this.birdX, this.birdY, '#FEF08A');
      return;
    }

    this.state = 'GAMEOVER';
    this.callbacks.onStateChange('GAMEOVER');

    retroAudio.playHit();
    retroAudio.playGameOver();
    retroAudio.stopMusic();

    // Haptic crash pattern
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 50, 100]);
      } catch {
        // ignore
      }
    }

    // High-impact pixel explosion with bird color palette & obstacle fragments
    this.createPixelExplosion(this.birdX, this.birdY, true, true);

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }

    this.callbacks.onGameOver(this.score, this.runCoins, isNewHigh);
  }

  /**
   * Update Particles physics, ground bouncing, air drag, rotation, and alpha fade-out
   */
  private updateParticles(isGameOver = false) {
    const playableBottom = this.height - this.groundHeight;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Drag / air friction
      const drag = p.drag ?? (p.shape === 'pixel' ? 0.97 : 0.98);
      p.vx *= drag;

      // Gravity
      const gravity = p.gravity ?? (p.shape === 'pixel' ? 0.22 : 0);
      p.vy += gravity;

      p.x += p.vx;
      p.y += p.vy;

      // Dynamic rotation tumbling
      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot;
      }

      // Ground bounce
      if (p.bounce && p.y + p.size >= playableBottom) {
        p.y = playableBottom - p.size;
        p.vy = -p.vy * p.bounce;
        p.vx *= 0.65;
        if (Math.abs(p.vy) < 0.4) {
          p.vy = 0;
        }
      }

      // Ceiling bounce if blown upwards
      if (p.y < 0) {
        p.y = 0;
        p.vy = Math.abs(p.vy) * 0.5;
      }

      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        // Fast O(1) swap-and-pop removal instead of O(N) splice
        const lastIdx = this.particles.length - 1;
        if (i !== lastIdx) {
          this.particles[i] = this.particles[lastIdx];
        }
        this.particles.pop();
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.6);
    }
  }

  /**
   * Generates a lightweight retro 'pixel explosion' effect when the bird dies or impacts an obstacle
   */
  public createPixelExplosion(x: number, y: number, isFatal = true, hitObstacle = false) {
    const skin = this.selectedSkin.colorScheme;
    const colors = [
      skin.body,
      skin.body,
      skin.wing,
      skin.belly,
      skin.beak,
      skin.eye,
      skin.outline,
      skin.trailColor,
      '#FFFFFF',
      '#FACC15',
      '#EF4444',
    ];

    const particleCount = isFatal ? 42 : 18;

    // 1. Bird Pixel Debris (multi-sized pixel chunks scattering with physics)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isFatal ? 2.5 : 1.5) + Math.random() * (isFatal ? 6.5 : 3.5);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() < 0.3 ? 5 : Math.random() < 0.6 ? 4 : 3;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isFatal ? 2.2 : 0.8), // slight upward arc
        size,
        color,
        alpha: 1,
        life: 0,
        maxLife: isFatal ? 45 + Math.floor(Math.random() * 25) : 25 + Math.floor(Math.random() * 15),
        shape: 'pixel',
        gravity: 0.22,
        drag: 0.97,
        bounce: 0.45,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
      });
    }

    // 2. High-speed Shockwave Sparkle Pixels (expanding outward ring)
    const shockCount = isFatal ? 14 : 8;
    for (let i = 0; i < shockCount; i++) {
      const angle = (i / shockCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = (isFatal ? 6.0 : 4.0) + Math.random() * 3.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5,
        color: Math.random() < 0.5 ? '#FFFFFF' : '#FDE047',
        alpha: 1,
        life: 0,
        maxLife: 16,
        shape: 'sparkle',
        drag: 0.92,
      });
    }

    // 3. If obstacle impact, add obstacle fragment pixels
    if (hitObstacle) {
      const obsColors = ['#15803D', '#22C55E', '#4ADE80', '#166534', '#94A3B8'];
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 4.5;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 3 + Math.floor(Math.random() * 3),
          color: obsColors[Math.floor(Math.random() * obsColors.length)],
          alpha: 1,
          life: 0,
          maxLife: 35 + Math.floor(Math.random() * 15),
          shape: 'pixel',
          gravity: 0.25,
          drag: 0.96,
          bounce: 0.4,
        });
      }
    }

    // 4. Trigger arcade screen shake
    this.screenShake = isFatal ? 7 : 3.5;
  }

  /**
   * Particle & Popup Creators
   */
  private createJumpParticles() {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: this.birdX - 10 + Math.random() * 4,
        y: this.birdY + 5 + Math.random() * 4,
        vx: -1.5 - Math.random() * 1.5,
        vy: 0.5 + Math.random() * 1.2,
        size: 2.5,
        color: this.selectedSkin.colorScheme.trailColor,
        alpha: 0.9,
        life: 0,
        maxLife: 15,
        shape: 'square',
      });
    }
  }

  private createSparkleParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spd = 1.8 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20,
        shape: 'sparkle',
      });
    }
  }

  private createExplosionParticles(x: number, y: number, color: string, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 35 + Math.random() * 15,
        shape: 'pixel',
      });
    }
  }

  private addScorePopup(x: number, y: number, text: string, color: string) {
    this.scorePopups.push({
      id: `sp-${Date.now()}-${Math.random()}`,
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 0,
    });
  }

  /**
   * Render Everything to Canvas
   */
  public render() {
    const ctx = this.ctx;
    const biome = BIOMES[this.selectedBiome] || BIOMES.day;

    ctx.save();

    // 0. Arcade Screen Shake on death / impact
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Parallax Background
    drawBackground(
      ctx,
      this.width,
      this.height,
      biome,
      this.groundOffset,
      this.groundHeight,
      this.gameTime
    );

    // 2. Obstacles
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, biome, this.height - this.groundHeight, this.gameTime);
    }

    // 3. Collectibles & Power-Ups
    for (const coin of this.coins) {
      drawCoin(ctx, coin, this.gameTime);
    }
    for (const pw of this.powerUps) {
      drawPowerUp(ctx, pw, this.gameTime);
    }

    // 4. Bird Sprite (Flicker when invulnerable)
    const shouldFlicker = this.invulnerableTimer > 0 && Math.floor(this.gameTime * 25) % 2 === 0;
    if (!shouldFlicker && this.state !== 'GAMEOVER') {
      drawPixelBird(
        ctx,
        this.birdX,
        this.birdY,
        this.selectedSkin,
        this.birdRotation,
        this.birdFlapFrame,
        1,
        this.activePowerUps
      );
    }

    // 4.5. Flappy Bird Laser Cannon Beam & Impact Shockwave Flash
    if (this.laserFiringTimer > 0) {
      const isHyper = this.activePowerUps.laserTimer > 0;
      const beamHitX = this.laserBeamHitX || (this.width + 20);
      drawLaserBeam(
        ctx,
        this.birdX + 16,
        this.birdY,
        beamHitX,
        this.gameTime,
        isHyper
      );

      // Render high-contrast expanding impact shockwave ring at the exact hit coordinate
      const progress = 1 - this.laserFiringTimer / 0.20;
      const ringRadius = 8 + progress * 28;
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = isHyper ? '#00F0FF' : '#FF1744';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(beamHitX, this.laserBeamHitY || this.birdY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((beamHitX - 5) | 0, ((this.laserBeamHitY || this.birdY) - 5) | 0, 10, 10);
      ctx.globalAlpha = 1;
    }

    // 5. Canvas-Optimized Particle Renderer (Zero per-particle save/restore overhead)
    if (this.particles.length > 0) {
      for (let i = 0, len = this.particles.length; i < len; i++) {
        const p = this.particles[i];
        const px = p.x | 0;
        const py = p.y | 0;
        const sz = p.size;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        if (p.shape === 'sparkle') {
          const half = (sz * 0.5) | 0;
          ctx.fillRect(px - half, py - half, sz, sz);
          ctx.fillRect(px - sz, py - 1, sz * 2, 2);
          ctx.fillRect(px - 1, py - sz, 2, sz * 2);
        } else {
          ctx.fillRect(px, py, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
    }

    // 6. Floating Score Popups
    for (const sp of this.scorePopups) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(sp.text, sp.x + 1, sp.y + 1);
      ctx.fillStyle = sp.color;
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

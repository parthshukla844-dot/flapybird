import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  Difficulty, 
  BiomeType, 
  BirdSkin, 
  ActivePowerUps,
  HistoryEntry,
  DailyMission,
  DailyMissionsState,
  DailyStreakState
} from './types';
import { SKINS, BIOMES, BIOME_ITEMS } from './game/pixelArt';
import { FlappyEngine } from './game/engine';
import { retroAudio } from './game/audio';
import { 
  loadOrInitDailyMissions, 
  generateDailyMissions, 
  saveDailyMissions, 
  resetDailyMissionsHistory,
  applyMissionEvent,
  claimDailyMissionReward
} from './game/dailyMissions';
import {
  loadDailyStreak,
  recordDailyStreakPlay,
  resetDailyStreak,
  getStreakMultiplier,
  formatMultiplier,
  hasPlayedToday,
} from './game/dailyStreak';
import { ArcadeHUD } from './components/ArcadeHUD';
import { MenuScreen } from './components/MenuScreen';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { PauseScreen } from './components/PauseScreen';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { InstructionsModal } from './components/InstructionsModal';
import { HistoryModal } from './components/HistoryModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { DailyMissionsLeaderboardModal } from './components/DailyMissionsLeaderboardModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { MissionToast } from './components/MissionToast';
import { Sparkles, CloudSun, RotateCcw, Maximize2, Minimize2, History, Target, Flame, Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'FLAPPY_PIXEL_DATA_V2';
const HISTORY_STORAGE_KEY = 'FLAPPY_PIXEL_HISTORY_V1';

export default function App() {
  // Canvas & Engine Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cabinetRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FlappyEngine | null>(null);

  // Persistent User State
  const [highScore, setHighScore] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['pip']);
  const [selectedSkin, setSelectedSkin] = useState<BirdSkin>(SKINS[0]);
  const [unlockedBiomes, setUnlockedBiomes] = useState<string[]>(['day']);
  const [selectedBiome, setSelectedBiome] = useState<BiomeType>('day');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const crtFilterEnabled = false;
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Live Game State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [runCoins, setRunCoins] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [lastRunConfig, setLastRunConfig] = useState<{
    difficulty: Difficulty;
    biome: BiomeType;
  }>({ difficulty: 'medium', biome: 'day' });
  const lastRunConfigRef = useRef<{ difficulty: Difficulty; biome: BiomeType }>({
    difficulty: 'medium',
    biome: 'day',
  });
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isMissionsLeaderboardOpen, setIsMissionsLeaderboardOpen] = useState<boolean>(false);
  const [isStreakOpen, setIsStreakOpen] = useState<boolean>(false);
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(() => loadOrInitDailyMissions());
  const missionsStateRef = useRef<DailyMissionsState>(missionsState);
  const [missionToastQueue, setMissionToastQueue] = useState<DailyMission[]>([]);
  const [streakState, setStreakState] = useState<DailyStreakState>(() => loadDailyStreak());
  const streakStateRef = useRef<DailyStreakState>(streakState);
  const streakMultiplier = getStreakMultiplier(streakState.currentStreak);
  const streakMultiplierRef = useRef<number>(streakMultiplier);
  const [streakToast, setStreakToast] = useState<{
    streak: number;
    multiplier: number;
    unlockedNewMultiplier: boolean;
  } | null>(null);
  const streakToastTimeoutRef = useRef<number | null>(null);
  const [shopInitialTab, setShopInitialTab] = useState<'avatars' | 'weathers'>('avatars');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);
  const resetToastTimeoutRef = useRef<number | null>(null);

  // Refs for stable mission tracking without tearing down FlappyEngine
  const highScoreRef = useRef<number>(highScore);
  const totalCoinsRef = useRef<number>(totalCoins);
  const unlockedSkinsRef = useRef<string[]>(unlockedSkins);
  const selectedSkinRef = useRef<BirdSkin>(selectedSkin);
  const unlockedBiomesRef = useRef<string[]>(unlockedBiomes);
  const selectedBiomeRef = useRef<BiomeType>(selectedBiome);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const musicEnabledRef = useRef<boolean>(musicEnabled);

  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);
  useEffect(() => { totalCoinsRef.current = totalCoins; }, [totalCoins]);
  useEffect(() => { unlockedSkinsRef.current = unlockedSkins; }, [unlockedSkins]);
  useEffect(() => { selectedSkinRef.current = selectedSkin; }, [selectedSkin]);
  useEffect(() => { unlockedBiomesRef.current = unlockedBiomes; }, [unlockedBiomes]);
  useEffect(() => {
    selectedBiomeRef.current = selectedBiome;
    retroAudio.setBiome(selectedBiome);
  }, [selectedBiome]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { musicEnabledRef.current = musicEnabled; }, [musicEnabled]);
  useEffect(() => { missionsStateRef.current = missionsState; }, [missionsState]);
  useEffect(() => { streakStateRef.current = streakState; }, [streakState]);
  useEffect(() => { streakMultiplierRef.current = streakMultiplier; }, [streakMultiplier]);

  // Refresh streak & daily missions when tab regains focus (handles midnight rollover)
  useEffect(() => {
    const handleFocus = () => {
      const freshStreak = loadDailyStreak();
      streakStateRef.current = freshStreak;
      setStreakState(freshStreak);
      const freshMissions = loadOrInitDailyMissions();
      missionsStateRef.current = freshMissions;
      setMissionsState(freshMissions);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (missionToastQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setMissionToastQueue((prev) => prev.slice(1));
    }, 3800);
    return () => window.clearTimeout(timer);
  }, [missionToastQueue]);

  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUps>({
    shield: false,
    shieldTimer: 0,
    slowmoTimer: 0,
    multiplierTimer: 0,
    shrinkTimer: 0,
    laserTimer: 0,
    laserAmmo: 3,
    maxLaserAmmo: 3,
    isLaserFiring: false,
  });

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('FLAPPY_PIXEL_DATA_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.highScore === 'number') setHighScore(parsed.highScore);
        if (typeof parsed.totalCoins === 'number') setTotalCoins(parsed.totalCoins);
        if (Array.isArray(parsed.unlockedSkins)) setUnlockedSkins(parsed.unlockedSkins);
        if (Array.isArray(parsed.unlockedBiomes)) setUnlockedBiomes(parsed.unlockedBiomes);
        if (parsed.selectedSkinId) {
          const found = SKINS.find((s) => s.id === parsed.selectedSkinId);
          if (found) setSelectedSkin(found);
        }
        if (parsed.difficulty) {
          if (parsed.difficulty === 'easy' || parsed.difficulty === 'medium' || parsed.difficulty === 'hard') {
            setDifficulty(parsed.difficulty);
          }
        }
        if (parsed.selectedBiome && parsed.selectedBiome !== 'random') {
          const validBiomes: BiomeType[] = ['day', 'night', 'sunset', 'cyberpunk', 'volcano', 'winter'];
          if (validBiomes.includes(parsed.selectedBiome)) {
            setSelectedBiome(parsed.selectedBiome);
          } else {
            setSelectedBiome('day');
          }
        } else {
          setSelectedBiome('day');
        }
        if (typeof parsed.soundEnabled === 'boolean') {
          setSoundEnabled(parsed.soundEnabled);
          retroAudio.setSoundEnabled(parsed.soundEnabled);
        }
        if (typeof parsed.musicEnabled === 'boolean') {
          setMusicEnabled(parsed.musicEnabled);
          retroAudio.setMusicEnabled(parsed.musicEnabled);
        }
        if (Array.isArray(parsed.history)) {
          setHistory(parsed.history);
        }
      }

      // Check dedicated history key
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist) && parsedHist.length > 0) {
          setHistory(parsedHist);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to local storage
  const saveState = useCallback((
    newHighScore: number,
    newTotalCoins: number,
    newUnlockedSkins: string[],
    skinId: string,
    newUnlockedBiomes: string[],
    biome: BiomeType,
    diff: Difficulty,
    crt: boolean,
    snd: boolean,
    mus: boolean
  ) => {
    try {
      const payload = {
        highScore: newHighScore,
        totalCoins: newTotalCoins,
        unlockedSkins: newUnlockedSkins,
        selectedSkinId: skinId,
        unlockedBiomes: newUnlockedBiomes,
        selectedBiome: biome,
        difficulty: diff,
        crtFilterEnabled: crt,
        soundEnabled: snd,
        musicEnabled: mus,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, []);

  // Append new event into permanent career history log
  const addHistoryEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) => {
    const fullEntry: HistoryEntry = {
      id: entry.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: entry.type,
      timestamp: entry.timestamp || Date.now(),
      title: entry.title,
      description: entry.description,
      details: entry.details,
    };
    setHistory((prev) => {
      const updated = [fullEntry, ...prev];
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Process live & end-of-run Daily Mission milestones without destabilizing FlappyEngine
  const processMissionEvent = useCallback((event: {
    type: 'score' | 'coin' | 'laser_destroy' | 'powerup_collect' | 'game_over';
    value?: number;
  }): DailyMission[] => {
    const result = applyMissionEvent(missionsStateRef.current, {
      ...event,
      biome: selectedBiomeRef.current,
      difficulty: difficultyRef.current,
    });

    if (result.changed) {
      missionsStateRef.current = result.nextState;
      setMissionsState(result.nextState);
    }

    if (result.newlyCompleted.length > 0) {
      retroAudio.playPowerUp();
      setMissionToastQueue((prev) => [...prev, ...result.newlyCompleted]);
    }

    return result.newlyCompleted;
  }, []);

  // Explicitly claim a completed mission's reward coins and add them directly to total balance
  const handleClaimMissionReward = useCallback((missionId: string) => {
    const { nextState, rewardCoins, claimedMission } = claimDailyMissionReward(
      missionsStateRef.current,
      missionId
    );
    if (!claimedMission || rewardCoins <= 0) return;

    missionsStateRef.current = nextState;
    setMissionsState(nextState);
    retroAudio.playCoin();

    setTotalCoins((prev) => {
      const updated = prev + rewardCoins;
      totalCoinsRef.current = updated;
      saveState(
        highScoreRef.current,
        updated,
        unlockedSkinsRef.current,
        selectedSkinRef.current.id,
        unlockedBiomesRef.current,
        selectedBiomeRef.current,
        difficultyRef.current,
        crtFilterEnabled,
        soundEnabledRef.current,
        musicEnabledRef.current
      );
      return updated;
    });
  }, [saveState]);

  // Initialize Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FlappyEngine(canvas, {
      onScoreChange: (score) => {
        setCurrentScore(score);
        processMissionEvent({ type: 'score', value: score });
      },
      onCoinsChange: (coins) => {
        setRunCoins(coins);
      },
      onCoinCollect: (amount) => {
        processMissionEvent({ type: 'coin', value: amount });
      },
      onLaserDestroy: () => {
        processMissionEvent({ type: 'laser_destroy', value: 1 });
      },
      onPowerUpCollect: () => {
        processMissionEvent({ type: 'powerup_collect', value: 1 });
      },
      onStateChange: (state) => {
        setGameState(state);
      },
      onGameOver: (finalScore, earnedCoins, newHigh) => {
        setIsNewHighScore(newHigh);
        processMissionEvent({ type: 'game_over' });

        // Record Medal Win into Permanent History if score qualifies (score >= 10), or record No Medal entry
        if (finalScore >= 10) {
          const medalTier = finalScore >= 1500
            ? 'OBSIDIAN'
            : finalScore >= 1000 
            ? 'DIAMOND' 
            : finalScore >= 75 
            ? 'PLATINUM' 
            : finalScore >= 50 
            ? 'GOLD' 
            : finalScore >= 25 
            ? 'SILVER' 
            : 'BRONZE';

          addHistoryEntry({
            type: 'medal',
            title: `${medalTier} MEDAL WON!`,
            description: `Scored ${finalScore} points with ${selectedSkin.name} in ${selectedBiome.toUpperCase()} realm (${difficulty.toUpperCase()} mode). Earned +${earnedCoins}¢ coins.`,
            details: {
              medalTier,
              score: finalScore,
              coinsEarned: earnedCoins,
              skinName: selectedSkin.name,
              biomeName: selectedBiome,
              difficulty,
            },
          });
        } else {
          // Record 'No Medal' flight into permanent career history log
          addHistoryEntry({
            type: 'medal',
            title: `NO MEDAL (SCORE ${finalScore})`,
            description: `Flight completed with ${selectedSkin.name} in ${selectedBiome.toUpperCase()} realm (${difficulty.toUpperCase()} mode). Scored ${finalScore} pts (Reach 10+ for Bronze). Earned +${earnedCoins}¢ coins.`,
            details: {
              medalTier: 'NO MEDAL',
              score: finalScore,
              coinsEarned: earnedCoins,
              skinName: selectedSkin.name,
              biomeName: selectedBiome,
              difficulty,
            },
          });
        }

        setTotalCoins((prev) => {
          const updated = prev + earnedCoins;
          setHighScore((prevHigh) => {
            const nextHigh = Math.max(prevHigh, finalScore);
            saveState(
              nextHigh,
              updated,
              unlockedSkins,
              selectedSkin.id,
              unlockedBiomes,
              selectedBiome,
              difficulty,
              crtFilterEnabled,
              soundEnabledRef.current,
              musicEnabledRef.current
            );

            return nextHigh;
          });
          return updated;
        });
      },
    });

    engine.setDifficulty(difficulty);
    engine.setBiome(selectedBiome);
    engine.setSkin(selectedSkin);
    engine.setHighScore(highScore);
    engine.setStreakMultiplier(streakMultiplierRef.current);
    engine.render();

    engineRef.current = engine;

    // Power-up sync timer for smooth sliding bar
    const interval = setInterval(() => {
      if (engineRef.current) {
        setActivePowerUps({ ...engineRef.current.activePowerUps });
      }
    }, 33);

    return () => {
      engine.stop();
      clearInterval(interval);
    };
  }, [saveState, processMissionEvent, unlockedBiomes, unlockedSkins, selectedSkin.id, selectedBiome, difficulty, crtFilterEnabled, highScore]);

  // Sync settings with engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDifficulty(difficulty);
      engineRef.current.setBiome(selectedBiome);
      engineRef.current.setSkin(selectedSkin);
      engineRef.current.setHighScore(highScore);
      engineRef.current.setStreakMultiplier(streakMultiplier);
    }
  }, [difficulty, selectedBiome, selectedSkin, highScore, streakMultiplier]);

  // Global Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isTyping) {
        return;
      }

      if (e.code === 'KeyI') {
        e.preventDefault();
        retroAudio.playSelect();
        setIsInstructionsOpen((prev) => {
          if (!prev && gameState === 'PLAYING') {
            engineRef.current?.pause();
          }
          return !prev;
        });
        return;
      }

      if (
        e.code === 'KeyX' || 
        e.code === 'KeyL' || 
        e.code === 'KeyE' || 
        e.code === 'KeyZ' || 
        e.code === 'ShiftLeft' || 
        e.code === 'ShiftRight'
      ) {
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isMissionsOpen || isMissionsLeaderboardOpen || isStreakOpen || isResetModalOpen) return;
        if (gameState === 'PLAYING') {
          e.preventDefault();
          engineRef.current?.fireLaser();
          return;
        }
      }

      if (e.code === 'KeyR') {
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isMissionsOpen || isMissionsLeaderboardOpen || isStreakOpen || isResetModalOpen) return;
        if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') {
          e.preventDefault();
          retroAudio.playSelect();
          if (gameState === 'GAMEOVER') {
            handleQuickRestart();
          } else {
            handleStartGame();
          }
          setResetToastMessage('FLIGHT RESTARTED: Ready, Set, Fly!');
          if (resetToastTimeoutRef.current) clearTimeout(resetToastTimeoutRef.current);
          resetToastTimeoutRef.current = window.setTimeout(() => {
            setResetToastMessage(null);
            resetToastTimeoutRef.current = null;
          }, 2500);
          return;
        }
      }

      if (e.code === 'KeyH') {
        e.preventDefault();
        retroAudio.playSelect();
        setIsHistoryOpen((prev) => {
          if (!prev && gameState === 'PLAYING') {
            engineRef.current?.pause();
          }
          return !prev;
        });
        return;
      }

      if (e.code === 'KeyD') {
        e.preventDefault();
        retroAudio.playSelect();
        setIsMissionsOpen((prev) => {
          if (!prev) {
            if (gameState === 'PLAYING') {
              engineRef.current?.pause();
            }
            const fresh = loadOrInitDailyMissions();
            missionsStateRef.current = fresh;
            setMissionsState(fresh);
          }
          return !prev;
        });
        return;
      }

      if (e.code === 'Escape') {
        if (isMissionsLeaderboardOpen) {
          e.preventDefault();
          retroAudio.playSelect();
          setIsMissionsLeaderboardOpen(false);
          return;
        }
        if (isStreakOpen) {
          e.preventDefault();
          retroAudio.playSelect();
          setIsStreakOpen(false);
          return;
        }
        if (isMissionsOpen) {
          e.preventDefault();
          retroAudio.playSelect();
          setIsMissionsOpen(false);
          return;
        }
        if (isHistoryOpen) {
          e.preventDefault();
          retroAudio.playSelect();
          setIsHistoryOpen(false);
          return;
        }
        if (isInstructionsOpen) {
          e.preventDefault();
          retroAudio.playSelect();
          setIsInstructionsOpen(false);
          return;
        }
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isMissionsOpen || isMissionsLeaderboardOpen || isStreakOpen || isResetModalOpen) return;

        if (gameState === 'PLAYING') {
          engineRef.current?.flap();
        } else if (gameState === 'MENU' || gameState === 'GAMEOVER') {
          handleStartGame();
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.pause();
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
        }
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        toggleSound();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMusic();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isShopOpen, isInstructionsOpen, isHistoryOpen, isMissionsOpen, isMissionsLeaderboardOpen, isStreakOpen, isResetModalOpen]);

  // Responsive Cabinet & Device Orientation Resize Observer
  useEffect(() => {
    const cabinet = cabinetRef.current;
    if (!cabinet) return;

    let frameId: number | null = null;
    let lastW = 0;
    let lastH = 0;

    const handleResize = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (engineRef.current && canvasRef.current && cabinetRef.current) {
          const rect = cabinetRef.current.getBoundingClientRect();
          const w = Math.round(rect.width);
          const h = Math.round(rect.height);
          if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
            lastW = w;
            lastH = h;
            engineRef.current.resizeCanvas(w, h);
          }
        }
      });
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(cabinet);

    const onOrientationChange = () => {
      handleResize();
      setTimeout(handleResize, 50);
      setTimeout(handleResize, 180);
      setTimeout(handleResize, 350);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', onOrientationChange);
    if (window.screen && 'orientation' in window.screen && window.screen.orientation) {
      try {
        window.screen.orientation.addEventListener('change', onOrientationChange);
      } catch {
        // ignore
      }
    }

    const onFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      handleResize();
      setTimeout(handleResize, 60);
      setTimeout(handleResize, 200);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', onOrientationChange);
      if (window.screen && 'orientation' in window.screen && window.screen.orientation) {
        try {
          window.screen.orientation.removeEventListener('change', onOrientationChange);
        } catch {
          // ignore
        }
      }
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    retroAudio.playSelect();
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        try {
          const target = document.getElementById('arcade-main-viewport') || document.documentElement;
          if (!document.fullscreenElement && target.requestFullscreen) {
            target.requestFullscreen().catch(() => {});
          }
        } catch {
          // ignore
        }
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      const doResize = () => {
        if (cabinetRef.current && engineRef.current) {
          const rect = cabinetRef.current.getBoundingClientRect();
          engineRef.current.resizeCanvas(rect.width, rect.height);
        }
      };
      doResize();
      setTimeout(doResize, 60);
      setTimeout(doResize, 180);
      return next;
    });
  };

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState === 'PLAYING') {
      e.preventDefault();
      engineRef.current?.flap();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
      engineRef.current?.fireLaser();
    }
  };

  const handleStartGame = (diff?: Difficulty, biomeOverride?: BiomeType) => {
    if (!engineRef.current) return;
    const targetDiff = diff || difficulty;
    const targetBiome = biomeOverride || selectedBiome;
    const runCfg = { difficulty: targetDiff, biome: targetBiome };
    lastRunConfigRef.current = runCfg;
    setLastRunConfig(runCfg);
    setDifficulty(targetDiff);
    if (biomeOverride) {
      setSelectedBiome(biomeOverride);
    }

    // Record daily streak check-in on consecutive days & apply unlocked coin multiplier immediately
    const streakResult = recordDailyStreakPlay(streakStateRef.current);
    streakStateRef.current = streakResult.nextState;
    setStreakState(streakResult.nextState);
    streakMultiplierRef.current = streakResult.newMultiplier;
    if (streakResult.increased) {
      if (streakToastTimeoutRef.current) {
        window.clearTimeout(streakToastTimeoutRef.current);
      }
      setStreakToast({
        streak: streakResult.nextState.currentStreak,
        multiplier: streakResult.newMultiplier,
        unlockedNewMultiplier: streakResult.unlockedNewMultiplier,
      });
      streakToastTimeoutRef.current = window.setTimeout(() => {
        setStreakToast(null);
        streakToastTimeoutRef.current = null;
      }, 4000);
    }

    saveState(
      highScore,
      totalCoins,
      unlockedSkins,
      selectedSkin.id,
      unlockedBiomes,
      targetBiome,
      targetDiff,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
    setIsShopOpen(false);
    setIsMissionsOpen(false);
    setIsMissionsLeaderboardOpen(false);
    setIsStreakOpen(false);
    engineRef.current.setDifficulty(targetDiff);
    engineRef.current.setBiome(targetBiome);
    engineRef.current.setStreakMultiplier(streakResult.newMultiplier);
    engineRef.current.start(targetDiff);
  };

  // Dedicated one-click Quick Restart: immediately starts a new run with the exact same difficulty & biome as the previous run
  const handleQuickRestart = () => {
    const { difficulty: prevDiff, biome: prevBiome } = lastRunConfigRef.current;
    handleStartGame(prevDiff, prevBiome);
  };

  const handleGoHome = () => {
    setIsShopOpen(false);
    setIsMissionsOpen(false);
    setIsMissionsLeaderboardOpen(false);
    setIsStreakOpen(false);
    setGameState('MENU');
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.render();
    }
  };

  const handleOpenShop = (tab: 'avatars' | 'weathers' = 'avatars') => {
    if (gameState === 'PLAYING') {
      engineRef.current?.pause();
    }
    setShopInitialTab(tab);
    setIsShopOpen(true);
  };

  const handleOpenInstructions = () => {
    if (gameState === 'PLAYING') {
      engineRef.current?.pause();
    }
    retroAudio.playSelect();
    setIsInstructionsOpen(true);
  };

  const handleCloseInstructions = () => {
    setIsInstructionsOpen(false);
  };

  const handleOpenMissions = () => {
    if (gameState === 'PLAYING') {
      engineRef.current?.pause();
    }
    const fresh = loadOrInitDailyMissions();
    missionsStateRef.current = fresh;
    setMissionsState(fresh);
    setIsMissionsOpen(true);
  };

  const handleOpenStreak = () => {
    if (gameState === 'PLAYING') {
      engineRef.current?.pause();
    }
    const fresh = loadDailyStreak();
    streakStateRef.current = fresh;
    setStreakState(fresh);
    setIsStreakOpen(true);
  };

  const handleSelectSkin = (skin: BirdSkin) => {
    setSelectedSkin(skin);
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
      engineRef.current.render();
    }
    saveState(
      highScore,
      totalCoins,
      unlockedSkins,
      skin.id,
      unlockedBiomes,
      selectedBiome,
      difficulty,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
  };

  const handleUnlockSkin = (skinId: string, cost: number) => {
    if (totalCoins < cost) return;
    const newCoins = totalCoins - cost;
    const newUnlocked = [...unlockedSkins, skinId];
    setTotalCoins(newCoins);
    setUnlockedSkins(newUnlocked);

    const skinObj = SKINS.find((s) => s.id === skinId);
    if (skinObj) {
      handleSelectSkin(skinObj);
      addHistoryEntry({
        type: 'avatar',
        title: `AVATAR UNLOCKED: ${skinObj.name.toUpperCase()}`,
        description: `Purchased ${skinObj.name} for ${cost}¢. Special Feature perk: ${skinObj.specialFeature.name} (${skinObj.specialFeature.tag}) — ${skinObj.specialFeature.description}`,
        details: {
          cost,
          itemId: skinObj.id,
          itemName: skinObj.name,
          perkName: skinObj.specialFeature.name,
          perkDescription: skinObj.specialFeature.description,
          skinName: skinObj.name,
        },
      });
    }

    saveState(
      highScore,
      newCoins,
      newUnlocked,
      skinId,
      unlockedBiomes,
      selectedBiome,
      difficulty,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
  };

  const handleSelectBiome = (biome: BiomeType) => {
    setSelectedBiome(biome);
    if (engineRef.current) {
      engineRef.current.setBiome(biome);
      engineRef.current.render();
    }
    saveState(
      highScore,
      totalCoins,
      unlockedSkins,
      selectedSkin.id,
      unlockedBiomes,
      biome,
      difficulty,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
  };

  const handleUnlockBiome = (biomeId: BiomeType, cost: number) => {
    if (totalCoins < cost) return;
    const newCoins = totalCoins - cost;
    const newUnlocked = [...unlockedBiomes, biomeId];
    setTotalCoins(newCoins);
    setUnlockedBiomes(newUnlocked);

    handleSelectBiome(biomeId);

    const biomeObj = BIOME_ITEMS.find((b) => b.id === biomeId);
    if (biomeObj) {
      addHistoryEntry({
        type: 'weather',
        title: `WEATHER REALM UNLOCKED: ${biomeObj.name.toUpperCase()}`,
        description: `Purchased ${biomeObj.name} (${biomeObj.weatherName}) for ${cost}¢. Atmospheric passive: ${biomeObj.specialFeature.name} (${biomeObj.specialFeature.tag}) — ${biomeObj.specialFeature.description}`,
        details: {
          cost,
          itemId: biomeObj.id,
          itemName: biomeObj.name,
          perkName: biomeObj.specialFeature.name,
          perkDescription: biomeObj.specialFeature.description,
          biomeName: biomeObj.name,
        },
      });
    }

    saveState(
      highScore,
      newCoins,
      unlockedSkins,
      selectedSkin.id,
      newUnlocked,
      biomeId,
      difficulty,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    saveState(
      highScore,
      totalCoins,
      unlockedSkins,
      selectedSkin.id,
      unlockedBiomes,
      selectedBiome,
      diff,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      retroAudio.setSoundEnabled(next);
      if (next) {
        retroAudio.playSelect();
      }
      saveState(
        highScoreRef.current,
        totalCoinsRef.current,
        unlockedSkinsRef.current,
        selectedSkinRef.current.id,
        unlockedBiomesRef.current,
        selectedBiomeRef.current,
        difficultyRef.current,
        crtFilterEnabled,
        next,
        musicEnabledRef.current
      );
      return next;
    });
  };

  const toggleMusic = () => {
    setMusicEnabled((prev) => {
      const next = !prev;
      musicEnabledRef.current = next;
      retroAudio.setMusicEnabled(next);
      if (next) {
        if (gameState === 'PLAYING') {
          retroAudio.startMusic(selectedBiomeRef.current);
        }
      } else {
        retroAudio.stopMusic();
      }
      saveState(
        highScoreRef.current,
        totalCoinsRef.current,
        unlockedSkinsRef.current,
        selectedSkinRef.current.id,
        unlockedBiomesRef.current,
        selectedBiomeRef.current,
        difficultyRef.current,
        crtFilterEnabled,
        soundEnabledRef.current,
        next
      );
      return next;
    });
  };

  // Hard Reset / Wipe Career Progress Handler
  const handleConfirmHardReset = () => {
    const defaultSkin = SKINS[0];
    const defaultBiome: BiomeType = 'day';

    setTotalCoins(0);
    setHighScore(0);
    setUnlockedSkins(['pip']);
    setSelectedSkin(defaultSkin);
    setUnlockedBiomes(['day']);
    setSelectedBiome(defaultBiome);
    setCurrentScore(0);
    setRunCoins(0);
    setGameState('MENU');
    setIsShopOpen(false);
    setIsMissionsOpen(false);
    setIsMissionsLeaderboardOpen(false);
    setIsResetModalOpen(false);

    // Audio SFX for system wipe
    retroAudio.playReset();

    // Reset Engine State
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.setSkin(defaultSkin);
      engineRef.current.setBiome(defaultBiome);
      engineRef.current.setHighScore(0);
    }

    // Reset Career History (Only way history is restarted)
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }

    // Reset Daily Missions & 7-day history for fresh start
    resetDailyMissionsHistory();
    const freshMissions = generateDailyMissions();
    missionsStateRef.current = freshMissions;
    setMissionsState(freshMissions);
    saveDailyMissions(freshMissions);
    setMissionToastQueue([]);

    // Reset Daily Streak for fresh start
    const emptyStreak = resetDailyStreak();
    streakStateRef.current = emptyStreak;
    streakMultiplierRef.current = 1;
    setStreakState(emptyStreak);
    setStreakToast(null);
    engineRef.current?.setStreakMultiplier(1);

    // Persist cleanly to localStorage
    saveState(
      0,
      0,
      ['pip'],
      'pip',
      ['day'],
      defaultBiome,
      difficulty,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );

    // Provide immediate visual feedback
    if (resetToastTimeoutRef.current) {
      window.clearTimeout(resetToastTimeoutRef.current);
    }
    setResetToastMessage('PROGRESS & CAREER HISTORY WIPED! ALL AVATARS & WEATHERS LOCKED. COLLECT COINS TO START FRESH.');
    resetToastTimeoutRef.current = window.setTimeout(() => {
      setResetToastMessage(null);
      resetToastTimeoutRef.current = null;
    }, 5000);
  };

  const missionsCompletedCount = missionsState.missions.filter((m) => m.completed).length;
  const missionsTotalCount = missionsState.missions.length;
  const unclaimedMissionsCount = missionsState.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div 
      id="arcade-main-viewport"
      className={`relative flex w-full flex-col bg-[#121212] font-mono text-white select-none overflow-hidden touch-none overscroll-none ${
        isFullscreen ? 'h-screen w-screen' : 'h-[100dvh] max-h-[100dvh]'
      }`}
    >
      {/* Header Telemetry Bar - Responsive across mobile portrait, landscape, and desktop */}
      <header 
        id="arcade-marquee-header"
        className={`w-full flex items-center justify-between px-2 sm:px-6 md:px-10 border-b-2 border-white/10 shrink-0 z-30 bg-[#0d0d0d] ${
          isFullscreen 
            ? 'h-11 sm:h-14 shadow-lg' 
            : 'h-12 sm:h-16 md:h-20 landscape:h-11 sm:landscape:h-14'
        }`}
      >
        <button 
          id="btn-marquee-logo-home"
          onClick={handleGoHome}
          className="flex flex-col text-left focus:outline-none hover:opacity-85 transition-opacity cursor-pointer shrink-0"
          title="Return to Home Screen"
        >
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter italic leading-tight">
            FLAP_GEN<span className="text-[#f7d302]">.OS</span>
          </h1>
          <p className="text-[7px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.4em] text-white/40 font-mono">
            Procedural Core
          </p>
        </button>

        <div className="flex items-center gap-2 sm:gap-5 md:gap-7">
          <div className="flex flex-col items-end">
            <span className="text-[7px] sm:text-[9px] md:text-[10px] text-white/40 uppercase tracking-wider">Best</span>
            <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold font-mono tracking-wider">
              {String(highScore).padStart(5, '0')}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[7px] sm:text-[9px] md:text-[10px] text-white/40 uppercase tracking-wider">Bank</span>
            <div className="flex items-center gap-1">
              <div className="size-1.5 sm:size-2 rounded-full bg-[#f7d302] shadow-[0_0_8px_#f7d302] animate-pulse" />
              <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-black font-mono text-[#f7d302] tracking-wider">
                {totalCoins}¢
              </span>
            </div>
          </div>

          {/* Dedicated Header Sound Mute / Unmute Toggle near Bank Balance */}
          <button
            type="button"
            id="btn-header-toggle-sound"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            aria-pressed={!soundEnabled}
            className={`flex items-center justify-center gap-1 rounded-lg border-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
              soundEnabled
                ? 'border-[#4ec0ca]/70 bg-[#4ec0ca]/15 text-[#4ec0ca] hover:bg-[#4ec0ca] hover:text-black shadow-[0_0_10px_rgba(78,192,202,0.2)]'
                : 'border-[#f25022]/70 bg-[#f25022]/15 text-[#f25022] hover:bg-[#f25022] hover:text-white shadow-[0_0_10px_rgba(242,80,34,0.2)]'
            }`}
            title={soundEnabled ? 'Sound On — Click to Mute (S)' : 'Sound Muted — Click to Unmute (S)'}
          >
            {soundEnabled ? (
              <Volume2 className="size-3.5 sm:size-4 md:size-5 shrink-0" />
            ) : (
              <VolumeX className="size-3.5 sm:size-4 md:size-5 shrink-0" />
            )}
            <span className="hidden lg:inline font-mono text-[10px] font-black tracking-wider uppercase">
              {soundEnabled ? 'SOUND' : 'MUTED'}
            </span>
          </button>

          {/* Daily Streak Counter next to Bank Balance */}
          <button
            id="btn-header-streak"
            onClick={() => {
              retroAudio.playSelect();
              handleOpenStreak();
            }}
            className={`flex flex-col items-end rounded-lg border px-1.5 sm:px-2.5 py-0.5 sm:py-1 transition-all cursor-pointer shrink-0 ${
              streakState.currentStreak > 0
                ? 'border-[#fb923c]/60 bg-[#fb923c]/10 hover:border-[#fb923c] hover:bg-[#fb923c]/20 shadow-[0_0_12px_rgba(251,146,60,0.2)]'
                : 'border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10'
            }`}
            title={`Daily Streak: ${streakState.currentStreak} ${streakState.currentStreak === 1 ? 'Day' : 'Days'} • Coin Multiplier: ${formatMultiplier(streakMultiplier)}${hasPlayedToday(streakState) ? ' (Logged Today)' : ' (Play today to extend!)'}`}
          >
            <div className="flex items-center gap-1">
              <span className="text-[7px] sm:text-[9px] md:text-[10px] text-white/50 uppercase tracking-wider">Streak</span>
              <span
                className={`rounded px-1 py-[1px] text-[7px] sm:text-[8px] font-black leading-none ${
                  streakMultiplier > 1
                    ? 'bg-[#f7d302] text-black shadow-[0_0_6px_rgba(247,211,2,0.5)]'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {formatMultiplier(streakMultiplier)}¢
              </span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Flame
                className={`size-3 sm:size-4 md:size-5 ${
                  streakState.currentStreak > 0
                    ? 'text-[#fb923c] fill-[#fb923c] drop-shadow-[0_0_6px_rgba(251,146,60,0.85)]'
                    : 'text-white/30'
                }`}
              />
              <span
                className={`text-sm sm:text-xl md:text-2xl lg:text-3xl font-black font-mono tracking-wider ${
                  streakState.currentStreak > 0 ? 'text-[#fb923c]' : 'text-white/45'
                }`}
              >
                {streakState.currentStreak}D
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              id="btn-header-fullscreen"
              onClick={toggleFullscreen}
              className="flex items-center gap-1 rounded-lg border-2 border-white/30 bg-white/10 px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-black text-white transition-all hover:bg-white hover:text-black cursor-pointer shadow-sm"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="size-3 sm:size-3.5" /> : <Maximize2 className="size-3 sm:size-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? 'WINDOW' : 'FULLSCREEN'}</span>
            </button>

            <button
              id="btn-header-open-avatars"
              onClick={() => handleOpenShop('avatars')}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border-2 border-[#f7d302] bg-[#f7d302]/10 px-2 sm:px-2.5 py-1 text-xs font-black text-[#f7d302] transition-all hover:bg-[#f7d302] hover:text-black cursor-pointer shadow-sm"
              title="Open Avatars Hangar"
            >
              <Sparkles className="size-3 sm:size-3.5" />
              <span>AVATARS (20)</span>
            </button>

            <button
              id="btn-header-open-weathers"
              onClick={() => handleOpenShop('weathers')}
              className="hidden md:flex items-center gap-1.5 rounded-lg border-2 border-[#4ec0ca] bg-[#4ec0ca]/10 px-2 sm:px-2.5 py-1 text-xs font-black text-[#4ec0ca] transition-all hover:bg-[#4ec0ca] hover:text-black cursor-pointer shadow-sm"
              title="Open Weathers Vault"
            >
              <CloudSun className="size-3 sm:size-3.5" />
              <span>WEATHERS (6)</span>
            </button>

            <button
              id="btn-header-missions"
              onClick={() => {
                retroAudio.playSelect();
                handleOpenMissions();
              }}
              className={`relative flex items-center gap-1 sm:gap-1.5 rounded-lg border-2 px-1.5 sm:px-2 py-1 text-xs font-black transition-all cursor-pointer shadow-sm ${
                unclaimedMissionsCount > 0
                  ? 'border-[#73bf2e] bg-[#73bf2e]/20 text-[#73bf2e] hover:bg-[#73bf2e] hover:text-black shadow-[0_0_12px_rgba(115,191,46,0.45)]'
                  : missionsCompletedCount >= missionsTotalCount
                  ? 'border-[#73bf2e]/80 bg-[#73bf2e]/15 text-[#73bf2e] hover:bg-[#73bf2e] hover:text-black'
                  : 'border-[#f7d302]/70 bg-[#f7d302]/15 text-[#f7d302] hover:bg-[#f7d302] hover:text-black'
              }`}
              title={`Daily Missions — ${missionsCompletedCount}/${missionsTotalCount} Complete${unclaimedMissionsCount > 0 ? ` (${unclaimedMissionsCount} Ready to Claim!)` : ''} (D)`}
            >
              <Target className="size-3 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline">MISSIONS</span>
              <span className="font-mono text-[9px] sm:text-[10px] bg-black/50 px-1 py-0.5 rounded border border-current/30">
                {missionsCompletedCount}/{missionsTotalCount}
              </span>
              {unclaimedMissionsCount > 0 && (
                <span
                  aria-label={`${unclaimedMissionsCount} rewards ready to claim`}
                  className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#f7d302] text-[9px] font-black text-black border border-black animate-bounce"
                >
                  !
                </span>
              )}
            </button>

            <button
              id="btn-header-history"
              onClick={() => {
                retroAudio.playSelect();
                setIsHistoryOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 rounded-lg border-2 border-[#c084fc]/60 bg-[#a855f7]/15 px-1.5 sm:px-2 py-1 text-xs font-black text-[#c084fc] transition-all hover:bg-[#a855f7] hover:text-white cursor-pointer shadow-sm"
              title={`Career History — Best Score: ${highScore} pts, Coins Bank: ${totalCoins}¢ (H)`}
            >
              <History className="size-3 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline">HISTORY</span>
              <div className="hidden lg:flex items-center gap-1 font-mono text-[9px] bg-black/60 px-1 py-0.5 rounded border border-[#c084fc]/40 text-[#f7d302]">
                <span title="Best Score">🏆{highScore}</span>
                <span className="text-white/40">•</span>
                <span title="Coins Bank">{totalCoins}¢</span>
              </div>
            </button>

            <button
              id="btn-header-hard-reset"
              onClick={() => {
                retroAudio.playSelect();
                setIsResetModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-lg border-2 border-[#f25022]/60 bg-[#f25022]/15 px-1.5 sm:px-2.5 py-1 text-xs font-black text-[#f25022] transition-all hover:bg-[#f25022] hover:text-white cursor-pointer shadow-sm"
              title="Restart Game from Beginning (Lock all weathers & avatars, reset coins to 0¢)"
            >
              <RotateCcw className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline">RESTART</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Arcade Frame - Responsive edge-to-edge on mobile phones, retro arcade cabinet on desktop */}
      <main 
        id="arcade-stage-container"
        className={`relative flex flex-1 w-full min-h-0 items-center justify-center transition-all overflow-hidden ${
          isFullscreen 
            ? 'p-0 h-full' 
            : 'p-0 sm:p-2 md:p-3 lg:p-4 w-full h-full'
        }`}
      >
        <div 
          id="game-viewport-cabinet"
          ref={cabinetRef}
          className={`relative overflow-hidden bg-black transition-all flex items-center justify-center ${
            isFullscreen
              ? 'w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none m-0 overflow-hidden flex-1'
              : 'w-full h-full sm:max-w-xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl rounded-none sm:rounded-2xl border-0 sm:border-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
          }`}
          onClick={handleCanvasInteraction}
          onTouchStart={handleCanvasInteraction}
          onContextMenu={handleContextMenu}
        >
          {/* Main Rendering Canvas */}
          <canvas
            id="flappy-main-canvas"
            ref={canvasRef}
            width={480}
            height={640}
            className="h-full w-full block image-render-pixelated cursor-pointer"
          />

          {/* In-Game Heads-Up Display (Live) */}
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <ArcadeHUD
              score={currentScore}
              coins={runCoins}
              totalCoins={totalCoins}
              highScore={highScore}
              difficulty={difficulty}
              selectedSkinId={selectedSkin.id}
              activePowerUps={activePowerUps}
              isPaused={gameState === 'PAUSED'}
              soundEnabled={soundEnabled}
              musicEnabled={musicEnabled}
              isFullscreen={isFullscreen}
              onTogglePause={() => {
                if (gameState === 'PLAYING') {
                  engineRef.current?.pause();
                } else if (gameState === 'PAUSED') {
                  engineRef.current?.resume();
                }
              }}
              onToggleSound={toggleSound}
              onToggleMusic={toggleMusic}
              onToggleFullscreen={toggleFullscreen}
              onOpenInstructions={handleOpenInstructions}
              onOpenShop={handleOpenShop}
              onOpenHistory={() => {
                retroAudio.playSelect();
                setIsHistoryOpen(true);
              }}
              onGoHome={handleGoHome}
              onRestartRun={() => {
                retroAudio.playSelect();
                handleStartGame();
                setResetToastMessage('FLIGHT RESTARTED: Ready, Set, Fly!');
                if (resetToastTimeoutRef.current) clearTimeout(resetToastTimeoutRef.current);
                resetToastTimeoutRef.current = window.setTimeout(() => {
                  setResetToastMessage(null);
                  resetToastTimeoutRef.current = null;
                }, 2500);
              }}
              onRequestReset={() => setIsResetModalOpen(true)}
              onFireLaser={() => engineRef.current?.fireLaser()}
            />
          )}

          {/* Main Menu Screen Overlay */}
          {gameState === 'MENU' && (
            <MenuScreen
              highScore={highScore}
              totalCoins={totalCoins}
              difficulty={difficulty}
              selectedBiome={selectedBiome}
              unlockedBiomes={unlockedBiomes}
              selectedSkin={selectedSkin}
              soundEnabled={soundEnabled}
              musicEnabled={musicEnabled}
              isFullscreen={isFullscreen}
              missionsCompletedCount={missionsCompletedCount}
              missionsTotalCount={missionsTotalCount}
              onStartGame={handleStartGame}
              onOpenShop={handleOpenShop}
              onOpenInstructions={handleOpenInstructions}
              onOpenHistory={() => {
                retroAudio.playSelect();
                setIsHistoryOpen(true);
              }}
              onOpenMissions={handleOpenMissions}
              onSelectDifficulty={handleSelectDifficulty}
              onSelectBiome={handleSelectBiome}
              onToggleSound={toggleSound}
              onToggleMusic={toggleMusic}
              onToggleFullscreen={toggleFullscreen}
              onRequestReset={() => setIsResetModalOpen(true)}
            />
          )}

          {/* Pause Screen Overlay */}
          <PauseScreen
            isOpen={gameState === 'PAUSED'}
            score={currentScore}
            onResume={() => engineRef.current?.resume()}
            onRestart={() => handleStartGame()}
            onQuitToMenu={handleGoHome}
            onOpenInstructions={handleOpenInstructions}
            onRequestReset={() => setIsResetModalOpen(true)}
          />

          {/* Game Over Modal Screen */}
          <GameOverModal
            isOpen={gameState === 'GAMEOVER'}
            score={currentScore}
            highScore={highScore}
            coinsEarned={runCoins}
            totalCoins={totalCoins}
            isNewHighScore={isNewHighScore}
            streakMultiplier={streakMultiplier}
            lastRunDifficulty={lastRunConfig.difficulty}
            lastRunBiome={lastRunConfig.biome}
            onQuickRestart={handleQuickRestart}
            onRestart={handleStartGame}
            onOpenShop={handleOpenShop}
            onGoHome={handleGoHome}
            onRequestReset={() => setIsResetModalOpen(true)}
          />

          {/* Unified Vault Modal: Avatars (x30) & Weathers (x20) */}
          <ShopModal
            isOpen={isShopOpen}
            totalCoins={totalCoins}
            unlockedSkins={unlockedSkins}
            selectedSkinId={selectedSkin.id}
            unlockedBiomes={unlockedBiomes}
            selectedBiome={selectedBiome}
            initialTab={shopInitialTab}
            onClose={() => setIsShopOpen(false)}
            onSelectSkin={handleSelectSkin}
            onUnlockSkin={handleUnlockSkin}
            onSelectBiome={handleSelectBiome}
            onUnlockBiome={handleUnlockBiome}
            onRequestReset={() => {
              setIsShopOpen(false);
              setIsResetModalOpen(true);
            }}
          />

          {/* Hard Reset Confirmation Modal */}
          <ResetConfirmModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onConfirmReset={handleConfirmHardReset}
          />

          {/* How to Play / Instructions Modal */}
          <InstructionsModal
            isOpen={isInstructionsOpen}
            onClose={handleCloseInstructions}
          />

          {/* Permanent Career History Modal */}
          <HistoryModal
            isOpen={isHistoryOpen}
            history={history}
            highScore={highScore}
            totalCoins={totalCoins}
            onClose={() => setIsHistoryOpen(false)}
            onRequestReset={() => {
              setIsHistoryOpen(false);
              setIsResetModalOpen(true);
            }}
          />

          {/* Daily Missions Modal */}
          <DailyMissionsModal
            isOpen={isMissionsOpen}
            missionsState={missionsState}
            unlockedBiomes={unlockedBiomes}
            selectedBiome={selectedBiome}
            onClose={() => setIsMissionsOpen(false)}
            onClaimReward={handleClaimMissionReward}
            onPlayBiome={(biome) => {
              setIsMissionsOpen(false);
              handleStartGame(undefined, biome);
            }}
            onPlayDifficulty={(diff) => {
              setIsMissionsOpen(false);
              handleStartGame(diff);
            }}
            onPlayNow={() => {
              setIsMissionsOpen(false);
              handleStartGame();
            }}
            onOpenWeatherVault={() => {
              setIsMissionsOpen(false);
              handleOpenShop('weathers');
            }}
            onOpenLeaderboard={() => {
              setIsMissionsLeaderboardOpen(true);
            }}
          />

          {/* Daily Missions Leaderboard Modal (D3 Global Average Comparison) */}
          <DailyMissionsLeaderboardModal
            isOpen={isMissionsLeaderboardOpen}
            missionsState={missionsState}
            onClose={() => setIsMissionsLeaderboardOpen(false)}
            onBackToMissions={() => {
              setIsMissionsLeaderboardOpen(false);
              setIsMissionsOpen(true);
            }}
          />

          {/* Daily Streak Multiplier Modal */}
          <DailyStreakModal
            isOpen={isStreakOpen}
            streakState={streakState}
            onClose={() => setIsStreakOpen(false)}
            onPlayNow={() => {
              setIsStreakOpen(false);
              handleStartGame();
            }}
          />

          {/* Daily Mission Completion Toast Notification */}
          <MissionToast
            mission={missionToastQueue[0] ?? null}
            completedCount={missionsCompletedCount}
            totalCount={missionsTotalCount}
          />

          {/* Daily Streak Increase Toast Notification */}
          {streakToast && !missionToastQueue[0] && (
            <div
              id="daily-streak-toast"
              className="pointer-events-none absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[94] w-[92%] sm:w-auto sm:min-w-[320px] max-w-md rounded-xl border-2 border-[#fb923c] bg-black/95 px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-white shadow-[0_0_32px_rgba(251,146,60,0.65)] backdrop-blur-md animate-in fade-in slide-in-from-top-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg border border-[#fb923c] bg-[#fb923c]/20 text-[#fb923c]">
                    <Flame className="size-4 sm:size-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#fb923c]">
                      DAY {streakToast.streak} STREAK {streakToast.unlockedNewMultiplier ? 'BOOST UNLOCKED!' : 'ACTIVE!'}
                    </p>
                    <p className="text-xs sm:text-sm font-black text-white truncate">
                      {streakToast.multiplier > 1
                        ? `${formatMultiplier(streakToast.multiplier)} Coin Multiplier active on all runs!`
                        : 'Come back tomorrow to unlock 1.25x Coins!'}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg border-2 border-[#f7d302] bg-[#f7d302]/20 px-2 py-1 text-xs sm:text-sm font-black text-[#f7d302]">
                  {formatMultiplier(streakToast.multiplier)}¢
                </span>
              </div>
            </div>
          )}

          {/* Reset Confirmation Toast Banner - Always visible in both Windowed & Fullscreen modes */}
          {resetToastMessage && (
            <div 
              id="reset-toast-alert"
              className="pointer-events-none absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] sm:w-auto max-w-xl rounded-xl border-2 border-[#f25022] bg-black/95 px-4 py-2.5 sm:py-3 text-center font-mono text-xs sm:text-sm font-black text-[#f25022] shadow-[0_0_40px_rgba(242,80,34,0.85)] animate-in fade-in slide-in-from-top-4"
            >
              ⚠️ {resetToastMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

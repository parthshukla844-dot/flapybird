import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  Difficulty, 
  BiomeType, 
  BirdSkin, 
  ActivePowerUps,
  HistoryEntry
} from './types';
import { SKINS, BIOMES, BIOME_ITEMS } from './game/pixelArt';
import { FlappyEngine } from './game/engine';
import { retroAudio } from './game/audio';
import { CRTOverlay } from './components/CRTOverlay';
import { ArcadeHUD } from './components/ArcadeHUD';
import { MenuScreen } from './components/MenuScreen';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { PauseScreen } from './components/PauseScreen';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { InstructionsModal } from './components/InstructionsModal';
import { HistoryModal } from './components/HistoryModal';
import { Gamepad2, Info, Sparkles, Home, CloudSun, RotateCcw, Maximize2, Minimize2, HelpCircle, History, Zap } from 'lucide-react';

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
  const [crtFilterEnabled, setCrtFilterEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Live Game State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [runCoins, setRunCoins] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<'avatars' | 'weathers'>('avatars');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);
  const resetToastTimeoutRef = useRef<number | null>(null);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUps>({
    shield: false,
    shieldTimer: 0,
    slowmoTimer: 0,
    multiplierTimer: 0,
    shrinkTimer: 0,
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
        if (typeof parsed.crtFilterEnabled === 'boolean') setCrtFilterEnabled(parsed.crtFilterEnabled);
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

  // Initialize Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FlappyEngine(canvas, {
      onScoreChange: (score) => {
        setCurrentScore(score);
      },
      onCoinsChange: (coins) => {
        setRunCoins(coins);
      },
      onStateChange: (state) => {
        setGameState(state);
      },
      onGameOver: (finalScore, earnedCoins, newHigh) => {
        setIsNewHighScore(newHigh);

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
              soundEnabled,
              musicEnabled
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
  }, [saveState, unlockedBiomes, unlockedSkins, selectedSkin.id, selectedBiome, difficulty, crtFilterEnabled, soundEnabled, musicEnabled, highScore]);

  // Sync settings with engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDifficulty(difficulty);
      engineRef.current.setBiome(selectedBiome);
      engineRef.current.setSkin(selectedSkin);
      engineRef.current.setHighScore(highScore);
    }
  }, [difficulty, selectedBiome, selectedSkin, highScore]);

  // Global Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isResetModalOpen) return;
        if (gameState === 'PLAYING') {
          e.preventDefault();
          engineRef.current?.fireLaser();
          return;
        }
      }

      if (e.code === 'KeyR') {
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isResetModalOpen) return;
        if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') {
          e.preventDefault();
          retroAudio.playSelect();
          handleStartGame();
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

      if (e.code === 'Escape') {
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
        if (isShopOpen || isInstructionsOpen || isHistoryOpen || isResetModalOpen) return;

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
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        toggleCRT();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isShopOpen, isInstructionsOpen, isHistoryOpen, isResetModalOpen]);

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

  const handleStartGame = (diff?: Difficulty) => {
    if (!engineRef.current) return;
    const targetDiff = diff || difficulty;
    setDifficulty(targetDiff);
    saveState(
      highScore,
      totalCoins,
      unlockedSkins,
      selectedSkin.id,
      unlockedBiomes,
      selectedBiome,
      targetDiff,
      crtFilterEnabled,
      soundEnabled,
      musicEnabled
    );
    setIsShopOpen(false);
    engineRef.current.setDifficulty(targetDiff);
    engineRef.current.setBiome(selectedBiome);
    engineRef.current.start(targetDiff);
  };

  const handleGoHome = () => {
    setIsShopOpen(false);
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

  const toggleCRT = () => {
    setCrtFilterEnabled((prev) => {
      const next = !prev;
      saveState(
        highScore,
        totalCoins,
        unlockedSkins,
        selectedSkin.id,
        unlockedBiomes,
        selectedBiome,
        difficulty,
        next,
        soundEnabled,
        musicEnabled
      );
      return next;
    });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      retroAudio.setSoundEnabled(next);
      saveState(
        highScore,
        totalCoins,
        unlockedSkins,
        selectedSkin.id,
        unlockedBiomes,
        selectedBiome,
        difficulty,
        crtFilterEnabled,
        next,
        musicEnabled
      );
      return next;
    });
  };

  const toggleMusic = () => {
    setMusicEnabled((prev) => {
      const next = !prev;
      retroAudio.setMusicEnabled(next);
      if (next) {
        if (gameState === 'PLAYING') {
          retroAudio.startMusic();
        }
      } else {
        retroAudio.stopMusic();
      }
      saveState(
        highScore,
        totalCoins,
        unlockedSkins,
        selectedSkin.id,
        unlockedBiomes,
        selectedBiome,
        difficulty,
        crtFilterEnabled,
        soundEnabled,
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

        <div className="flex items-center gap-2 sm:gap-6 md:gap-8">
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

          {/* CRT Scanline & Phosphor Overlay */}
          <CRTOverlay enabled={crtFilterEnabled} />

          {/* In-Game Heads-Up Display (Live) */}
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <ArcadeHUD
              score={currentScore}
              coins={runCoins}
              totalCoins={totalCoins}
              highScore={highScore}
              difficulty={difficulty}
              activePowerUps={activePowerUps}
              isPaused={gameState === 'PAUSED'}
              soundEnabled={soundEnabled}
              musicEnabled={musicEnabled}
              crtFilterEnabled={crtFilterEnabled}
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
              onToggleCRT={toggleCRT}
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
              crtFilterEnabled={crtFilterEnabled}
              soundEnabled={soundEnabled}
              musicEnabled={musicEnabled}
              isFullscreen={isFullscreen}
              onStartGame={handleStartGame}
              onOpenShop={handleOpenShop}
              onOpenInstructions={handleOpenInstructions}
              onOpenHistory={() => {
                retroAudio.playSelect();
                setIsHistoryOpen(true);
              }}
              onSelectDifficulty={handleSelectDifficulty}
              onSelectBiome={handleSelectBiome}
              onToggleCRT={toggleCRT}
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
            onRestart={() => engineRef.current?.start()}
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

      {/* Control Deck Footer - Responsive compact heights on mobile and landscape */}
      <footer 
        id="arcade-control-deck"
        className={`bg-white text-black flex items-center justify-between px-2 sm:px-6 md:px-10 shrink-0 z-30 font-mono transition-all border-t-2 sm:border-t-4 border-black ${
          isFullscreen 
            ? 'hidden' 
            : 'h-13 sm:h-16 md:h-20 landscape:h-11 sm:landscape:h-14'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 overflow-x-auto py-1">
          <button 
            type="button"
            id="btn-footer-home"
            onClick={handleGoHome}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Go to Home Screen"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black text-white flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs">
              <Home className="size-3.5 sm:size-4 md:size-5 text-[#f7d302]" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden sm:inline">
              Home
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-flap"
            onClick={() => {
              if (gameState === 'PLAYING') {
                engineRef.current?.flap();
              } else if (gameState === 'PAUSED') {
                engineRef.current?.resume();
              } else {
                handleStartGame();
              }
            }}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Click or press SPACE to flap/start"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black text-white flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs">
              SPCE
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden sm:inline">
              Jump / Flap
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-laser"
            onClick={() => {
              if (gameState === 'PLAYING') {
                engineRef.current?.fireLaser();
              }
            }}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Fire Flappy Bird Laser Cannon Beam (1 at a time • 0.25s pause • 1 min refill per bar • Hotkey: X)"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black border-2 border-[#ef4444] text-[#ef4444] flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              <Zap className="size-3.5 sm:size-4 md:size-5 text-[#ef4444] fill-current" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter text-[#ef4444]">
                Laser (X)
              </span>
              <span className="text-[8px] font-mono text-black/60">
                {activePowerUps.laserTimer > 0 
                  ? `HYPER 2s (${Math.ceil(activePowerUps.laserTimer / 1000)}s) ∞` 
                  : activePowerUps.laserAmmo < 3
                  ? `AMMO ${activePowerUps.laserAmmo}/3 (${Math.max(1, Math.ceil(60 * (1 - (activePowerUps.laserRechargeProgress ?? 1))))}s)`
                  : 'AMMO 3/3 (READY)'}
              </span>
            </div>
          </button>

          <button 
            type="button"
            id="btn-footer-pause"
            onClick={() => {
              if (gameState === 'PLAYING') engineRef.current?.pause();
              else if (gameState === 'PAUSED') engineRef.current?.resume();
            }}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Pause game"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black text-white flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs">
              ESC
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden sm:inline">
              Pause Menu
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-instructions"
            onClick={handleOpenInstructions}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="How to Play / Instructions (I)"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black text-[#f7d302] flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs">
              <HelpCircle className="size-3.5 sm:size-4 md:size-5 text-[#f7d302]" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden md:inline">
              HOW TO PLAY
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-fullscreen"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Toggle Fullscreen Mode (F)"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs transition-colors ${
              isFullscreen ? 'bg-black text-[#f7d302]' : 'bg-black text-white'
            }`}>
              {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4 md:size-5" /> : <Maximize2 className="size-3.5 sm:size-4 md:size-5" />}
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden md:inline">
              {isFullscreen ? 'WINDOW' : 'FULL (F)'}
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-crt"
            onClick={toggleCRT}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Toggle CRT Scanlines (C)"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs transition-colors ${
              crtFilterEnabled ? 'bg-black text-[#f7d302]' : 'bg-zinc-300 text-zinc-600'
            }`}>
              CRT
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter hidden md:inline">
              {crtFilterEnabled ? 'CRT ON' : 'CRT OFF'}
            </span>
          </button>

          <button 
            type="button"
            id="btn-footer-reset-game"
            onClick={() => {
              retroAudio.playSelect();
              setIsResetModalOpen(true);
            }}
            className="flex items-center gap-1 sm:gap-2 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Restart Game (Lock all weathers & avatars, reset coins to 0¢)"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#f25022]/15 border-2 border-[#f25022] text-[#f25022] flex items-center justify-center font-black rounded-lg text-[9px] sm:text-xs hover:bg-[#f25022] hover:text-white transition-colors">
              <RotateCcw className="size-3.5 sm:size-4 md:size-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter text-[#f25022] hidden lg:inline">
              Reset Save
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <div className="text-right">
            <p className="text-[8px] sm:text-[9px] uppercase font-bold text-black/40">Seed</p>
            <p className="text-[10px] sm:text-xs font-black font-mono">A7-X82</p>
          </div>
          <div className="h-6 sm:h-8 w-[1px] bg-black/15 hidden sm:block" />
          <div className="text-right hidden sm:block">
            <p className="text-[8px] sm:text-[9px] uppercase font-bold text-black/40">Core</p>
            <p className="text-[10px] sm:text-xs font-black font-mono">PERLIN_NOISE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { BirdSkin, BiomeType } from '../types';
import { SKINS, BIOME_ITEMS, BiomeItemData, drawPixelBird, BIOMES } from '../game/pixelArt';
import { X, Lock, Check, Sparkles, CloudSun, RotateCcw, Zap, CheckCircle2 } from 'lucide-react';
import { retroAudio } from '../game/audio';
import confetti from 'canvas-confetti';

interface ShopModalProps {
  isOpen: boolean;
  totalCoins: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  unlockedBiomes: string[];
  selectedBiome: BiomeType;
  initialTab?: 'avatars' | 'weathers';
  onClose: () => void;
  onSelectSkin: (skin: BirdSkin) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onSelectBiome: (biome: BiomeType) => void;
  onUnlockBiome: (biomeId: BiomeType, cost: number) => void;
  onRequestReset?: () => void;
}

type MainCategory = 'avatars' | 'weathers';
type FilterTab = 'all' | 'owned' | 'affordable' | 'locked';

interface FeatureUnlockAnnouncement {
  name: string;
  type: 'avatar' | 'weather';
  icon?: string;
  tag: string;
  featureName: string;
  description: string;
  badgeColor?: string;
  skin?: BirdSkin;
  biome?: BiomeItemData;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  totalCoins,
  unlockedSkins,
  selectedSkinId,
  unlockedBiomes,
  selectedBiome,
  initialTab = 'avatars',
  onClose,
  onSelectSkin,
  onUnlockSkin,
  onSelectBiome,
  onUnlockBiome,
  onRequestReset,
}) => {
  const [activeCategory, setActiveCategory] = useState<MainCategory>(initialTab);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [unlockedToast, setUnlockedToast] = useState<{ name: string; feature: string } | null>(null);
  const [featureAnnouncement, setFeatureAnnouncement] = useState<FeatureUnlockAnnouncement | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveCategory(initialTab);
      setUnlockedToast(null);
      setFeatureAnnouncement(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const unlockedSkinCount = SKINS.filter(
    (s) => unlockedSkins.includes(s.id) || s.cost === 0
  ).length;

  const unlockedBiomeCount = BIOME_ITEMS.filter(
    (b) => unlockedBiomes.includes(b.id) || b.cost === 0
  ).length;

  const filteredSkins = SKINS.filter((skin) => {
    const isUnlocked = unlockedSkins.includes(skin.id) || skin.cost === 0;
    const canAfford = totalCoins >= skin.cost;

    if (activeFilter === 'owned') return isUnlocked;
    if (activeFilter === 'affordable') return !isUnlocked && canAfford;
    if (activeFilter === 'locked') return !isUnlocked;
    return true;
  });

  const filteredBiomes = BIOME_ITEMS.filter((biome) => {
    const isUnlocked = unlockedBiomes.includes(biome.id) || biome.cost === 0;
    const canAfford = totalCoins >= biome.cost;

    if (activeFilter === 'owned') return isUnlocked;
    if (activeFilter === 'affordable') return !isUnlocked && canAfford;
    if (activeFilter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div 
      id="shop-modal-backdrop"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono select-none overflow-hidden"
      onClick={onClose}
    >
      <div 
        id="shop-modal-dialog"
        className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-full max-h-[96vh] rounded-2xl md:rounded-3xl border-4 md:border-6 border-white bg-[#121212] p-3 sm:p-4 md:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] text-white flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LOCKED UPPER VIEW ================= */}
        <div id="shop-locked-upper-view" className="shrink-0 flex flex-col gap-2.5 sm:gap-3.5 border-b-2 border-white/10 pb-2.5 sm:pb-3.5">
          {/* Header */}
          <div id="shop-header" className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="size-4 sm:size-5 md:size-6 text-[#f7d302] animate-pulse shrink-0" />
              <div>
                <h2 className="font-mono text-sm sm:text-base md:text-xl font-black italic tracking-tight text-white leading-none">
                  ARCADE_VAULT<span className="text-[#f7d302]">.OS</span>
                </h2>
                <span className="font-mono text-[8px] sm:text-[9px] md:text-xs text-white/50 tracking-widest uppercase mt-0.5 block">
                  {activeCategory === 'avatars' ? '20 FLAPPER AVATARS (×30¢)' : '6 WEATHER REALMS (×20¢)'}
                </span>
              </div>
            </div>
            <button 
              id="btn-close-shop"
              onClick={onClose}
              className="flex size-7 sm:size-8 md:size-10 items-center justify-center rounded-xl border border-white/20 bg-black/80 text-white/60 transition-colors hover:border-white hover:text-white cursor-pointer shadow-sm"
              title="Close Vault"
            >
              <X className="size-4 sm:size-5 md:size-6" />
            </button>
          </div>

          {/* Currency & Progress Banner */}
          <div id="shop-currency-banner" className="flex items-center justify-between rounded-xl md:rounded-2xl border-2 border-[#f7d302] bg-black/90 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 shadow-inner">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] sm:text-[9px] md:text-xs text-white/60 uppercase font-bold tracking-wider">
                BANK BALANCE
              </span>
              <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                <div className="size-2.5 sm:size-3 md:size-4 rounded-full bg-[#f7d302] shadow-[0_0_8px_#f7d302] animate-bounce" />
                <span className="font-mono text-sm sm:text-lg md:text-2xl font-black text-[#f7d302] tracking-tight">
                  {totalCoins}¢
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-mono text-[8px] sm:text-[9px] md:text-xs text-white/60 uppercase font-bold tracking-wider">
                {activeCategory === 'avatars' ? 'AVATARS UNLOCKED' : 'WEATHERS UNLOCKED'}
              </span>
              <span className="font-mono text-[11px] sm:text-sm md:text-base font-black text-[#4ec0ca] mt-0.5">
                {activeCategory === 'avatars' 
                  ? `${unlockedSkinCount} / ${SKINS.length}`
                  : `${unlockedBiomeCount} / ${BIOME_ITEMS.length}`
                } UNLOCKED
              </span>
              <div className="w-20 sm:w-28 md:w-36 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-[#4ec0ca] transition-all duration-300"
                  style={{ 
                    width: `${activeCategory === 'avatars' 
                      ? (unlockedSkinCount / SKINS.length) * 100 
                      : (unlockedBiomeCount / BIOME_ITEMS.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Category Selector (Avatars vs Weathers) */}
          <div id="shop-main-tabs" className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              id="tab-btn-avatars"
              onClick={() => {
                retroAudio.playSelect();
                setActiveCategory('avatars');
              }}
              className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 md:py-3.5 rounded-xl border-2 font-mono text-xs sm:text-sm md:text-base font-black transition-all cursor-pointer ${
                activeCategory === 'avatars'
                  ? 'border-[#f7d302] bg-[#f7d302] text-black shadow-[0_0_15px_rgba(247,211,2,0.35)]'
                  : 'border-white/20 bg-black/70 text-white/70 hover:border-white/50 hover:text-white'
              }`}
            >
              <Sparkles className="size-3.5 sm:size-4 md:size-5" />
              <span>AVATARS (20)</span>
              <span className="text-[8px] sm:text-[9px] md:text-xs px-1.5 py-0.5 rounded bg-black/20 font-bold">×30¢</span>
            </button>

            <button
              id="tab-btn-weathers"
              onClick={() => {
                retroAudio.playSelect();
                setActiveCategory('weathers');
              }}
              className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 md:py-3.5 rounded-xl border-2 font-mono text-xs sm:text-sm md:text-base font-black transition-all cursor-pointer ${
                activeCategory === 'weathers'
                  ? 'border-[#4ec0ca] bg-[#4ec0ca] text-black shadow-[0_0_15px_rgba(78,192,202,0.35)]'
                  : 'border-white/20 bg-black/70 text-white/70 hover:border-white/50 hover:text-white'
              }`}
            >
              <CloudSun className="size-3.5 sm:size-4 md:size-5" />
              <span>WEATHERS (6)</span>
              <span className="text-[8px] sm:text-[9px] md:text-xs px-1.5 py-0.5 rounded bg-black/20 font-bold">×20¢</span>
            </button>
          </div>

          {/* Filter Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {(
              [
                { 
                  id: 'all', 
                  label: `ALL (${activeCategory === 'avatars' ? SKINS.length : BIOME_ITEMS.length})` 
                },
                { 
                  id: 'owned', 
                  label: `OWNED (${activeCategory === 'avatars' ? unlockedSkinCount : unlockedBiomeCount})` 
                },
                { id: 'affordable', label: `CAN BUY` },
                { id: 'locked', label: `LOCKED` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  retroAudio.playSelect();
                  setActiveFilter(tab.id);
                }}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg font-mono text-[9px] sm:text-xs md:text-sm font-bold uppercase transition-all shrink-0 cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'bg-black/60 text-white/60 border border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unlocked Special Feature Banner Toast */}
        {unlockedToast && (
          <div className="mx-2 sm:mx-6 mb-2 rounded-xl border-2 border-[#f7d302] bg-[#f7d302]/15 p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 sm:size-5 text-[#f7d302] shrink-0 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="font-mono text-[9px] sm:text-[10px] font-black text-[#f7d302] uppercase tracking-wider">
                  ★ SPECIAL FEATURE ACTIVATED FOR {unlockedToast.name}!
                </span>
                <span className="font-mono text-[8px] sm:text-[9px] text-white/90">
                  {unlockedToast.feature}
                </span>
              </div>
            </div>
            <button
              onClick={() => setUnlockedToast(null)}
              className="text-white/60 hover:text-white p-1 cursor-pointer shrink-0"
            >
              <X className="size-3.5 sm:size-4" />
            </button>
          </div>
        )}

        {/* ================= SCROLLABLE ITEMS GRID LIST ================= */}
        <div id="shop-cards-list" className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 py-1.5 overscroll-contain">
          {activeCategory === 'avatars' ? (
            filteredSkins.map((skin) => {
              const isUnlocked = unlockedSkins.includes(skin.id) || skin.cost === 0;
              const isSelected = selectedSkinId === skin.id;
              const canAfford = totalCoins >= skin.cost;

              return (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                  isUnlocked={isUnlocked}
                  isSelected={isSelected}
                  canAfford={canAfford}
                  onSelect={() => {
                    retroAudio.playSelect();
                    onSelectSkin(skin);
                  }}
                  onUnlock={() => {
                    if (canAfford) {
                      retroAudio.playPowerUp();
                      try {
                        confetti({
                          particleCount: 50,
                          spread: 70,
                          origin: { y: 0.5 },
                        });
                      } catch {
                        // ignore
                      }
                      onUnlockSkin(skin.id, skin.cost);
                      setFeatureAnnouncement({
                        name: skin.name,
                        type: 'avatar',
                        tag: skin.specialFeature.tag,
                        featureName: skin.specialFeature.name,
                        description: skin.specialFeature.description,
                        badgeColor: skin.specialFeature.badgeColor,
                        skin,
                      });
                      setUnlockedToast({
                        name: skin.name,
                        feature: `${skin.specialFeature.name} (${skin.specialFeature.tag}): ${skin.specialFeature.description}`,
                      });
                    }
                  }}
                />
              );
            })
          ) : (
            filteredBiomes.map((biome) => {
              const isUnlocked = unlockedBiomes.includes(biome.id) || biome.cost === 0;
              const isSelected = selectedBiome === biome.id;
              const canAfford = totalCoins >= biome.cost;

              return (
                <WeatherCard
                  key={biome.id}
                  biome={biome}
                  isUnlocked={isUnlocked}
                  isSelected={isSelected}
                  canAfford={canAfford}
                  onSelect={() => {
                    retroAudio.playSelect();
                    onSelectBiome(biome.id);
                  }}
                  onUnlock={() => {
                    if (canAfford) {
                      retroAudio.playPowerUp();
                      try {
                        confetti({
                          particleCount: 50,
                          spread: 70,
                          origin: { y: 0.5 },
                        });
                      } catch {
                        // ignore
                      }
                      onUnlockBiome(biome.id, biome.cost);
                      setFeatureAnnouncement({
                        name: biome.name,
                        type: 'weather',
                        icon: biome.icon,
                        tag: biome.specialFeature.tag,
                        featureName: biome.specialFeature.name,
                        description: biome.specialFeature.description,
                        badgeColor: biome.specialFeature.badgeColor,
                        biome,
                      });
                      setUnlockedToast({
                        name: biome.name,
                        feature: `${biome.specialFeature.name} (${biome.specialFeature.tag}): ${biome.specialFeature.description}`,
                      });
                    }
                  }}
                />
              );
            })
          )}

          {activeCategory === 'avatars' && filteredSkins.length === 0 && (
            <div className="py-8 text-center text-white/40 font-mono text-xs">
              NO AVATARS FOUND IN THIS CATEGORY
            </div>
          )}

          {activeCategory === 'weathers' && filteredBiomes.length === 0 && (
            <div className="py-8 text-center text-white/40 font-mono text-xs">
              NO WEATHERS FOUND IN THIS CATEGORY
            </div>
          )}
        </div>

        {/* Footer Info & Reset Action */}
        <div id="shop-locked-footer" className="shrink-0 mt-auto border-t border-white/10 pt-1.5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">
              {activeCategory === 'avatars' 
                ? '★ 20 AVATARS PRICED IN MULTIPLES OF 30 (0¢ TO 570¢)' 
                : '★ 6 WEATHERS PRICED IN MULTIPLES OF 20 (0¢ TO 100¢)'}
            </p>
            <span className="font-mono text-[8px] text-[#f7d302] font-bold">
              {activeCategory === 'avatars' ? '×30¢ PRICING' : '×20¢ PRICING'}
            </span>
          </div>

          {onRequestReset && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[8px] text-white/40">WANT TO START FROM SCRATCH?</span>
              <button
                id="btn-shop-reset-progress"
                onClick={() => {
                  retroAudio.playSelect();
                  onRequestReset();
                }}
                className="flex items-center gap-1 rounded bg-[#f25022]/15 border border-[#f25022]/40 px-2 py-0.5 text-[8px] font-mono font-bold text-[#f25022] hover:bg-[#f25022] hover:text-white transition-colors cursor-pointer"
                title="Reset all purchases & coins to 0"
              >
                <RotateCcw className="size-2.5" />
                <span>RESTART ALL (LOCK ALL & 0¢)</span>
              </button>
            </div>
          )}
        </div>

        {/* Celebratory Dialog on Unlocking Special Feature */}
        {featureAnnouncement && (
          <div
            id="feature-announcement-overlay"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setFeatureAnnouncement(null)}
          >
            <div
              className="relative w-full max-w-sm sm:max-w-md rounded-2xl border-4 border-[#f7d302] bg-[#121212] p-5 sm:p-6 shadow-[0_0_50px_rgba(247,211,2,0.4)] text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#f7d302] text-black shadow-lg">
                <Zap className="size-8 fill-black stroke-[2.5] animate-bounce" />
              </div>

              <div>
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#f7d302]">
                  ★ SPECIAL FEATURE UNLOCKED ★
                </span>
                <h3 className="font-mono text-base sm:text-xl font-black text-white italic mt-0.5">
                  {featureAnnouncement.name}
                </h3>
              </div>

              <div className="w-full rounded-xl border border-white/20 bg-white/5 p-3 sm:p-4 text-left flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-white/50 uppercase">
                    SPECIAL FEATURE PERK
                  </span>
                  <span
                    className="font-mono text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm"
                    style={{
                      backgroundColor: featureAnnouncement.badgeColor || '#f7d302',
                      color: '#000000',
                    }}
                  >
                    {featureAnnouncement.tag}
                  </span>
                </div>

                <div className="font-mono text-sm sm:text-base font-black text-[#f7d302]">
                  {featureAnnouncement.featureName}
                </div>

                <p className="font-mono text-[11px] sm:text-xs text-white/80 leading-relaxed">
                  {featureAnnouncement.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full mt-1">
                <button
                  id="btn-equip-unlocked-feature"
                  onClick={() => {
                    retroAudio.playSelect();
                    if (featureAnnouncement.type === 'avatar' && featureAnnouncement.skin) {
                      onSelectSkin(featureAnnouncement.skin);
                    } else if (featureAnnouncement.type === 'weather' && featureAnnouncement.biome) {
                      onSelectBiome(featureAnnouncement.biome.id);
                    }
                    setFeatureAnnouncement(null);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#f7d302] py-2.5 px-3 font-mono text-xs font-black text-black shadow-md hover:bg-[#ffe338] cursor-pointer"
                >
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                  <span>EQUIP & USE</span>
                </button>

                <button
                  id="btn-close-feature-announcement"
                  onClick={() => {
                    retroAudio.playSelect();
                    setFeatureAnnouncement(null);
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 py-2.5 px-3 font-mono text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SkinCardProps {
  skin: BirdSkin;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onUnlock: () => void;
}

const SkinCard: React.FC<SkinCardProps> = ({
  skin,
  isUnlocked,
  isSelected,
  canAfford,
  onSelect,
  onUnlock,
}) => {
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
      const flap = Math.floor((frame / 10) % 3);
      drawPixelBird(ctx, canvas.width / 2, canvas.height / 2 + 2, skin, 0, flap, 1.25);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [skin]);

  const rarityColors: Record<string, string> = {
    common: 'text-zinc-400 border-zinc-700 bg-zinc-900',
    rare: 'text-[#38BDF8] border-[#0284C7]/40 bg-[#0284C7]/15',
    epic: 'text-[#C084FC] border-[#7E22CE]/40 bg-[#7E22CE]/15',
    legendary: 'text-[#FBBF24] border-[#D97706]/40 bg-[#D97706]/15',
    mythic: 'text-[#F472B6] border-[#DB2777]/40 bg-[#DB2777]/15',
  };

  const rarityBadge = rarityColors[skin.rarity || 'common'];

  return (
    <div 
      id={`skin-card-${skin.id}`}
      className={`flex items-center justify-between rounded-xl md:rounded-2xl border-2 p-2.5 sm:p-3.5 md:p-4 transition-all ${
        isSelected
          ? 'border-[#f7d302] bg-[#f7d302]/15 shadow-[0_0_20px_rgba(247,211,2,0.3)] scale-[1.01]'
          : isUnlocked
          ? 'border-white/15 bg-black/80 hover:border-white/40'
          : canAfford
          ? 'border-[#f7d302]/40 bg-black/60 hover:border-[#f7d302]'
          : 'border-white/10 bg-black/40 opacity-75'
      }`}
    >
      {/* Left: Pixel Preview & Metadata */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative flex size-12 sm:size-14 md:size-16 items-center justify-center rounded-xl border-2 border-white/20 bg-black/90 shrink-0">
          <canvas ref={canvasRef} width={48} height={48} className="size-11 sm:size-13 md:size-15 image-render-pixelated" />
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/65">
              <Lock className="size-4 sm:size-5 text-white/60" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h4 className="font-mono text-xs sm:text-base md:text-lg font-black text-white leading-tight">
              {skin.name}
            </h4>
            {skin.rarity && (
              <span className={`px-1.5 py-0.5 rounded border text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider ${rarityBadge}`}>
                {skin.rarity}
              </span>
            )}
            {skin.accessory && skin.accessory !== 'none' && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[7px] sm:text-[8px] font-mono font-bold uppercase">
                +{skin.accessory}
              </span>
            )}
          </div>
          <p className="font-mono text-[9px] sm:text-xs md:text-sm text-white/60 line-clamp-1 mt-0.5">
            {skin.description}
          </p>

          {/* Special Feature Perk Pill & Description */}
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1 sm:p-1.5 max-w-sm">
            <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-black/60 border border-[#f7d302]/30">
              <Zap className="size-2.5 sm:size-3 text-[#f7d302]" />
              <span className="font-mono text-[7px] sm:text-[8px] font-black uppercase text-[#f7d302]">
                {skin.specialFeature.tag}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[8px] sm:text-[9px] font-bold text-white leading-tight">
                {skin.specialFeature.name}
              </span>
              <span className="font-mono text-[7px] sm:text-[8px] text-white/70 leading-tight mt-0.5 line-clamp-2">
                {skin.specialFeature.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Select or Unlock Button */}
      <div className="shrink-0 ml-2 sm:ml-3">
        {isUnlocked ? (
          <button
            id={`btn-select-skin-${skin.id}`}
            onClick={onSelect}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3 font-mono text-[10px] sm:text-xs md:text-sm font-black transition-transform active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-[#f7d302] text-black font-black shadow-[0_3px_0_#a88e00]'
                : 'border-2 border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="size-3.5 sm:size-4 stroke-[3]" /> EQUIPPED
              </>
            ) : (
              'EQUIP'
            )}
          </button>
        ) : (
          <button
            id={`btn-unlock-skin-${skin.id}`}
            onClick={onUnlock}
            disabled={!canAfford}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3 font-mono text-[10px] sm:text-xs md:text-sm font-black transition-transform active:scale-95 cursor-pointer ${
              canAfford
                ? 'border-2 border-[#f7d302] bg-[#f7d302] text-black shadow-[0_3px_0_#a88e00] hover:bg-[#ffe338]'
                : 'cursor-not-allowed border-2 border-white/10 bg-black/60 text-white/30'
            }`}
          >
            <div className="size-2 sm:size-2.5 rounded-full bg-current" />
            <span>{skin.cost}¢</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface WeatherCardProps {
  biome: BiomeItemData;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onUnlock: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  biome,
  isUnlocked,
  isSelected,
  canAfford,
  onSelect,
  onUnlock,
}) => {
  const config = BIOMES[biome.id];

  return (
    <div 
      id={`weather-card-${biome.id}`}
      className={`flex items-center justify-between rounded-xl md:rounded-2xl border-2 p-2.5 sm:p-3.5 md:p-4 transition-all ${
        isSelected
          ? 'border-[#4ec0ca] bg-[#4ec0ca]/15 shadow-[0_0_20px_rgba(78,192,202,0.3)] scale-[1.01]'
          : isUnlocked
          ? 'border-white/15 bg-black/80 hover:border-white/40'
          : canAfford
          ? 'border-[#4ec0ca]/40 bg-black/60 hover:border-[#4ec0ca]'
          : 'border-white/10 bg-black/40 opacity-75'
      }`}
    >
      {/* Left: Weather Icon & Sky Preview Gradient */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div 
          className="relative flex size-12 sm:size-14 md:size-16 items-center justify-center rounded-xl border-2 border-white/20 shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, ${config?.skyTop || '#000'}, ${config?.skyBottom || '#333'})`
          }}
        >
          <span className="text-2xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {biome.icon}
          </span>
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/65">
              <Lock className="size-4 sm:size-5 text-white/60" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h4 className="font-mono text-xs sm:text-base md:text-lg font-black text-white leading-tight">
              {biome.name}
            </h4>
            <span className="px-1.5 py-0.5 rounded border border-[#4ec0ca]/40 bg-[#4ec0ca]/15 text-[#4ec0ca] text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider">
              {biome.weatherName}
            </span>
          </div>
          <p className="font-mono text-[9px] sm:text-xs md:text-sm text-white/60 line-clamp-1 mt-0.5">
            {biome.description}
          </p>

          {/* Special Feature Perk Pill & Description */}
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-[#4ec0ca]/20 bg-[#4ec0ca]/5 p-1 sm:p-1.5 max-w-sm">
            <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-black/60 border border-[#4ec0ca]/30">
              <Zap className="size-2.5 sm:size-3 text-[#4ec0ca]" />
              <span className="font-mono text-[7px] sm:text-[8px] font-black uppercase text-[#4ec0ca]">
                {biome.specialFeature.tag}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#4ec0ca] leading-tight">
                {biome.specialFeature.name}
              </span>
              <span className="font-mono text-[7px] sm:text-[8px] text-white/70 leading-tight mt-0.5 line-clamp-2">
                {biome.specialFeature.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Select or Unlock Button */}
      <div className="shrink-0 ml-2 sm:ml-3">
        {isUnlocked ? (
          <button
            id={`btn-select-weather-${biome.id}`}
            onClick={onSelect}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3 font-mono text-[10px] sm:text-xs md:text-sm font-black transition-transform active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-[#4ec0ca] text-black font-black shadow-[0_3px_0_#2b828a]'
                : 'border-2 border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="size-3.5 sm:size-4 stroke-[3]" /> ACTIVE
              </>
            ) : (
              'APPLY'
            )}
          </button>
        ) : (
          <button
            id={`btn-unlock-weather-${biome.id}`}
            onClick={onUnlock}
            disabled={!canAfford}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3 font-mono text-[10px] sm:text-xs md:text-sm font-black transition-transform active:scale-95 cursor-pointer ${
              canAfford
                ? 'border-2 border-[#4ec0ca] bg-[#4ec0ca] text-black shadow-[0_3px_0_#2b828a] hover:bg-[#6ee7b7]'
                : 'cursor-not-allowed border-2 border-white/10 bg-black/60 text-white/30'
            }`}
          >
            <div className="size-2 sm:size-2.5 rounded-full bg-current" />
            <span>{biome.cost}¢</span>
          </button>
        )}
      </div>
    </div>
  );
};

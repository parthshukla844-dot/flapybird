import React, { useEffect, useRef, useState } from 'react';
import { BirdSkin } from '../types';
import { SKINS, drawPixelBird } from '../game/pixelArt';
import { X, Lock, Check, Sparkles, Coins, Flame, Star, ShieldAlert } from 'lucide-react';
import { retroAudio } from '../game/audio';

interface SkinShopModalProps {
  isOpen: boolean;
  totalCoins: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  onClose: () => void;
  onSelectSkin: (skin: BirdSkin) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
}

type FilterTab = 'all' | 'owned' | 'affordable' | 'locked';

export const SkinShopModal: React.FC<SkinShopModalProps> = ({
  isOpen,
  totalCoins,
  unlockedSkins,
  selectedSkinId,
  onClose,
  onSelectSkin,
  onUnlockSkin,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  if (!isOpen) return null;

  const unlockedCount = SKINS.filter(
    (s) => unlockedSkins.includes(s.id) || s.cost === 0
  ).length;

  const filteredSkins = SKINS.filter((skin) => {
    const isUnlocked = unlockedSkins.includes(skin.id) || skin.cost === 0;
    const canAfford = totalCoins >= skin.cost;

    if (activeFilter === 'owned') return isUnlocked;
    if (activeFilter === 'affordable') return !isUnlocked && canAfford;
    if (activeFilter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div 
      id="skin-shop-backdrop"
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-xs font-mono select-none"
      onClick={onClose}
    >
      <div 
        id="skin-shop-dialog"
        className="w-full max-w-md rounded-2xl border-4 border-white bg-[#121212] p-3.5 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div id="skin-shop-header" className="flex items-center justify-between border-b-2 border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#f7d302] animate-pulse" />
            <div>
              <h2 className="font-mono text-sm sm:text-base font-black italic tracking-tight text-white leading-none">
                AVATAR_HANGAR<span className="text-[#f7d302]">.OS</span>
              </h2>
              <span className="font-mono text-[9px] text-white/50 tracking-widest uppercase">
                {SKINS.length} FLAPPER AVATARS
              </span>
            </div>
          </div>
          <button 
            id="btn-close-shop"
            onClick={onClose}
            className="flex size-7 sm:size-8 items-center justify-center rounded-lg border border-white/20 bg-black/80 text-white/60 transition-colors hover:border-white hover:text-white cursor-pointer"
            title="Close Hangar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Currency & Progress Banner */}
        <div id="shop-currency-banner" className="my-2.5 flex items-center justify-between rounded-xl border-2 border-[#f7d302] bg-black/90 px-3.5 py-2 shadow-inner">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-white/60 uppercase font-bold tracking-wider">
              COLLECTED CREDITS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="size-3 rounded-full bg-[#f7d302] shadow-[0_0_8px_#f7d302] animate-bounce" />
              <span className="font-mono text-base sm:text-lg font-black text-[#f7d302] tracking-tight">
                {totalCoins}¢
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] text-white/60 uppercase font-bold tracking-wider">
              COLLECTION
            </span>
            <span className="font-mono text-xs font-black text-[#4ec0ca]">
              {unlockedCount} / {SKINS.length} UNLOCKED
            </span>
            <div className="w-20 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-[#4ec0ca] transition-all"
                style={{ width: `${(unlockedCount / SKINS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: `ALL (${SKINS.length})` },
              { id: 'owned', label: `OWNED (${unlockedCount})` },
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
              className={`px-2.5 py-1 rounded-md font-mono text-[9px] sm:text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-black font-black'
                  : 'bg-black/60 text-white/60 border border-white/15 hover:border-white/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skins Grid List */}
        <div id="skin-cards-list" className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {filteredSkins.map((skin) => {
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
                    onUnlockSkin(skin.id, skin.cost);
                  }
                }}
              />
            );
          })}

          {filteredSkins.length === 0 && (
            <div className="py-8 text-center text-white/40 font-mono text-xs">
              NO AVATARS FOUND IN THIS CATEGORY
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-2 border-t border-white/10 pt-2 text-center flex items-center justify-between">
          <p className="font-mono text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">
            ★ PRICED IN MULTIPLES OF 2 • COLLECT COINS IN-RUN
          </p>
          <span className="font-mono text-[8px] text-[#f7d302] font-bold">
            START AT 2¢
          </span>
        </div>
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
      className={`flex items-center justify-between rounded-xl border-2 p-2.5 sm:p-3 transition-all ${
        isSelected
          ? 'border-[#f7d302] bg-[#f7d302]/15 shadow-[0_0_16px_rgba(247,211,2,0.25)] scale-[1.01]'
          : isUnlocked
          ? 'border-white/15 bg-black/80 hover:border-white/40'
          : canAfford
          ? 'border-[#f7d302]/40 bg-black/60 hover:border-[#f7d302]'
          : 'border-white/10 bg-black/40 opacity-75'
      }`}
    >
      {/* Left: Pixel Preview & Metadata */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative flex size-12 sm:size-13 items-center justify-center rounded-lg border border-white/20 bg-black/90 shrink-0">
          <canvas ref={canvasRef} width={48} height={48} className="size-12 sm:size-13 image-render-pixelated" />
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/65">
              <Lock className="size-4 text-white/60" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-mono text-xs sm:text-sm font-black text-white leading-tight">
              {skin.name}
            </h4>
            {skin.rarity && (
              <span className={`px-1.5 py-0.2 rounded border text-[7px] sm:text-[8px] font-black uppercase tracking-wider ${rarityBadge}`}>
                {skin.rarity}
              </span>
            )}
            {skin.accessory && skin.accessory !== 'none' && (
              <span className="px-1 py-0.2 rounded bg-white/10 text-white/60 text-[7px] font-mono font-bold uppercase">
                +{skin.accessory}
              </span>
            )}
          </div>
          <p className="font-mono text-[9px] sm:text-[10px] text-white/60 line-clamp-1 mt-0.5">
            {skin.description}
          </p>
        </div>
      </div>

      {/* Right: Select or Unlock Button */}
      <div className="shrink-0 ml-2">
        {isUnlocked ? (
          <button
            id={`btn-select-skin-${skin.id}`}
            onClick={onSelect}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-[10px] font-black transition-transform active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-[#f7d302] text-black font-black shadow-[0_2px_0_#a88e00]'
                : 'border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="size-3 stroke-[3]" /> EQUIPPED
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] sm:text-xs font-black transition-transform active:scale-95 cursor-pointer ${
              canAfford
                ? 'border-2 border-[#f7d302] bg-[#f7d302] text-black shadow-[0_3px_0_#a88e00] hover:bg-[#ffe338]'
                : 'cursor-not-allowed border border-white/10 bg-black/60 text-white/30'
            }`}
          >
            <div className="size-2 rounded-full bg-current" />
            <span>{skin.cost}¢</span>
          </button>
        )}
      </div>
    </div>
  );
};


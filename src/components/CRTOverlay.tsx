import React from 'react';

interface CRTOverlayProps {
  enabled: boolean;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div 
      id="crt-overlay-wrapper" 
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-2xl"
    >
      {/* Scanline Pattern */}
      <div 
        id="crt-scanlines"
        className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-70"
      />
      {/* CRT Vignette Edge Shadow */}
      <div 
        id="crt-vignette"
        className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]"
      />
      {/* Subtle CRT Phosphor Glow */}
      <div 
        id="crt-glow"
        className="absolute inset-0 bg-emerald-500/[0.015] mix-blend-screen"
      />
    </div>
  );
};

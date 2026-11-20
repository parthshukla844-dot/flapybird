import React, { useEffect, useRef } from 'react';
import { BiomeType } from '../types';
import { BIOMES } from '../game/pixelArt';

interface Biome3DPreviewProps {
  biome: BiomeType;
  className?: string;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  sx: number;
  sy: number;
  depth: number;
}

interface FloatingParticle {
  angle: number;
  radius: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}

interface RenderItem {
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

function projectPoint(
  p: Vec3,
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  scale: number
): ProjectedPoint {
  // Rotate around Y axis (yaw)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;

  // Tilt around X axis (pitch)
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = p.y * cosP - z1 * sinP;
  const z2 = p.y * sinP + z1 * cosP;

  // Mild perspective projection for authentic 3D depth
  const cameraDist = 5.4;
  const perspective = cameraDist / (cameraDist - z2 * 0.42);

  return {
    sx: cx + x1 * scale * perspective,
    sy: cy - y2 * scale * perspective,
    depth: z2,
  };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  pts: ProjectedPoint[],
  fill: string,
  stroke?: string,
  lineWidth = 1
) {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].sx, pts[i].sy);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export const Biome3DPreview: React.FC<Biome3DPreviewProps> = ({
  biome,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const biomeRef = useRef<BiomeType>(biome);
  const spinBoostRef = useRef<number>(0);

  // Trigger a snappy rotation burst when user switches biomes
  useEffect(() => {
    if (biomeRef.current !== biome) {
      biomeRef.current = biome;
      spinBoostRef.current = 2.6;
    }
  }, [biome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seed ambient particles for weather effects (stars, snow, embers, rain)
    const particles: FloatingParticle[] = Array.from({ length: 26 }, (_, i) => ({
      angle: (Math.PI * 2 * i) / 26 + Math.random() * 0.4,
      radius: 0.45 + Math.random() * 1.35,
      y: -0.1 + Math.random() * 1.45,
      speed: 0.35 + Math.random() * 0.65,
      size: 1.5 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let width = container.clientWidth || 420;
    let height = container.clientHeight || 220;

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(200, container.clientWidth || 420);
      height = Math.max(150, container.clientHeight || 220);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncCanvasSize();
    const ro = new ResizeObserver(syncCanvasSize);
    ro.observe(container);

    let rafId = 0;
    let yaw = 0.55;
    let elapsed = 0;
    let lastTime = performance.now();

    const addBox = (
      items: RenderItem[],
      x: number,
      yBottom: number,
      z: number,
      w: number,
      h: number,
      d: number,
      colors: { top: string; left: string; right: string; stroke?: string },
      proj: (p: Vec3) => ProjectedPoint
    ) => {
      const hw = w / 2;
      const hd = d / 2;
      const yTop = yBottom + h;

      const corners: Vec3[] = [
        { x: x - hw, y: yBottom, z: z - hd }, // 0
        { x: x + hw, y: yBottom, z: z - hd }, // 1
        { x: x + hw, y: yBottom, z: z + hd }, // 2
        { x: x - hw, y: yBottom, z: z + hd }, // 3
        { x: x - hw, y: yTop, z: z - hd },    // 4
        { x: x + hw, y: yTop, z: z - hd },    // 5
        { x: x + hw, y: yTop, z: z + hd },    // 6
        { x: x - hw, y: yTop, z: z + hd },    // 7
      ];

      const p = corners.map(proj);

      const faces: { idx: number[]; color: string }[] = [
        { idx: [4, 5, 6, 7], color: colors.top },   // top
        { idx: [0, 1, 5, 4], color: colors.left },  // back/side A
        { idx: [1, 2, 6, 5], color: colors.right }, // side B
        { idx: [2, 3, 7, 6], color: colors.left },  // front/side C
        { idx: [3, 0, 4, 7], color: colors.right }, // side D
      ];

      for (const face of faces) {
        const pts = face.idx.map((i) => p[i]);
        // Backface cull via 2D screen cross product (counter-clockwise facing viewer)
        const ax = pts[1].sx - pts[0].sx;
        const ay = pts[1].sy - pts[0].sy;
        const bx = pts[2].sx - pts[0].sx;
        const by = pts[2].sy - pts[0].sy;
        const cross = ax * by - ay * bx;
        // Top face always visible from elevated pitch; side faces culled when facing away (cross <= 0)
        if (face.idx[0] !== 4 && cross <= 0) continue;

        const avgDepth =
          (pts[0].depth + pts[1].depth + pts[2].depth + pts[3].depth) * 0.25;
        items.push({
          depth: avgDepth,
          draw: (c) => drawPolygon(c, pts, face.color, colors.stroke, 0.9),
        });
      }
    };

    const addPyramid = (
      items: RenderItem[],
      x: number,
      yBase: number,
      z: number,
      radius: number,
      heightVal: number,
      sides: number,
      faceColors: [string, string],
      stroke: string,
      proj: (p: Vec3) => ProjectedPoint,
      craterColor?: string
    ) => {
      const basePts: Vec3[] = [];
      for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 * i) / sides + Math.PI / 4;
        basePts.push({
          x: x + Math.cos(a) * radius,
          y: yBase,
          z: z + Math.sin(a) * radius,
        });
      }
      const apex: Vec3 = { x, y: yBase + heightVal, z };
      const pBase = basePts.map(proj);
      const pApex = proj(apex);

      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        const tri = [pBase[i], pBase[next], pApex];
        const avgDepth = (tri[0].depth + tri[1].depth + tri[2].depth) / 3;
        const color = i % 2 === 0 ? faceColors[0] : faceColors[1];
        items.push({
          depth: avgDepth,
          draw: (c) => drawPolygon(c, tri, color, stroke, 0.9),
        });
      }

      if (craterColor) {
        items.push({
          depth: pApex.depth + 0.08,
          draw: (c) => {
            const glowR = 9 + Math.sin(elapsed * 5) * 2.5;
            const grad = c.createRadialGradient(
              pApex.sx,
              pApex.sy,
              1,
              pApex.sx,
              pApex.sy,
              glowR
            );
            grad.addColorStop(0, '#FEF08A');
            grad.addColorStop(0.45, craterColor);
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            c.fillStyle = grad;
            c.beginPath();
            c.arc(pApex.sx, pApex.sy, glowR, 0, Math.PI * 2);
            c.fill();
          },
        });
      }
    };

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      // Smoothly decay biome-switch spin impulse
      if (spinBoostRef.current > 0.001) {
        spinBoostRef.current *= Math.pow(0.08, dt);
      } else {
        spinBoostRef.current = 0;
      }

      const activeBiome = biomeRef.current;
      const cfg = BIOMES[activeBiome] ?? BIOMES.day;
      const baseSpeed = activeBiome === 'volcano' ? 0.56 : activeBiome === 'cyberpunk' ? 0.48 : 0.36;
      yaw += (baseSpeed + spinBoostRef.current) * dt;

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      // Place floating 3D island slightly above center so landmarks peek above the button stack
      const bobY = Math.sin(elapsed * 1.9) * 3.5;
      const cy = height * 0.44 + bobY;
      const scale = Math.min(width * 0.25, height * 0.44, 108);
      const pitch = 0.46 + Math.sin(elapsed * 0.8) * 0.035;

      // 1. Soft atmospheric radial aura matching the selected biome's sky
      const auraR = Math.max(width * 0.46, height * 0.72);
      const skyGrad = ctx.createRadialGradient(cx, cy - scale * 0.2, scale * 0.15, cx, cy, auraR);
      skyGrad.addColorStop(0, `${cfg.skyBottom}95`);
      skyGrad.addColorStop(0.48, `${cfg.skyTop}55`);
      skyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const proj = (p: Vec3) => projectPoint(p, yaw, pitch, cx, cy, scale);

      // 2. Orbiting celestial body (Sun / Moon / Neon Ring / Ember Core)
      const skyAngle = yaw * 0.65 + 0.8;
      const celPos = proj({
        x: Math.cos(skyAngle) * 1.55,
        y: 1.05 + Math.sin(elapsed * 1.4) * 0.06,
        z: Math.sin(skyAngle) * 1.55,
      });

      const items: RenderItem[] = [];

      // Soft floating shadow beneath the island
      const shadowY = cy + scale * 0.76;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, scale * 0.92, scale * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Celestial orb item
      items.push({
        depth: celPos.depth,
        draw: (c) => {
          const orbR = activeBiome === 'sunset' ? 14 : 10;
          const orbColor =
            activeBiome === 'night'
              ? '#E2E8F0'
              : activeBiome === 'sunset'
              ? '#FDE047'
              : activeBiome === 'cyberpunk'
              ? '#EC4899'
              : activeBiome === 'volcano'
              ? '#F97316'
              : activeBiome === 'winter'
              ? '#E0F2FE'
              : '#FEF08A';

          const g = c.createRadialGradient(
            celPos.sx,
            celPos.sy,
            orbR * 0.2,
            celPos.sx,
            celPos.sy,
            orbR * 2.4
          );
          g.addColorStop(0, orbColor);
          g.addColorStop(0.45, `${orbColor}66`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g;
          c.beginPath();
          c.arc(celPos.sx, celPos.sy, orbR * 2.4, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = orbColor;
          c.beginPath();
          c.arc(celPos.sx, celPos.sy, orbR, 0, Math.PI * 2);
          c.fill();
        },
      });

      // 3. Rotating 3D Floating Island Base (Top slab + tapered rocky underside)
      const islandSides = 8;
      const topR = 1.24;
      const midR = 1.18;
      const botR = 0.42;
      const yTop = 0.0;
      const ySlab = -0.2;
      const yTip = -0.64;

      const topRing: ProjectedPoint[] = [];
      const slabRing: ProjectedPoint[] = [];
      const botRing: ProjectedPoint[] = [];

      for (let i = 0; i < islandSides; i++) {
        const a = (Math.PI * 2 * i) / islandSides + Math.PI / 8;
        topRing.push(proj({ x: Math.cos(a) * topR, y: yTop, z: Math.sin(a) * topR }));
        slabRing.push(proj({ x: Math.cos(a) * midR, y: ySlab, z: Math.sin(a) * midR }));
        botRing.push(proj({ x: Math.cos(a) * botR, y: yTip, z: Math.sin(a) * botR }));
      }

      // Underside beveled facets
      for (let i = 0; i < islandSides; i++) {
        const next = (i + 1) % islandSides;
        const underQuad = [slabRing[i], slabRing[next], botRing[next], botRing[i]];
        const depthUnder =
          (underQuad[0].depth + underQuad[1].depth + underQuad[2].depth + underQuad[3].depth) *
          0.25;
        items.push({
          depth: depthUnder - 0.12,
          draw: (c) =>
            drawPolygon(
              c,
              underQuad,
              i % 2 === 0 ? cfg.groundStripe : cfg.groundBody,
              'rgba(0,0,0,0.45)',
              0.8
            ),
        });

        const rimQuad = [topRing[i], topRing[next], slabRing[next], slabRing[i]];
        const depthRim =
          (rimQuad[0].depth + rimQuad[1].depth + rimQuad[2].depth + rimQuad[3].depth) * 0.25;
        items.push({
          depth: depthRim - 0.04,
          draw: (c) =>
            drawPolygon(
              c,
              rimQuad,
              i % 2 === 0 ? cfg.groundBody : cfg.groundStripe,
              'rgba(0,0,0,0.5)',
              0.9
            ),
        });
      }

      // Top terrain deck
      items.push({
        depth: -0.02,
        draw: (c) => {
          drawPolygon(c, topRing, cfg.groundTop, 'rgba(0,0,0,0.55)', 1.2);

          // Subtle rotating surface detail grid for Cyberpunk / lava veins for Volcano
          if (activeBiome === 'cyberpunk') {
            c.save();
            c.strokeStyle = 'rgba(244, 114, 182, 0.45)';
            c.lineWidth = 0.8;
            for (let g = -0.8; g <= 0.8; g += 0.4) {
              const a1 = proj({ x: g, y: 0.005, z: -0.85 });
              const a2 = proj({ x: g, y: 0.005, z: 0.85 });
              c.beginPath();
              c.moveTo(a1.sx, a1.sy);
              c.lineTo(a2.sx, a2.sy);
              c.stroke();
            }
            c.restore();
          } else if (activeBiome === 'volcano') {
            c.save();
            c.strokeStyle = `rgba(251, 146, 60, ${(0.55 + Math.sin(elapsed * 4) * 0.25).toFixed(2)})`;
            c.lineWidth = 1.6;
            const c0 = proj({ x: 0, y: 0.01, z: 0 });
            for (let k = 0; k < 4; k++) {
              const ang = (Math.PI * 2 * k) / 4 + 0.4;
              const edge = proj({ x: Math.cos(ang) * 0.95, y: 0.01, z: Math.sin(ang) * 0.95 });
              c.beginPath();
              c.moveTo(c0.sx, c0.sy);
              c.lineTo(edge.sx, edge.sy);
              c.stroke();
            }
            c.restore();
          }
        },
      });

      // 4. Biome-Specific 3D Landscape Landmarks
      // Pair of signature miniature 3D arcade pipes on every biome
      addBox(
        items,
        0.58,
        0.0,
        0.38,
        0.22,
        0.52,
        0.22,
        {
          top: cfg.pipeHighlight,
          left: cfg.pipeMain,
          right: cfg.pipeShadow,
          stroke: cfg.pipeOutline,
        },
        proj
      );
      addBox(
        items,
        0.58,
        0.5,
        0.38,
        0.28,
        0.09,
        0.28,
        {
          top: cfg.pipeHighlight,
          left: cfg.pipeHighlight,
          right: cfg.pipeRim,
          stroke: cfg.pipeOutline,
        },
        proj
      );
      addBox(
        items,
        -0.62,
        0.0,
        -0.36,
        0.2,
        0.36,
        0.2,
        {
          top: cfg.pipeHighlight,
          left: cfg.pipeMain,
          right: cfg.pipeShadow,
          stroke: cfg.pipeOutline,
        },
        proj
      );

      if (activeBiome === 'volcano') {
        // Central erupting volcanic cone + jagged obsidian spires
        addPyramid(
          items,
          -0.05,
          0.0,
          -0.04,
          0.56,
          0.95,
          6,
          ['#27272A', '#3F3F46'],
          '#09090B',
          proj,
          '#EF4444'
        );
        addPyramid(
          items,
          -0.55,
          0.0,
          0.42,
          0.26,
          0.46,
          4,
          ['#3F3F46', '#18181B'],
          '#09090B',
          proj
        );
        addPyramid(
          items,
          0.48,
          0.0,
          -0.5,
          0.24,
          0.42,
          4,
          ['#450A0A', '#27272A'],
          '#09090B',
          proj
        );
      } else if (activeBiome === 'cyberpunk') {
        // Futuristic neon skyline towers
        addBox(
          items,
          -0.1,
          0.0,
          -0.12,
          0.34,
          0.96,
          0.34,
          {
            top: '#06B6D4',
            left: '#1E1B4B',
            right: '#312E81',
            stroke: '#EC4899',
          },
          proj
        );
        addBox(
          items,
          -0.52,
          0.0,
          0.38,
          0.26,
          0.62,
          0.26,
          {
            top: '#F472B6',
            left: '#2E1065',
            right: '#4C1D95',
            stroke: '#22D3EE',
          },
          proj
        );
        addBox(
          items,
          0.35,
          0.0,
          -0.48,
          0.24,
          0.74,
          0.24,
          {
            top: '#22D3EE',
            left: '#1E1B4B',
            right: '#3B0764',
            stroke: '#D946EF',
          },
          proj
        );
      } else if (activeBiome === 'winter') {
        // Crystalline snow peaks + frosted evergreen spires
        addPyramid(
          items,
          -0.06,
          0.0,
          -0.06,
          0.5,
          0.88,
          4,
          ['#E0F2FE', '#93C5FD'],
          '#0369A1',
          proj
        );
        addPyramid(
          items,
          -0.52,
          0.0,
          0.36,
          0.28,
          0.56,
          4,
          ['#FFFFFF', '#BAE6FD'],
          '#0284C7',
          proj
        );
        addPyramid(
          items,
          0.36,
          0.0,
          -0.46,
          0.22,
          0.52,
          4,
          ['#38BDF8', '#0284C7'],
          '#0C4A6E',
          proj
        );
      } else if (activeBiome === 'sunset') {
        // Warm stepped desert canyon mesas
        addBox(
          items,
          -0.12,
          0.0,
          -0.1,
          0.58,
          0.42,
          0.52,
          {
            top: '#F59E0B',
            left: '#9A3412',
            right: '#7C2D12',
            stroke: '#431407',
          },
          proj
        );
        addBox(
          items,
          -0.12,
          0.42,
          -0.1,
          0.34,
          0.28,
          0.32,
          {
            top: '#FDBA74',
            left: '#C2410C',
            right: '#9A3412',
            stroke: '#431407',
          },
          proj
        );
        addPyramid(
          items,
          -0.55,
          0.0,
          0.45,
          0.26,
          0.4,
          4,
          ['#EA580C', '#9A3412'],
          '#431407',
          proj
        );
      } else if (activeBiome === 'night') {
        // Moonlit rocky crags & glowing night crystal spire
        addPyramid(
          items,
          -0.08,
          0.0,
          -0.08,
          0.46,
          0.78,
          5,
          ['#1E293B', '#0F172A'],
          '#38BDF8',
          proj
        );
        addPyramid(
          items,
          -0.48,
          0.0,
          0.4,
          0.24,
          0.5,
          4,
          ['#10B981', '#047857'],
          '#022C22',
          proj
        );
        addPyramid(
          items,
          0.38,
          0.0,
          -0.46,
          0.25,
          0.44,
          4,
          ['#334155', '#1E293B'],
          '#0F172A',
          proj
        );
      } else {
        // Day: Rolling emerald hills & fluffy sunlit meadow mounds
        addPyramid(
          items,
          -0.1,
          0.0,
          -0.1,
          0.52,
          0.66,
          4,
          ['#4ADE80', '#22C55E'],
          '#14532D',
          proj
        );
        addPyramid(
          items,
          -0.52,
          0.0,
          0.38,
          0.32,
          0.42,
          4,
          ['#86EFAC', '#4ADE80'],
          '#166534',
          proj
        );
        addPyramid(
          items,
          0.36,
          0.0,
          -0.44,
          0.26,
          0.36,
          4,
          ['#73BF2E', '#53971C'],
          '#14532D',
          proj
        );
      }

      // 5. Orbiting fluffy pixel clouds (Day / Sunset / Winter)
      if (activeBiome === 'day' || activeBiome === 'sunset' || activeBiome === 'winter') {
        for (let i = 0; i < 3; i++) {
          const ca = yaw * 0.45 + (Math.PI * 2 * i) / 3;
          const cp = proj({
            x: Math.cos(ca) * 1.15,
            y: 0.82 + Math.sin(elapsed * 1.6 + i) * 0.06,
            z: Math.sin(ca) * 1.15,
          });
          items.push({
            depth: cp.depth,
            draw: (c) => {
              c.save();
              c.fillStyle = `${cfg.cloudColor}CC`;
              c.fillRect(cp.sx - 12, cp.sy - 3, 24, 6);
              c.fillRect(cp.sx - 7, cp.sy - 7, 14, 5);
              c.restore();
            },
          });
        }
      }

      // 6. Dynamic 3D Weather Particles orbiting the diorama
      for (const pt of particles) {
        const a = pt.angle + elapsed * pt.speed * 0.55;
        let py = pt.y;
        if (activeBiome === 'volcano') {
          py = ((pt.y + elapsed * pt.speed * 0.65) % 1.45) - 0.05;
        } else if (activeBiome === 'winter' || activeBiome === 'cyberpunk') {
          py = 1.35 - ((pt.y + elapsed * pt.speed * 0.55) % 1.45);
        } else {
          py = pt.y + Math.sin(elapsed * 2 + pt.phase) * 0.08;
        }

        const pPos = proj({
          x: Math.cos(a) * pt.radius,
          y: py,
          z: Math.sin(a) * pt.radius,
        });

        items.push({
          depth: pPos.depth,
          draw: (c) => {
            c.save();
            if (activeBiome === 'volcano') {
              c.fillStyle = pt.phase > 3 ? '#FDE047' : '#F97316';
              c.globalAlpha = 0.85;
              c.fillRect(pPos.sx, pPos.sy, pt.size, pt.size);
            } else if (activeBiome === 'winter') {
              c.fillStyle = '#FFFFFF';
              c.globalAlpha = 0.85;
              c.beginPath();
              c.arc(pPos.sx, pPos.sy, pt.size * 0.65, 0, Math.PI * 2);
              c.fill();
            } else if (activeBiome === 'cyberpunk') {
              c.strokeStyle = pt.phase > 3 ? '#22D3EE' : '#F472B6';
              c.globalAlpha = 0.7;
              c.lineWidth = 1.2;
              c.beginPath();
              c.moveTo(pPos.sx, pPos.sy);
              c.lineTo(pPos.sx - 2, pPos.sy + 7);
              c.stroke();
            } else if (activeBiome === 'night') {
              const twinkle = 0.45 + 0.55 * Math.sin(elapsed * 3.5 + pt.phase);
              c.fillStyle = '#FEF08A';
              c.globalAlpha = twinkle;
              c.fillRect(pPos.sx, pPos.sy, pt.size * 0.85, pt.size * 0.85);
            } else {
              c.fillStyle = activeBiome === 'sunset' ? '#FDBA74' : '#FEF08A';
              c.globalAlpha = 0.35 + 0.25 * Math.sin(elapsed * 2 + pt.phase);
              c.fillRect(pPos.sx, pPos.sy, pt.size * 0.75, pt.size * 0.75);
            }
            c.restore();
          },
        });
      }

      // Depth-sort back-to-front (painter's algorithm) and draw!
      items.sort((a, b) => a.depth - b.depth);
      for (const item of items) {
        item.draw(ctx);
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="biome-3d-preview-stage"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        id="biome-3d-preview-canvas"
        className="h-full w-full block"
      />
    </div>
  );
};

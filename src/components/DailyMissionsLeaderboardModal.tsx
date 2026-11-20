import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Trophy, X, ArrowLeft, Globe2, TrendingUp, Award, Users } from 'lucide-react';
import { DailyMissionsState } from '../types';
import {
  FICTIONAL_GLOBAL_MISSION_AVERAGE,
  getTotalCompletedMissionsCount,
} from '../game/dailyMissions';
import { retroAudio } from '../game/audio';

interface DailyMissionsLeaderboardModalProps {
  isOpen: boolean;
  missionsState: DailyMissionsState;
  onClose: () => void;
  onBackToMissions?: () => void;
}

interface BenchmarkDatum {
  id: string;
  label: string;
  shortTag: string;
  missions: number;
  isUser?: boolean;
  isGlobalAvg?: boolean;
  color: string;
  stroke: string;
  description: string;
}

interface FictionalPilotRow {
  callsign: string;
  missions: number;
  badge: string;
  isUser?: boolean;
}

const FICTIONAL_PILOTS: Omit<FictionalPilotRow, 'isUser'>[] = [
  { callsign: 'SOLAR_VORTEX', missions: 84, badge: 'INFERNO' },
  { callsign: 'MAGMA_FALCON', missions: 63, badge: 'APEX' },
  { callsign: 'CYBER_WING_99', missions: 48, badge: 'ACE' },
  { callsign: 'NEON_PIP_X', missions: 35, badge: 'VETERAN' },
  { callsign: 'FROST_GLIDER', missions: 24, badge: 'PRO' },
  { callsign: 'RETRO_DASH', missions: 16, badge: 'PILOT' },
  { callsign: 'GLOBAL_AVG_BOT', missions: FICTIONAL_GLOBAL_MISSION_AVERAGE, badge: 'AVG' },
  { callsign: 'CLOUD_HOPPER', missions: 7, badge: 'CADET' },
  { callsign: 'PIXEL_CHICK', missions: 3, badge: 'ROOKIE' },
];

function computeEstimatedPercentile(userMissions: number): number {
  if (userMissions >= 75) return 1;
  if (userMissions >= 42) return 8;
  if (userMissions >= 24) return 22;
  if (userMissions >= FICTIONAL_GLOBAL_MISSION_AVERAGE) {
    const ratio = (userMissions - FICTIONAL_GLOBAL_MISSION_AVERAGE) / 12;
    return Math.max(23, Math.round(48 - ratio * 25));
  }
  if (userMissions <= 0) return 95;
  const ratio = userMissions / FICTIONAL_GLOBAL_MISSION_AVERAGE;
  return Math.max(50, Math.round(92 - ratio * 42));
}

export const DailyMissionsLeaderboardModal: React.FC<DailyMissionsLeaderboardModalProps> = ({
  isOpen,
  missionsState,
  onClose,
  onBackToMissions,
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(540);
  const [hoveredItem, setHoveredItem] = useState<BenchmarkDatum | null>(null);

  const { totalCompleted: userTotalCompleted, activeDays } = useMemo(
    () => getTotalCompletedMissionsCount(missionsState),
    [missionsState]
  );

  const globalAvg = FICTIONAL_GLOBAL_MISSION_AVERAGE;
  const deltaVsGlobal = userTotalCompleted - globalAvg;
  const estimatedTopPct = computeEstimatedPercentile(userTotalCompleted);

  const benchmarkData: BenchmarkDatum[] = useMemo(() => {
    const isAboveAvg = userTotalCompleted >= globalAvg;
    return [
      {
        id: 'you',
        label: 'YOU (TOTAL)',
        shortTag: 'YOUR RECORD',
        missions: userTotalCompleted,
        isUser: true,
        color: isAboveAvg ? '#73bf2e' : '#f7d302',
        stroke: isAboveAvg ? '#a3e635' : '#fde047',
        description: `Your cumulative total across ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}.`,
      },
      {
        id: 'rookie',
        label: 'ROOKIE AVG',
        shortTag: 'NEWCOMERS',
        missions: 4,
        color: 'rgba(148, 163, 184, 0.35)',
        stroke: '#94a3b8',
        description: 'Fictional average for players in their first few sessions.',
      },
      {
        id: 'global',
        label: 'GLOBAL AVG',
        shortTag: 'ALL PLAYERS',
        missions: globalAvg,
        isGlobalAvg: true,
        color: 'rgba(78, 192, 202, 0.35)',
        stroke: '#4ec0ca',
        description: 'Fictional worldwide player average for total daily missions completed.',
      },
      {
        id: 'top25',
        label: 'TOP 25% PILOTS',
        shortTag: 'VETERANS',
        missions: 24,
        color: 'rgba(192, 132, 252, 0.32)',
        stroke: '#c084fc',
        description: 'Fictional benchmark for dedicated weekly arcade pilots.',
      },
      {
        id: 'top10',
        label: 'TOP 10% ACES',
        shortTag: 'ELITE',
        missions: 42,
        color: 'rgba(251, 146, 60, 0.32)',
        stroke: '#fb923c',
        description: 'Fictional elite tier of daily mission grinders.',
      },
      {
        id: 'top1',
        label: 'TOP 1% LEGENDS',
        shortTag: 'MYTHIC',
        missions: 75,
        color: 'rgba(244, 63, 94, 0.32)',
        stroke: '#f43f5e',
        description: 'Fictional hall-of-fame daily mission champions.',
      },
    ];
  }, [userTotalCompleted, activeDays, globalAvg]);

  const rankedRoster = useMemo(() => {
    const combined: FictionalPilotRow[] = [
      ...FICTIONAL_PILOTS.map((p) => ({ ...p, isUser: false })),
      {
        callsign: 'YOU',
        missions: userTotalCompleted,
        badge: userTotalCompleted >= globalAvg ? 'ABOVE AVG' : 'RISING',
        isUser: true,
      },
    ];
    combined.sort((a, b) => {
      if (b.missions !== a.missions) return b.missions - a.missions;
      return a.isUser ? -1 : b.isUser ? 1 : 0;
    });
    return combined;
  }, [userTotalCompleted, globalAvg]);

  const userRank = rankedRoster.findIndex((r) => r.isUser) + 1;

  // Measure container responsively when open
  useEffect(() => {
    if (!isOpen) return;
    const el = chartContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setChartWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  // Render D3 horizontal comparison bar chart with Global Average reference line
  useEffect(() => {
    if (!isOpen) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = Math.max(290, chartWidth);
    const height = 250;
    const margin = { top: 26, right: 44, bottom: 30, left: 108 };
    const innerWidth = Math.max(120, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const maxVal = Math.max(
      80,
      d3.max<BenchmarkDatum, number>(benchmarkData, (d) => d.missions) ?? 80
    );

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height);

    const root = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleBand<string>()
      .domain(benchmarkData.map((d) => d.id))
      .range([0, innerHeight])
      .padding(0.28);

    const xTicks = x.ticks(5);

    // Vertical gridlines
    root
      .append('g')
      .selectAll('line')
      .data(xTicks)
      .join('line')
      .attr('x1', (d: number) => x(d))
      .attr('x2', (d: number) => x(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-dasharray', '3,3');

    // Bottom X-axis
    const xAxis = d3
      .axisBottom(x)
      .ticks(5)
      .tickSize(0);
    const xAxisG = root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', 'rgba(255,255,255,0.2)');
    xAxisG
      .selectAll('text')
      .attr('fill', 'rgba(255,255,255,0.55)')
      .attr('font-size', '9.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '700')
      .attr('dy', '13px');

    // Highlight strip behind YOU row
    const youY = y('you');
    if (youY !== undefined) {
      root
        .append('rect')
        .attr('x', -margin.left + 4)
        .attr('y', youY - 3)
        .attr('width', innerWidth + margin.left + margin.right - 8)
        .attr('height', y.bandwidth() + 6)
        .attr('rx', 6)
        .attr('fill', 'rgba(247, 211, 2, 0.08)')
        .attr('stroke', 'rgba(247, 211, 2, 0.3)')
        .attr('stroke-dasharray', '3,2');
    }

    // Row groups
    const rows = root
      .selectAll<SVGGElement, BenchmarkDatum>('g.bench-row')
      .data(benchmarkData)
      .join('g')
      .attr('class', 'bench-row')
      .attr('transform', (d: BenchmarkDatum) => `translate(0,${y(d.id) ?? 0})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event: MouseEvent, d: BenchmarkDatum) => setHoveredItem(d))
      .on('click', (_event: MouseEvent, d: BenchmarkDatum) => setHoveredItem(d))
      .on('mouseleave', () => setHoveredItem(null));

    // Left category labels
    rows
      .append('text')
      .attr('x', -8)
      .attr('y', y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', (d: BenchmarkDatum) =>
        d.isUser ? '#f7d302' : d.isGlobalAvg ? '#4ec0ca' : 'rgba(255,255,255,0.78)'
      )
      .attr('font-size', '9.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', (d: BenchmarkDatum) => (d.isUser || d.isGlobalAvg ? '900' : '700'))
      .text((d: BenchmarkDatum) => d.label);

    // Track background
    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', 'rgba(255,255,255,0.04)');

    // Animated horizontal bars
    const bars = rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', (d: BenchmarkDatum) => d.color)
      .attr('stroke', (d: BenchmarkDatum) => d.stroke)
      .attr('stroke-width', (d: BenchmarkDatum) => (d.isUser || d.isGlobalAvg ? 2 : 1.5));

    bars
      .transition()
      .duration(520)
      .delay((_d: BenchmarkDatum, idx: number) => idx * 45)
      .ease(d3.easeCubicOut)
      .attr('width', (d: BenchmarkDatum) => (d.missions > 0 ? Math.max(6, x(d.missions)) : 4));

    // Value labels at end of each bar
    rows
      .append('text')
      .attr('x', (d: BenchmarkDatum) => Math.max(6, x(d.missions)) + 6)
      .attr('y', y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', (d: BenchmarkDatum) =>
        d.isUser ? '#f7d302' : d.isGlobalAvg ? '#4ec0ca' : 'rgba(255,255,255,0.8)'
      )
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '900')
      .text((d: BenchmarkDatum) => String(d.missions));

    // Vertical dashed GLOBAL AVG reference line across all bars
    const avgX = x(globalAvg);
    root
      .append('line')
      .attr('x1', avgX)
      .attr('x2', avgX)
      .attr('y1', -8)
      .attr('y2', innerHeight)
      .attr('stroke', '#4ec0ca')
      .attr('stroke-width', 1.75)
      .attr('stroke-dasharray', '4,3');

    root
      .append('text')
      .attr('x', avgX)
      .attr('y', -13)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4ec0ca')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '900')
      .text(`GLOBAL AVG (${globalAvg})`);
  }, [isOpen, benchmarkData, chartWidth, globalAvg]);

  if (!isOpen) return null;

  const activeDatum = hoveredItem ?? benchmarkData[0];

  return (
    <div
      id="daily-missions-leaderboard-backdrop"
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/88 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono text-white select-none"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="daily-missions-leaderboard-dialog"
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border-4 border-[#4ec0ca] bg-[#0d0d0d] shadow-[0_0_55px_rgba(78,192,202,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBackToMissions && (
              <button
                type="button"
                id="btn-leaderboard-back-to-missions"
                onClick={() => {
                  retroAudio.playSelect();
                  onBackToMissions();
                }}
                className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/80 hover:border-[#f7d302] hover:text-[#f7d302] cursor-pointer shrink-0"
                title="Back to Daily Missions"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-[#4ec0ca] text-black shadow-[0_0_14px_rgba(78,192,202,0.5)]">
              <Trophy className="size-4 sm:size-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono text-sm sm:text-xl font-black italic tracking-tighter text-white truncate">
                MISSIONS_LEADERBOARD<span className="text-[#4ec0ca]">.GLOBAL</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/55 flex items-center gap-1.5">
                <Globe2 className="size-3 text-[#4ec0ca]" />
                <span>Your Total Completed Missions vs. Fictional Global Player Benchmarks</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-missions-leaderboard"
            onClick={() => {
              retroAudio.playSelect();
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 hover:border-white hover:text-white cursor-pointer shrink-0"
            title="Close Leaderboard (ESC)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
          {/* Top KPI Comparison Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[#f7d302]/60 bg-black/85 p-2.5 text-center">
              <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
                YOUR TOTAL
              </span>
              <div className="mt-1 flex items-center justify-center gap-1 text-base sm:text-xl font-black text-[#f7d302]">
                <Award className="size-4" />
                <span>{userTotalCompleted}</span>
              </div>
              <span className="text-[8px] text-white/40 uppercase">MISSIONS</span>
            </div>

            <div className="rounded-xl border border-[#4ec0ca]/60 bg-black/85 p-2.5 text-center">
              <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
                GLOBAL AVG
              </span>
              <div className="mt-1 flex items-center justify-center gap-1 text-base sm:text-xl font-black text-[#4ec0ca]">
                <Users className="size-4" />
                <span>{globalAvg}</span>
              </div>
              <span className="text-[8px] text-white/40 uppercase">SIMULATED AVG</span>
            </div>

            <div
              className={`rounded-xl border p-2.5 text-center bg-black/85 ${
                deltaVsGlobal >= 0
                  ? 'border-[#73bf2e]/70'
                  : 'border-[#fb923c]/60'
              }`}
            >
              <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
                VS. GLOBAL AVG
              </span>
              <div
                className={`mt-1 flex items-center justify-center gap-1 text-base sm:text-xl font-black ${
                  deltaVsGlobal >= 0 ? 'text-[#73bf2e]' : 'text-[#fb923c]'
                }`}
              >
                <TrendingUp className="size-4" />
                <span>
                  {deltaVsGlobal >= 0 ? `+${deltaVsGlobal}` : deltaVsGlobal}
                </span>
              </div>
              <span className="text-[8px] text-white/55 font-bold uppercase">
                EST. TOP {estimatedTopPct}% • #{userRank}
              </span>
            </div>
          </div>

          {/* D3 Horizontal Bar Chart Card */}
          <div className="rounded-xl border-2 border-white/15 bg-black/85 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  TOTAL MISSIONS COMPLETED — GLOBAL COMPARISON
                </h3>
                <p className="text-[9px] sm:text-[10px] text-white/50">
                  Dashed cyan line marks the fictional Global Player Average ({globalAvg} missions)
                </p>
              </div>
              <span className="rounded border border-[#4ec0ca]/40 bg-[#4ec0ca]/10 px-2 py-0.5 text-[9px] font-black text-[#4ec0ca]">
                D3 VISUALIZATION
              </span>
            </div>

            <div ref={chartContainerRef} className="w-full overflow-hidden">
              <svg
                ref={svgRef}
                id="missions-leaderboard-d3-svg"
                className="block w-full"
                role="img"
                aria-label="D3 horizontal bar chart comparing your total completed daily missions against fictional global player benchmarks"
              />
            </div>

            {/* Interactive Hover / Selection Detail Bar */}
            {activeDatum && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-[10px] sm:text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0"
                    style={{
                      backgroundColor: activeDatum.isUser
                        ? '#f7d302'
                        : activeDatum.isGlobalAvg
                        ? '#4ec0ca'
                        : 'rgba(255,255,255,0.12)',
                      color:
                        activeDatum.isUser || activeDatum.isGlobalAvg ? '#000' : '#fff',
                    }}
                  >
                    {activeDatum.label}
                  </span>
                  <span className="text-white/65 truncate">{activeDatum.description}</span>
                </div>

                <span className="font-black text-[#f7d302] shrink-0">
                  {activeDatum.isUser
                    ? deltaVsGlobal >= 0
                      ? `+${deltaVsGlobal} ABOVE GLOBAL AVG`
                      : `${Math.abs(deltaVsGlobal)} TO REACH GLOBAL AVG`
                    : userTotalCompleted >= activeDatum.missions
                    ? `YOU LEAD BY +${userTotalCompleted - activeDatum.missions}`
                    : `${activeDatum.missions - userTotalCompleted} MISSIONS AHEAD`}
                </span>
              </div>
            )}
          </div>

          {/* Fictional Global Standings Table */}
          <div className="rounded-xl border border-white/15 bg-black/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/75">
                SIMULATED GLOBAL PILOT STANDINGS
              </h3>
              <span className="text-[9px] font-bold text-[#4ec0ca]">
                YOUR RANK: #{userRank} OF {rankedRoster.length}
              </span>
            </div>

            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {rankedRoster.map((row, idx) => (
                <div
                  key={`${row.callsign}-${idx}`}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[10px] sm:text-xs ${
                    row.isUser
                      ? 'border-[#f7d302] bg-[#f7d302]/15 text-white font-black shadow-[0_0_12px_rgba(247,211,2,0.2)]'
                      : row.callsign === 'GLOBAL_AVG_BOT'
                      ? 'border-[#4ec0ca]/45 bg-[#4ec0ca]/10 text-[#4ec0ca] font-bold'
                      : 'border-white/10 bg-white/[0.03] text-white/75'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 text-center font-black text-white/50">
                      #{idx + 1}
                    </span>
                    <span className="truncate">{row.callsign}</span>
                    <span className="rounded bg-black/50 border border-current/25 px-1.5 py-0.5 text-[8px] font-black uppercase">
                      {row.badge}
                    </span>
                  </div>
                  <span className="font-black shrink-0">
                    {row.missions} {row.missions === 1 ? 'MISSION' : 'MISSIONS'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/95 px-4 py-2.5 text-[9px] sm:text-[10px] text-white/50 shrink-0">
          <span>Benchmarks use simulated global arcade player averages for local comparison.</span>
          {onBackToMissions && (
            <button
              type="button"
              onClick={() => {
                retroAudio.playSelect();
                onBackToMissions();
              }}
              className="rounded-lg border border-[#f7d302]/60 bg-[#f7d302]/15 px-2.5 py-1 text-[10px] font-black text-[#f7d302] hover:bg-[#f7d302] hover:text-black cursor-pointer shrink-0 ml-2 transition-colors"
            >
              BACK TO MISSIONS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

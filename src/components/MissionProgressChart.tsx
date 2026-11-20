import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Coins, CheckCircle2, TrendingUp } from 'lucide-react';
import { DailyMissionDayRecord } from '../types';

interface MissionProgressChartProps {
  data: DailyMissionDayRecord[];
}

export const MissionProgressChart: React.FC<MissionProgressChartProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(520);
  const [hoveredDay, setHoveredDay] = useState<DailyMissionDayRecord | null>(null);

  // Measure container responsively
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setChartWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render D3 grouped bar chart (Total vs Completed missions over last 7 days)
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || data.length === 0) return;

    const height = 230;
    const margin = { top: 24, right: 16, bottom: 42, left: 34 };
    const width = Math.max(280, chartWidth);
    const innerWidth = Math.max(160, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const maxTotal = Math.max(
      3,
      d3.max<DailyMissionDayRecord, number>(data, (d) => Math.max(d.total, d.completed)) ?? 3
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

    const x0 = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.dateKey))
      .range([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.12);

    const x1 = d3
      .scaleBand<'total' | 'completed'>()
      .domain(['total', 'completed'])
      .range([0, x0.bandwidth()])
      .padding(0.14);

    const y = d3
      .scaleLinear()
      .domain([0, maxTotal])
      .nice()
      .range([innerHeight, 0]);

    const yTicks = d3.range(0, maxTotal + 1, 1);

    // Horizontal dashed gridlines
    root
      .append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-dasharray', (d) => (d === 0 ? 'none' : '3,3'));

    // Highlight column for Today
    const todayRec = data.find((d) => d.isToday);
    if (todayRec) {
      const tx = x0(todayRec.dateKey);
      if (tx !== undefined) {
        root
          .append('rect')
          .attr('x', tx - 4)
          .attr('y', -10)
          .attr('width', x0.bandwidth() + 8)
          .attr('height', innerHeight + 10)
          .attr('rx', 6)
          .attr('fill', 'rgba(247, 211, 2, 0.08)')
          .attr('stroke', 'rgba(247, 211, 2, 0.35)')
          .attr('stroke-dasharray', '3,2');
      }
    }

    // Y-axis
    const yAxis = d3
      .axisLeft(y)
      .tickValues(yTicks)
      .tickFormat((d) => String(d))
      .tickSize(0);

    const yAxisG = root.append('g').call(yAxis);
    yAxisG.select('.domain').attr('stroke', 'rgba(255,255,255,0.2)');
    yAxisG
      .selectAll('text')
      .attr('fill', 'rgba(255,255,255,0.55)')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '700')
      .attr('dx', '-6px');

    // X-axis
    const xAxis = d3
      .axisBottom(x0)
      .tickFormat((key) => {
        const found = data.find((d) => d.dateKey === key);
        return found ? found.shortLabel : key;
      })
      .tickSize(0);

    const xAxisG = root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', 'rgba(255,255,255,0.2)');
    xAxisG
      .selectAll<SVGTextElement, string>('text')
      .attr('fill', (key) => {
        const found = data.find((d) => d.dateKey === key);
        return found?.isToday ? '#f7d302' : 'rgba(255,255,255,0.75)';
      })
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', (key) => {
        const found = data.find((d) => d.dateKey === key);
        return found?.isToday ? '900' : '700';
      })
      .attr('dy', '14px');

    // Secondary date subtitle below day label
    root
      .selectAll<SVGTextElement, DailyMissionDayRecord>('text.date-sub')
      .data(data)
      .join('text')
      .attr('class', 'date-sub')
      .attr('x', (d: DailyMissionDayRecord) => (x0(d.dateKey) ?? 0) + x0.bandwidth() / 2)
      .attr('y', innerHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: DailyMissionDayRecord) =>
        d.isToday ? 'rgba(247,211,2,0.75)' : 'rgba(255,255,255,0.38)'
      )
      .attr('font-size', '8.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d: DailyMissionDayRecord) => d.monthDay);

    // Day groups for paired bars
    const dayGroups = root
      .selectAll<SVGGElement, DailyMissionDayRecord>('g.day-group')
      .data(data)
      .join('g')
      .attr('class', 'day-group')
      .attr('transform', (d: DailyMissionDayRecord) => `translate(${x0(d.dateKey) ?? 0},0)`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event: MouseEvent, d: DailyMissionDayRecord) => setHoveredDay(d))
      .on('click', (_event: MouseEvent, d: DailyMissionDayRecord) => setHoveredDay(d))
      .on('mouseleave', () => setHoveredDay(null));

    // Invisible hit target per day for easy hover/tap
    dayGroups
      .append('rect')
      .attr('x', -3)
      .attr('y', 0)
      .attr('width', x0.bandwidth() + 6)
      .attr('height', innerHeight)
      .attr('fill', 'transparent');

    // Total Missions bar
    const totalBars = dayGroups
      .append('rect')
      .attr('x', x1('total') ?? 0)
      .attr('width', x1.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 3)
      .attr('fill', 'rgba(78, 192, 202, 0.25)')
      .attr('stroke', '#4ec0ca')
      .attr('stroke-width', 1.5);

    totalBars
      .transition()
      .duration(400)
      .ease(d3.easeCubicOut)
      .attr('y', (d: DailyMissionDayRecord) => y(d.total))
      .attr('height', (d: DailyMissionDayRecord) => Math.max(0, innerHeight - y(d.total)));

    // Completed Missions bar
    const completedBars = dayGroups
      .append('rect')
      .attr('x', x1('completed') ?? 0)
      .attr('width', x1.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 3)
      .attr('fill', (d: DailyMissionDayRecord) =>
        d.completed >= d.total && d.total > 0
          ? '#73bf2e'
          : d.completed > 0
          ? '#f7d302'
          : 'rgba(255,255,255,0.08)'
      )
      .attr('stroke', (d: DailyMissionDayRecord) =>
        d.completed >= d.total && d.total > 0
          ? '#a3e635'
          : d.completed > 0
          ? '#fde047'
          : 'rgba(255,255,255,0.18)'
      )
      .attr('stroke-width', 1.5);

    completedBars
      .transition()
      .duration(520)
      .delay(60)
      .ease(d3.easeCubicOut)
      .attr('y', (d: DailyMissionDayRecord) => (d.completed > 0 ? y(d.completed) : innerHeight - 3))
      .attr('height', (d: DailyMissionDayRecord) =>
        d.completed > 0 ? Math.max(3, innerHeight - y(d.completed)) : 3
      );

    // Value labels above Total bars
    dayGroups
      .append('text')
      .attr('x', (x1('total') ?? 0) + x1.bandwidth() / 2)
      .attr('y', (d: DailyMissionDayRecord) => y(d.total) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4ec0ca')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '700')
      .text((d: DailyMissionDayRecord) => String(d.total));

    // Value labels above Completed bars
    dayGroups
      .append('text')
      .attr('x', (x1('completed') ?? 0) + x1.bandwidth() / 2)
      .attr('y', (d: DailyMissionDayRecord) => (d.completed > 0 ? y(d.completed) - 5 : innerHeight - 7))
      .attr('text-anchor', 'middle')
      .attr('fill', (d: DailyMissionDayRecord) =>
        d.completed >= d.total && d.total > 0
          ? '#73bf2e'
          : d.completed > 0
          ? '#f7d302'
          : 'rgba(255,255,255,0.35)'
      )
      .attr('font-size', '9.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '900')
      .text((d: DailyMissionDayRecord) => String(d.completed));
  }, [data, chartWidth]);

  const totalCompleted7d = data.reduce((sum, d) => sum + d.completed, 0);
  const totalMissions7d = data.reduce((sum, d) => sum + d.total, 0);
  const clearRate =
    totalMissions7d > 0 ? Math.round((totalCompleted7d / totalMissions7d) * 100) : 0;
  const totalBonus7d = data.reduce((sum, d) => sum + d.bonusCoinsEarned, 0);

  const activeDetail = hoveredDay ?? data[data.length - 1] ?? null;

  return (
    <div id="mission-progress-d3-panel" className="space-y-3">
      {/* 7-Day Summary Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[#73bf2e]/50 bg-black/80 p-2.5 text-center">
          <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
            7-DAY CLEARED
          </span>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm sm:text-lg font-black text-[#73bf2e]">
            <CheckCircle2 className="size-3.5 sm:size-4" />
            <span>
              {totalCompleted7d}/{totalMissions7d}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#4ec0ca]/50 bg-black/80 p-2.5 text-center">
          <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
            CLEAR RATE
          </span>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm sm:text-lg font-black text-[#4ec0ca]">
            <TrendingUp className="size-3.5 sm:size-4" />
            <span>{clearRate}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#f7d302]/50 bg-black/80 p-2.5 text-center">
          <span className="block text-[8px] sm:text-[9px] text-white/50 uppercase font-bold">
            7-DAY BONUS
          </span>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm sm:text-lg font-black text-[#f7d302]">
            <Coins className="size-3.5 sm:size-4" />
            <span>+{totalBonus7d}¢</span>
          </div>
        </div>
      </div>

      {/* D3 Bar Chart Card */}
      <div className="rounded-xl border-2 border-white/15 bg-black/85 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              COMPLETED VS. TOTAL MISSIONS (LAST 7 DAYS)
            </h3>
            <p className="text-[9px] sm:text-[10px] text-white/50">
              Hover or tap any day column to inspect mission stats
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-[#4ec0ca]">
              <span className="inline-block size-2.5 rounded-xs border border-[#4ec0ca] bg-[#4ec0ca]/25" />
              TOTAL
            </span>
            <span className="flex items-center gap-1.5 text-[#73bf2e]">
              <span className="inline-block size-2.5 rounded-xs border border-[#a3e635] bg-[#73bf2e]" />
              COMPLETED
            </span>
          </div>
        </div>

        {/* Responsive D3 SVG Mount */}
        <div ref={containerRef} className="w-full overflow-hidden">
          <svg
            ref={svgRef}
            id="mission-progress-d3-svg"
            className="block w-full"
            role="img"
            aria-label="Bar chart of completed versus total daily missions over the last 7 days"
          />
        </div>

        {/* Selected / Hovered Day Readout Bar */}
        {activeDetail && (
          <div
            id="mission-progress-day-readout"
            className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-[10px] sm:text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                  activeDetail.isToday
                    ? 'bg-[#f7d302] text-black'
                    : 'bg-white/10 text-white/80'
                }`}
              >
                {activeDetail.shortLabel}
              </span>
              <span className="font-bold text-white/80">{activeDetail.monthDay}</span>
              <span className="text-white/35">({activeDetail.dateKey})</span>
            </div>

            <div className="flex items-center gap-3 font-black">
              <span
                className={
                  activeDetail.completed >= activeDetail.total
                    ? 'text-[#73bf2e]'
                    : activeDetail.completed > 0
                    ? 'text-[#f7d302]'
                    : 'text-white/50'
                }
              >
                {activeDetail.completed} / {activeDetail.total} COMPLETED (
                {Math.round((activeDetail.completed / Math.max(1, activeDetail.total)) * 100)}%)
              </span>
              <span className="text-[#f7d302]">+{activeDetail.bonusCoinsEarned}¢</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

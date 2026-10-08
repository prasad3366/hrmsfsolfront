import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatWorkedHours } from '../../utils/attendanceDate';

/* Presentation-only chart wrappers. Every chart receives real dashboard data
   from its caller; nothing here fetches, derives business rules or invents data. */

/* Brand ocean/gold family, re-stepped so adjacent slots stay distinguishable for
   colour-vision-deficient readers (validated: lightness band, chroma floor, CVD and
   normal-vision separation). Every chart also shows values in a legend or tooltip,
   so colour is never the only carrier of meaning. */
export const CHART_COLORS = {
  navy: '#073b5c',
  blue: '#24599a',
  sky: '#3a9fe0',
  teal: '#3c8d93',
  gold: '#c9952b',
  bronze: '#9a6b1f',
  green: '#2e8b6a',
  amber: '#c9952b',
  rose: '#c8503f',
  slate: '#9fb2ba',
};

/* Attendance status colours used consistently across every dashboard chart and badge. */
export const STATUS_COLORS = {
  present: CHART_COLORS.green,
  late: CHART_COLORS.gold,
  halfDay: CHART_COLORS.sky,
  leave: CHART_COLORS.blue,
  absent: CHART_COLORS.rose,
};

const INK = { primary: '#12354a', secondary: '#486271', muted: '#78909a', grid: '#e8eff0', axis: '#dce6e8' };

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #dce6e8',
  boxShadow: '0 12px 30px rgba(7,59,92,0.12)',
  fontSize: 12,
  color: INK.primary,
  padding: '8px 12px',
};

const tooltipLabelStyle = { fontWeight: 700, color: INK.primary, marginBottom: 4 };
const axisTick = { fontSize: 11, fill: '#617984' };
const legendStyle = { fontSize: 12, color: INK.secondary, paddingTop: 8 };

const truncate = (value: unknown, max: number) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

export type DonutSlice = { name: string; value: number; color: string };

export const DonutChart = ({ data, centerLabel, centerValue, emptyMessage, valueSuffix }: {
  data: DonutSlice[];
  centerLabel: string;
  centerValue?: string | number;
  emptyMessage: string;
  valueSuffix?: string;
}) => {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) return <ChartEmpty message={emptyMessage} />;
  const visible = data.filter((slice) => slice.value > 0);

  return (
    <div className="flex flex-col items-center gap-6 px-5 py-6 sm:flex-row sm:justify-center">
      <div className="relative h-44 w-44 shrink-0 sm:h-48 sm:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={visible} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={visible.length > 1 ? 2 : 0} stroke="#ffffff" strokeWidth={2} startAngle={90} endAngle={-270} animationDuration={500}>
              {visible.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [`${value}${valueSuffix ? ` ${valueSuffix}` : ''} · ${Math.round((Number(value) / total) * 100)}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[1.75rem] font-bold leading-none tabular-nums text-[#073b5c]">{centerValue ?? total}</span>
          <span className="mt-1 max-w-[7rem] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78909a]">{centerLabel}</span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 max-w-[16rem] gap-2.5 text-sm" aria-label={`${centerLabel} breakdown`}>
        {data.map((slice) => (
          <li key={slice.name} className="flex min-w-0 items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[#486271]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
              <span className="truncate" title={slice.name}>{slice.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-[#12354a]"><span>{slice.value}</span><span className="ml-1.5 inline-block w-9 text-right text-xs font-normal text-[#78909a]">{Math.round((slice.value / total) * 100)}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export type BarSeries = { key: string; label: string; color: string };

export const ComparisonBarChart = ({ data, xKey, series, stacked = false, emptyMessage, height = 280, horizontal = false }: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: BarSeries[];
  stacked?: boolean;
  emptyMessage: string;
  height?: number;
  /** Category labels on the Y axis - best for long names such as departments */
  horizontal?: boolean;
}) => {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;
  const chartHeight = horizontal ? Math.max(height, data.length * 38 + (series.length > 1 ? 72 : 40)) : height;
  const lastIndex = series.length - 1;
  const endRadius = (index: number): [number, number, number, number] => {
    if (stacked && index < lastIndex) return [0, 0, 0, 0];
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  };

  return (
    <div className="px-3 pb-4 pt-5" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 4, right: 20, left: 8, bottom: 0 } : { top: 4, right: 12, left: -16, bottom: 0 }}
          barCategoryGap={horizontal ? '24%' : '30%'}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} stroke={INK.grid} />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={xKey} width={112} tick={axisTick} tickLine={false} axisLine={{ stroke: INK.axis }} tickFormatter={(value) => truncate(value, 16)} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: INK.axis }} interval={0} tickFormatter={(value) => truncate(value, data.length > 4 ? 9 : 14)} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: 'rgba(36,89,154,0.06)' }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />}
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              stackId={stacked ? 'stack' : undefined}
              radius={endRadius(index)}
              maxBarSize={horizontal ? 22 : 40}
              stroke={stacked ? '#ffffff' : undefined}
              strokeWidth={stacked ? 1 : 0}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export type TrendSeries = { key: string; label: string; color: string };

/* Multi-series trend over time (one shared Y axis). */
export const TrendLineChart = ({ data, xKey, series, emptyMessage, height = 280 }: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: TrendSeries[];
  emptyMessage: string;
  height?: number;
}) => {
  if (!data.length) return <ChartEmpty message={emptyMessage} />;

  return (
    <div className="px-3 pb-4 pt-5" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={INK.grid} />
          <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: INK.axis }} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ stroke: INK.axis, strokeWidth: 1 }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />}
          {series.map((item) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: '#ffffff', fill: item.color }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }} animationDuration={500} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WorkedHoursTrend = ({ points, emptyMessage }: {
  points: Array<{ label: string; hours: number }>;
  emptyMessage: string;
}) => {
  if (!points.length) return <ChartEmpty message={emptyMessage} />;

  return (
    <div className="h-[280px] px-3 pb-4 pt-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 16, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="workedHoursFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={INK.grid} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: INK.axis }} minTickGap={12} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}h`} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ stroke: INK.axis, strokeWidth: 1 }} formatter={(value) => [formatWorkedHours(Number(value)), 'Worked']} />
          <Area type="monotone" dataKey="hours" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#workedHoursFill)" dot={{ r: 3, strokeWidth: 2, stroke: '#ffffff', fill: CHART_COLORS.blue }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff', fill: CHART_COLORS.gold }} animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ChartEmpty = ({ message }: { message: string }) => (
  <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3f5] text-[#9fb2ba]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19V5M4 19h16M8 15v-3M12 15V9M16 15v-5" /></svg>
    </span>
    <p className="max-w-xs text-sm text-[#78909a]">{message}</p>
  </div>
);

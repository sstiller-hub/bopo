import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { WeightEntry } from '@/hooks/useWeightLog';
import { cn } from '@/lib/utils';

interface WeightHistoryChartProps {
  entries: WeightEntry[];
  unit: 'lb' | 'kg';
  loading?: boolean;
}

export function WeightHistoryChart({ entries, unit, loading }: WeightHistoryChartProps) {
  // Prepare chart data - reverse to show oldest first
  const chartData = useMemo(() => {
    if (!entries.length) return [];
    
    return [...entries]
      .reverse()
      .map((entry) => ({
        date: entry.measured_at,
        weight: unit === 'lb' ? Number(entry.weight_lb) : Number(entry.weight_kg),
        formattedDate: format(parseISO(entry.measured_at), 'MMM d'),
      }));
  }, [entries, unit]);

  // Calculate stats
  const stats = useMemo(() => {
    if (entries.length < 2) return null;

    const latest = unit === 'lb' ? Number(entries[0].weight_lb) : Number(entries[0].weight_kg);
    const oldest = unit === 'lb' ? Number(entries[entries.length - 1].weight_lb) : Number(entries[entries.length - 1].weight_kg);
    const change = latest - oldest;
    const changePercent = ((change / oldest) * 100).toFixed(1);

    // Calculate 7-day change if we have enough data
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentEntries = entries.filter(e => parseISO(e.measured_at) >= sevenDaysAgo);
    let weeklyChange = null;
    if (recentEntries.length >= 2) {
      const weekLatest = unit === 'lb' ? Number(recentEntries[0].weight_lb) : Number(recentEntries[0].weight_kg);
      const weekOldest = unit === 'lb' ? Number(recentEntries[recentEntries.length - 1].weight_lb) : Number(recentEntries[recentEntries.length - 1].weight_kg);
      weeklyChange = weekLatest - weekOldest;
    }

    // Calculate average
    const weights = entries.map(e => unit === 'lb' ? Number(e.weight_lb) : Number(e.weight_kg));
    const average = weights.reduce((a, b) => a + b, 0) / weights.length;

    return {
      latest,
      change,
      changePercent,
      weeklyChange,
      average,
      min: Math.min(...weights),
      max: Math.max(...weights),
    };
  }, [entries, unit]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 shadow-sm text-center"
      >
        <p className="text-muted-foreground">No weight entries yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Log your first weight to see your progress!</p>
      </motion.div>
    );
  }

  const TrendIcon = stats?.change && stats.change < -0.1 
    ? TrendingDown 
    : stats?.change && stats.change > 0.1 
      ? TrendingUp 
      : Minus;

  const trendColor = stats?.change && stats.change < -0.1 
    ? 'text-green-500' 
    : stats?.change && stats.change > 0.1 
      ? 'text-orange-500' 
      : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header with stats */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Weight History</h3>
            <p className="text-sm text-muted-foreground">{entries.length} entries</p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <TrendIcon className={cn('w-4 h-4', trendColor)} />
                <span className={cn('font-semibold', trendColor)}>
                  {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} {unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.changePercent}% overall
              </p>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="font-bold text-foreground">{stats.latest.toFixed(1)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="font-bold text-foreground">{stats.average.toFixed(1)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground">7-day</p>
              <p className={cn(
                'font-bold',
                stats.weeklyChange !== null && stats.weeklyChange < -0.1 
                  ? 'text-green-500' 
                  : stats.weeklyChange !== null && stats.weeklyChange > 0.1 
                    ? 'text-orange-500' 
                    : 'text-foreground'
              )}>
                {stats.weeklyChange !== null 
                  ? `${stats.weeklyChange > 0 ? '+' : ''}${stats.weeklyChange.toFixed(1)}`
                  : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-4 pt-2">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.toFixed(0)}
              />
              {stats && (
                <ReferenceLine 
                  y={stats.average} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, 'Weight']}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

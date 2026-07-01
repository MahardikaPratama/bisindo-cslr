import { useState, useEffect, useMemo } from 'react';
import { cn } from '../utils/cn';
import { AVAILABLE_CONFIGS } from '../constants/configs.constants';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Trophy, Activity, AlertTriangle } from 'lucide-react';

interface ConfigMetrics {
  wer: number;
  speed: number;
  sentenceErrors: number;
  substitutions: number;
  deletions: number;
  insertions: number;
}

interface DashboardData {
  config: string;
  major: ConfigMetrics;
  minor: ConfigMetrics;
}

type SortField = keyof ConfigMetrics | 'config';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [sortField, setSortField] = useState<SortField>('wer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      try {
        const promises = AVAILABLE_CONFIGS.map(cfg => 
          fetch(`/hasil-eksperimen/${cfg}.json`).then(r => r.json()).catch(() => null)
        );
        const results = await Promise.all(promises);
        
        const parsedData: DashboardData[] = results.map((res, index) => {
          if (!res) return null;
          const major = res.tests?.test_si_major;
          const minor = res.tests?.test_si_minor;
          
          return {
            config: AVAILABLE_CONFIGS[index],
            major: {
              wer: major?.word_error_rate ?? 0,
              speed: res.inference_speed ?? 0,
              sentenceErrors: major?.summary?.global?.sentence_errors ?? 0,
              substitutions: major?.summary?.global?.substitutions ?? 0,
              deletions: major?.summary?.global?.deletions ?? 0,
              insertions: major?.summary?.global?.insertions ?? 0,
            },
            minor: {
              wer: minor?.word_error_rate ?? 0,
              speed: res.inference_speed ?? 0,
              sentenceErrors: minor?.summary?.global?.sentence_errors ?? 0,
              substitutions: minor?.summary?.global?.substitutions ?? 0,
              deletions: minor?.summary?.global?.deletions ?? 0,
              insertions: minor?.summary?.global?.insertions ?? 0,
            }
          };
        }).filter(Boolean) as DashboardData[];
        
        setData(parsedData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
      setLoading(false);
    }
    fetchAllData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortField === 'config') {
        return sortOrder === 'asc' ? a.config.localeCompare(b.config) : b.config.localeCompare(a.config);
      } else {
        const aVal = a[mode][sortField];
        const bVal = b[mode][sortField];
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
  }, [data, sortField, sortOrder, mode]);

  const maxValues = useMemo(() => {
    const metrics = data.map(d => d[mode]);
    return {
      wer: Math.max(...metrics.map(d => d.wer), 1),
      speed: Math.max(...metrics.map(d => d.speed), 1),
      sentenceErrors: Math.max(...metrics.map(d => d.sentenceErrors), 1),
      substitutions: Math.max(...metrics.map(d => d.substitutions), 1),
      deletions: Math.max(...metrics.map(d => d.deletions), 1),
      insertions: Math.max(...metrics.map(d => d.insertions), 1),
    };
  }, [data, mode]);

  // Derived sections
  const top4 = useMemo(() => {
    return [...data].sort((a, b) => a[mode].wer - b[mode].wer).slice(0, 4);
  }, [data, mode]);

  const overallErrors = useMemo(() => {
    let sub = 0;
    let del = 0;
    let ins = 0;
    data.forEach(d => {
      sub += d[mode].substitutions;
      del += d[mode].deletions;
      ins += d[mode].insertions;
    });
    const total = sub + del + ins || 1;
    return { sub, del, ins, total };
  }, [data, mode]);

  const SortableHeader = ({ field, label, align = 'left', highlight = false }: { field: SortField, label: string, align?: 'left' | 'right', highlight?: boolean }) => {
    return (
      <th 
        className={cn(
          "px-4 py-4 cursor-pointer hover:bg-surface-hover transition-colors select-none",
          align === 'right' ? "text-right" : "text-left",
          highlight ? "text-brand-blue" : "text-text-secondary"
        )}
        onClick={() => handleSort(field)}
      >
        <div className={cn("flex items-center gap-2", align === 'right' ? "justify-end" : "justify-start")}>
          <span className={cn("font-bold text-xs uppercase tracking-wider", highlight && "text-[13px]")}>{label}</span>
          <span className="text-text-muted">
            {sortField === field ? (
              sortOrder === 'asc' ? <ArrowUp size={14} className={highlight ? "text-brand-blue" : "text-text-primary"} /> : <ArrowDown size={14} className={highlight ? "text-brand-blue" : "text-text-primary"} />
            ) : (
              <ArrowUpDown size={14} className="opacity-30 hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const BarCell = ({ value, max, format = (v: number) => v.toString(), color = "bg-brand-blue", prominent = false }: { value: number, max: number, format?: (v: number) => string, color?: string, prominent?: boolean }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <td className={cn("px-4 py-3", prominent && "bg-surface-bg/30")}>
        <div className="flex items-center gap-3">
          <div className={cn("w-12 text-right font-mono", prominent ? "text-base font-bold text-text-primary" : "text-sm text-text-secondary")}>
            {format(value)}
          </div>
          <div className={cn("flex-1 bg-surface-bg rounded-full overflow-hidden", prominent ? "h-3" : "h-1.5")}>
            <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-screen-2xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Statistical Dashboard</h1>
          <p className="text-text-secondary mt-1">Deep analysis of WER, Inference Speed, and Error Distributions.</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-surface-card border border-surface-border rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setMode('major')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              mode === 'major' ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30 shadow-panel-glow" : "text-text-muted hover:text-text-primary"
            )}
          >
            SI Major
          </button>
          <button 
            onClick={() => setMode('minor')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              mode === 'minor' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-panel" : "text-text-muted hover:text-text-primary"
            )}
          >
            SI Minor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-brand-blue">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p className="text-lg font-medium">Crunching data across all models...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-8 animate-fade-in">
          
          {/* Top Row: Best Configs & Global Errors */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Top 4 Configs */}
            <div className="xl:col-span-8 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-yellow-500" />
                <h2 className="text-lg font-bold text-text-primary">Top 4 Configurations (by WER)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                {top4.map((cfg, idx) => (
                  <div key={cfg.config} className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col justify-between shadow-panel hover:border-brand-blue/50 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-blue/10 to-transparent opacity-50 rounded-bl-3xl"></div>
                    <div>
                      <div className="text-xs font-bold text-brand-blue mb-1 uppercase tracking-widest">Rank {idx + 1}</div>
                      <div className="text-2xl font-black text-text-primary mb-4">{cfg.config}</div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-xs text-text-secondary">WER</div>
                        <div className="text-xl font-bold text-text-primary">{cfg[mode].wer.toFixed(1)}%</div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-xs text-text-secondary">Speed</div>
                        <div className="text-sm font-semibold text-green-400">{cfg[mode].speed.toFixed(1)} ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Error Distribution */}
            <div className="xl:col-span-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-red-400" />
                <h2 className="text-lg font-bold text-text-primary">Global Error Distribution</h2>
              </div>
              <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-panel flex-1 flex flex-col justify-center">
                <div className="mb-6">
                  <div className="text-sm text-text-secondary mb-1">Most common error type across all configs</div>
                  <div className="text-xl font-bold text-red-400">
                    {overallErrors.sub > overallErrors.del && overallErrors.sub > overallErrors.ins ? 'Substitutions' : 
                     overallErrors.del > overallErrors.sub && overallErrors.del > overallErrors.ins ? 'Deletions' : 'Insertions'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'Substitutions', val: overallErrors.sub, color: 'bg-yellow-400', text: 'text-yellow-400' },
                    { label: 'Deletions', val: overallErrors.del, color: 'bg-red-400', text: 'text-red-400' },
                    { label: 'Insertions', val: overallErrors.ins, color: 'bg-blue-400', text: 'text-blue-400' }
                  ].map(err => {
                    const pct = ((err.val / overallErrors.total) * 100).toFixed(1);
                    return (
                      <div key={err.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-text-primary">{err.label}</span>
                          <span className={cn("font-bold", err.text)}>{err.val} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-surface-bg rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", err.color)} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
          </div>

          {/* Detailed Data Table */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-brand-blue" />
              <h2 className="text-lg font-bold text-text-primary">Detailed Configuration Metrics</h2>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto shadow-panel-glow">
              <table className="w-full min-w-[1000px] text-sm text-left">
                <thead className="bg-surface-bg/80 border-b border-surface-border">
                  <tr>
                    <SortableHeader field="config" label="Config" />
                    <SortableHeader field="wer" label="WER (%)" highlight />
                    <SortableHeader field="speed" label="Speed (ms)" highlight />
                    <SortableHeader field="sentenceErrors" label="Sentence Err" />
                    <SortableHeader field="substitutions" label="Substitutions" />
                    <SortableHeader field="deletions" label="Deletions" />
                    <SortableHeader field="insertions" label="Insertions" />
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row, idx) => {
                    const r = row[mode];
                    return (
                      <tr key={row.config} className={cn(
                        "border-b border-surface-border/50 hover:bg-surface-hover transition-colors group",
                        idx % 2 === 0 ? "bg-transparent" : "bg-surface-bg/30"
                      )}>
                        <td className="px-4 py-4 font-bold text-lg text-text-primary whitespace-nowrap group-hover:text-brand-blue transition-colors">
                          {row.config}
                        </td>
                        <BarCell value={r.wer} max={maxValues.wer} format={v => v.toFixed(1)} color={mode === 'major' ? 'bg-brand-blue' : 'bg-purple-500'} prominent />
                        <BarCell value={r.speed} max={maxValues.speed} format={v => v.toFixed(1)} color="bg-green-400" prominent />
                        <BarCell value={r.sentenceErrors} max={maxValues.sentenceErrors} color="bg-orange-400" />
                        <BarCell value={r.substitutions} max={maxValues.substitutions} color="bg-yellow-400" />
                        <BarCell value={r.deletions} max={maxValues.deletions} color="bg-red-400" />
                        <BarCell value={r.insertions} max={maxValues.insertions} color="bg-blue-400" />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const AVAILABLE_CONFIGS = [
  'B1', 'B2', 'D2', 'D4', 'D6', 'D7', 'D8',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
  'O2', 'O3', 'O4'
];

export default function CompareConfigsPage() {
  const [configA, setConfigA] = useState('D2');
  const [configB, setConfigB] = useState('M1');
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownAOpen, setDropdownAOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);
  const dropdownARef = useRef<HTMLDivElement>(null);
  const dropdownBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownARef.current && !dropdownARef.current.contains(event.target as Node)) {
        setDropdownAOpen(false);
      }
      if (dropdownBRef.current && !dropdownBRef.current.contains(event.target as Node)) {
        setDropdownBOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [resA, resB] = await Promise.all([
          fetch(`/hasil-eksperimen/${configA}.json`),
          fetch(`/hasil-eksperimen/${configB}.json`)
        ]);
        const jsonA = await resA.json();
        const jsonB = await resB.json();
        setDataA(jsonA);
        setDataB(jsonB);
      } catch (err) {
        console.error("Failed to fetch configs:", err);
      }
      setLoading(false);
    }
    loadData();
  }, [configA, configB]);

  const renderDelta = (valA: number, valB: number, isLowerBetter: boolean, isPercentage = false) => {
    if (valA === undefined || valB === undefined) return null;
    const diff = valB - valA;
    if (diff === 0) return <div className="text-text-muted flex items-center justify-center gap-1 text-sm"><Minus size={14}/> 0</div>;
    
    const isGood = isLowerBetter ? diff < 0 : diff > 0;
    
    return (
      <div className={cn("flex items-center justify-center gap-1 text-sm font-bold", isGood ? "text-green-400" : "text-red-400")}>
        {diff > 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
        {Math.abs(diff).toFixed(isPercentage ? 2 : 0)}{isPercentage ? '%' : ''}
      </div>
    );
  };

  const renderComparisonTable = (title: string, sumA: any, sumB: any) => {
    if (!sumA || !sumB) return null;
    
    const metrics = [
      { key: 'word_error_rate', label: 'Word Error Rate (WER)', lowerIsBetter: true, isPercentage: true },
      { key: 'sentence_error_rate', label: 'Sentence Error Rate (SER)', lowerIsBetter: true, isPercentage: true },
      { key: 'correct', label: 'Correct Words', lowerIsBetter: false, isPercentage: false },
      { key: 'substitutions', label: 'Substitutions', lowerIsBetter: true, isPercentage: false },
      { key: 'deletions', label: 'Deletions', lowerIsBetter: true, isPercentage: false },
      { key: 'insertions', label: 'Insertions', lowerIsBetter: true, isPercentage: false },
    ];

    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-panel mb-8">
        <div className="bg-surface-bg/80 px-6 py-4 border-b border-surface-border flex justify-between items-center">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-surface-border/50 bg-surface-bg/30 font-semibold text-text-secondary text-sm text-center">
          <div className="col-span-1 text-left pl-4">Metric</div>
          <div className="col-span-1 text-brand-blue">{configA} (Base)</div>
          <div className="col-span-1 text-purple-400">{configB} (Compare)</div>
          <div className="col-span-1">Delta</div>
        </div>

        <div className="flex flex-col">
          {metrics.map((m, idx) => (
            <div key={m.key} className={cn("grid grid-cols-4 gap-4 p-4 text-center items-center transition-colors", idx % 2 === 0 ? 'bg-transparent' : 'bg-surface-bg/20 hover:bg-surface-hover')}>
              <div className="col-span-1 text-left pl-4 font-medium text-text-primary">{m.label}</div>
              <div className="col-span-1 text-xl font-bold text-text-secondary">
                {sumA[m.key]}{m.isPercentage ? '%' : ''}
              </div>
              <div className="col-span-1 text-xl font-bold text-text-primary">
                {sumB[m.key]}{m.isPercentage ? '%' : ''}
              </div>
              <div className="col-span-1 bg-surface-bg py-2 rounded-lg border border-surface-border/50">
                {renderDelta(sumA[m.key], sumB[m.key], m.lowerIsBetter, m.isPercentage)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-screen-xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Compare Configurations</h1>
          <p className="text-text-secondary mt-1">Select two configs to compare their global evaluation metrics side-by-side.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface-card p-3 rounded-xl border border-surface-border shadow-sm">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-brand-blue mb-1 uppercase tracking-wider">Base (A)</label>
            <div className="relative" ref={dropdownARef}>
              <button 
                onClick={() => setDropdownAOpen(!dropdownAOpen)}
                className="bg-surface-bg border border-brand-blue/30 text-text-primary text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue flex items-center justify-between p-2 min-w-[100px] outline-none"
              >
                {configA}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownAOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-surface-bg border border-surface-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {AVAILABLE_CONFIGS.map(cfg => (
                    <div 
                      key={cfg} 
                      className={cn("p-2 cursor-pointer hover:bg-surface-hover text-sm", configA === cfg ? "bg-surface-hover font-bold text-brand-blue" : "text-text-primary")}
                      onClick={() => { setConfigA(cfg); setDropdownAOpen(false); }}
                    >
                      {cfg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center text-text-muted mt-5">
            <span className="text-sm font-bold px-2">VS</span>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-purple-400 mb-1 uppercase tracking-wider">Compare (B)</label>
            <div className="relative" ref={dropdownBRef}>
              <button 
                onClick={() => setDropdownBOpen(!dropdownBOpen)}
                className="bg-surface-bg border border-purple-500/30 text-text-primary text-sm rounded-lg focus:ring-purple-400 focus:border-purple-400 flex items-center justify-between p-2 min-w-[100px] outline-none"
              >
                {configB}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownBOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-surface-bg border border-surface-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {AVAILABLE_CONFIGS.map(cfg => (
                    <div 
                      key={cfg} 
                      className={cn("p-2 cursor-pointer hover:bg-surface-hover text-sm", configB === cfg ? "bg-surface-hover font-bold text-purple-400" : "text-text-primary")}
                      onClick={() => { setConfigB(cfg); setDropdownBOpen(false); }}
                    >
                      {cfg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-brand-blue animate-pulse">Loading comparison data...</div>}

      {!loading && dataA && dataB && (
        <div className="flex-1 flex flex-col">
          {renderComparisonTable('SI Major Performance', dataA?.tests?.test_si_major?.summary?.global, dataB?.tests?.test_si_major?.summary?.global)}
          {renderComparisonTable('SI Minor Performance', dataA?.tests?.test_si_minor?.summary?.global, dataB?.tests?.test_si_minor?.summary?.global)}
        </div>
      )}
    </div>
  );
}

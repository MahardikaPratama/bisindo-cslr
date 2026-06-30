import { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

const AVAILABLE_CONFIGS = [
  'B1', 'B2', 'D2', 'D4', 'D6', 'D7', 'D8',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
  'O2', 'O3', 'O4'
];

export default function ExperimentResultsPage() {
  const [selectedConfig, setSelectedConfig] = useState('D2');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'errors'>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(`/hasil-eksperimen/${selectedConfig}.json`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch config:", err);
        setData(null);
      }
      setLoading(false);
    }
    loadData();
  }, [selectedConfig]);

  const majorGlobal = data?.tests?.test_si_major?.summary?.global;
  const minorGlobal = data?.tests?.test_si_minor?.summary?.global;
  const majorSpeed = data?.tests?.test_si_major?.inference_speed;
  const minorSpeed = data?.tests?.test_si_minor?.inference_speed;

  const majorPreds = data?.tests?.test_si_major?.predictions || [];
  const minorPreds = data?.tests?.test_si_minor?.predictions || [];

  const combined = majorPreds.map((major: any) => {
    const majorBase = major.filename ? major.filename.toLowerCase().replace('_mj', '') : '';
    const minor = minorPreds.find((m: any) => {
      const minorBase = m.filename ? m.filename.toLowerCase().replace('_mn', '') : '';
      return minorBase === majorBase && majorBase !== '';
    });
    const majorEvalStr = major.alignment.eval || '';
    const minorEvalStr = minor?.alignment?.eval || '';

    const hasError = majorEvalStr.includes('D') || majorEvalStr.includes('S') || majorEvalStr.includes('I') ||
      minorEvalStr.includes('D') || minorEvalStr.includes('S') || minorEvalStr.includes('I');

    return {
      utterance_id: major.utterance_id,
      ref: major.alignment.ref,
      majorHyp: major.alignment.hyp,
      majorEval: majorEvalStr ? ' ' + majorEvalStr : '',
      minorHyp: minor?.alignment?.hyp || '  [Not Evaluated]',
      minorEval: minorEvalStr ? ' ' + minorEvalStr : '',
      hasError
    };
  });

  const filteredCombined = filterMode === 'errors' ? combined.filter((c: any) => c.hasError) : combined;

  const renderColoredEval = (evalStr: string) => {
    return evalStr.split('').map((char, i) => {
      if (char === 'D') return <span key={i} className="text-red-400 bg-red-400/10 font-bold">{char}</span>;
      if (char === 'S') return <span key={i} className="text-yellow-400 bg-yellow-400/10 font-bold">{char}</span>;
      if (char === 'I') return <span key={i} className="text-blue-400 bg-blue-400/10 font-bold">{char}</span>;
      return <span key={i}>{char}</span>;
    });
  };


  return (
    <div className="pt-24 pb-20 px-6 max-w-screen-2xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Experiment Results</h1>
          <p className="text-text-secondary mt-1">Analyze major and minor predictions side-by-side.</p>
        </div>

        <div className="flex items-center gap-4 bg-surface-card p-2 rounded-xl border border-surface-border">
          <label className="text-sm font-medium text-text-secondary pl-2">Config:</label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-surface-bg border border-surface-border text-text-primary text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue flex items-center justify-between p-2.5 min-w-[120px]"
            >
              {selectedConfig}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full mt-1 left-0 w-full bg-surface-bg border border-surface-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {AVAILABLE_CONFIGS.map(cfg => (
                  <div
                    key={cfg}
                    className={cn("p-2 cursor-pointer hover:bg-surface-hover text-sm", selectedConfig === cfg ? "bg-surface-hover font-bold text-brand-blue" : "text-text-primary")}
                    onClick={() => { setSelectedConfig(cfg); setDropdownOpen(false); }}
                  >
                    {cfg}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-surface-border mx-2"></div>

          <label className="text-sm font-medium text-text-secondary">Filter:</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'errors')}
            className="bg-surface-bg border border-surface-border text-text-primary text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2.5"
          >
            <option value="all">All Utterances</option>
            <option value="errors">With Errors</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-brand-blue animate-pulse">Loading data...</div>}

      {!loading && data && (
        <div className="flex-1 flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-card border border-brand-blue/30 rounded-2xl p-6 shadow-panel-glow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-blue">SI Major Summary</h3>
                {majorSpeed !== undefined && <span className="text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-lg border border-brand-blue/20">Inference Speed: {majorSpeed} ms</span>}
              </div>
              {majorGlobal ? (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{majorGlobal.word_error_rate}%</div>
                    <div className="text-xs text-text-secondary">WER</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{majorGlobal.sentence_error_rate}%</div>
                    <div className="text-xs text-text-secondary">SER</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-xl font-bold text-green-400">{majorGlobal.correct}</div>
                    <div className="text-xs text-text-secondary">Correct</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3 text-red-400">
                    <div className="text-sm font-semibold">S: {majorGlobal.substitutions}</div>
                    <div className="text-sm font-semibold">D: {majorGlobal.deletions}</div>
                    <div className="text-sm font-semibold">I: {majorGlobal.insertions}</div>
                  </div>
                </div>
              ) : <div className="text-text-secondary">No summary data</div>}
            </div>

            <div className="bg-surface-card border border-purple-500/30 rounded-2xl p-6 shadow-panel">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-400">SI Minor Summary</h3>
                {minorSpeed !== undefined && <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-lg border border-purple-500/20">Inference Speed: {minorSpeed} ms</span>}
              </div>
              {minorGlobal ? (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{minorGlobal.word_error_rate}%</div>
                    <div className="text-xs text-text-secondary">WER</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{minorGlobal.sentence_error_rate}%</div>
                    <div className="text-xs text-text-secondary">SER</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3">
                    <div className="text-xl font-bold text-green-400">{minorGlobal.correct}</div>
                    <div className="text-xs text-text-secondary">Correct</div>
                  </div>
                  <div className="bg-surface-bg rounded-lg p-3 text-red-400">
                    <div className="text-sm font-semibold">S: {minorGlobal.substitutions}</div>
                    <div className="text-sm font-semibold">D: {minorGlobal.deletions}</div>
                    <div className="text-sm font-semibold">I: {minorGlobal.insertions}</div>
                  </div>
                </div>
              ) : <div className="text-text-secondary">No summary data</div>}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-surface-border bg-surface-bg/50 font-semibold text-text-secondary text-sm">
              <div className="col-span-1">ID</div>
              <div className="col-span-3 text-brand-blue">SI Major Pred (Hyp & Eval)</div>
              <div className="col-span-5 text-center text-text-primary">Ground Truth (Ref)</div>
              <div className="col-span-3 text-purple-400">SI Minor Pred (Hyp & Eval)</div>
            </div>

            <div className="overflow-y-auto max-h-[800px] flex flex-col">
              {filteredCombined.map((item: any, idx: number) => (
                <div key={item.utterance_id} className={cn("grid grid-cols-12 gap-4 p-4 border-b border-surface-border/50 hover:bg-surface-hover transition-colors font-mono text-sm", idx % 2 === 0 ? 'bg-transparent' : 'bg-surface-bg/30')}>
                  <div className="col-span-1 text-text-muted">{item.utterance_id}</div>

                  {/* SI Major */}
                  <div className="col-span-3 min-w-0 overflow-x-auto whitespace-pre pb-2">
                    <div className="text-text-secondary">{item.majorHyp}</div>
                    <div className="text-text-primary mt-1">{renderColoredEval(item.majorEval)}</div>
                  </div>

                  {/* Ground Truth */}
                  <div className="col-span-5 min-w-0 text-center flex items-center justify-center overflow-x-auto whitespace-pre pb-2">
                    <div className="bg-surface-bg px-4 py-2 rounded-lg border border-surface-border text-text-primary font-bold">
                      {item.ref.trim()}
                    </div>
                  </div>

                  {/* SI Minor */}
                  <div className="col-span-3 min-w-0 overflow-x-auto whitespace-pre pb-2">
                    <div className="text-text-secondary">{item.minorHyp}</div>
                    <div className="text-text-primary mt-1">{renderColoredEval(item.minorEval)}</div>
                  </div>
                </div>
              ))}
              {filteredCombined.length === 0 && (
                <div className="p-8 text-center text-text-muted">No utterances found matching the criteria.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

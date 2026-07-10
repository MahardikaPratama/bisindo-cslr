import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import ConfigDropdown from '../common/ConfigDropdown/ConfigDropdown';

export default function ComparePredictionsPage() {
  const [configA, setConfigA] = useState('D1');
  const [configB, setConfigB] = useState('D2');
  const [testTypeA, setTestTypeA] = useState<'major' | 'minor'>('major');
  const [testTypeB, setTestTypeB] = useState<'major' | 'minor'>('major');
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'errors'>('all');

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

  const testKeyA = `test_si_${testTypeA}`;
  const testKeyB = `test_si_${testTypeB}`;
  const predsA = dataA?.tests?.[testKeyA]?.predictions || [];
  const predsB = dataB?.tests?.[testKeyB]?.predictions || [];

  const combined = predsA.map((predA: any) => {
    const predB = predsB.find((p: any) => p.utterance_id === predA.utterance_id);
    const evalA = predA.alignment?.eval || '';
    const evalB = predB?.alignment?.eval || '';

    const hasError = evalA.includes('D') || evalA.includes('S') || evalA.includes('I') ||
                     evalB.includes('D') || evalB.includes('S') || evalB.includes('I');

    return {
      utterance_id: predA.utterance_id,
      ref: predA.alignment?.ref || '',
      hypA: predA.alignment?.hyp || '',
      evalA: evalA ? ' ' + evalA : '',
      hypB: predB?.alignment?.hyp || '  [Not Evaluated]',
      evalB: evalB ? ' ' + evalB : '',
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
    <div className="pt-24 pb-20 px-6 w-full max-w-screen-2xl mx-auto flex flex-col min-h-screen overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Compare Predictions</h1>
          <p className="text-text-secondary mt-1">Compare actual hypothesis predictions side-by-side between two configurations.</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 bg-surface-card p-4 rounded-xl border border-surface-border w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-brand-blue uppercase tracking-wider pl-2 w-20 sm:w-auto">Config A:</label>
            <ConfigDropdown
              value={configA}
              onChange={setConfigA}
              buttonClassName="border-brand-blue/30 focus:ring-brand-blue focus:border-brand-blue p-2 flex-1 sm:min-w-[100px]"
              activeItemClassName="text-brand-blue"
            />
            <select
              value={testTypeA}
              onChange={(e) => setTestTypeA(e.target.value as 'major' | 'minor')}
              className="bg-surface-bg border border-surface-border text-text-primary text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2 w-full sm:w-auto ml-1"
            >
              <option value="major">SI Major</option>
              <option value="minor">SI Minor</option>
            </select>
          </div>

          <div className="h-6 w-px bg-surface-border hidden md:block"></div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider pl-2 w-20 sm:w-auto">Config B:</label>
            <ConfigDropdown
              value={configB}
              onChange={setConfigB}
              buttonClassName="border-purple-500/30 focus:ring-purple-400 focus:border-purple-400 p-2 flex-1 sm:min-w-[100px]"
              activeItemClassName="text-purple-400"
            />
            <select
              value={testTypeB}
              onChange={(e) => setTestTypeB(e.target.value as 'major' | 'minor')}
              className="bg-surface-bg border border-surface-border text-text-primary text-sm rounded-lg focus:ring-purple-400 focus:border-purple-400 block p-2 w-full sm:w-auto ml-1"
            >
              <option value="major">SI Major</option>
              <option value="minor">SI Minor</option>
            </select>
          </div>

          <div className="h-6 w-px bg-surface-border hidden md:block"></div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'errors')}
              className="bg-surface-bg border border-surface-border text-text-primary text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2 w-full"
            >
              <option value="all">All Utterances</option>
              <option value="errors">With Errors</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-brand-blue animate-pulse">Loading prediction data...</div>}

      {!loading && dataA && dataB && (
        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* Detailed Table */}
          <div className="bg-surface-card border border-surface-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-panel-glow">
            <div className="overflow-x-auto w-full">
              <div className="min-w-[800px] flex flex-col h-full">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-surface-border bg-surface-bg/50 font-semibold text-text-secondary text-sm">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-3 text-brand-blue">{configA} Pred ({testTypeA === 'major' ? 'Major' : 'Minor'})</div>
                  <div className="col-span-5 text-center text-text-primary">Ground Truth (Ref)</div>
                  <div className="col-span-3 text-purple-400">{configB} Pred ({testTypeB === 'major' ? 'Major' : 'Minor'})</div>
                </div>

                <div className="overflow-y-auto max-h-[800px] flex flex-col">
                  {filteredCombined.map((item: any, idx: number) => (
                    <div key={item.utterance_id} className={cn("grid grid-cols-12 gap-4 p-4 border-b border-surface-border/50 hover:bg-surface-hover transition-colors font-mono text-sm", idx % 2 === 0 ? 'bg-transparent' : 'bg-surface-bg/30')}>
                      <div className="col-span-1 text-text-muted">{item.utterance_id}</div>

                      {/* Config A */}
                      <div className="col-span-3 min-w-0 overflow-x-auto whitespace-pre pb-2">
                        <div className="text-text-secondary">{item.hypA}</div>
                        <div className="text-text-primary mt-1">{renderColoredEval(item.evalA)}</div>
                      </div>

                      {/* Ground Truth */}
                      <div className="col-span-5 min-w-0 text-center flex items-center justify-center overflow-x-auto whitespace-pre pb-2">
                        <div className="bg-surface-bg px-4 py-2 rounded-lg border border-surface-border text-text-primary font-bold">
                          {item.ref.trim()}
                        </div>
                      </div>

                      {/* Config B */}
                      <div className="col-span-3 min-w-0 overflow-x-auto whitespace-pre pb-2">
                        <div className="text-text-secondary">{item.hypB}</div>
                        <div className="text-text-primary mt-1">{renderColoredEval(item.evalB)}</div>
                      </div>
                    </div>
                  ))}
                  {filteredCombined.length === 0 && (
                    <div className="p-8 text-center text-text-muted">No utterances found matching the criteria.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

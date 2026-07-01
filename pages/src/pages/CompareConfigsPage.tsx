import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import ConfigDropdown from '../common/ConfigDropdown/ConfigDropdown';

export default function CompareConfigsPage() {
  const [configA, setConfigA] = useState('B1');
  const [configB, setConfigB] = useState('B2');
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    if (diff === 0) return <div className="text-text-muted flex items-center justify-center gap-1 text-sm"><Minus size={14} /> 0</div>;

    const isGood = isLowerBetter ? diff < 0 : diff > 0;

    return (
      <div className={cn("flex items-center justify-center gap-1 text-sm font-bold", isGood ? "text-green-400" : "text-red-400")}>
        {diff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(diff).toFixed(isPercentage ? 2 : 0)}{isPercentage ? '%' : ''}
      </div>
    );
  };

  const renderComparisonTable = (title: string, testA: any, testB: any) => {
    if (!testA || !testB) return null;
    const sumA = testA.summary?.global;
    const sumB = testB.summary?.global;
    if (!sumA || !sumB) return null;

    const dataA = {
      ...sumA,
      inference_speed: testA.inference_speed,
      word_error_rate: testA.word_error_rate
    };
    const dataB = {
      ...sumB,
      inference_speed: testB.inference_speed,
      word_error_rate: testB.word_error_rate
    };

    const metrics = [
      { key: 'word_error_rate', label: 'Word Error Rate (WER)', lowerIsBetter: true, isPercentage: true },
      { key: 'sentence_errors', label: 'Sentence Errors', lowerIsBetter: true, isPercentage: false },
      { key: 'substitutions', label: 'Substitutions', lowerIsBetter: true, isPercentage: false },
      { key: 'deletions', label: 'Deletions', lowerIsBetter: true, isPercentage: false },
      { key: 'insertions', label: 'Insertions', lowerIsBetter: true, isPercentage: false },
      { key: 'inference_speed', label: 'Inference Speed (ms)', lowerIsBetter: true, isPercentage: false },
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
                {dataA[m.key] !== undefined ? dataA[m.key] : '-'}{m.isPercentage && dataA[m.key] !== undefined ? '%' : ''}
              </div>
              <div className="col-span-1 text-xl font-bold text-text-primary">
                {dataB[m.key] !== undefined ? dataB[m.key] : '-'}{m.isPercentage && dataB[m.key] !== undefined ? '%' : ''}
              </div>
              <div className="col-span-1 bg-surface-bg py-2 rounded-lg border border-surface-border/50">
                {dataA[m.key] !== undefined && dataB[m.key] !== undefined ? renderDelta(dataA[m.key], dataB[m.key], m.lowerIsBetter, m.isPercentage) : '-'}
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
            <ConfigDropdown
              value={configA}
              onChange={setConfigA}
              buttonClassName="border-brand-blue/30 focus:ring-brand-blue focus:border-brand-blue"
              activeItemClassName="text-brand-blue"
            />
          </div>

          <div className="flex items-center justify-center text-text-muted mt-5">
            <span className="text-sm font-bold px-2">VS</span>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-purple-400 mb-1 uppercase tracking-wider">Compare (B)</label>
            <ConfigDropdown
              value={configB}
              onChange={setConfigB}
              buttonClassName="border-purple-500/30 focus:ring-purple-400 focus:border-purple-400"
              activeItemClassName="text-purple-400"
            />
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-brand-blue animate-pulse">Loading comparison data...</div>}

      {!loading && dataA && dataB && (
        <div className="flex-1 flex flex-col">
          {renderComparisonTable('SI Major Performance', dataA?.tests?.test_si_major, dataB?.tests?.test_si_major)}
          {renderComparisonTable('SI Minor Performance', dataA?.tests?.test_si_minor, dataB?.tests?.test_si_minor)}
        </div>
      )}
    </div>
  );
}

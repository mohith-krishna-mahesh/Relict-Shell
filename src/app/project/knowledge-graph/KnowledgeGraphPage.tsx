import { useCallback, useState } from 'react';
import type { Strategy } from '../../types';
import { GraphIcon, ListIcon } from '../../components/Icons';
import { GraphTab } from './GraphTab';
import { StrategiesTab } from './StrategiesTab';

type Tab = 'graph' | 'strategies';

export function KnowledgeGraphPage() {
  const [tab, setTab] = useState<Tab>('graph');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);

  const updateStrategies = useCallback((next: Strategy[]) => {
    setStrategies(next);
  }, []);

  return (
    <main className="flex h-[calc(100vh-7rem)] min-h-[640px] flex-col bg-[#FBF6EE] transition-colors duration-200 dark:bg-[#100C08]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#140D07]/10 bg-[#FBF6EE] px-5 py-4 transition-colors duration-200 sm:flex-row sm:items-center sm:px-8 dark:border-white/10 dark:bg-[#100C08]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#B25A12] dark:text-[#FCBA48]">
            Evidence explorer
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#140D07] dark:text-white">Knowledge graph</h1>
        </div>
        <div className="flex rounded-xl bg-[#140D07]/5 p-1 dark:bg-white/10" role="tablist" aria-label="Knowledge graph views">
          <button
            role="tab"
            aria-selected={tab === 'graph'}
            onClick={() => setTab('graph')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'graph'
                ? 'bg-white text-[#140D07] shadow-sm dark:bg-white/20 dark:text-white'
                : 'text-[#4A3B2A] hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:text-white'
            }`}
          >
            <GraphIcon size={16} /> Graph
          </button>
          <button
            role="tab"
            aria-selected={tab === 'strategies'}
            onClick={() => setTab('strategies')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'strategies'
                ? 'bg-white text-[#140D07] shadow-sm dark:bg-white/20 dark:text-white'
                : 'text-[#4A3B2A] hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:text-white'
            }`}
          >
            <ListIcon size={16} /> Strategies{' '}
            <span className="rounded-full bg-[#140D07]/10 px-1.5 py-0.5 text-[10px] text-[#140D07] dark:bg-white/15 dark:text-white">
              {strategies.length}
            </span>
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <div className={tab === 'graph' ? 'h-full' : 'hidden'} aria-hidden={tab !== 'graph'}>
          <GraphTab
            active={tab === 'graph'}
            selectedStrategyIds={selectedStrategyIds}
            onStrategiesLoaded={updateStrategies}
            onStreamingChange={setStreaming}
          />
        </div>
        {tab === 'strategies' && (
          <div className="h-full overflow-y-auto">
            <StrategiesTab
              strategies={strategies}
              selectedIds={selectedStrategyIds}
              onSelectedIdsChange={setSelectedStrategyIds}
              streaming={streaming}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default KnowledgeGraphPage;

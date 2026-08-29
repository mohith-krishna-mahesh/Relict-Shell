import { Button, Card } from '@/components/ui';
import { EmptyState } from '../../components/Feedback';
import { CheckIcon, SparkIcon, TargetIcon } from '../../components/Icons';
import type { Strategy } from '../../types';

export interface StrategiesTabProps {
  strategies: Strategy[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  streaming: boolean;
}

export function StrategiesTab({ strategies, selectedIds, onSelectedIdsChange, streaming }: StrategiesTabProps) {
  const toggle = (id: string) =>
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]
    );

  if (!strategies.length) {
    return (
      <div className="p-5 sm:p-8">
        <EmptyState
          icon={<SparkIcon />}
          title={streaming ? 'Strategies are being generated' : 'No strategies in this run'}
          description={
            streaming
              ? 'Keep this tab open while Core streams evidence and ranks candidate strategies.'
              : 'Start a new run with the planner to generate candidate interventions.'
          }
        />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-[#140D07] dark:text-white">Candidate strategies</h2>
            <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
              Select strategies to highlight their supporting nodes in the graph.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onSelectedIdsChange([])} disabled={!selectedIds.length}>
              Clear
            </Button>
            <Button variant="secondary" onClick={() => onSelectedIdsChange(strategies.map((strategy) => strategy.id))}>
              Select all
            </Button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {strategies.map((strategy, index) => {
            const selected = selectedIds.includes(strategy.id);
            const confidence =
              typeof strategy.confidence === 'number'
                ? strategy.confidence <= 1
                  ? strategy.confidence * 100
                  : strategy.confidence
                : undefined;
            return (
              <Card
                key={strategy.id}
                className={`relative cursor-pointer transition dark:border-white/10 dark:bg-[#18130E] ${
                  selected
                    ? 'border-[#EE8E28] ring-2 ring-[#FCBA48]/30 dark:border-[#EE8E28]'
                    : 'hover:border-[#140D07]/25 dark:hover:border-white/25'
                }`}
                onClick={() => toggle(strategy.id)}
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(strategy.id);
                    }}
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                      selected
                        ? 'border-[#EE8E28] bg-[#EE8E28] text-white'
                        : 'border-[#140D07]/20 bg-white dark:border-white/20 dark:bg-white/5'
                    }`}
                  >
                    {selected && <CheckIcon size={13} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#4A3B2A] dark:text-[#E2D5C3]">
                          Strategy {index + 1}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-[#140D07] dark:text-white">{strategy.name}</h3>
                      </div>
                      {confidence !== undefined && (
                        <span className="shrink-0 rounded-full bg-[#FFE49E]/75 px-2.5 py-1 text-xs font-semibold text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
                          {Math.round(confidence)}%
                        </span>
                      )}
                    </div>
                    {strategy.summary && (
                      <p className="mt-3 text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">{strategy.summary}</p>
                    )}
                    {strategy.rationale && (
                      <div className="mt-4 rounded-xl bg-[#140D07]/[0.035] p-3 dark:bg-white/[0.04]">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#140D07] dark:text-white">
                          <TargetIcon size={14} /> Rationale
                        </p>
                        <p className="mt-1.5 text-xs leading-5 text-[#4A3B2A] dark:text-[#E2D5C3]">{strategy.rationale}</p>
                      </div>
                    )}
                    {strategy.genes?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {strategy.genes.map((gene) => (
                          <span
                            key={gene}
                            className="rounded-md bg-[#140D07] px-2 py-1 font-mono text-[10px] font-semibold text-[#FBF6EE] dark:bg-white/15 dark:text-white"
                          >
                            {gene}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StrategiesTab;

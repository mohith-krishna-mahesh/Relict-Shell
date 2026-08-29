import type { GraphEdgeData, GraphNodeData } from '../../types';
import { CloseIcon, GraphIcon } from '../../components/Icons';

export interface NodeInspectorPanelProps {
  node: GraphNodeData | null;
  edges: GraphEdgeData[];
  onClose: () => void;
}

const hiddenKeys = new Set([
  'id',
  'label',
  'name',
  'description',
  'summary',
  'type',
  'score',
  'strategyId',
  'strategy_id',
]);

export function NodeInspectorPanel({ node, edges, onClose }: NodeInspectorPanelProps) {
  if (!node) {
    return (
      <aside className="flex h-full min-h-64 flex-col items-center justify-center border-l border-[#140D07]/10 bg-white/90 px-6 text-center dark:border-white/10 dark:bg-[#18130E]/90">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
          <GraphIcon />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-[#140D07] dark:text-white">Inspect a node</h2>
        <p className="mt-2 text-xs leading-5 text-[#4A3B2A] dark:text-[#E2D5C3]">
          Select a node in the graph to review its evidence and relationships.
        </p>
      </aside>
    );
  }

  const details = Object.entries(node)
    .filter(
      ([key, value]) =>
        !hiddenKeys.has(key) &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    )
    .slice(0, 12);
  const score =
    typeof node.score === 'number' ? (node.score <= 1 ? node.score * 100 : node.score) : undefined;

  return (
    <aside className="h-full min-h-0 overflow-y-auto border-l border-[#140D07]/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#18130E]">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#140D07]/10 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#18130E]/95">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#B25A12] dark:text-[#FCBA48]">
            Node inspector
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-[#140D07] dark:text-white" title={node.label}>
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#4A3B2A] hover:bg-[#140D07]/5 hover:text-[#140D07] dark:text-[#E2D5C3] dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close inspector"
        >
          <CloseIcon size={17} />
        </button>
      </div>
      <div className="space-y-6 p-5">
        <div className="flex flex-wrap gap-2">
          {node.type && (
            <span className="rounded-full bg-[#140D07]/5 px-2.5 py-1 text-xs font-medium capitalize text-[#4A3B2A] dark:bg-white/10 dark:text-[#E2D5C3]">
              {node.type}
            </span>
          )}
          {score !== undefined && (
            <span className="rounded-full bg-[#FFE49E]/75 px-2.5 py-1 text-xs font-semibold text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
              {Math.round(score)}% score
            </span>
          )}
        </div>
        {node.description && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-[#4A3B2A] dark:text-[#E2D5C3]">
              Summary
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#140D07] dark:text-[#E2D5C3]">{node.description}</p>
          </section>
        )}
        {details.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-[#4A3B2A] dark:text-[#E2D5C3]">
              Properties
            </h3>
            <dl className="mt-3 divide-y divide-[#140D07]/10 rounded-xl border border-[#140D07]/10 dark:divide-white/10 dark:border-white/10">
              {details.map(([key, value]) => (
                <div key={key} className="px-3 py-2.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#4A3B2A] dark:text-[#E2D5C3]">
                    {key.replaceAll('_', ' ')}
                  </dt>
                  <dd className="mt-1 break-words text-xs text-[#140D07] dark:text-white">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-[#4A3B2A] dark:text-[#E2D5C3]">
            Relationships <span className="ml-1 text-[#140D07] dark:text-white">{edges.length}</span>
          </h3>
          {edges.length ? (
            <ul className="mt-3 space-y-2">
              {edges.slice(0, 20).map((edge) => (
                <li key={edge.id} className="rounded-xl bg-[#140D07]/[0.035] p-3 dark:bg-white/[0.04]">
                  <p className="text-xs font-medium text-[#140D07] dark:text-white">{edge.label ?? 'Related to'}</p>
                  <p className="mt-1 truncate font-mono text-[10px] text-[#4A3B2A] dark:text-[#E2D5C3]">
                    {edge.source === node.id ? `→ ${edge.target}` : `← ${edge.source}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">No relationships received yet.</p>
          )}
        </section>
      </div>
    </aside>
  );
}

export default NodeInspectorPanel;

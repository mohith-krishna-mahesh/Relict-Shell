import { useCallback, useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type LayoutOptions, type NodeSingular, type StylesheetStyle } from 'cytoscape';
import { useSearchParams } from 'react-router-dom';
import { Button, Slider, Toggle } from '@/components/ui';
import { getRun, openRunStream, shellApi } from '@/lib/core-client';
import { EmptyState, ErrorBanner } from '../../components/Feedback';
import { RunFailedInline } from '@/components/ErrorStates';
import { GraphIcon, RefreshIcon, SearchIcon } from '../../components/Icons';
import type { GraphEdgeData, GraphNodeData, Strategy } from '../../types';
import { readLatestRun } from '../../api-shapes';
import { getErrorMessage, inputClass } from '../../utils';
import { useProject } from '../ProjectLayout';
import { extractGraphBundle, type GraphBundle } from './graph-data';
import { NodeInspectorPanel } from './NodeInspectorPanel';

type LayoutName = 'cose' | 'circle' | 'grid';
type Confidence = 'evidence' | 'model_estimated' | 'unknown';

export interface GraphTabProps {
  active: boolean;
  selectedStrategyIds: string[];
  onStrategiesLoaded: (strategies: Strategy[]) => void;
  onStreamingChange: (streaming: boolean) => void;
}

const graphStyles: StylesheetStyle[] = [
  { selector: 'node', style: { 'background-color': '#FCBA48', 'border-color': '#140D07', 'border-width': 1.5, color: '#140D07', label: 'data(label)', 'font-family': 'Inter, sans-serif', 'font-size': 10, 'font-weight': 600, 'text-margin-y': 7, 'text-valign': 'bottom', width: 30, height: 30, 'text-wrap': 'ellipsis', 'text-max-width': 100, 'transition-property': 'opacity, background-color, border-width', 'transition-duration': 180 } },
  { selector: 'node[type = "gene"]', style: { shape: 'round-rectangle', 'background-color': '#EE8E28', width: 40, height: 28 } },
  { selector: 'node[type = "phenotype"]', style: { shape: 'diamond', 'background-color': '#FFE49E', width: 36, height: 36 } },
  { selector: 'node[type = "pathway"]', style: { shape: 'hexagon', 'background-color': '#3C78A8', color: '#3C78A8' } },
  { selector: 'edge', style: { width: 1.5, 'line-color': '#4A3B2A', 'target-arrow-color': '#4A3B2A', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', opacity: 0.62, label: 'data(label)', 'font-family': 'Inter, sans-serif', 'font-size': 8, color: '#4A3B2A', 'text-background-color': '#FBF6EE', 'text-background-opacity': 0.85, 'text-background-padding': 2, 'transition-property': 'opacity', 'transition-duration': 180 } },
  { selector: 'edge[confidence = "model_estimated"]', style: { 'line-style': 'dashed', opacity: 0.45 } },
  { selector: 'edge[confidence = "unknown"]', style: { 'line-style': 'dotted', opacity: 0.24 } },
  { selector: '.strategy-muted', style: { opacity: 0.12 } },
  { selector: '.strategy-selected', style: { 'background-color': '#B25A12', 'border-width': 4, 'border-color': '#FFE49E', opacity: 1 } },
  { selector: ':selected', style: { 'border-width': 4, 'border-color': '#140D07', 'overlay-color': '#FCBA48', 'overlay-opacity': 0.12, 'overlay-padding': 7 } },
] as unknown as StylesheetStyle[];

export function GraphTab({ active, selectedStrategyIds, onStrategiesLoaded, onStreamingChange }: GraphTabProps) {
  const project = useProject();
  const [searchParams] = useSearchParams();
  const requestedRunId = searchParams.get('run');
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const nodesRef = useRef(new Map<string, GraphNodeData>());
  const edgesRef = useRef(new Map<string, GraphEdgeData>());
  const strategiesRef = useRef(new Map<string, Strategy>());
  const layoutTimerRef = useRef<number>();
  const layoutRef = useRef<LayoutName>('cose');
  const [activeRunId, setActiveRunId] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [fatalError, setFatalError] = useState('');
  const [version, setVersion] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [minimumScore, setMinimumScore] = useState(0);
  const [layout, setLayout] = useState<LayoutName>('cose');
  const [query, setQuery] = useState('');
  const [confidence, setConfidence] = useState<Record<Confidence, boolean>>({ evidence: true, model_estimated: true, unknown: true });

  const scheduleLayout = useCallback(() => {
    window.clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = window.setTimeout(() => {
      const cy = cyRef.current;
      if (!cy || cy.nodes().length === 0) return;
      cy.layout({ name: layoutRef.current, animate: cy.nodes().length < 250, animationDuration: 280, fit: true, padding: 45 } as LayoutOptions).run();
    }, 120);
  }, []);

  const applyBundle = useCallback((bundle: GraphBundle) => {
    for (const node of bundle.nodes) nodesRef.current.set(node.id, node);
    for (const edge of bundle.edges) edgesRef.current.set(edge.id, edge);
    for (const strategy of bundle.strategies) strategiesRef.current.set(strategy.id, strategy);

    const cy = cyRef.current;
    if (cy) cy.batch(() => {
      for (const node of bundle.nodes) {
        const existing = cy.getElementById(node.id);
        if (existing.length) existing.data(node);
        else cy.add({ group: 'nodes', data: node });
      }
      for (const edge of edgesRef.current.values()) {
        if (!cy.getElementById(edge.source).length || !cy.getElementById(edge.target).length) continue;
        const existing = cy.getElementById(edge.id);
        if (existing.length) existing.data(edge);
        else cy.add({ group: 'edges', data: edge });
      }
    });

    if (bundle.strategies.length) onStrategiesLoaded([...strategiesRef.current.values()]);
    setSelectedNode((current) => current ? nodesRef.current.get(current.id) ?? current : null);
    setVersion((current) => current + 1);
    if (bundle.nodes.length || bundle.edges.length) scheduleLayout();
  }, [onStrategiesLoaded, scheduleLayout]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({ container: containerRef.current, elements: [], style: graphStyles, minZoom: 0.15, maxZoom: 3.5, wheelSensitivity: 0.25, boxSelectionEnabled: false });
    cyRef.current = cy;
    cy.on('tap', 'node', (event) => {
      const node = event.target as NodeSingular;
      setSelectedNode(nodesRef.current.get(node.id()) ?? node.data() as GraphNodeData);
    });
    cy.on('tap', (event) => { if (event.target === cy) setSelectedNode(null); });
    return () => { window.clearTimeout(layoutTimerRef.current); cy.destroy(); cyRef.current = null; };
  }, []);

  useEffect(() => { layoutRef.current = layout; scheduleLayout(); }, [layout, scheduleLayout]);
  useEffect(() => { if (active) { window.setTimeout(() => { cyRef.current?.resize(); cyRef.current?.fit(undefined, 40); }, 0); } }, [active]);
  useEffect(() => { onStreamingChange(streaming); }, [onStreamingChange, streaming]);

  useEffect(() => {
    let mounted = true;
    let closeStream: (() => void) | undefined;
    nodesRef.current.clear(); edgesRef.current.clear(); strategiesRef.current.clear();
    cyRef.current?.elements().remove();
    onStrategiesLoaded([]); setSelectedNode(null); setStreamError(''); setFatalError(''); setLoading(true); setStreaming(false); setVersion((current) => current + 1);

    const ingest = (event: unknown) => { if (mounted) applyBundle(extractGraphBundle(event)); };

    const connect = async () => {
      try {
        let coreRunId = requestedRunId ?? '';
        if (!coreRunId) {
          const latest = readLatestRun(await shellApi<unknown>(`/api/projects/${project.id}/runs/latest`));
          coreRunId = latest?.coreRunId || latest?.id || '';
        }
        if (!coreRunId) throw new Error('No graph run is available for this project.');
        if (!mounted) return;
        setActiveRunId(coreRunId);

        try { ingest(await getRun(coreRunId)); }
        catch (reason) { if (mounted) setStreamError(`${getErrorMessage(reason, 'The current snapshot could not be loaded.')} Waiting for streamed updates.`); }
        if (!mounted) return;

        setLoading(false); setStreaming(true);
        const handlers = {
          onEvent: ingest,
          onMessage: ingest,
          onError: (reason: unknown) => { if (mounted) { setStreaming(false); setStreamError(getErrorMessage(reason, 'The live stream stopped. Partial graph data has been preserved.')); } },
          onComplete: () => { if (mounted) setStreaming(false); },
        };
        closeStream = openRunStream(coreRunId, handlers);
      } catch (reason) {
        if (mounted) { setFatalError(getErrorMessage(reason, 'No graph run is available.')); setLoading(false); setStreaming(false); }
      }
    };

    void connect();
    return () => { mounted = false; closeStream?.(); };
  }, [applyBundle, onStrategiesLoaded, project.id, requestedRunId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const normalizedQuery = query.trim().toLowerCase();
    cy.batch(() => {
      cy.nodes().forEach((node) => {
        const data = nodesRef.current.get(node.id());
        if (!data) return;
        const rawScore = typeof data.score === 'number' ? data.score : 1;
        const score = rawScore <= 1 ? rawScore * 100 : rawScore;
        const queryMatches = !normalizedQuery || data.label.toLowerCase().includes(normalizedQuery) || data.type?.toLowerCase().includes(normalizedQuery);
        const strategyMatches = selectedStrategyIds.length === 0 || (data.strategyId ? selectedStrategyIds.includes(data.strategyId) : false) || (Array.isArray(data.strategyIds) && data.strategyIds.some((id) => typeof id === 'string' && selectedStrategyIds.includes(id)));
        const visible = score >= minimumScore && queryMatches;
        node.style('display', visible ? 'element' : 'none');
        node.toggleClass('strategy-muted', visible && !strategyMatches);
        node.toggleClass('strategy-selected', visible && selectedStrategyIds.length > 0 && strategyMatches);
      });
      cy.edges().forEach((edge) => {
        const data = edgesRef.current.get(edge.id());
        const edgeConfidence = data?.confidence ?? 'unknown';
        const endpointsVisible = edge.source().style('display') !== 'none' && edge.target().style('display') !== 'none';
        edge.style('display', confidence[edgeConfidence] && endpointsVisible ? 'element' : 'none');
      });
    });
  }, [confidence, minimumScore, query, selectedStrategyIds, version]);

  const selectedEdges = selectedNode ? [...edgesRef.current.values()].filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id) : [];
  const nodeCount = nodesRef.current.size;
  const edgeCount = edgesRef.current.size;

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="relative min-h-[520px] overflow-hidden bg-[#F8F1E6] transition-colors duration-300 dark:bg-[#0B0806]">
        <div ref={containerRef} className="absolute inset-0" aria-label="Interactive knowledge graph" />
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
          <span className="pointer-events-auto rounded-full border border-ink/10 bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#18130E]/90 dark:text-white">
            {nodeCount} nodes · {edgeCount} edges
          </span>
          {streaming && (
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-bg-light shadow-sm dark:bg-amber-deep dark:text-bg-dark">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" /> Live
            </span>
          )}
          {activeRunId && (
            <span
              className="pointer-events-auto max-w-40 truncate rounded-full border border-ink/10 bg-white/90 px-3 py-1.5 font-mono text-[10px] text-text-light shadow-sm dark:border-white/10 dark:bg-[#18130E]/90 dark:text-text-dark"
              title={activeRunId}
            >
              {activeRunId}
            </span>
          )}
        </div>

        {streamError && (
          <div className="absolute bottom-4 left-4 right-4 z-20 lg:right-[276px]">
            <RunFailedInline message={streamError} />
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-bg-light/65 backdrop-blur-sm dark:bg-black/60">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium shadow-lg dark:bg-[#18130E] dark:text-white">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-deep border-t-transparent" />
              Loading graph run…
            </div>
          </div>
        )}
        {!loading && fatalError && nodeCount === 0 && (
          <div className="absolute inset-0 z-20 grid place-items-center p-6">
            <div className="w-full max-w-lg">
              <EmptyState icon={<GraphIcon />} title="No graph to display" description={fatalError} />
            </div>
          </div>
        )}

        <aside className="absolute right-4 top-4 z-10 w-[244px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-ink/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#18130E]/95">
          <div className="border-b border-ink/10 px-4 py-3 dark:border-white/10">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Graph controls</h2>
            <p className="mt-0.5 text-[10px] text-text-light dark:text-text-dark">Display-only; does not rerun Core.</p>
          </div>
          <div className="max-h-[calc(100vh-180px)] space-y-4 overflow-y-auto p-4">
            <label className="relative block">
              <span className="sr-only">Highlight nodes</span>
              <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/70 dark:text-text-dark/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={`${inputClass} py-2 pl-9 text-xs`}
                placeholder="Highlight nodes"
              />
            </label>
            <Slider label="Minimum score" value={minimumScore} min={0} max={100} onChange={setMinimumScore} />
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-text-light dark:text-text-dark">
                Relationships
              </legend>
              <div className="space-y-3">
                <Toggle
                  label="Evidence"
                  checked={confidence.evidence}
                  onChange={(checked) => setConfidence((current) => ({ ...current, evidence: checked }))}
                />
                <Toggle
                  label="Model-estimated"
                  checked={confidence.model_estimated}
                  onChange={(checked) => setConfidence((current) => ({ ...current, model_estimated: checked }))}
                />
                <Toggle
                  label="Unknown"
                  checked={confidence.unknown}
                  onChange={(checked) => setConfidence((current) => ({ ...current, unknown: checked }))}
                />
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[.1em] text-text-light dark:text-text-dark">
                Layout
              </span>
              <select
                value={layout}
                onChange={(event) => setLayout(event.target.value as LayoutName)}
                className={`${inputClass} py-2 text-xs`}
              >
                <option value="cose" className="dark:bg-[#18130E] dark:text-white">Evidence network</option>
                <option value="circle" className="dark:bg-[#18130E] dark:text-white">Circle</option>
                <option value="grid" className="dark:bg-[#18130E] dark:text-white">Grid</option>
              </select>
            </label>
            <Button
              variant="secondary"
              className="w-full min-h-8 py-1.5 text-xs"
              onClick={() => cyRef.current?.fit(undefined, 45)}
            >
              <RefreshIcon size={14} /> Fit graph
            </Button>
            {selectedStrategyIds.length > 0 && (
              <p className="rounded-lg bg-amber-pale/35 p-2.5 text-[10px] leading-4 text-amber-rust dark:bg-amber-pale/15 dark:text-amber-pale">
                <strong>{selectedStrategyIds.length}</strong> selected{' '}
                {selectedStrategyIds.length === 1 ? 'strategy' : 'strategies'} highlighted locally.
              </p>
            )}
          </div>
        </aside>
      </section>
      <NodeInspectorPanel
        node={selectedNode}
        edges={selectedEdges}
        onClose={() => {
          cyRef.current?.elements().unselect();
          setSelectedNode(null);
        }}
      />
    </div>
  );
}

export default GraphTab;

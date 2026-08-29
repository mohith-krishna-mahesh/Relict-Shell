import type { GraphEdgeData, GraphElements, GraphNodeData, Strategy } from '../../types';
import { asNumber, asRecord, asString } from '../../utils';

export interface GraphBundle extends GraphElements { strategies: Strategy[]; }

function decode(value: unknown): unknown {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as unknown; } catch { return value; }
  }
  return value;
}

function normalizeNode(value: unknown): GraphNodeData | null {
  const wrapper = asRecord(value);
  const item = asRecord(wrapper?.data) ?? wrapper;
  if (!item) return null;
  const id = asString(item.id) ?? asString(item.nodeId) ?? asString(item.key);
  if (!id) return null;
  const label = asString(item.label) ?? asString(item.name) ?? asString(item.symbol) ?? id;
  return { ...item, id, label, type: asString(item.type) ?? asString(item.kind), description: asString(item.description) ?? asString(item.summary), score: asNumber(item.score) ?? asNumber(item.confidence), strategyId: asString(item.strategyId) ?? asString(item.strategy_id) };
}

function normalizeEdge(value: unknown): GraphEdgeData | null {
  const wrapper = asRecord(value);
  const item = asRecord(wrapper?.data) ?? wrapper;
  if (!item) return null;
  const sourceValue = item.source ?? item.sourceId ?? item.from;
  const targetValue = item.target ?? item.targetId ?? item.to;
  const source = typeof sourceValue === 'string' || typeof sourceValue === 'number' ? String(sourceValue) : undefined;
  const target = typeof targetValue === 'string' || typeof targetValue === 'number' ? String(targetValue) : undefined;
  if (!source || !target) return null;
  const label = asString(item.label) ?? asString(item.relationship) ?? asString(item.type);
  const id = asString(item.id) ?? `${source}::${label ?? 'related'}::${target}`;
  const confidenceValue = asString(item.confidence) ?? asString(item.confidenceType) ?? asString(item.confidence_type);
  const confidence = confidenceValue === 'evidence' || confidenceValue === 'model_estimated' || confidenceValue === 'unknown' ? confidenceValue : 'unknown';
  return { ...item, id, source, target, label, confidence, score: asNumber(item.score) };
}

function normalizeStrategy(value: unknown): Strategy | null {
  const wrapper = asRecord(value);
  const item = asRecord(wrapper?.data) ?? wrapper;
  if (!item) return null;
  const id = asString(item.id) ?? asString(item.strategyId) ?? asString(item.strategy_id);
  if (!id) return null;
  const name = asString(item.name) ?? asString(item.title) ?? `Strategy ${id.slice(0, 6)}`;
  const genes = Array.isArray(item.genes) ? item.genes.filter((gene): gene is string => typeof gene === 'string') : undefined;
  return { ...item, id, name, summary: asString(item.summary) ?? asString(item.description), rationale: asString(item.rationale), confidence: asNumber(item.confidence) ?? asNumber(item.score), genes };
}

export function extractGraphBundle(input: unknown): GraphBundle {
  const nodes = new Map<string, GraphNodeData>();
  const edges = new Map<string, GraphEdgeData>();
  const strategies = new Map<string, Strategy>();
  const visited = new Set<object>();

  const visit = (raw: unknown) => {
    const value = decode(raw);
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const record = asRecord(value);
    if (!record || visited.has(record)) return;
    visited.add(record);

    const type = (asString(record.type) ?? asString(record.event) ?? '').toLowerCase();
    const eventData = decode(record.data);
    if (type.includes('node') && eventData) { const node = normalizeNode(eventData); if (node) nodes.set(node.id, node); }
    if (type.includes('edge') && eventData) { const edge = normalizeEdge(eventData); if (edge) edges.set(edge.id, edge); }
    if (type.includes('strateg') && eventData) { const strategy = normalizeStrategy(eventData); if (strategy) strategies.set(strategy.id, strategy); }

    if (Array.isArray(record.nodes)) record.nodes.forEach((item) => { const node = normalizeNode(item); if (node) nodes.set(node.id, node); });
    if (Array.isArray(record.edges)) record.edges.forEach((item) => { const edge = normalizeEdge(item); if (edge) edges.set(edge.id, edge); });
    if (Array.isArray(record.strategies)) record.strategies.forEach((item) => { const strategy = normalizeStrategy(item); if (strategy) strategies.set(strategy.id, strategy); });

    for (const key of ['result', 'graph', 'snapshot', 'payload']) if (record[key]) visit(record[key]);
    if (!type && eventData) visit(eventData);
  };

  visit(input);
  return { nodes: [...nodes.values()], edges: [...edges.values()], strategies: [...strategies.values()] };
}

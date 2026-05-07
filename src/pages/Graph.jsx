import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Handle,
  Position,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  AlertOctagon,
  Cpu,
  FlaskConical,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

import Header from '../components/dashboard/Header';
import DetailPanel from '../components/dashboard/DetailPanel';
import { fetchGraphOverview } from '../lib/api';

// ---------------------------------------------------------------------------
// Layout — 4 vertical columns by node type. The backend's edges all flow
// roughly left → right under this arrangement (lab contributes → cve, attack
// uses → cve, cve affects → component), so a simple columnar layout reads
// nicely without needing dagre/elkjs for the demo dataset.
// ---------------------------------------------------------------------------

const COLUMN_X = { lab: 0, attack: 320, cve: 640, component: 960 };
const ROW_GAP = 130;

function layoutNodes(rawNodes, rawEdges) {
  // Group nodes by type, preserving incoming order so the layout is stable.
  const buckets = { lab: [], attack: [], cve: [], component: [] };
  rawNodes.forEach((n) => {
    if (buckets[n.type]) buckets[n.type].push(n);
  });

  const positioned = [];
  Object.entries(buckets).forEach(([type, nodes]) => {
    const x = COLUMN_X[type] ?? 0;
    nodes.forEach((node, i) => {
      positioned.push({
        id: node.id,
        type: 'mose',
        position: { x, y: i * ROW_GAP },
        data: { ...node },
      });
    });
  });

  const edges = rawEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.type,
    labelStyle: { fontSize: 10, fontWeight: 600, fill: '#6B7280' },
    labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    style: { stroke: edgeColor(e.type), strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor(e.type) },
  }));

  return { nodes: positioned, edges };
}

function edgeColor(type) {
  switch (type) {
    case 'affects': return '#EF4444';
    case 'uses': return '#A855F7';
    case 'contributes': return '#9CA3AF';
    case 'contains': return '#3B82F6';
    case 'connects_to':
    case 'depends_on':
    case 'variant_of': return '#0EA5E9';
    default: return '#9CA3AF';
  }
}

// ---------------------------------------------------------------------------
// Custom node — one component handles all four types via the `type` field
// on data. Keeps styles co-located.
// ---------------------------------------------------------------------------

const SEVERITY_TINT = {
  Critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  Low:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
};

const TYPE_CHROME = {
  lab:       { Icon: FlaskConical, bg: 'bg-white',      border: 'border-gray-200', accent: 'text-gray-500',  pill: 'Lab' },
  attack:    { Icon: Zap,          bg: 'bg-purple-50',  border: 'border-purple-200', accent: 'text-purple-600', pill: 'Attack' },
  component: { Icon: Cpu,          bg: 'bg-blue-50',    border: 'border-blue-200',   accent: 'text-blue-600',   pill: 'Component' },
  cve:       { Icon: ShieldAlert,  bg: 'bg-white',      border: 'border-gray-200',   accent: 'text-gray-700',   pill: 'CVE' },
};

const MoseNode = ({ data }) => {
  const chrome = TYPE_CHROME[data.type] ?? TYPE_CHROME.cve;
  // CVE nodes pick up severity tinting on top of their base chrome
  const severityTint = data.type === 'cve' ? SEVERITY_TINT[data.severity] : null;
  const bg = severityTint?.bg ?? chrome.bg;
  const border = severityTint?.border ?? chrome.border;
  const accent = severityTint?.text ?? chrome.accent;
  const Icon = chrome.Icon;

  return (
    <div
      className={clsx(
        'rounded-xl border shadow-sm w-[220px] px-3 py-2.5 transition-all',
        bg, border,
        data.type === 'cve' && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-1.5 !h-1.5" />

      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={clsx('w-3.5 h-3.5', accent)} />
        <span className={clsx('text-[9px] font-bold uppercase tracking-widest', accent)}>
          {chrome.pill}
        </span>
        {data.type === 'cve' && data.severity && (
          <span className={clsx('ml-auto text-[9px] font-bold uppercase', accent)}>
            {data.severity}
          </span>
        )}
      </div>
      <div className="text-sm font-semibold text-gray-900 truncate">{data.label}</div>
      {data.category && (
        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{data.category}</div>
      )}
      {data.type === 'cve' && data.cvss != null && (
        <div className="text-[10px] text-gray-400 font-mono mt-0.5">CVSS {data.cvss.toFixed(1)}</div>
      )}
    </div>
  );
};

const nodeTypes = { mose: MoseNode };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Graph = ({ onLogout, onNavigate }) => {
  const [overview, setOverview] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ lab: true, attack: true, cve: true, component: true });
  const [selectedCve, setSelectedCve] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchGraphOverview(50)
      .then(setOverview)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Apply type filter, then run layout. We hide nodes by removing them from
  // the input set so dropped edges don't dangle.
  const { nodes, edges } = useMemo(() => {
    const visibleNodes = overview.nodes.filter((n) => filters[n.type] !== false);
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = overview.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
    );
    return layoutNodes(visibleNodes, visibleEdges);
  }, [overview, filters]);

  const handleNodeClick = useCallback((_event, node) => {
    if (node.data?.type !== 'cve') return;
    // The graph payload only has minimal CVE fields. The DetailPanel will
    // load the full record + relations via /cves/{id}/graph itself, so we
    // just need an object with `id` and the basics for the header.
    const numericId = Number(node.id.split(':', 2)[1]);
    setSelectedCve({
      id: numericId,
      cve_id: node.data.label,
      severity: node.data.severity,
      cvss: node.data.cvss,
    });
  }, []);

  const counts = useMemo(() => {
    const c = { lab: 0, attack: 0, cve: 0, component: 0 };
    overview.nodes.forEach((n) => { if (c[n.type] != null) c[n.type] += 1; });
    return c;
  }, [overview]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogout={onLogout} onNavigate={onNavigate} currentView="graph" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page heading + actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Network View</h1>
            <p className="text-sm text-gray-500 mt-1">
              Live graph of CVEs, affected components, attack techniques, and contributing labs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill type="lab" label="Labs" count={counts.lab} filters={filters} setFilters={setFilters} />
            <FilterPill type="attack" label="Attacks" count={counts.attack} filters={filters} setFilters={setFilters} />
            <FilterPill type="cve" label="CVEs" count={counts.cve} filters={filters} setFilters={setFilters} />
            <FilterPill type="component" label="Components" count={counts.component} filters={filters} setFilters={setFilters} />
            <button
              onClick={load}
              disabled={loading}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="premium-card rounded-[2rem] overflow-hidden bg-white/60 relative" style={{ height: '70vh', minHeight: 480 }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading graph…
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
              <div className="p-3 bg-red-50 rounded-full text-red-500 mb-4">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Could not load graph</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">{error}</p>
              <button
                onClick={load}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && overview.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Graph is empty</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Add CVEs, components, or attack techniques and link them to populate this view.
              </p>
            </div>
          )}

          {!loading && !error && overview.nodes.length > 0 && (
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                minZoom={0.2}
                maxZoom={1.5}
              >
                <Background gap={24} color="#E5E7EB" />
                <Controls showInteractive={false} className="!bg-white !border !border-gray-200 !rounded-xl !shadow-sm" />
                <MiniMap
                  pannable
                  zoomable
                  className="!bg-white !border !border-gray-200 !rounded-xl"
                  nodeColor={(n) => {
                    const t = n.data?.type;
                    if (t === 'cve') return SEVERITY_TINT[n.data?.severity]?.border?.replace('border-', '#') ? '#EF4444' : '#FCA5A5';
                    if (t === 'attack') return '#A855F7';
                    if (t === 'component') return '#3B82F6';
                    return '#9CA3AF';
                  }}
                />
              </ReactFlow>
            </ReactFlowProvider>
          )}
        </div>

        <Legend />
      </main>

      <DetailPanel
        isOpen={!!selectedCve}
        onClose={() => setSelectedCve(null)}
        cve={selectedCve}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------

const FilterPill = ({ type, label, count, filters, setFilters }) => {
  const active = filters[type] !== false;
  const chrome = TYPE_CHROME[type];
  return (
    <button
      onClick={() => setFilters((prev) => ({ ...prev, [type]: !active }))}
      aria-pressed={active}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all',
        active
          ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
          : 'bg-gray-50 text-gray-400 border-gray-100 line-through'
      )}
    >
      <chrome.Icon className={clsx('w-3.5 h-3.5', active ? chrome.accent : 'text-gray-400')} />
      {label}
      <span className="ml-0.5 text-[10px] font-medium text-gray-400">{count}</span>
    </button>
  );
};

const Legend = () => (
  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 px-4 py-3 bg-white/60 rounded-2xl border border-gray-100">
    <span className="font-bold text-gray-400 uppercase tracking-widest">Edges</span>
    <LegendDot color="#9CA3AF" label="contributes" />
    <LegendDot color="#A855F7" label="uses" />
    <LegendDot color="#EF4444" label="affects" />
    <LegendDot color="#3B82F6" label="contains" />
  </div>
);

const LegendDot = ({ color, label }) => (
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
    {label}
  </span>
);

export default Graph;

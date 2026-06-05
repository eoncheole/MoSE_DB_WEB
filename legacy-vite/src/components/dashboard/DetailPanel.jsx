import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Cpu, Zap, FlaskConical, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { fetchCveGraph } from '../../lib/api';

const DetailPanel = ({ isOpen, onClose, cve }) => {
  const [copied, setCopied] = useState(false);
  const [graph, setGraph] = useState(null);   // null = not loaded yet for this cve
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState(null);

  // Esc to close + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Reset transient state when a different CVE is opened
  useEffect(() => {
    setCopied(false);
    setGraph(null);
    setGraphError(null);
  }, [cve?.id]);

  // Fetch the relations graph whenever the panel opens for a CVE
  useEffect(() => {
    if (!isOpen || !cve?.id) return;
    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);
    fetchCveGraph(cve.id)
      .then((data) => { if (!cancelled) setGraph(data); })
      .catch((err) => { if (!cancelled) setGraphError(err.message); })
      .finally(() => { if (!cancelled) setGraphLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, cve?.id]);

  if (!cve) return null;

  const script = cve.remediation_script ?? '';
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard unavailable (e.g., insecure context) — silently ignore */
    }
  };

  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 text-red-600 ring-red-100';
      case 'High': return 'bg-orange-50 text-orange-600 ring-orange-100';
      default: return 'bg-yellow-50 text-yellow-600 ring-yellow-100';
    }
  };

  // Build a unique-by-id list of contributing labs across both edge sets
  const contributors = (() => {
    if (!graph) return [];
    const byId = new Map();
    [...(graph.components ?? []), ...(graph.attacks ?? [])].forEach((link) => {
      if (link.contributor && !byId.has(link.contributor.id)) {
        byId.set(link.contributor.id, link.contributor);
      }
    });
    return Array.from(byId.values());
  })();

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-gray-900/10 backdrop-blur-[2px] z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cve-detail-title"
        className={clsx(
          "fixed inset-y-0 right-0 w-full md:w-[500px] bg-white/90 backdrop-blur-2xl z-[101] shadow-[0_0_50px_rgba(0,0,0,0.15)] border-l border-white/50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col h-full supports-[height:100dvh]:h-[100dvh] overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="px-6 py-6 sm:px-8 border-b border-gray-100/50 flex justify-between items-start bg-white/40 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ring-1", getSeverityColors(cve.severity))}>
                {cve.severity}
              </span>
              <span className="text-xs text-gray-400 font-mono tracking-tight">
                CVSS {cve.cvss != null ? cve.cvss.toFixed(1) : '—'}
              </span>
            </div>
            <h2 id="cve-detail-title" className="text-3xl font-bold text-gray-900 font-mono tracking-tighter">{cve.cve_id}</h2>
          </div>
          <button onClick={onClose} aria-label="Close detail panel" className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-6 sm:px-8 space-y-8">
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vulnerability Detail</h4>
            <p className="text-gray-600 leading-relaxed text-[15px] font-light">
              {cve.description ?? 'No description provided.'}
            </p>
          </div>

          {/* --- Connected to (graph relations from /cves/{id}/graph) --- */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Connected To</h4>

            {graphLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading relations…
              </div>
            )}

            {graphError && !graphLoading && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Could not load relations: {graphError}</span>
              </div>
            )}

            {graph && !graphLoading && !graphError && (
              <div className="space-y-4">
                <RelationGroup
                  label="Affected Components"
                  icon={Cpu}
                  empty="No components linked yet."
                  items={(graph.components ?? []).map((link) => ({
                    key: `c-${link.component.id}`,
                    primary: link.component.name,
                    meta: [link.component.type, link.component.vendor].filter(Boolean).join(' · '),
                    contributor: link.contributor?.name,
                  }))}
                />

                <RelationGroup
                  label="Attack Techniques"
                  icon={Zap}
                  empty="No attack techniques linked yet."
                  items={(graph.attacks ?? []).map((link) => ({
                    key: `a-${link.attack.id}`,
                    primary: link.attack.name,
                    meta: [link.attack.category, link.attack.mitre_id].filter(Boolean).join(' · '),
                    contributor: link.contributor?.name,
                  }))}
                />

                {contributors.length > 0 && (
                  <RelationGroup
                    label="Contributing Labs"
                    icon={FlaskConical}
                    items={contributors.map((lab) => ({
                      key: `l-${lab.id}`,
                      primary: lab.name,
                      meta: lab.affiliation,
                    }))}
                  />
                )}
              </div>
            )}
          </div>

          {/* --- Remediation Script --- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Remediation Script</h4>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!script}
                aria-label={copied ? 'Script copied' : 'Copy remediation script'}
                className={clsx(
                  "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all",
                  copied
                    ? "bg-green-50 text-green-600 ring-1 ring-green-100"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
                  !script && "opacity-40 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-[#1e1e1e] p-5 rounded-2xl overflow-x-auto shadow-inner border border-gray-800">
              <code className="font-mono text-xs text-gray-300 leading-relaxed block whitespace-pre-wrap">
                {script || '# No remediation script provided.'}
              </code>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 shrink-0">
           <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">CVE #{cve.id}</span>
              <button className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors">Open in Jira &rarr;</button>
           </div>
        </div>
      </div>
    </>
  );
};

const RelationGroup = ({ label, icon: Icon, items, empty }) => {
  if (!items || items.length === 0) {
    if (!empty) return null;
    return (
      <div>
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </h5>
        <p className="text-xs text-gray-400 italic pl-5">{empty}</p>
      </div>
    );
  }
  return (
    <div>
      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label} <span className="text-gray-300 font-medium">· {items.length}</span>
      </h5>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.key}
            className="flex items-start justify-between gap-3 px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-lg"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{it.primary}</div>
              {it.meta && <div className="text-[11px] text-gray-500 truncate">{it.meta}</div>}
            </div>
            {it.contributor && (
              <span className="text-[10px] font-medium text-gray-400 bg-white border border-gray-100 rounded-md px-2 py-0.5 whitespace-nowrap shrink-0">
                {it.contributor}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetailPanel;

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  Loader2,
  Send,
  UploadCloud,
  X,
} from 'lucide-react';
import clsx from 'clsx';

import Header from '../components/dashboard/Header';
import { importBundle } from '../lib/api';


// Sample template — exposed via a "Download example" button so partners know
// what shape we expect. Mirrors what the backend ingests; values illustrative.
const EXAMPLE_BUNDLE = {
  lab: {
    name: 'Partner Lab Example',
    affiliation: 'Partner University',
    contact: 'partner@example.com',
  },
  components: [
    { name: 'NXP iMX RT1170', vendor: 'NXP', model: 'RT1170', type: 'MCU' },
    { name: 'TPM Module 2.0', vendor: 'Generic', type: 'Firmware' },
  ],
  attacks: [
    { name: 'EM Fault Injection', category: 'Fault Injection' },
  ],
  cves: [
    {
      cve_id: 'PARTNER-CVE-001',
      severity: 'High',
      cvss: 7.5,
      description: 'EM glitch on iMX RT1170 bypasses TPM attestation.',
      remediation_script: 'apply patch RT1170-fw-2.4',
      affects: ['NXP iMX RT1170', 'TPM Module 2.0'],
      attacks: ['EM Fault Injection'],
    },
  ],
};


function validateBundle(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== 'object') {
    return ['Bundle must be a JSON object.'];
  }
  if (parsed.lab && (typeof parsed.lab !== 'object' || !parsed.lab.name)) {
    errors.push('lab.name is required when lab is present.');
  }
  for (const [key, requiredFields] of [
    ['components', ['name', 'type']],
    ['attacks', ['name']],
    ['cves', ['cve_id', 'severity']],
  ]) {
    if (parsed[key] != null && !Array.isArray(parsed[key])) {
      errors.push(`${key} must be an array.`);
      continue;
    }
    (parsed[key] ?? []).forEach((item, i) => {
      if (typeof item !== 'object' || item == null) {
        errors.push(`${key}[${i}] must be an object.`);
        return;
      }
      requiredFields.forEach((f) => {
        if (item[f] == null || item[f] === '') {
          errors.push(`${key}[${i}].${f} is required.`);
        }
      });
    });
  }
  return errors;
}


const Import = ({ onLogout, onNavigate }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Live parse + validation while the user types/edits the textarea.
  const { parsed, parseError, validationErrors } = useMemo(() => {
    if (!text.trim()) return { parsed: null, parseError: null, validationErrors: [] };
    try {
      const obj = JSON.parse(text);
      return { parsed: obj, parseError: null, validationErrors: validateBundle(obj) };
    } catch (e) {
      return { parsed: null, parseError: e.message, validationErrors: [] };
    }
  }, [text]);

  const counts = useMemo(() => ({
    lab: parsed?.lab ? 1 : 0,
    components: parsed?.components?.length ?? 0,
    attacks: parsed?.attacks?.length ?? 0,
    cves: parsed?.cves?.length ?? 0,
  }), [parsed]);

  const isReady = parsed && !parseError && validationErrors.length === 0
    && (counts.lab + counts.components + counts.attacks + counts.cves > 0);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!/\.json$/i.test(file.name)) {
      setSubmitError('Only .json files are supported.');
      return;
    }
    setSubmitError(null);
    setResult(null);
    setFileName(file.name);
    const txt = await file.text();
    setText(txt);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const reset = () => {
    setText('');
    setFileName(null);
    setSubmitError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!isReady) return;
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const out = await importBundle(parsed);
      setResult(out);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(EXAMPLE_BUNDLE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mose-bundle-example.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogout={onLogout} onNavigate={onNavigate} currentView="import" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Import Bundle</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Drop a JSON bundle from a partner lab. Components and attacks referenced by name
              get reused if they already exist; everything is upserted, so you can re-run the same
              file safely.
            </p>
          </div>
          <button
            onClick={downloadExample}
            className="self-start inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />
            Download example
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* --- Left: drop zone + textarea --- */}
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={clsx(
                'flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed transition-all',
                dragOver
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-white/60 border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="p-3 bg-gray-100 rounded-full mb-3 text-gray-500">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-900">Drop a .json file here</p>
              <p className="text-xs text-gray-500 mt-1">or pick one from disk — it's parsed locally before upload</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Choose file
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="bundle-text" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Bundle JSON
                </label>
                {fileName && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                    <FileJson className="w-3.5 h-3.5" />
                    {fileName}
                    <button
                      onClick={reset}
                      aria-label="Clear file"
                      className="ml-1 text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <textarea
                id="bundle-text"
                value={text}
                onChange={(e) => { setText(e.target.value); setFileName(null); setResult(null); }}
                placeholder="Paste JSON here, or drop a file above."
                spellCheck={false}
                className="w-full h-72 font-mono text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* --- Right: validation + actions + result --- */}
          <div className="space-y-4">
            <div className="bg-white/70 border border-gray-100 rounded-2xl p-5">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Preview</h3>

              {!text.trim() ? (
                <p className="text-sm text-gray-400">Bundle preview will appear once you load a file.</p>
              ) : parseError ? (
                <ValidationError title="JSON syntax error" lines={[parseError]} />
              ) : validationErrors.length > 0 ? (
                <ValidationError title="Bundle is missing required fields" lines={validationErrors} />
              ) : (
                <div className="space-y-2.5 text-sm">
                  <PreviewRow label="Contributing lab" value={parsed?.lab?.name ?? '(none)'} />
                  <PreviewRow label="Components" value={`${counts.components}`} />
                  <PreviewRow label="Attack techniques" value={`${counts.attacks}`} />
                  <PreviewRow label="CVEs" value={`${counts.cves}`} />
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isReady || submitting}
              className={clsx(
                'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                isReady && !submitting
                  ? 'bg-gray-900 text-white hover:bg-black hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {submitting
                ? (<><Loader2 className="w-4 h-4 animate-spin" />Importing…</>)
                : (<><Send className="w-4 h-4" />Run import</>)}
            </button>

            {submitError && (
              <ValidationError title="Import failed" lines={[submitError]} />
            )}

            {result && <ResultSummary result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
};


const PreviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);


const ValidationError = ({ title, lines }) => (
  <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs">
    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
    <div className="space-y-1">
      <div className="font-bold">{title}</div>
      <ul className="list-disc list-inside space-y-0.5">
        {lines.map((l, i) => <li key={i} className="break-words">{l}</li>)}
      </ul>
    </div>
  </div>
);


const ResultSummary = ({ result }) => {
  const { created, updated, linked, warnings, lab } = result;
  const total = (...c) => c.reduce((a, b) => a + (b ?? 0), 0);
  const createdTotal = total(created.labs, created.components, created.attacks, created.cves);
  const updatedTotal = total(updated.labs, updated.components, updated.attacks, updated.cves);
  const linkedTotal = total(linked.cve_affects_component, linked.cve_uses_attack);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <h3 className="text-sm font-bold text-gray-900">Import complete</h3>
      </div>
      {lab && (
        <div className="text-xs text-gray-500">
          Recorded under contributor: <span className="font-semibold text-gray-900">{lab.name}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <ResultStat label="Created" value={createdTotal} hint={`${created.cves} CVEs`} accent="text-emerald-600" />
        <ResultStat label="Updated" value={updatedTotal} hint={`${updated.cves} CVEs`} accent="text-blue-600" />
        <ResultStat label="Edges linked" value={linkedTotal} hint={`${linked.cve_affects_component} affects, ${linked.cve_uses_attack} uses`} accent="text-purple-600" />
      </div>
      {warnings && warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs">
          <div className="font-bold mb-1">Warnings ({warnings.length})</div>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => <li key={i} className="break-words">{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};


const ResultStat = ({ label, value, hint, accent }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <div className={clsx('text-2xl font-bold tracking-tight', accent)}>{value}</div>
    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</div>
    <div className="text-[10px] text-gray-400 mt-0.5">{hint}</div>
  </div>
);


export default Import;

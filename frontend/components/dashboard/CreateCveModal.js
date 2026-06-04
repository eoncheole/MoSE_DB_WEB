'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, Cpu } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const EMPTY_FORM = {
  cve_id: '',
  severity: 'Medium',
  description: '',
  status: 'Active',
};

export default function CreateCveModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  // Affected assets are now relations to Component records (the backend dropped
  // the old free-text `asset` column), so we let the user pick existing
  // components and link them after the CVE is created.
  const [components, setComponents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load the component list whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingComponents(true);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/components/`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setComponents(data);
      } catch {
        if (!cancelled) setComponents([]);
      } finally {
        if (!cancelled) setIsLoadingComponents(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleComponent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetAndClose = () => {
    setFormData(EMPTY_FORM);
    setSelectedIds([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // 1. Create the CVE record.
      const res = await fetch(`${API_URL}/cves/`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        // Surface auth/permission failures distinctly. Writes require an admin
        // account, so a logged-in non-admin gets 403; an expired/missing token
        // gets 401. Fall back to the API's `detail` for anything else.
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (res.status === 403) {
          throw new Error('You do not have permission to add records. This action requires an admin account.');
        }
        let detail = 'Failed to create CVE';
        try {
          const data = await res.json();
          if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : detail;
        } catch { /* response had no JSON body */ }
        throw new Error(detail);
      }

      const newCve = await res.json();

      // 2. Link each selected component to the new CVE.
      const failedLinks = [];
      for (const componentId of selectedIds) {
        const linkRes = await fetch(`${API_URL}/cves/links/components`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ cve_id: newCve.id, component_id: componentId }),
        });
        if (!linkRes.ok) {
          const comp = components.find(c => c.id === componentId);
          failedLinks.push(comp?.name || `#${componentId}`);
        }
      }

      // 3. Tell the parent, passing the linked component names so the row's
      //    "Asset" column is populated immediately (the list API would
      //    otherwise only show them on the next refetch).
      const linkedNames = components
        .filter(c => selectedIds.includes(c.id) && !failedLinks.includes(c.name))
        .map(c => c.name);
      onCreated({ ...newCve, components: linkedNames });

      if (failedLinks.length) {
        // CVE was created but some links didn't take — keep the modal open and
        // tell the user which ones, rather than silently dropping them.
        setError(`CVE created, but failed to link: ${failedLinks.join(', ')}`);
        setSelectedIds([]);
        return;
      }

      resetAndClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New Vulnerability</h2>
              <p className="text-xs text-gray-500">Register a new CVE into the database</p>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form id="create-cve-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">CVE ID</label>
                <input
                  required
                  name="cve_id"
                  value={formData.cve_id}
                  onChange={handleChange}
                  placeholder="e.g. CVE-2024-0001"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Severity</label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Mitigated">Mitigated</option>
                    </select>
                </div>
              </div>

              {/* Affected components — relational replacement for the old `asset` field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Affected Components</label>
                {isLoadingComponents ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading components...
                  </div>
                ) : components.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No components available. Add components first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {components.map(comp => {
                      const active = selectedIds.includes(comp.id);
                      return (
                        <button
                          type="button"
                          key={comp.id}
                          onClick={() => toggleComponent(comp.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          {comp.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">Select the components this CVE affects (optional).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter vulnerability details..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-cve-form"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Record
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

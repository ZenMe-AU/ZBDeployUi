import { useState, useCallback } from 'react';
import type { DeploymentScript, ScriptFormData } from './types';
import {
  getScripts,
  saveScript,
  updateScript,
  deleteScript,
  getLogsForScript,
} from './services/storage';
import { ScriptCard } from './components/ScriptCard';
import { ScriptForm } from './components/ScriptForm';
import { Modal } from './components/Modal';
import { ExecutionPanel } from './components/ExecutionPanel';
import { LogsView } from './components/LogsView';

type ActiveModal =
  | { type: 'create' }
  | { type: 'edit'; script: DeploymentScript }
  | { type: 'run'; script: DeploymentScript }
  | { type: 'logs'; script: DeploymentScript }
  | { type: 'confirm-delete'; script: DeploymentScript }
  | null;

export default function App() {
  const [scripts, setScripts] = useState<DeploymentScript[]>(() => getScripts());
  const [modal, setModal] = useState<ActiveModal>(null);
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('all');

  const refresh = useCallback(() => setScripts(getScripts()), []);

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleCreate(data: ScriptFormData) {
    saveScript(data);
    refresh();
    setModal(null);
  }

  function handleUpdate(data: ScriptFormData) {
    if (modal?.type !== 'edit') return;
    updateScript(modal.script.id, data);
    refresh();
    setModal(null);
  }

  function handleDelete() {
    if (modal?.type !== 'confirm-delete') return;
    deleteScript(modal.script.id);
    refresh();
    setModal(null);
  }

  // ── filtering ─────────────────────────────────────────────────────────────

  const environments = Array.from(new Set(scripts.map((s) => s.environment))).sort();

  const filtered = scripts.filter((s) => {
    const matchesSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesEnv = envFilter === 'all' || s.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  // ── stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total: scripts.length,
    running: scripts.filter((s) => s.lastRunStatus === 'running').length,
    success: scripts.filter((s) => s.lastRunStatus === 'success').length,
    failed: scripts.filter((s) => s.lastRunStatus === 'failed').length,
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-900">ZB Deploy</span>
            </div>

            <button
              onClick={() => setModal({ type: 'create' })}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Script
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Scripts', value: stats.total, color: 'text-gray-700' },
            { label: 'Running', value: stats.running, color: 'text-blue-600' },
            { label: 'Succeeded', value: stats.success, color: 'text-green-600' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scripts…"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Environments</option>
            {environments.map((env) => (
              <option key={env} value={env}>
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Scripts grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="h-12 w-12 text-gray-300 mb-4"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {search || envFilter !== 'all' ? (
              <>
                <p className="text-gray-600 font-medium">No scripts match your filters</p>
                <button
                  onClick={() => { setSearch(''); setEnvFilter('all'); }}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-medium">No deployment scripts yet</p>
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Create your first script
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                onRun={(s) => setModal({ type: 'run', script: s })}
                onEdit={(s) => setModal({ type: 'edit', script: s })}
                onDelete={(s) => setModal({ type: 'confirm-delete', script: s })}
                onViewLogs={(s) => setModal({ type: 'logs', script: s })}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}

      {modal?.type === 'create' && (
        <Modal title="New Deployment Script" onClose={() => setModal(null)}>
          <ScriptForm onSubmit={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Script" onClose={() => setModal(null)}>
          <ScriptForm
            initial={modal.script}
            onSubmit={handleUpdate}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'run' && (
        <Modal title="Running Script" onClose={() => setModal(null)} wide>
          <ExecutionPanel
            script={modal.script}
            onClose={() => { refresh(); setModal(null); }}
            onComplete={refresh}
          />
        </Modal>
      )}

      {modal?.type === 'logs' && (
        <Modal title={`Execution History — ${modal.script.name}`} onClose={() => setModal(null)} wide>
          <LogsView
            scriptName={modal.script.name}
            logs={getLogsForScript(modal.script.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'confirm-delete' && (
        <Modal title="Delete Script" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900">{modal.script.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

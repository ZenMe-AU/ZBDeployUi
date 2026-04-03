import type { DeploymentScript } from '../types';
import { StatusBadge } from './StatusBadge';

interface ScriptCardProps {
  script: DeploymentScript;
  onRun: (script: DeploymentScript) => void;
  onEdit: (script: DeploymentScript) => void;
  onDelete: (script: DeploymentScript) => void;
  onViewLogs: (script: DeploymentScript) => void;
}

export function ScriptCard({ script, onRun, onEdit, onDelete, onViewLogs }: ScriptCardProps) {
  const isRunning = script.lastRunStatus === 'running';

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const envColors: Record<string, string> = {
    production: 'bg-orange-100 text-orange-700',
    staging: 'bg-yellow-100 text-yellow-700',
    development: 'bg-teal-100 text-teal-700',
    testing: 'bg-purple-100 text-purple-700',
  };
  const envClass = envColors[script.environment] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{script.name}</h3>
          {script.description && (
            <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{script.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={script.lastRunStatus} pulsing />
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${envClass}`}>
            {script.environment}
          </span>
        </div>
      </div>

      {/* Command */}
      <code className="block rounded-lg bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 truncate border border-gray-100">
        {script.command}
      </code>

      {/* Meta */}
      <p className="text-xs text-gray-400">
        Last run: <span className="text-gray-600">{formatDate(script.lastRunAt)}</span>
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onRun(script)}
          disabled={isRunning}
          title="Run script"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isRunning ? 'Running…' : 'Run'}
        </button>

        <button
          onClick={() => onViewLogs(script)}
          title="View execution history"
          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          onClick={() => onEdit(script)}
          title="Edit script"
          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(script)}
          title="Delete script"
          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

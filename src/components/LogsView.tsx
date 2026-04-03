import { useState } from 'react';
import type { ExecutionLog } from '../types';
import { StatusBadge } from './StatusBadge';

interface LogsViewProps {
  scriptName: string;
  logs: ExecutionLog[];
  onClose: () => void;
}

export function LogsView({ scriptName, logs, onClose }: LogsViewProps) {
  const [selected, setSelected] = useState<ExecutionLog | null>(logs[0] ?? null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  }

  function duration(log: ExecutionLog) {
    if (!log.finishedAt) return '…';
    const ms = new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime();
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No execution history for <strong>{scriptName}</strong> yet.
        </p>
      ) : (
        <div className="flex gap-4" style={{ minHeight: '24rem' }}>
          {/* Sidebar */}
          <div className="w-48 shrink-0 flex flex-col gap-1 overflow-y-auto">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                  selected?.id === log.id
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="mb-1">
                  <StatusBadge status={log.status} />
                </div>
                <div className="text-gray-400 truncate">{formatDate(log.startedAt)}</div>
                <div className="text-gray-400">Duration: {duration(log)}</div>
              </button>
            ))}
          </div>

          {/* Log output */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <pre className="h-96 overflow-y-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
                {selected.output || '(no output)'}
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Select a run to view output
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { DeploymentScript, ExecutionLog } from '../types';
import { runScript, addLog, updateLog, setScriptRunStatus } from '../services/storage';

interface ExecutionPanelProps {
  script: DeploymentScript;
  onClose: () => void;
  onComplete: () => void;
}

export function ExecutionPanel({ script, onClose, onComplete }: ExecutionPanelProps) {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'running' | 'success' | 'failed'>('running');
  const [logId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const startedAt = new Date().toISOString();

    const initialLog: ExecutionLog = {
      id: logId,
      scriptId: script.id,
      scriptName: script.name,
      startedAt,
      finishedAt: null,
      status: 'running',
      output: '',
      exitCode: null,
    };
    addLog(initialLog);
    setScriptRunStatus(script.id, 'running', startedAt);

    runScript(script, (partial) => {
      setOutput(partial);
      updateLog(logId, { output: partial });
    }).then(({ exitCode, output: finalOutput }) => {
      const finishedAt = new Date().toISOString();
      const finalStatus = exitCode === 0 ? 'success' : 'failed';
      setStatus(finalStatus);
      updateLog(logId, { status: finalStatus, finishedAt, exitCode, output: finalOutput });
      setScriptRunStatus(script.id, finalStatus, finishedAt);
      onComplete();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const statusColor =
    status === 'running' ? 'text-blue-400' : status === 'success' ? 'text-green-400' : 'text-red-400';
  const statusLabel =
    status === 'running' ? '⟳ Running…' : status === 'success' ? '✓ Completed' : '✗ Failed';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Script</p>
          <p className="font-medium text-gray-900">{script.name}</p>
        </div>
        <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>

      <pre
        ref={outputRef}
        className="h-80 overflow-y-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100 font-mono leading-relaxed whitespace-pre-wrap"
      >
        {output || 'Initialising…'}
      </pre>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          disabled={status === 'running'}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {status === 'running' ? 'Running…' : 'Close'}
        </button>
      </div>
    </div>
  );
}

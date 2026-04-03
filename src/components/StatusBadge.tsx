import type { ScriptStatus } from '../types';

interface StatusBadgeProps {
  status: ScriptStatus;
  pulsing?: boolean;
}

const config: Record<ScriptStatus, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'bg-gray-100 text-gray-600' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-700' },
  success: { label: 'Success', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status, pulsing }: StatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {status === 'running' && pulsing && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {label}
    </span>
  );
}

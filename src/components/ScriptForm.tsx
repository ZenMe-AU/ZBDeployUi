import { useEffect, useRef } from 'react';
import type { ScriptFormData } from '../types';

interface ScriptFormProps {
  initial?: Partial<ScriptFormData>;
  onSubmit: (data: ScriptFormData) => void;
  onCancel: () => void;
  submitting?: boolean;
}

const ENVIRONMENTS = ['production', 'staging', 'development', 'testing'];

export function ScriptForm({ initial, onSubmit, onCancel, submitting }: ScriptFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      command: fd.get('command') as string,
      environment: fd.get('environment') as string,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="script-name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          ref={nameRef}
          id="script-name"
          name="name"
          type="text"
          required
          defaultValue={initial?.name}
          placeholder="e.g. Deploy API Service"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="script-desc">
          Description
        </label>
        <textarea
          id="script-desc"
          name="description"
          rows={2}
          defaultValue={initial?.description}
          placeholder="What does this script do?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="script-cmd">
          Command <span className="text-red-500">*</span>
        </label>
        <textarea
          id="script-cmd"
          name="command"
          rows={3}
          required
          defaultValue={initial?.command}
          placeholder="e.g. docker-compose up -d"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="script-env">
          Environment <span className="text-red-500">*</span>
        </label>
        <select
          id="script-env"
          name="environment"
          required
          defaultValue={initial?.environment ?? 'staging'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : 'Save Script'}
        </button>
      </div>
    </form>
  );
}

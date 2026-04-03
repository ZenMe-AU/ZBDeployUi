import { describe, it, expect, beforeEach } from 'vitest';
import {
  getScripts,
  saveScript,
  updateScript,
  deleteScript,
  getLogs,
  addLog,
  getLogsForScript,
} from '../services/storage';

// Use a fresh localStorage for each test
beforeEach(() => {
  localStorage.clear();
});

describe('storage – scripts', () => {
  it('returns default scripts when localStorage is empty', () => {
    const scripts = getScripts();
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts[0]).toHaveProperty('id');
    expect(scripts[0]).toHaveProperty('name');
  });

  it('saves a new script', () => {
    localStorage.setItem('zb_deploy_scripts', JSON.stringify([]));
    const script = saveScript({
      name: 'Test Script',
      description: 'A test',
      command: 'echo hello',
      environment: 'staging',
    });
    expect(script.id).toBeTruthy();
    expect(script.name).toBe('Test Script');
    expect(script.lastRunStatus).toBe('idle');
    expect(script.lastRunAt).toBeNull();

    const all = getScripts();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(script.id);
  });

  it('updates an existing script', () => {
    localStorage.setItem('zb_deploy_scripts', JSON.stringify([]));
    const original = saveScript({
      name: 'Original',
      description: '',
      command: 'echo a',
      environment: 'staging',
    });
    const updated = updateScript(original.id, {
      name: 'Updated',
      description: 'changed',
      command: 'echo b',
      environment: 'production',
    });
    expect(updated.name).toBe('Updated');
    expect(updated.command).toBe('echo b');
    expect(updated.id).toBe(original.id);
  });

  it('throws when updating a non-existent script', () => {
    localStorage.setItem('zb_deploy_scripts', JSON.stringify([]));
    expect(() =>
      updateScript('does-not-exist', {
        name: 'x',
        description: '',
        command: 'x',
        environment: 'staging',
      }),
    ).toThrow();
  });

  it('deletes a script', () => {
    localStorage.setItem('zb_deploy_scripts', JSON.stringify([]));
    const script = saveScript({
      name: 'To Delete',
      description: '',
      command: 'echo delete',
      environment: 'staging',
    });
    deleteScript(script.id);
    const remaining = getScripts();
    expect(remaining.find((s) => s.id === script.id)).toBeUndefined();
  });
});

describe('storage – logs', () => {
  it('returns empty array when no logs exist', () => {
    expect(getLogs()).toEqual([]);
  });

  it('adds a log entry', () => {
    addLog({
      id: 'log-1',
      scriptId: 'script-1',
      scriptName: 'My Script',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: 'running',
      output: '',
      exitCode: null,
    });
    const logs = getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe('log-1');
  });

  it('filters logs by script id', () => {
    addLog({
      id: 'log-a',
      scriptId: 'script-1',
      scriptName: 'Script 1',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: 'success',
      output: 'done',
      exitCode: 0,
    });
    addLog({
      id: 'log-b',
      scriptId: 'script-2',
      scriptName: 'Script 2',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: 'failed',
      output: 'error',
      exitCode: 1,
    });
    const script1Logs = getLogsForScript('script-1');
    expect(script1Logs).toHaveLength(1);
    expect(script1Logs[0].id).toBe('log-a');
  });

  it('caps logs at 200 entries', () => {
    for (let i = 0; i < 205; i++) {
      addLog({
        id: `log-${i}`,
        scriptId: 'script-x',
        scriptName: 'Script X',
        startedAt: new Date().toISOString(),
        finishedAt: null,
        status: 'success',
        output: '',
        exitCode: 0,
      });
    }
    expect(getLogs().length).toBe(200);
  });
});

import type { DeploymentScript, ExecutionLog, ScriptFormData, ScriptStatus } from '../types';

const SCRIPTS_KEY = 'zb_deploy_scripts';
const LOGS_KEY = 'zb_deploy_logs';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ── Scripts ──────────────────────────────────────────────────────────────────

export function getScripts(): DeploymentScript[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    return raw ? (JSON.parse(raw) as DeploymentScript[]) : defaultScripts();
  } catch {
    return defaultScripts();
  }
}

export function saveScript(data: ScriptFormData): DeploymentScript {
  const scripts = getScripts();
  const script: DeploymentScript = {
    id: generateId(),
    ...data,
    createdAt: now(),
    updatedAt: now(),
    lastRunAt: null,
    lastRunStatus: 'idle',
  };
  scripts.push(script);
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
  return script;
}

export function updateScript(id: string, data: ScriptFormData): DeploymentScript {
  const scripts = getScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Script ${id} not found`);
  const updated: DeploymentScript = { ...scripts[idx], ...data, updatedAt: now() };
  scripts[idx] = updated;
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
  return updated;
}

export function deleteScript(id: string): void {
  const scripts = getScripts().filter((s) => s.id !== id);
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

export function setScriptRunStatus(id: string, status: ScriptStatus, lastRunAt: string | null): void {
  const scripts = getScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) return;
  scripts[idx] = { ...scripts[idx], lastRunStatus: status, lastRunAt };
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

// ── Execution Logs ────────────────────────────────────────────────────────────

export function getLogs(): ExecutionLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as ExecutionLog[]) : [];
  } catch {
    return [];
  }
}

export function addLog(log: ExecutionLog): void {
  const logs = getLogs();
  logs.unshift(log);
  // keep at most 200 entries
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
}

export function updateLog(id: string, patch: Partial<ExecutionLog>): void {
  const logs = getLogs();
  const idx = logs.findIndex((l) => l.id === id);
  if (idx === -1) return;
  logs[idx] = { ...logs[idx], ...patch };
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function getLogsForScript(scriptId: string): ExecutionLog[] {
  return getLogs().filter((l) => l.scriptId === scriptId);
}

// ── Simulated execution ───────────────────────────────────────────────────────

export async function runScript(
  script: DeploymentScript,
  onProgress: (partial: string) => void,
): Promise<{ exitCode: number; output: string }> {
  const lines = [
    `[ZBDeploy] Starting deployment: ${script.name}`,
    `[ZBDeploy] Environment: ${script.environment}`,
    `[ZBDeploy] Command: ${script.command}`,
    `[ZBDeploy] Timestamp: ${new Date().toLocaleString()}`,
    '',
    `$ ${script.command}`,
  ];

  let output = '';
  for (const line of lines) {
    await delay(120);
    output += line + '\n';
    onProgress(output);
  }

  // Simulate some command output
  const steps = generateSteps(script.command);
  for (const step of steps) {
    await delay(200 + Math.random() * 300);
    output += step + '\n';
    onProgress(output);
  }

  // 10% chance of failure for demo purposes
  const exitCode = Math.random() < 0.1 ? 1 : 0;
  await delay(300);
  if (exitCode === 0) {
    output += '\n[ZBDeploy] ✓ Deployment completed successfully.\n';
  } else {
    output += '\n[ZBDeploy] ✗ Deployment failed with exit code 1.\n';
  }
  onProgress(output);

  return { exitCode, output };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSteps(command: string): string[] {
  if (command.includes('docker')) {
    return [
      'Pulling latest image...',
      'docker pull registry.example.com/app:latest',
      'latest: Pulling from app',
      'Digest: sha256:abc123def456',
      'Status: Image is up to date',
      'Stopping existing container...',
      'Starting new container...',
      'Container started with ID: a1b2c3d4e5f6',
      'Health check passed.',
    ];
  }
  if (command.includes('kubectl') || command.includes('k8s')) {
    return [
      'Applying manifest...',
      'deployment.apps/app configured',
      'service/app unchanged',
      'Waiting for rollout...',
      'Waiting for deployment "app" rollout to finish: 1 old replicas are pending termination...',
      'deployment "app" successfully rolled out',
    ];
  }
  if (command.includes('terraform')) {
    return [
      'Initializing provider plugins...',
      'Terraform has been successfully initialized!',
      'Planning...',
      'Plan: 2 to add, 1 to change, 0 to destroy.',
      'Applying...',
      'Apply complete! Resources: 2 added, 1 changed, 0 destroyed.',
    ];
  }
  return [
    'Checking prerequisites...',
    'Prerequisites OK.',
    'Running deployment steps...',
    'Step 1/3: Pulling latest changes... done',
    'Step 2/3: Installing dependencies... done',
    'Step 3/3: Restarting services... done',
  ];
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function defaultScripts(): DeploymentScript[] {
  return [
    {
      id: 'demo-1',
      name: 'Deploy API Service',
      description: 'Pulls the latest Docker image and restarts the API container.',
      command: 'docker pull registry.example.com/api:latest && docker-compose up -d api',
      environment: 'production',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-20T14:30:00.000Z',
      lastRunAt: '2026-04-02T09:15:00.000Z',
      lastRunStatus: 'success',
    },
    {
      id: 'demo-2',
      name: 'Deploy Frontend',
      description: 'Builds and deploys the React frontend to the CDN.',
      command: 'npm run build && aws s3 sync dist/ s3://myapp-frontend --delete',
      environment: 'production',
      createdAt: '2026-03-05T10:00:00.000Z',
      updatedAt: '2026-04-01T11:00:00.000Z',
      lastRunAt: '2026-04-01T11:00:00.000Z',
      lastRunStatus: 'success',
    },
    {
      id: 'demo-3',
      name: 'Run DB Migrations',
      description: 'Applies pending database migrations.',
      command: 'kubectl exec deploy/api -- python manage.py migrate',
      environment: 'staging',
      createdAt: '2026-02-15T12:00:00.000Z',
      updatedAt: '2026-03-28T09:00:00.000Z',
      lastRunAt: '2026-03-28T09:00:00.000Z',
      lastRunStatus: 'failed',
    },
    {
      id: 'demo-4',
      name: 'Terraform Infrastructure',
      description: 'Applies Terraform changes to AWS infrastructure.',
      command: 'terraform plan && terraform apply -auto-approve',
      environment: 'staging',
      createdAt: '2026-01-20T15:00:00.000Z',
      updatedAt: '2026-03-15T16:00:00.000Z',
      lastRunAt: null,
      lastRunStatus: 'idle',
    },
  ];
}

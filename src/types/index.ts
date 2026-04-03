export type ScriptStatus = 'idle' | 'running' | 'success' | 'failed';

export interface DeploymentScript {
  id: string;
  name: string;
  description: string;
  command: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunStatus: ScriptStatus;
}

export interface ExecutionLog {
  id: string;
  scriptId: string;
  scriptName: string;
  startedAt: string;
  finishedAt: string | null;
  status: ScriptStatus;
  output: string;
  exitCode: number | null;
}

export type ScriptFormData = Pick<DeploymentScript, 'name' | 'description' | 'command' | 'environment'>;

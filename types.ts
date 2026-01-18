
export enum VMStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  SAVING = 'SAVING',
  STARTING = 'STARTING',
  OFFLINE = 'OFFLINE'
}

export interface Workspace {
  id: string;
  name: string;
  repo: string;
  branch: string;
  status: VMStatus;
  lastActive: string;
  isShared: boolean;
  snapshotsCount: number;
}

export interface Snapshot {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  description?: string;
}

export type ViewType = 'dashboard' | 'create' | 'editor';

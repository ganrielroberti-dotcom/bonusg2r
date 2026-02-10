// Auvo API V2 Types

export interface AuvoTask {
  taskID: number;
  externalId: string;
  customerDescription: string;
  customerId: number;
  taskDate: string;
  taskType: number;
  taskTypeDescription: string;
  idUserTo: number;
  userToName: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  taskStatus: number; // 1=Opened, 2=InDisplacement, 3=CheckedIn, 4=CheckedOut, 5=Finished, 6=Paused
  duration: string | null;
  durationDecimal: string | null;
}

export interface AuvoUser {
  userID: number;
  name: string;
  email: string;
  jobPosition: string;
  externalId: string;
}

export interface AuvoUserMapping {
  id: string;
  auvo_user_id: number;
  auvo_user_name: string;
  employee_id: string;
  created_at: string;
}

export interface AuvoSyncLog {
  id: string;
  month_key: string;
  started_at: string;
  finished_at: string | null;
  employees_count: number;
  tasks_count: number;
  errors: unknown[];
  status: string;
}

export interface AuvoHoursCache {
  id: string;
  month_key: string;
  employee_id: string;
  auvo_user_id: number;
  total_hours: number;
  tasks_detail: AuvoTaskDetail[];
  synced_at: string;
}

export interface AuvoTaskDetail {
  taskID: number;
  externalId: string;
  customerDescription: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  taskStatus: number;
  durationDecimal: string | null;
  calculatedHours: number;
  calculation: string; // human-readable explanation
}

export interface AuvoOSLookupResult {
  found: boolean;
  task?: AuvoTask;
  cached?: boolean;
}

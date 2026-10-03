export type PortalModule =
  | "Beranda"
  | "CRM"
  | "Klien & Handover"
  | "Proyek"
  | "Sosmed"
  | "Pengaturan";

export type StatusTone =
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "priority";

export interface NavigationItem {
  label: string;
  module: PortalModule;
  href: string;
  badge?: number;
  roles: string[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  tone: StatusTone;
}

export interface WorkQueueItem {
  id: string;
  title: string;
  module: PortalModule;
  owner: string;
  status: string;
  dueDate: string;
  tone: StatusTone;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  subject: string;
  timestamp: string;
  module: PortalModule;
}

export interface DashboardSnapshot {
  currentUser: {
    name: string;
    email: string;
    roles: string[];
  };
  metrics: DashboardMetric[];
  navigation: NavigationItem[];
  workQueue: WorkQueueItem[];
  activities: ActivityItem[];
}

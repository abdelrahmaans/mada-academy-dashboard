export interface ReadinessRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  activeGroupsCount?: number;
  equipment: string[];
  status: "AVAILABLE" | "IN_MAINTENANCE" | "OCCUPIED";
  notes: string;
}

export interface ReadinessKit {
  id: string;
  name: string;
  track: string;
  totalQuantity: number;
  readyQuantity: number;
  maintenanceQuantity: number;
  supportsStudents: string;
  status: "READY" | "PARTIAL" | "MAINTENANCE";
  notes: string;
}

export interface ReadinessCompetition {
  id: string;
  name: string;
  tracks: string[];
  targetKits: string;
  registeredTeams: number;
  studentsCount: number;
  status: "ACTIVE_PREPARATION" | "ENROLLED" | "COMPLETED" | "UPCOMING";
  notes: string;
}

export interface ReadinessCheckItem {
  id: string;
  title: string;
  category: "FACILITY" | "NETWORK" | "EQUIPMENT" | "SAFETY";
  checked: boolean;
  assignedRole: string;
  updatedAt: string;
}

export interface BranchReadinessState {
  rooms: ReadinessRoom[];
  kits: ReadinessKit[];
  competitions: ReadinessCompetition[];
  checklist: ReadinessCheckItem[];
}

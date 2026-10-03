export type FinanceView = "overview" | "collections" | "expenses" | "reports";

export type FinanceCapabilities = {
  allowed: boolean;
  roleCode: "R05" | "R06" | "";
  roleLabel: string;
  initialView: FinanceView;
  canViewOverview: boolean;
  canReadInvoices: boolean;
  canCreateInvoices: boolean;
  canRecordPayments: boolean;
  canReadExpenses: boolean;
  canManageExpenses: boolean;
  canReadReports: boolean;
};

const DENIED: FinanceCapabilities = {
  allowed: false,
  roleCode: "",
  roleLabel: "",
  initialView: "collections",
  canViewOverview: false,
  canReadInvoices: false,
  canCreateInvoices: false,
  canRecordPayments: false,
  canReadExpenses: false,
  canManageExpenses: false,
  canReadReports: false,
};

export function financeCapabilitiesForRole(
  role: string | null | undefined
): FinanceCapabilities {
  if (role === "R05_SECRETARY") {
    return {
      allowed: true,
      roleCode: "R05",
      roleLabel: "السكرتير",
      initialView: "collections",
      canViewOverview: false,
      canReadInvoices: true,
      canCreateInvoices: true,
      canRecordPayments: true,
      canReadExpenses: false,
      canManageExpenses: false,
      canReadReports: false,
    };
  }

  if (role === "R06_ACCOUNTANT") {
    return {
      allowed: true,
      roleCode: "R06",
      roleLabel: "المحاسب",
      initialView: "overview",
      canViewOverview: true,
      canReadInvoices: true,
      canCreateInvoices: true,
      canRecordPayments: true,
      canReadExpenses: true,
      canManageExpenses: true,
      canReadReports: true,
    };
  }

  return DENIED;
}

export function canAccessFinanceView(
  capabilities: FinanceCapabilities,
  view: FinanceView
): boolean {
  if (!capabilities.allowed) return false;
  if (view === "overview") return capabilities.canViewOverview;
  if (view === "collections") return capabilities.canReadInvoices;
  if (view === "expenses") return capabilities.canReadExpenses;
  return capabilities.canReadReports;
}

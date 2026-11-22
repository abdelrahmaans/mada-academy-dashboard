import type {
  ApprovalItem,
  ApprovalKind,
  ApprovalStatus,
} from "@/components/ApprovalCard";

const STORAGE_PREFIX = "mada_approvals_";

function getStorageKey(branchId: string, tenantId?: string): string {
  const t = tenantId || "default";
  const b = branchId || "main";
  return `${STORAGE_PREFIX}${t}_${b}`;
}

function getSafeLocalStorage() {
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function filterValidRequests(items: ApprovalItem[], tenantId?: string): ApprovalItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    if (tenantId && item.tenantId && item.tenantId !== tenantId) return false;
    // Purge legacy hardcoded demo requests
    if (item.id === "EVR-2026-001" || item.id === "EVR-2026-002") return false;
    if (item.kind === "evaluation" && (item.student === "آدم شريف حسن" || item.student === "ليلى أحمد محمود")) return false;
    return true;
  });
}

export const approvalsStorage = {
  load(branchId: string, tenantId?: string): ApprovalItem[] {
    const storage = getSafeLocalStorage();
    if (!storage) return [];

    const t = tenantId || "default";

    // If "ALL" branches requested, aggregate across all branch keys for this tenant
    if (branchId === "ALL" || !branchId) {
      const allItems: ApprovalItem[] = [];
      const prefix = `${STORAGE_PREFIX}${t}_`;
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(prefix)) {
            const raw = storage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                allItems.push(...parsed);
              }
            }
          }
        }
      } catch {
        // ignore
      }
      return filterValidRequests(allItems, tenantId);
    }

    const key = getStorageKey(branchId, tenantId);
    try {
      const stored = storage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return filterValidRequests(parsed, tenantId);
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  save(branchId: string, items: ApprovalItem[], tenantId?: string): void {
    const storage = getSafeLocalStorage();
    if (!storage) return;

    const key = getStorageKey(branchId, tenantId);
    try {
      storage.setItem(key, JSON.stringify(filterValidRequests(items, tenantId)));
    } catch {
      // ignore
    }
  },

  createRequest(
    branchId: string,
    data: {
      kind: ApprovalKind;
      title: string;
      summary: string;
      requestedBy: string;
      student?: string;
      course?: string;
      invoice?: string;
      discountType?: string;
      discountValue?: number;
      originalAmount?: number;
      finalAmount?: number;
      instructor?: string;
      substitute?: string;
      expenseDescription?: string;
      expenseAmount?: number;
      expenseCategory?: string;
      sessionDate?: string;
      sessionTime?: string;
      correctionCurrentAmount?: number;
      correctionProposedAmount?: number;
      correctionInvoice?: string;
      tenantId?: string;
      branchId?: string;
    },
    tenantId?: string
  ): ApprovalItem {
    const items = this.load(branchId, tenantId);
    const now = new Date();
    const timeFormatted = new Intl.DateTimeFormat("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);

    const newItem: ApprovalItem = {
      id: `APR-${Date.now().toString().slice(-4)}`,
      branch: branchId || "الفرع المصرح",
      branchId: data.branchId,
      tenantId: data.tenantId || tenantId,
      status: "pending",
      submittedAt: `اليوم · ${timeFormatted}`,
      submittedAtSort: now.toISOString(),
      ...data,
    };

    items.unshift(newItem);
    this.save(branchId, items, tenantId);
    return newItem;
  },

  decideRequest(
    branchId: string,
    id: string,
    status: "approved" | "rejected",
    decisionNote: string,
    decidedBy: string,
    tenantId?: string
  ): ApprovalItem | null {
    const items = this.load(branchId, tenantId);
    const item = items.find((req) => req.id === id);
    if (!item) return null;

    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now);

    item.status = status;
    item.decidedAt = dateFormatted;
    item.decidedAtSort = Date.now();
    item.decidedBy = decidedBy || "مدير الفرع";
    item.decisionNote = decisionNote;

    this.save(branchId, items, tenantId);
    return item;
  },

  deleteRequest(branchId: string, id: string, tenantId?: string): void {
    const items = this.load(branchId, tenantId);
    const filtered = items.filter((req) => req.id !== id);
    this.save(branchId, filtered, tenantId);
  },

  getPendingCount(branchId: string, tenantId?: string): number {
    const items = this.load(branchId, tenantId);
    return items.filter((req) => req.status === "pending").length;
  },
};

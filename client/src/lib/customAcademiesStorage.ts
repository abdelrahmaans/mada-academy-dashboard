import type { PlatformAcademy, AcademyBranch, BootstrapAcademyResponse } from "./apiClient";

const STORAGE_KEY = "mada_custom_academies";
const BRANCHES_KEY_PREFIX = "mada_branches_";
const OWNERS_KEY = "mada_custom_academy_owners";

export interface StoredAcademyOwner {
  id: string;
  tenantId: string;
  academyName: string;
  displayName: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
}

function safeGetItem(key: string): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore quota errors
  }
}

/**
 * Retrieve all custom academies saved in persistent storage.
 */
export function getStoredAcademies(): PlatformAcademy[] {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save an academy to persistent storage.
 */
export function storeCustomAcademy(
  academy: PlatformAcademy,
  primaryBranch?: { id?: string; name: string; code: string },
  owner?: { id?: string; displayName: string; phone: string; email: string; password?: string }
): void {
  const current = getStoredAcademies();
  const index = current.findIndex((item) => item.id === academy.id || item.slug === academy.slug);

  const updatedAcademy: PlatformAcademy = {
    ...academy,
    branches: academy.branches || 1,
    users: academy.users || 1,
    owner: owner?.displayName || academy.owner,
    ownerPhone: owner?.phone || academy.ownerPhone,
    ownerEmail: owner?.email || academy.ownerEmail,
    createdAt: academy.createdAt || new Date().toISOString(),
  };

  if (index >= 0) {
    current[index] = { ...current[index], ...updatedAcademy };
  } else {
    current.unshift(updatedAcademy);
  }

  safeSetItem(STORAGE_KEY, JSON.stringify(current));

  // Also persist the primary branch for this academy
  if (primaryBranch) {
    const branchId = primaryBranch.id || `br-${academy.id}-1`;
    const newBranch: AcademyBranch = {
      id: branchId,
      tenantId: academy.id,
      name: primaryBranch.name,
      code: primaryBranch.code.toUpperCase(),
      status: "ACTIVE",
      membersCount: 1,
      studentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    saveStoredBranch(academy.id, newBranch);
  }

  // Also persist the owner login credentials so they can log in even if backend recycled
  if (owner) {
    saveStoredOwner({
      id: owner.id || `usr-${academy.id}-owner`,
      tenantId: academy.id,
      academyName: academy.name,
      displayName: owner.displayName,
      email: owner.email,
      phone: owner.phone,
      password: owner.password,
      role: "R01_ACADEMY_OWNER",
    });
  }
}

/**
 * Update an existing stored academy.
 */
export function updateStoredAcademy(id: string, updates: Partial<PlatformAcademy>): void {
  const current = getStoredAcademies();
  const index = current.findIndex((item) => item.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updates };
    safeSetItem(STORAGE_KEY, JSON.stringify(current));
  } else {
    // If not in custom list yet, store it with updates so it persists
    current.unshift({
      id,
      name: updates.name || "أكاديمية جديدة",
      slug: updates.slug || `academy-${id.slice(0, 8)}`,
      status: updates.status || "ACTIVE",
      plan: updates.plan || updates.planCode || "GROWTH",
      planCode: updates.planCode || "growth",
      planName: updates.planName || "GROWTH",
      createdAt: new Date().toISOString(),
      branches: updates.branches || 1,
      users: updates.users || 1,
      owner: updates.owner !== undefined ? updates.owner : null,
      ...updates,
    });
    safeSetItem(STORAGE_KEY, JSON.stringify(current));
  }
}

/**
 * Delete an academy from persistent storage.
 */
export function deleteStoredAcademy(id: string): void {
  const current = getStoredAcademies();
  const filtered = current.filter((item) => item.id !== id);
  safeSetItem(STORAGE_KEY, JSON.stringify(filtered));

  try {
    localStorage.removeItem(`${BRANCHES_KEY_PREFIX}${id}`);
  } catch {}

  // Remove any deleted academy's owners
  const owners = getStoredOwners().filter((o) => o.tenantId !== id);
  safeSetItem(OWNERS_KEY, JSON.stringify(owners));

  // Mark in deleted tombstone list to prevent server resurrected items
  const tombstoneKey = "mada_deleted_academies_tombstones";
  const rawTombstones = safeGetItem(tombstoneKey);
  const tombstones: string[] = rawTombstones ? JSON.parse(rawTombstones) : [];
  if (!tombstones.includes(id)) {
    tombstones.push(id);
    safeSetItem(tombstoneKey, JSON.stringify(tombstones));
  }
}

/**
 * Merge backend academies list with persistent client academies.
 * Handles server recycling by retaining custom academies created by user.
 */
export function mergeAcademiesWithPersistent(serverAcademies: PlatformAcademy[]): PlatformAcademy[] {
  const stored = getStoredAcademies();
  const tombstoneKey = "mada_deleted_academies_tombstones";
  const rawTombstones = safeGetItem(tombstoneKey);
  const tombstones: string[] = rawTombstones ? JSON.parse(rawTombstones) : [];

  // Filter out any deleted tombstones from server list
  const validServerAcademies = serverAcademies.filter((s) => !tombstones.includes(s.id));

  const map = new Map<string, PlatformAcademy>();

  // 1. Put server academies first
  for (const s of validServerAcademies) {
    map.set(s.id, s);
  }

  // 2. Overlay / add stored custom academies
  for (const cust of stored) {
    if (tombstones.includes(cust.id)) continue;

    if (map.has(cust.id)) {
      // Merge: local updates (like status or plan change) take precedence if set
      const existing = map.get(cust.id)!;
      map.set(cust.id, {
        ...existing,
        ...cust,
        status: cust.status || existing.status,
        plan: cust.plan || existing.plan,
        planCode: cust.planCode || existing.planCode,
        allowedBranches: cust.allowedBranches ?? existing.allowedBranches,
        remainingTrialDays: cust.remainingTrialDays ?? existing.remainingTrialDays,
      });
    } else {
      // Academy was in local storage but server lost it (in-memory backend recycled)
      map.set(cust.id, cust);
    }
  }

  return Array.from(map.values());
}

/**
 * Branch persistence per academy.
 */
export function getStoredBranches(tenantId: string): AcademyBranch[] {
  const raw = safeGetItem(`${BRANCHES_KEY_PREFIX}${tenantId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredBranch(tenantId: string, branch: AcademyBranch): void {
  const current = getStoredBranches(tenantId);
  const index = current.findIndex((b) => b.id === branch.id);
  if (index >= 0) {
    current[index] = { ...current[index], ...branch };
  } else {
    current.push(branch);
  }
  safeSetItem(`${BRANCHES_KEY_PREFIX}${tenantId}`, JSON.stringify(current));
}

/**
 * Owner credentials persistence for offline / post-recycle fallback.
 */
export function getStoredOwners(): StoredAcademyOwner[] {
  const raw = safeGetItem(OWNERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredOwner(owner: StoredAcademyOwner): void {
  const current = getStoredOwners();
  const index = current.findIndex((o) => o.phone === owner.phone || o.id === owner.id);
  if (index >= 0) {
    current[index] = { ...current[index], ...owner };
  } else {
    current.push(owner);
  }
  safeSetItem(OWNERS_KEY, JSON.stringify(current));
}

export function findStoredOwnerByPhone(phone: string): StoredAcademyOwner | null {
  const normalized = phone.replace(/\s+/g, "");
  const owners = getStoredOwners();
  return owners.find((o) => o.phone.replace(/\s+/g, "") === normalized) || null;
}

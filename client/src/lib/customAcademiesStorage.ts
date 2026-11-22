import type { PlatformAcademy, AcademyBranch, BootstrapAcademyResponse } from "./apiClient";

const STORAGE_KEY = "mada_custom_academies";
const BRANCHES_KEY_PREFIX = "mada_branches_";
const OWNERS_KEY = "mada_custom_academy_owners";
const ACCOUNTS_KEY = "mada_stored_accounts_v1";

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

export interface StoredUserAccount {
  id: string;
  tenantId?: string;
  branchId?: string | null;
  academyName?: string;
  displayName: string;
  email?: string | null;
  phone: string;
  password?: string;
  role: string;
  accountType?: "staff" | "parent" | "student";
}

/**
 * Standardize Egyptian & international phone numbers for robust matching
 * (e.g. 01012345678 -> +201012345678)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = (phone || "").trim().replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  if (cleaned.startsWith("20") && !cleaned.startsWith("+20")) cleaned = "+" + cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = "+20" + cleaned.slice(1);
  return cleaned;
}

const DEFAULT_DEMO_ACCOUNTS: StoredUserAccount[] = [
  { id: "10000000-0000-0000-0000-000000000001", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000001", displayName: "أ. عبد الرحمن شريف", role: "R00_PLATFORM_ADMIN", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000002", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000002", displayName: "د. أحمد البشبيشي", role: "R01_ACADEMY_OWNER", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000003", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000003", displayName: "م. كريم الشناوي", role: "R02_BRANCH_MANAGER", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000004", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000004", displayName: "م. مريم حسن", role: "R03_HEAD_INSTRUCTORS", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000005", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000005", displayName: "أ. هبة محمود", role: "R05_SECRETARY", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000006", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000006", displayName: "أ. أحمد ممدوح", role: "R06_ACCOUNTANT", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000007", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000007", displayName: "أ. سلمى عادل", role: "R07_MEDIA_MANAGER", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000010", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000010", displayName: "ك. عمر سامح", role: "R04_INSTRUCTOR", password: "Mada@2026", accountType: "staff" },
  { id: "10000000-0000-0000-0000-000000000011", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000011", displayName: "م. أحمد كمال", role: "R08_PARENT", password: "Mada@2026", accountType: "parent" },
  { id: "10000000-0000-0000-0000-000000000012", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", phone: "+201000000012", displayName: "لينة عمر", role: "R09_STUDENT", password: "Mada@2026", accountType: "student" },
];

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
  const normalizedPhone = normalizePhoneNumber(owner.phone);
  const normalizedOwner = { ...owner, phone: normalizedPhone };
  const index = current.findIndex(
    (o) => normalizePhoneNumber(o.phone) === normalizedPhone || o.id === owner.id
  );
  if (index >= 0) {
    current[index] = { ...current[index], ...normalizedOwner };
  } else {
    current.push(normalizedOwner);
  }
  safeSetItem(OWNERS_KEY, JSON.stringify(current));

  // Also sync to global stored accounts
  saveStoredAccount({
    id: owner.id,
    tenantId: owner.tenantId,
    academyName: owner.academyName,
    displayName: owner.displayName,
    email: owner.email,
    phone: normalizedPhone,
    password: owner.password,
    role: owner.role || "R01_ACADEMY_OWNER",
    accountType: "staff",
  });
}

export function findStoredOwnerByPhone(phone: string): StoredAcademyOwner | null {
  const target = normalizePhoneNumber(phone);
  const owners = getStoredOwners();
  return owners.find((o) => normalizePhoneNumber(o.phone) === target) || null;
}

export function findStoredOwnerByTenantId(tenantId: string): StoredAcademyOwner | null {
  const owners = getStoredOwners();
  return owners.find((o) => o.tenantId === tenantId) || null;
}

export function updateStoredOwnerPassword(tenantId: string, newPassword: string): StoredAcademyOwner | null {
  const owners = getStoredOwners();
  const owner = owners.find((o) => o.tenantId === tenantId);
  if (owner) {
    owner.password = newPassword;
    saveStoredOwner(owner);
    return owner;
  }
  return null;
}

/**
 * Universal Stored Accounts (Staff, Owners, Managers, etc.) across recycles
 */
export function getStoredAccounts(): StoredUserAccount[] {
  const raw = safeGetItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredAccount(account: StoredUserAccount): void {
  const current = getStoredAccounts();
  const normalizedPhone = normalizePhoneNumber(account.phone);
  const normalizedAccount: StoredUserAccount = { ...account, phone: normalizedPhone };
  const index = current.findIndex(
    (a) => normalizePhoneNumber(a.phone) === normalizedPhone || a.id === account.id
  );
  if (index >= 0) {
    current[index] = { ...current[index], ...normalizedAccount };
  } else {
    current.push(normalizedAccount);
  }
  safeSetItem(ACCOUNTS_KEY, JSON.stringify(current));
}

export function findStoredAccountByPhone(phone: string, accountType?: string): StoredUserAccount | null {
  const target = normalizePhoneNumber(phone);
  const accounts = getStoredAccounts();

  // 1. Check custom saved accounts
  const match = accounts.find(
    (a) =>
      normalizePhoneNumber(a.phone) === target &&
      (!accountType || !a.accountType || a.accountType === accountType)
  );
  if (match) return match;

  // 2. Check stored academy owners
  const owner = findStoredOwnerByPhone(phone);
  if (owner && (!accountType || accountType === "staff")) {
    return {
      id: owner.id,
      tenantId: owner.tenantId,
      academyName: owner.academyName,
      displayName: owner.displayName,
      email: owner.email,
      phone: normalizePhoneNumber(owner.phone),
      password: owner.password,
      role: owner.role || "R01_ACADEMY_OWNER",
      accountType: "staff",
    };
  }

  // 3. Check default demo accounts
  const demo = DEFAULT_DEMO_ACCOUNTS.find(
    (d) =>
      normalizePhoneNumber(d.phone) === target &&
      (!accountType || !d.accountType || d.accountType === accountType)
  );
  if (demo) return demo;

  return null;
}

export function updateStoredAccountPassword(phoneOrTenantIdOrId: string, newPassword: string): void {
  const accounts = getStoredAccounts();
  const targetPhone = normalizePhoneNumber(phoneOrTenantIdOrId);
  let updated = false;

  for (const acc of accounts) {
    if (
      normalizePhoneNumber(acc.phone) === targetPhone ||
      acc.tenantId === phoneOrTenantIdOrId ||
      acc.id === phoneOrTenantIdOrId
    ) {
      acc.password = newPassword;
      updated = true;
    }
  }
  if (updated) {
    safeSetItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  // Also update stored owner if matching
  updateStoredOwnerPassword(phoneOrTenantIdOrId, newPassword);
}

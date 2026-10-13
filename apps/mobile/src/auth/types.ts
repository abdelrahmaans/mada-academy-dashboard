export type AccountType = "staff" | "parent" | "student";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type AuthIdentity = {
  id: string;
  accountType: AccountType;
  role: string;
  roleLabel?: string;
  tenantId: string;
  branchId?: string | null;
  scopeLevel: string;
  permissions: string[];
  user?: {
    id: string;
    displayName: string | null;
    email: string | null;
    phone: string;
  };
  academy?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    planCode: string;
  };
  branches?: { id: string; name: string; code: string; status: string }[];
};

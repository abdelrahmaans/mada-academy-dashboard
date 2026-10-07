export type AccountType = 'staff' | 'parent' | 'student';

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
}

export interface AuthMe {
  readonly id: string;
  readonly accountType: string;
  readonly role: string;
  readonly roleLabel?: string;
  readonly tenantId: string;
  readonly branchId?: string | null;
  readonly scopeLevel: string;
  readonly permissions?: readonly string[];
  readonly user?: {
    readonly id: string;
    readonly displayName: string | null;
    readonly email: string | null;
    readonly phone: string;
  };
  readonly academy?: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly status: string;
    readonly planCode: string;
  };
}

export interface ApiEnvelope<T> {
  readonly data: T;
}

export interface ApiProblem {
  readonly title?: string;
  readonly detail?: string;
  readonly extensions?: { readonly code?: string };
  readonly error?: { readonly message?: string; readonly code?: string };
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

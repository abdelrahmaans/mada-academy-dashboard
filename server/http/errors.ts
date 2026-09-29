export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export const unauthorized = (message = "Authentication required") => new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Insufficient permission") => new ApiError(403, "FORBIDDEN", message);
export const tenantLocked = () => new ApiError(403, "TENANT_LOCKED", "Tenant is read-only locked");
export const conflict = (code: string, message: string, details?: unknown) => new ApiError(409, code, message, details);

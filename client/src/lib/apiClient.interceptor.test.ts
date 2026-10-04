import { beforeEach, describe, expect, it, vi } from "vitest";

type Storage = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void };

const storageValues = new Map<string, string>();
const storage: Storage = {
  getItem: key => storageValues.get(key) ?? null,
  setItem: (key, value) => storageValues.set(key, value),
  removeItem: key => storageValues.delete(key),
};
vi.stubGlobal("localStorage", storage);

const { apiClient, subscribeApiErrors } = await import("./apiClient");

describe("api error interceptor", () => {
  beforeEach(() => {
    storageValues.clear();
    vi.restoreAllMocks();
  });

  it("emits a structured event for forbidden responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "Branch scope denied", error: { code: "FORBIDDEN_SCOPE" } }), { status: 403, headers: { "content-type": "application/json" } })));
    const events: Array<{ error: { status: number; code?: string }; path: string; method: string }> = [];
    const unsubscribe = subscribeApiErrors(event => events.push(event));

    await expect(apiClient.executiveSummary()).rejects.toMatchObject({ status: 403, code: "FORBIDDEN_SCOPE" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ path: "/academy/executive-summary", method: "GET", error: { status: 403, code: "FORBIDDEN_SCOPE" } });
    unsubscribe();
  });

  it("emits a structured event for server errors with the backend message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ title: "Database unavailable", extensions: { code: "REPORT_SOURCE_UNAVAILABLE" } }), { status: 500, headers: { "content-type": "application/json" } })));
    const events: Array<{ error: { status: number; code?: string; message: string }; path: string; method: string }> = [];
    const unsubscribe = subscribeApiErrors(event => events.push(event));

    await expect(apiClient.executiveSummary({ from: "2026-10-01", to: "2026-10-03" })).rejects.toMatchObject({ status: 500, code: "REPORT_SOURCE_UNAVAILABLE", message: "Database unavailable" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ path: "/academy/executive-summary?from=2026-10-01&to=2026-10-03", method: "GET", error: { status: 500, code: "REPORT_SOURCE_UNAVAILABLE" } });
    unsubscribe();
  });

  it("refreshes once after an expired access token before retrying the request", async () => {
    storageValues.set("mada.refreshToken", "refresh-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { accessToken: "new-access", refreshToken: "new-refresh" } }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { activeStudents: 2 } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.executiveSummary()).resolves.toMatchObject({ activeStudents: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(storageValues.get("mada.accessToken")).toBe("new-access");
  });

  it("turns a network failure into a structured API error event", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const events: Array<{ error: { status: number; message: string }; path: string; method: string }> = [];
    const unsubscribe = subscribeApiErrors(event => events.push(event));

    await expect(apiClient.executiveSummary()).rejects.toMatchObject({ status: 0, message: "Failed to fetch" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ path: "/academy/executive-summary", method: "GET", error: { status: 0 } });
    unsubscribe();
  });
});

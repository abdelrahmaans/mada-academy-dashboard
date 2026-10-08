import { describe, expect, it, vi } from "vitest";
import {
  buildExpenseMutation,
  buildInvoiceMutation,
  buildPaymentMutation,
  createSingleFlightGuard,
  runSingleFlightMutation,
} from "./financeMutations";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("finance mutation submission", () => {
  it("keeps a mutation pending and blocks duplicate calls until it settles", async () => {
    const guard = createSingleFlightGuard();
    const request = deferred<string>();
    const mutation = vi.fn(() => request.promise);
    const pending: boolean[] = [];

    const first = runSingleFlightMutation(guard, mutation, value =>
      pending.push(value)
    );

    expect(pending).toEqual([true]);
    expect(mutation).toHaveBeenCalledTimes(1);
    await expect(
      runSingleFlightMutation(guard, mutation, value => pending.push(value))
    ).resolves.toEqual({ started: false });
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(pending).toEqual([true]);

    request.resolve("saved");
    await expect(first).resolves.toEqual({ started: true, value: "saved" });
    expect(pending).toEqual([true, false]);
    expect(guard.tryAcquire()).toBe(true);
    guard.release();
  });

  it("releases pending state and allows retry when the API request fails", async () => {
    const guard = createSingleFlightGuard();
    const failure = new Error("API unavailable");
    const pending: boolean[] = [];

    await expect(
      runSingleFlightMutation(
        guard,
        () => Promise.reject(failure),
        value => pending.push(value)
      )
    ).rejects.toBe(failure);

    expect(pending).toEqual([true, false]);
    expect(guard.tryAcquire()).toBe(true);
    guard.release();
  });
});

describe("payment mutation builder", () => {
  it("builds an integer-piastres cash payment and trims an optional reference", () => {
    expect(
      buildPaymentMutation({
        amount: " 125.50 ",
        remaining: 200,
        method: "CASH",
        receivedOn: "2026-10-05",
        externalReference: "  REF-1  ",
      })
    ).toEqual({
      ok: true,
      input: {
        amountPiastres: 12550,
        method: "CASH",
        receivedOn: "2026-10-05",
        externalReference: "REF-1",
      },
    });
  });

  it.each(["", "0", "-1", "1.001", "21474836.48"]) (
    "rejects invalid payment amount %s",
    amount => {
      expect(
        buildPaymentMutation({
          amount,
          remaining: 100,
          method: "VISA",
          receivedOn: "2026-10-05",
          externalReference: "",
        })
      ).toEqual({ ok: false, code: "INVALID_AMOUNT" });
    }
  );

  it("compares payment and remaining balance in integer piastres", () => {
    expect(
      buildPaymentMutation({
        amount: "100.01",
        remaining: 100,
        method: "VISA",
        receivedOn: "2026-10-05",
        externalReference: "",
      })
    ).toEqual({ ok: false, code: "OVER_COLLECTION" });
    expect(
      buildPaymentMutation({
        amount: "100.00",
        remaining: 100,
        method: "VISA",
        receivedOn: "2026-10-05",
        externalReference: "",
      })
    ).toMatchObject({ ok: true, input: { amountPiastres: 10000 } });
  });

  it.each(["INSTAPAY", "VODAFONE_CASH"] as const)(
    "requires an external reference for %s",
    method => {
      expect(
        buildPaymentMutation({
          amount: "50",
          remaining: 100,
          method,
          receivedOn: "2026-10-05",
          externalReference: "  ",
        })
      ).toEqual({ ok: false, code: "MISSING_REFERENCE" });
    }
  );

  it("requires a received date", () => {
    expect(
      buildPaymentMutation({
        amount: "50",
        remaining: 100,
        method: "CASH",
        receivedOn: "",
        externalReference: "",
      })
    ).toEqual({ ok: false, code: "MISSING_DATE" });
  });
});

describe("expense mutation builder", () => {
  it("trims the description and converts the amount to integer piastres", () => {
    expect(buildExpenseMutation("  أدوات  ", "350.25")).toEqual({
      description: "أدوات",
      category: "OPERATIONS",
      amountPiastres: 35025,
    });
  });

  it.each([
    ["", "350"],
    ["   ", "350"],
    ["مستلزمات", "0"],
    ["مستلزمات", "-1"],
    ["مستلزمات", "10.001"],
  ])("rejects invalid expense (%s, %s)", (description, amount) => {
    expect(buildExpenseMutation(description, amount)).toBeNull();
  });
});

describe("invoice mutation builder", () => {
  it("builds a trimmed invoice payload with a precise piastres amount", () => {
    expect(
      buildInvoiceMutation(
        "student-1",
        "  رسوم شهرية ",
        "1200.35",
        "2026-10-12"
      )
    ).toEqual({
      studentId: "student-1",
      dueDate: "2026-10-12",
      lines: [{ description: "رسوم شهرية", amountPiastres: 120035 }],
    });
  });

  it.each([
    ["", "رسوم", "100", "2026-10-12"],
    ["student-1", "  ", "100", "2026-10-12"],
    ["student-1", "رسوم", "0", "2026-10-12"],
    ["student-1", "رسوم", "10.001", "2026-10-12"],
    ["student-1", "رسوم", "100", ""],
  ])("rejects incomplete invoice data", (studentId, description, amount, dueDate) => {
    expect(
      buildInvoiceMutation(studentId, description, amount, dueDate)
    ).toBeNull();
  });
});

export type FinancePaymentMethod =
  | "CASH"
  | "VISA"
  | "INSTAPAY"
  | "VODAFONE_CASH";

export type PaymentMutationInput = {
  amount: string;
  remaining: number;
  method: FinancePaymentMethod;
  receivedOn: string;
  externalReference: string;
};

export type PaymentMutationResult =
  | {
      ok: true;
      input: {
        amountPiastres: number;
        method: FinancePaymentMethod;
        receivedOn: string;
        externalReference?: string;
      };
    }
  | {
      ok: false;
      code:
        | "INVALID_AMOUNT"
        | "OVER_COLLECTION"
        | "MISSING_DATE"
        | "MISSING_REFERENCE";
    };

export function createSingleFlightGuard() {
  let inFlight = false;

  return {
    tryAcquire() {
      if (inFlight) return false;
      inFlight = true;
      return true;
    },
    release() {
      inFlight = false;
    },
  };
}

export type SingleFlightMutationResult<T> =
  | { started: false }
  | { started: true; value: T };

export async function runSingleFlightMutation<T>(
  guard: ReturnType<typeof createSingleFlightGuard>,
  mutation: () => Promise<T>,
  setPending: (pending: boolean) => void
): Promise<SingleFlightMutationResult<T>> {
  if (!guard.tryAcquire()) return { started: false };
  try {
    setPending(true);
    return { started: true, value: await mutation() };
  } finally {
    guard.release();
    setPending(false);
  }
}

const MAX_AMOUNT_PIASTRES = 2_147_483_647;

function parseAmountPiastres(amount: string): number | null {
  const normalized = amount.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return null;
  const [whole = "0", fraction = ""] = normalized.split(".");
  const piastres = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(piastres) && piastres > 0 && piastres <= MAX_AMOUNT_PIASTRES
    ? piastres
    : null;
}

export function buildPaymentMutation(
  input: PaymentMutationInput
): PaymentMutationResult {
  const amountPiastres = parseAmountPiastres(input.amount);
  const reference = input.externalReference.trim();
  if (amountPiastres === null) return { ok: false, code: "INVALID_AMOUNT" };
  if (amountPiastres > Math.round(input.remaining * 100)) {
    return { ok: false, code: "OVER_COLLECTION" };
  }
  if (!input.receivedOn) return { ok: false, code: "MISSING_DATE" };
  if (
    (input.method === "INSTAPAY" || input.method === "VODAFONE_CASH") &&
    !reference
  ) {
    return { ok: false, code: "MISSING_REFERENCE" };
  }
  return {
    ok: true,
    input: {
      amountPiastres,
      method: input.method,
      receivedOn: input.receivedOn,
      ...(reference ? { externalReference: reference } : {}),
    },
  };
}

export function buildExpenseMutation(description: string, amount: string) {
  const amountPiastres = parseAmountPiastres(amount);
  if (!description.trim() || amountPiastres === null) return null;
  return {
    description: description.trim(),
    category: "OPERATIONS",
    amountPiastres,
  };
}

export function buildInvoiceMutation(
  studentId: string,
  description: string,
  amount: string,
  dueDate: string
) {
  const amountPiastres = parseAmountPiastres(amount);
  if (
    !studentId ||
    !description.trim() ||
    amountPiastres === null ||
    !dueDate
  )
    return null;
  return {
    studentId,
    dueDate,
    lines: [
      { description: description.trim(), amountPiastres },
    ],
  };
}

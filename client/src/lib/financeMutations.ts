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

export function buildPaymentMutation(
  input: PaymentMutationInput
): PaymentMutationResult {
  const amount = Number(input.amount);
  const reference = input.externalReference.trim();
  if (!amount || amount <= 0) return { ok: false, code: "INVALID_AMOUNT" };
  if (amount > input.remaining) return { ok: false, code: "OVER_COLLECTION" };
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
      amountPiastres: amount * 100,
      method: input.method,
      receivedOn: input.receivedOn,
      ...(reference ? { externalReference: reference } : {}),
    },
  };
}

export function buildExpenseMutation(description: string, amount: string) {
  const numericAmount = Number(amount);
  if (!description.trim() || !numericAmount || numericAmount <= 0) return null;
  return {
    description: description.trim(),
    category: "OPERATIONS",
    amountPiastres: numericAmount * 100,
  };
}

export function buildInvoiceMutation(
  studentId: string,
  description: string,
  amount: string,
  dueDate: string
) {
  const numericAmount = Number(amount);
  if (
    !studentId ||
    !description.trim() ||
    !numericAmount ||
    numericAmount <= 0 ||
    !dueDate
  )
    return null;
  return {
    studentId,
    dueDate,
    lines: [
      { description: description.trim(), amountPiastres: numericAmount * 100 },
    ],
  };
}

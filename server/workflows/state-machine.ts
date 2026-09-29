import { conflict } from "../http/errors";

export type TransitionMap = Record<string, readonly string[]>;
export function assertTransition(machine: TransitionMap, from: string, to: string) {
  if (from === to) return;
  if (!machine[from]?.includes(to)) throw conflict("INVALID_STATE_TRANSITION", `Transition ${from} -> ${to} is not allowed`, { from, to, allowed: machine[from] ?? [] });
}

export const expenseTransitions: TransitionMap = { DRAFT: ["PENDING"], PENDING: ["APPROVED", "REJECTED", "ESCALATED"], ESCALATED: ["APPROVED", "REJECTED"], APPROVED: [], REJECTED: [] };
export const invoiceCorrectionTransitions: TransitionMap = { LOCKED: ["CORRECTION_PENDING"], CORRECTION_PENDING: ["APPROVED", "REJECTED"], APPROVED: ["COMPLETED"], REJECTED: [], COMPLETED: [] };
export const evaluationTransitions: TransitionMap = { DRAFT: ["SUBMITTED"], SUBMITTED: ["NEEDS_REVIEW"], NEEDS_REVIEW: ["APPROVED", "CHANGES_REQUESTED"], CHANGES_REQUESTED: ["SUBMITTED"], APPROVED: ["SHARED"], SHARED: [] };

import { apiClient } from "@/lib/apiClient";
import HeadInstructorsLive from "./HeadInstructorsLive";
import HeadInstructorsPreview from "./HeadInstructorsPreview";

export type {
  SessionStatus,
  EvaluationCardStatus,
  SessionRecord,
  EvaluationRecord,
} from "./HeadInstructorsPreview";

export default function HeadInstructors() {
  return apiClient.hasSession() ? (
    <HeadInstructorsLive />
  ) : (
    <HeadInstructorsPreview />
  );
}

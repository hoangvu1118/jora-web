import { RECOMMENDATION_STATUS_LABELS, labelFor } from "../utils/labels";

// Recommendation status as a small pill: New, Saved, Viewed.
export default function StatusPill({ status }) {
  let className = "status";
  if (status === "NEW") {
    className = "status new";
  } else if (status === "SAVED") {
    className = "status saved";
  }
  return <span className={className}>{labelFor(RECOMMENDATION_STATUS_LABELS, status)}</span>;
}

import { MATCH_REASON_LABELS, labelFor } from "../utils/labels";

// "Why it matches" chips from the backend's matchReason set.
export default function ReasonChips({ reasons }) {
  if (!reasons || reasons.length === 0) {
    return null;
  }
  return (
    <div className="reasons">
      {reasons.map(function (reason) {
        return <span className="reason" key={reason}>{labelFor(MATCH_REASON_LABELS, reason)}</span>;
      })}
    </div>
  );
}

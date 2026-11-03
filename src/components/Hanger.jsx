// The wooden hanger. Size it with CSS on the parent (for example .tail-pick .hanger).
export default function Hanger() {
  return (
    <svg className="hanger" viewBox="0 0 200 90" aria-hidden="true">
      <use href="#hanger" />
    </svg>
  );
}

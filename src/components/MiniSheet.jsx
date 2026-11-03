// A tiny CV drawn as bars, for places where real text would be too small to read.
export default function MiniSheet() {
  return (
    <span className="sheet" aria-hidden="true">
      <i></i>
      <i></i>
      <i className="hi"></i>
      <i></i>
      <i className="hi s"></i>
      <i></i>
    </span>
  );
}

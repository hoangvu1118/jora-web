// The title block at the top of every screen. `action` is an optional button on the right.
export default function PageHeader({ title, sub, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      {action}
    </div>
  );
}

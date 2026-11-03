import PageHeader from "./PageHeader";

// What a screen shows while its data loads, or when loading failed.
export function PageLoading({ title }) {
  return (
    <div className="page">
      <PageHeader title={title} sub="Loading…" />
      <span className="spinner" aria-label="Loading"></span>
    </div>
  );
}

export function PageError({ title, message, onRetry }) {
  return (
    <div className="page">
      <PageHeader title={title} sub="" />
      <div className="empty-state" role="alert">
        <h2>Couldn't load this page</h2>
        <p>{message}</p>
        <button className="btn line" type="button" onClick={onRetry}>Try again</button>
      </div>
    </div>
  );
}

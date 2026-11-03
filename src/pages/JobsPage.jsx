import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../api/recommendations";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import ReasonChips from "../components/ReasonChips";
import StatusPill from "../components/StatusPill";
import { EMPLOYMENT_TYPE_LABELS, WORKPLACE_LABELS, labelFor } from "../utils/labels";
import { formatClock, getNextCrawl, joinParts } from "../utils/format";

const PAGE_SIZE = 20;
const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "SAVED", label: "Saved" },
];

// Home: every match for the user's search profile (skipped ones are hidden).
export default function JobsPage() {
  // 1. State
  const [matches, setMatches] = useState([]);
  const [cursor, setCursor] = useState(null); // { lastScore, lastId } for the next page, or null
  const [filter, setFilter] = useState("ALL");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 2. Load the first page once
  useEffect(function () {
    loadFirstPage();
  }, []);

  // 3. Handlers
  async function loadFirstPage() {
    setStatus("loading");
    try {
      const page = await getRecommendations(null, PAGE_SIZE);
      setMatches(page.items);
      setCursor(cursorOf(page));
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  async function loadMore() {
    setIsLoadingMore(true);
    try {
      const page = await getRecommendations(cursor, PAGE_SIZE);
      setMatches([...matches, ...page.items]);
      setCursor(cursorOf(page));
    } catch (error) {
      setErrorMessage(error.message);
    }
    setIsLoadingMore(false);
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="Jobs" />;
  }
  if (status === "error") {
    return <PageError title="Jobs" message={errorMessage} onRetry={loadFirstPage} />;
  }

  const visible = matchesNotSkipped(matches);
  const newCount = countWithStatus(visible, "NEW");
  const savedCount = countWithStatus(visible, "SAVED");
  const shown = applyFilter(visible, filter);

  let swipeButton = null;
  if (newCount > 0) {
    let swipeLabel = "Swipe " + newCount + " new matches";
    if (newCount === 1) {
      swipeLabel = "Swipe 1 new match";
    }
    swipeButton = (
      <Link className="btn sage" to="/suggested">
        {swipeLabel}
        <Icon name="right" />
      </Link>
    );
  }

  let list;
  if (visible.length === 0) {
    const nextCrawl = formatClock(getNextCrawl(new Date()));
    list = (
      <div className="empty-state">
        <h2>No matches yet</h2>
        <p>The next check runs at {nextCrawl}. If nothing comes up, try adding more job titles to your search profile.</p>
        <Link className="btn line" to="/profile">Edit search profile</Link>
      </div>
    );
  } else {
    // Column names, so the user knows what each part of a row means.
    // Hidden on phones, where the parts of a row stack instead of lining up.
    list = (
      <>
        <div className="joblist-head" aria-hidden="true">
          <span>Job</span>
          <span>Why it matches</span>
          <span>Status</span>
        </div>
        <div className="joblist">
          {shown.map(function (match) {
            return <JobRow key={match.id} match={match} />;
          })}
        </div>
      </>
    );
  }

  let moreButton = null;
  if (cursor !== null) {
    let moreLabel = "Show more";
    if (isLoadingMore) {
      moreLabel = "Loading…";
    }
    moreButton = (
      <div className="more">
        <button className="btn line" type="button" onClick={loadMore} disabled={isLoadingMore} aria-busy={isLoadingMore}>{moreLabel}</button>
      </div>
    );
  }

  // 5. Render
  return (
    <div className="page">
      <PageHeader title="Jobs" sub="Every job that matches your search profile." action={swipeButton} />
      <div className="filters">
        {FILTERS.map(function (option) {
          let count = visible.length;
          if (option.value === "NEW") {
            count = newCount;
          } else if (option.value === "SAVED") {
            count = savedCount;
          }
          return (
            <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={function () { setFilter(option.value); }}>
              {option.label} <b>{count}</b>
            </button>
          );
        })}
      </div>
      {list}
      {moreButton}
    </div>
  );
}

function JobRow({ match }) {
  const job = match.job;
  const place = joinParts([
    job.location,
    labelFor(WORKPLACE_LABELS, job.workplaceType),
    labelFor(EMPLOYMENT_TYPE_LABELS, job.employmentType),
  ]);
  // The detail page gets the match id in the address (for Save / Skip),
  // plus the status and reasons we already know, so it doesn't load them again.
  return (
    <Link
      className="jobrow"
      to={"/jobs/" + job.id + "?match=" + match.id}
      state={{ matchStatus: match.recommendationStatus, reasons: match.matchReason }}
    >
      <div>
        <h2>{job.title}</h2>
        <p className="meta"><b>{job.companyName}</b> · {place}</p>
      </div>
      <ReasonChips reasons={match.matchReason} />
      <StatusPill status={match.recommendationStatus} />
    </Link>
  );
}

// ---------- small helpers ----------

function cursorOf(page) {
  if (!page.hasNext) {
    return null;
  }
  return { lastScore: page.lastScore, lastId: page.lastId };
}

function matchesNotSkipped(matches) {
  const result = [];
  for (const match of matches) {
    if (match.recommendationStatus !== "DISMISSED") {
      result.push(match);
    }
  }
  return result;
}

function countWithStatus(matches, status) {
  let count = 0;
  for (const match of matches) {
    if (match.recommendationStatus === status) {
      count = count + 1;
    }
  }
  return count;
}

function applyFilter(matches, filter) {
  if (filter === "ALL") {
    return matches;
  }
  const result = [];
  for (const match of matches) {
    if (match.recommendationStatus === filter) {
      result.push(match);
    }
  }
  return result;
}

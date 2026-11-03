import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { setRecommendationStatus } from "../api/recommendations";
import { getCurrentResume, tailorResume } from "../api/resume";
import { EMPLOYMENT_TYPE_LABELS, LEVEL_LABELS, WORKPLACE_LABELS, labelFor } from "../utils/labels";
import { formatClock, getNextCrawl, joinParts } from "../utils/format";
import Hanger from "./Hanger";
import Icon from "./Icon";
import MiniSheet from "./MiniSheet";
import ReasonChips from "./ReasonChips";

const SWIPE_THRESHOLD = 100; // pixels a card must travel to count as a swipe
const VISIBLE_CARDS = 3;
const LEAVE_MS = 260; // matches .card.flying in app.css
const TOAST_MS = 5000;

// The swipe deck. `matches` are the NEW recommendations, best first.
export default function SwipeDeck({ matches, head }) {
  // 1. State
  const [index, setIndex] = useState(0); // the front card is matches[index]
  const [history, setHistory] = useState([]); // [{ match, direction }] for undo
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [leaving, setLeaving] = useState(null); // { match, direction, fromX } while a card flies away
  const [returningId, setReturningId] = useState(null); // the card that comes back after undo
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredToday, setTailoredToday] = useState([]); // [{ id, companyName }]
  const [toast, setToast] = useState(null); // { text, actionLabel, onAction, link }
  const [announcement, setAnnouncement] = useState("");

  const dragStart = useRef(null);
  const toastTimer = useRef(null);

  const front = matches[index];
  const hasFront = front !== undefined;

  // 2. Keyboard: ← skip, → save, Z undo, T tailor, while the deck is on screen.
  // The listener reads the newest handlers through a ref, so it never uses old state.
  const handlers = useRef({});
  handlers.current = { decide: decide, undo: undo, tailor: tailor };
  useEffect(function () {
    function handleKey(event) {
      if (event.target.closest("input, textarea, select")) {
        return;
      }
      if (event.key === "ArrowRight") {
        handlers.current.decide(1);
      } else if (event.key === "ArrowLeft") {
        handlers.current.decide(-1);
      } else if (event.key === "z" || event.key === "Z") {
        handlers.current.undo();
      } else if (event.key === "t" || event.key === "T") {
        handlers.current.tailor();
      }
    }
    document.addEventListener("keydown", handleKey);
    return function () {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(toastTimer.current);
    };
  }, []);

  // 3. Actions
  // direction: 1 = save (right), -1 = skip (left). fromX: where a dragged card was let go.
  function decide(direction, fromX = 0) {
    if (!hasFront || leaving !== null) {
      return;
    }
    const match = front;
    let newStatus = "DISMISSED";
    let verb = "Skipped";
    if (direction > 0) {
      newStatus = "SAVED";
      verb = "Saved";
      setSavedCount(savedCount + 1);
    } else {
      setSkippedCount(skippedCount + 1);
    }
    setLeaving({ match: match, direction: direction, fromX: fromX });
    setHistory([...history, { match: match, direction: direction }]);
    setIndex(index + 1);
    setDragX(0);
    setReturningId(null);
    setTimeout(function () { setLeaving(null); }, LEAVE_MS);

    setAnnouncement(verb + " " + match.job.title + " at " + match.job.companyName);
    // The toast calls the newest undo (through the ref), not the one from this moment.
    showToast({ text: verb + " " + match.job.companyName, actionLabel: "Undo", onAction: function () { handlers.current.undo(); } });
    setRecommendationStatus(match.id, newStatus).catch(function () {
      showToast({ text: "Couldn't update " + match.job.companyName + ". Check your connection." });
    });
  }

  function undo() {
    if (history.length === 0 || leaving !== null) {
      return;
    }
    const last = history[history.length - 1];
    setHistory(history.slice(0, history.length - 1));
    setIndex(index - 1);
    if (last.direction > 0) {
      setSavedCount(savedCount - 1);
    } else {
      setSkippedCount(skippedCount - 1);
    }
    setReturningId(last.match.id);
    hideToast();
    setAnnouncement("Brought back " + last.match.job.companyName);
    setRecommendationStatus(last.match.id, "NEW").catch(function () {
      // The card is back on screen; the next swipe will set its status again.
    });
  }

  async function tailor() {
    if (!hasFront || isTailoring) {
      return;
    }
    const match = front;
    setIsTailoring(true);
    setAnnouncement("Tailoring your CV for " + match.job.companyName);
    try {
      const resume = await getCurrentResume();
      if (resume === null) {
        showToast({ text: "Upload your CV first", actionLabel: "Upload", link: "/resume" });
      } else {
        const version = await tailorResume(resume.id, match.job.id);
        const newItem = { id: version.id, companyName: match.job.companyName };
        setTailoredToday(function (current) {
          return [...current, newItem].slice(-3); // the rail holds the last three
        });
        showToast({ text: "Tailored CV for " + match.job.companyName + " is ready", actionLabel: "View", link: "/tailored?version=" + version.id });
        setAnnouncement("Tailored CV for " + match.job.companyName + " is ready");
      }
    } catch (error) {
      showToast({ text: error.message });
    }
    setIsTailoring(false);
  }

  function showToast(newToast) {
    setToast(newToast);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(hideToast, TOAST_MS);
  }

  function hideToast() {
    setToast(null);
  }

  // 4. Dragging the front card
  function handlePointerDown(event) {
    // Let links inside the card work as normal links.
    if (leaving !== null || event.target.closest("a")) {
      return;
    }
    dragStart.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isDragging) {
      return;
    }
    setDragX(event.clientX - dragStart.current);
  }

  function handlePointerUp() {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    if (dragX > SWIPE_THRESHOLD) {
      decide(1, dragX);
    } else if (dragX < -SWIPE_THRESHOLD) {
      decide(-1, dragX);
    } else {
      setDragX(0); // not far enough: spring back
    }
  }

  // 5. Decide what to show
  const left = matches.length - index;
  const behind = matches.slice(index + 1, index + VISIBLE_CARDS); // empty shells behind the front card

  let stackContent;
  if (hasFront) {
    stackContent = (
      <>
        {behind.slice().reverse().map(function (match, position) {
          const depth = behind.length - position;
          return <div key={match.id} className={"card depth-" + depth} aria-hidden="true"></div>;
        })}
        <FrontCard
          match={front}
          dragX={dragX}
          isDragging={isDragging}
          isReturning={returningId === front.id}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </>
    );
  } else {
    stackContent = (
      <div className="deck-empty">
        <h3>You're all caught up.</h3>
        <p>New matches arrive after the next check at {formatClock(getNextCrawl(new Date()))}.</p>
        <Link className="btn line" to="/jobs">See all jobs</Link>
      </div>
    );
  }

  let leavingCard = null;
  if (leaving !== null) {
    leavingCard = <LeavingCard match={leaving.match} direction={leaving.direction} fromX={leaving.fromX} />;
  }

  let tailorLabel = "Tailor my CV";
  if (isTailoring) {
    tailorLabel = "Tailoring…";
  }

  let deckClass = "deck";
  if (!hasFront) {
    deckClass = "deck is-empty";
  }

  // 6. Render
  return (
    <div className={deckClass} aria-label="Suggested jobs. Right arrow saves, left arrow skips, Z undoes.">
      <div className="deck-main">
        <div className="deck-head">
          {head}
          <p className="tally">{left} left · {savedCount} saved</p>
        </div>
        <div className="stack">
          {stackContent}
          {leavingCard}
        </div>
        <div className="deck-foot">
          <div className="controls">
            <button className="btn skip" type="button" onClick={function () { decide(-1); }} disabled={!hasFront}><Icon name="x" />Skip</button>
            <button className="btn sage" type="button" onClick={tailor} disabled={!hasFront || isTailoring} aria-busy={isTailoring}>
              {isTailoring && <span className="spinner" aria-hidden="true"></span>}
              {tailorLabel}
            </button>
            <button className="btn dark" type="button" onClick={function () { decide(1); }} disabled={!hasFront}>Save<Icon name="check" /></button>
          </div>
          <p className="keys">Keys: <kbd>←</kbd> skip · <kbd>→</kbd> save · <kbd>Z</kbd> undo · <kbd>T</kbd> tailor</p>
          <Toast toast={toast} />
        </div>
      </div>

      <aside className="deck-side">
        <div className="counts" aria-live="polite">
          <h2 className="eyelabel">Today</h2>
          <div className="count"><span>Left to review</span><b>{left}</b></div>
          <div className="count"><span>Saved</span><b>{savedCount}</b></div>
          <div className="count"><span>Skipped</span><b>{skippedCount}</b></div>
        </div>
        <div>
          <h2 className="eyelabel">Tailored today</h2>
          <div className="minirack">
            <div className="rail"></div>
            {tailoredToday.length === 0 && <p className="empty-note">Tap Tailor my CV and the new copy hangs here.</p>}
            <div className="minirack-row">
              {tailoredToday.map(function (item) {
                return (
                  <Link className="mini-hang" key={item.id} to={"/tailored?version=" + item.id}>
                    <span className="swing"><Hanger /><MiniSheet /></span>
                    <span className="co">{item.companyName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}

// ---------- pieces of the deck ----------

function CardContent({ match }) {
  const job = match.job;
  return (
    <>
      <span className="stamp stamp-save" aria-hidden="true"></span>
      <span className="stamp stamp-skip" aria-hidden="true"></span>
      <div className="card-top"><b>{job.companyName}</b><span>{labelFor(LEVEL_LABELS, job.level)}</span></div>
      <h2>{job.title}</h2>
      <p className="meta">{joinParts([job.location, labelFor(WORKPLACE_LABELS, job.workplaceType), labelFor(EMPLOYMENT_TYPE_LABELS, job.employmentType)])}</p>
      <p className="blurb"><Link to={"/jobs/" + job.id + "?match=" + match.id} state={{ matchStatus: "NEW", reasons: match.matchReason }}>Read the full job</Link></p>
      <div className="why">
        <span className="eyelabel">Why it matches</span>
        <ReasonChips reasons={match.matchReason} />
      </div>
    </>
  );
}

function FrontCard({ match, dragX, isDragging, isReturning, onPointerDown, onPointerMove, onPointerUp }) {
  // The further the card is dragged, the stronger the Saved / Skipped stamp shows.
  const strength = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  let saveStrength = 0;
  let skipStrength = 0;
  if (dragX > 0) {
    saveStrength = strength;
  } else if (dragX < 0) {
    skipStrength = strength;
  }

  let className = "card depth-0";
  if (isDragging) {
    className = className + " dragging";
  }
  if (isReturning) {
    className = className + " returning";
  }

  let transform = "";
  if (dragX !== 0) {
    transform = "translate(" + dragX + "px, 0) rotate(" + dragX / 18 + "deg)";
  }

  return (
    <article
      className={className}
      data-filled="yes"
      aria-label={match.job.title + " at " + match.job.companyName}
      style={{ transform: transform, "--save": saveStrength, "--skip": skipStrength }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CardContent match={match} />
    </article>
  );
}

// A copy of the card that flies off screen after a decision (animation: .card.flying in app.css).
// It starts where the card was let go (fromX) and ends off screen on the chosen side.
function LeavingCard({ match, direction, fromX }) {
  let save = 0;
  let skip = 0;
  if (direction > 0) {
    save = 1;
  } else {
    skip = 1;
  }
  const from = "translate(" + fromX + "px, 0) rotate(" + fromX / 18 + "deg)";
  return (
    <article className="card depth-0 flying" data-filled="yes" aria-hidden="true" style={{ "--from": from, "--dir": direction, "--save": save, "--skip": skip }}>
      <CardContent match={match} />
    </article>
  );
}

function Toast({ toast }) {
  if (toast === null) {
    return <div className="toast" role="status"></div>;
  }
  let action = null;
  if (toast.link) {
    action = <Link to={toast.link}>{toast.actionLabel}</Link>;
  } else if (toast.onAction) {
    action = <button type="button" onClick={toast.onAction}>{toast.actionLabel}</button>;
  }
  return (
    <div className="toast show" role="status">
      <span>{toast.text}</span>
      {action}
    </div>
  );
}

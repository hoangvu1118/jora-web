import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCurrentResume, getTailoredVersions, getVersion, markVersionFinal, updateVersionContent } from "../api/resume";
import Hanger from "../components/Hanger";
import MiniSheet from "../components/MiniSheet";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import ResumeDocument from "../components/ResumeDocument";
import ResumeEditor from "../components/ResumeEditor";
import { useTailorQueue } from "../tailor/TailorQueue";
import { findChangedBullets } from "../utils/resumeDiff";
import { formatDay } from "../utils/format";

const TITLE = "Tailored CVs";
const SUB = "Every job you save gets its own copy, made from your base CV.";
const HANGERS_PER_RAIL = 2;

export default function TailoredPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. State
  const [resume, setResume] = useState(null); // gives us the resume id and the base CV for comparing
  const [versions, setVersions] = useState([]); // the hangers: [{ id, status, jobId, jobTitle, companyName, createdAt }]
  const [openVersion, setOpenVersion] = useState(null); // the CV on screen: { id, status, content }
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [showChanges, setShowChanges] = useState(true);
  const [isConfirmingFinal, setIsConfirmingFinal] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("idle"); // idle | saving | error
  const [editError, setEditError] = useState("");

  // Saved jobs whose CV is still being made (or failed) show on the rail too.
  const tailorQueue = useTailorQueue();
  const pendingJobs = jobsWithStatus(tailorQueue.jobs, ["waiting", "working"]);
  const failedJobs = jobsWithStatus(tailorQueue.jobs, ["failed"]);
  const doneCount = jobsWithStatus(tailorQueue.jobs, ["done"]).length;

  // The picked hanger lives in the address (?version=12), so links can open a specific CV.
  const pickedId = Number(searchParams.get("version"));

  // 2. Load the list once, and the CV whenever the picked hanger changes
  useEffect(function () {
    loadList();
  }, []);

  useEffect(function () {
    if (resume !== null && pickedId) {
      loadVersion(pickedId);
    }
  }, [resume, pickedId]);

  // Each time a saved job's CV is ready, fetch the list again so its hanger appears.
  useEffect(function () {
    if (resume !== null && doneCount > 0) {
      refreshList(resume.id);
    }
  }, [doneCount]);

  // 3. Handlers
  async function loadList() {
    setStatus("loading");
    try {
      const current = await getCurrentResume();
      setResume(current);
      if (current === null) {
        setStatus("ready");
        return;
      }
      await refreshList(current.id);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  // Fetches the hangers again, without the loading screen.
  async function refreshList(resumeId) {
    const list = await getTailoredVersions(resumeId);
    setVersions(list);
    // Nothing picked yet: open the newest copy.
    if (!pickedId && list.length > 0) {
      setSearchParams({ version: String(list[0].id) }, { replace: true });
    }
  }

  async function loadVersion(versionId) {
    setIsConfirmingFinal(false);
    setIsEditing(false);
    setActionError("");
    try {
      const version = await getVersion(resume.id, versionId);
      setOpenVersion(version);
    } catch (error) {
      setActionError(error.message);
    }
  }

  function pickVersion(versionId) {
    setSearchParams({ version: String(versionId) });
  }

  async function confirmFinal() {
    try {
      const updated = await markVersionFinal(resume.id, openVersion.id);
      setOpenVersion(updated);
      // Update the hanger's status too.
      const newList = [];
      for (const item of versions) {
        if (item.id === updated.id) {
          newList.push({ ...item, status: "FINAL" });
        } else {
          newList.push(item);
        }
      }
      setVersions(newList);
      setIsConfirmingFinal(false);
    } catch (error) {
      setActionError(error.message);
    }
  }

  function startEditing() {
    setIsConfirmingFinal(false);
    setEditStatus("idle");
    setEditError("");
    setIsEditing(true);
  }

  async function saveEdit(newContent) {
    setEditStatus("saving");
    try {
      const updated = await updateVersionContent(resume.id, openVersion.id, newContent);
      setOpenVersion(updated);
      setIsEditing(false);
      setEditStatus("idle");
    } catch (error) {
      setEditError(error.message);
      setEditStatus("error");
    }
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title={TITLE} />;
  }
  if (status === "error") {
    return <PageError title={TITLE} message={errorMessage} onRetry={loadList} />;
  }
  if (resume === null) {
    return (
      <EmptyRail
        title="Upload your CV first"
        text="Tailored copies are made from your base CV."
        action={<Link className="btn line" to="/resume">Upload my CV</Link>}
      />
    );
  }
  if (versions.length === 0 && pendingJobs.length === 0 && failedJobs.length === 0) {
    return (
      <EmptyRail
        title="Your rail is empty"
        text="Save a job from Suggested or from a job page. Jora tailors your CV for it, and the copy hangs here."
        action={<Link className="btn line" to="/suggested">Review suggested jobs</Link>}
      />
    );
  }

  const picked = findById(versions, pickedId);

  let documentArea = <span className="spinner" aria-label="Loading CV"></span>;
  if (versions.length === 0) {
    documentArea = <p className="empty-note">Your first tailored CV is on its way. It opens here when it's ready.</p>;
  } else if (picked !== null && openVersion !== null && openVersion.id === picked.id) {
    documentArea = (
      <OpenCv
        picked={picked}
        version={openVersion}
        baseContent={resume.baseVersion && resume.baseVersion.content}
        showChanges={showChanges}
        onToggleChanges={function () { setShowChanges(!showChanges); }}
        isConfirmingFinal={isConfirmingFinal}
        onAskFinal={function () { setIsConfirmingFinal(true); }}
        onCancelFinal={function () { setIsConfirmingFinal(false); }}
        onConfirmFinal={confirmFinal}
        isEditing={isEditing}
        onEdit={startEditing}
        onCancelEdit={function () { setIsEditing(false); }}
        onSaveEdit={saveEdit}
        isSaving={editStatus === "saving"}
        editError={editError}
      />
    );
  }

  // The wardrobe: CVs still being made first, then the finished ones, two hangers per rail.
  const hangers = [];
  for (const job of pendingJobs) {
    hangers.push({ kind: "pending", key: "pending-" + job.jobId, job: job });
  }
  for (const item of versions) {
    hangers.push({ kind: "version", key: "version-" + item.id, item: item });
  }
  const rails = splitIntoRails(hangers, HANGERS_PER_RAIL);

  // 5. Render
  return (
    <div className="page">
      <PageHeader title={TITLE} sub={SUB} />
      <div className="tail-layout">
        <nav className="wardrobe" aria-label="Pick a tailored CV">
          {rails.map(function (rail, railIndex) {
            return (
              <div className="wardrobe-rail" key={railIndex}>
                <div className="rail"></div>
                <div className="wardrobe-row">
                  {rail.map(function (hanger) {
                    return <WardrobeHanger key={hanger.key} hanger={hanger} pickedId={pickedId} onPick={pickVersion} />;
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <section className="tail-main">
          {failedJobs.length > 0 && (
            <div className="tail-failed" role="alert">
              {failedJobs.map(function (job) {
                return (
                  <p key={job.jobId}>
                    <span className="err">Couldn't tailor your CV for {job.companyName}. {job.message}</span>
                    <button className="btn line" type="button" onClick={function () { tailorQueue.retryJob(job.jobId); }}>Try again</button>
                  </p>
                );
              })}
            </div>
          )}
          {actionError !== "" && <p className="err" role="alert">{actionError}</p>}
          {documentArea}
        </section>
      </div>
    </div>
  );
}

// One hanger in the wardrobe: a CV still being made, or a finished CV you can open.
function WardrobeHanger({ hanger, pickedId, onPick }) {
  if (hanger.kind === "pending") {
    const job = hanger.job;
    return (
      <div className="tail-pick is-pending" role="status">
        <span className="swing"><Hanger /><MiniSheet /></span>
        <span className="jobtag">{job.jobTitle} · {job.companyName}</span>
        <small><span className="spinner" aria-hidden="true"></span>Tailoring…</small>
      </div>
    );
  }
  const item = hanger.item;
  return (
    <button className="tail-pick" type="button" aria-pressed={item.id === pickedId} onClick={function () { onPick(item.id); }}>
      <span className="swing"><Hanger /><MiniSheet /></span>
      <span className="jobtag">{item.jobTitle} · {item.companyName}</span>
      <small>{formatDay(item.createdAt)}</small>
    </button>
  );
}

// A DRAFT can be edited (the same copy is overwritten). A FINAL copy is locked.
function OpenCv({ picked, version, baseContent, showChanges, onToggleChanges, isConfirmingFinal, onAskFinal, onCancelFinal, onConfirmFinal, isEditing, onEdit, onCancelEdit, onSaveEdit, isSaving, editError }) {
  const isFinal = version.status === "FINAL";

  let statusPill = <span className="status draft">Draft</span>;
  let editButton = <button className="btn line" type="button" onClick={onEdit}>Edit</button>;
  let finalButton = <button className="btn dark" type="button" onClick={onAskFinal}>Mark as final</button>;
  if (isFinal) {
    statusPill = <span className="status final">Final</span>;
    editButton = null;
    finalButton = null;
  }
  if (isConfirmingFinal || isEditing) {
    editButton = null;
    finalButton = null;
  }

  let changedBullets = null;
  if (showChanges) {
    changedBullets = findChangedBullets(baseContent, version.content);
  }

  let documentBody = (
    <article className="doc">
      <ResumeDocument content={version.content} changedBullets={changedBullets} />
    </article>
  );
  if (isEditing) {
    documentBody = (
      <ResumeEditor content={version.content} isSaving={isSaving} errorMessage={editError} onSave={onSaveEdit} onCancel={onCancelEdit} />
    );
  }

  return (
    <>
      <div className="doc-head">
        <div>
          <h2 className="doc-title">{picked.jobTitle} · {picked.companyName}</h2>
          <p className="doc-meta">{statusPill}<span>Made {formatDay(picked.createdAt)} from your base CV</span></p>
        </div>
        <div className="doc-tools">
          <button className="switch" type="button" role="switch" aria-checked={showChanges} onClick={onToggleChanges}>
            <i aria-hidden="true"></i>Highlight changes
          </button>
          <Link className="btn line" to={"/jobs/" + picked.jobId}>Open job</Link>
          {editButton}
          {finalButton}
        </div>
      </div>
      {isFinal && <p className="locked-note">This copy is final, so it is locked and stays exactly as it is.</p>}
      {isConfirmingFinal && (
        <div className="inline-confirm doc-confirm show" role="alert">
          A final copy is locked and can't be changed.
          <button className="btn dark" type="button" onClick={onConfirmFinal}>Mark as final</button>
          <button className="btn quiet" type="button" onClick={onCancelFinal}>Cancel</button>
        </div>
      )}
      {documentBody}
    </>
  );
}

function EmptyRail({ title, text, action }) {
  return (
    <div className="page">
      <PageHeader title={TITLE} sub={SUB} />
      <div className="tail-rack flat"><div className="rail"></div></div>
      <div className="empty-state flat">
        <h2>{title}</h2>
        <p>{text}</p>
        {action}
      </div>
    </div>
  );
}

// [a, b, c, d, e] with size 2 -> [[a, b], [c, d], [e]]
function splitIntoRails(hangers, size) {
  const rails = [];
  let current = [];
  for (const hanger of hangers) {
    current.push(hanger);
    if (current.length === size) {
      rails.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    rails.push(current);
  }
  return rails;
}

function jobsWithStatus(jobs, statuses) {
  const found = [];
  for (const job of jobs) {
    if (statuses.includes(job.status)) {
      found.push(job);
    }
  }
  return found;
}

function findById(items, id) {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCurrentResume, getTailoredVersions, getVersion, markVersionFinal } from "../api/resume";
import Hanger from "../components/Hanger";
import MiniSheet from "../components/MiniSheet";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import ResumeDocument from "../components/ResumeDocument";
import { findChangedBullets } from "../utils/resumeDiff";
import { formatDay } from "../utils/format";

const TITLE = "Tailored CVs";
const SUB = "One copy per job, each made from your base CV.";

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
      const list = await getTailoredVersions(current.id);
      setVersions(list);
      // Nothing picked yet: open the newest copy.
      if (!pickedId && list.length > 0) {
        setSearchParams({ version: String(list[0].id) }, { replace: true });
      }
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  async function loadVersion(versionId) {
    setIsConfirmingFinal(false);
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
  if (versions.length === 0) {
    return (
      <EmptyRail
        title="Your rail is empty"
        text="Open any job and press Tailor my CV. The new copy hangs here."
        action={<Link className="btn line" to="/jobs">Browse jobs</Link>}
      />
    );
  }

  const picked = findById(versions, pickedId);

  let documentArea = <span className="spinner" aria-label="Loading CV"></span>;
  if (picked !== null && openVersion !== null && openVersion.id === picked.id) {
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
      />
    );
  }

  // 5. Render
  return (
    <div className="page">
      <PageHeader title={TITLE} sub={SUB} />
      <div className="tail-rack">
        <div className="rail"></div>
        <div className="tail-row" aria-label="Pick a tailored CV">
          {versions.map(function (item) {
            return (
              <button key={item.id} className="tail-pick" type="button" aria-pressed={item.id === pickedId} onClick={function () { pickVersion(item.id); }}>
                <span className="swing"><Hanger /><MiniSheet /></span>
                <span className="jobtag">{item.jobTitle} · {item.companyName}</span>
                <small>{formatDay(item.createdAt)}</small>
              </button>
            );
          })}
        </div>
      </div>
      {actionError !== "" && <p className="err" role="alert">{actionError}</p>}
      {documentArea}
    </div>
  );
}

// The open CV: title, status, tools, then the document.
function OpenCv({ picked, version, baseContent, showChanges, onToggleChanges, isConfirmingFinal, onAskFinal, onCancelFinal, onConfirmFinal }) {
  const isFinal = version.status === "FINAL";

  let statusPill = <span className="status draft">Draft</span>;
  let finalButton = <button className="btn dark" type="button" onClick={onAskFinal}>Mark as final</button>;
  if (isFinal) {
    statusPill = <span className="status final">Final</span>;
    finalButton = null;
  }
  if (isConfirmingFinal) {
    finalButton = null;
  }

  let changedBullets = null;
  if (showChanges) {
    changedBullets = findChangedBullets(baseContent, version.content);
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
      <article className="doc">
        <ResumeDocument content={version.content} changedBullets={changedBullets} />
      </article>
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

function findById(items, id) {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

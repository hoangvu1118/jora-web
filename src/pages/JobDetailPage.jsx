import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getJob } from "../api/jobs";
import { setRecommendationStatus } from "../api/recommendations";
import { getCurrentResume, tailorResume } from "../api/resume";
import Icon from "../components/Icon";
import { PageError, PageLoading } from "../components/PageStatus";
import ReasonChips from "../components/ReasonChips";
import { descriptionToBlocks } from "../utils/jobDescription";
import { EMPLOYMENT_TYPE_LABELS, LEVEL_LABELS, WORKPLACE_LABELS, labelFor } from "../utils/labels";
import { joinParts } from "../utils/format";

export default function JobDetailPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const jobId = params.jobId;
  const matchId = searchParams.get("match"); // null when opened without a match
  const passedState = location.state || {};

  // 1. State
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaved, setIsSaved] = useState(passedState.matchStatus === "SAVED");
  const [tailorStatus, setTailorStatus] = useState("idle"); // idle | working | done | failed | limit | noResume
  const [tailorMessage, setTailorMessage] = useState("");
  const [tailoredVersionId, setTailoredVersionId] = useState(null);

  // 2. Load the job once, and mark a NEW match as VIEWED
  useEffect(function () {
    loadJob();
    if (matchId && passedState.matchStatus === "NEW") {
      setRecommendationStatus(matchId, "VIEWED").catch(function () {
        // Not important enough to bother the user.
      });
    }
  }, [jobId]);

  // 3. Handlers
  async function loadJob() {
    setStatus("loading");
    try {
      const loadedJob = await getJob(jobId);
      setJob(loadedJob);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  async function startTailor() {
    if (tailorStatus === "done") {
      navigate("/tailored?version=" + tailoredVersionId);
      return;
    }
    setTailorStatus("working");
    try {
      const resume = await getCurrentResume();
      if (resume === null) {
        setTailorStatus("noResume");
        return;
      }
      const version = await tailorResume(resume.id, jobId);
      setTailoredVersionId(version.id);
      setTailorStatus("done");
    } catch (error) {
      setTailorMessage(error.message);
      if (error.status === 429) {
        setTailorStatus("limit");
      } else {
        setTailorStatus("failed");
      }
    }
  }

  async function toggleSave() {
    let newStatus = "SAVED";
    if (isSaved) {
      newStatus = "VIEWED";
    }
    setIsSaved(!isSaved);
    try {
      await setRecommendationStatus(matchId, newStatus);
    } catch {
      setIsSaved(isSaved); // put it back
      return;
    }
    // A saved job always gets a tailored CV, so the user finds it under Tailored CVs.
    if (newStatus === "SAVED" && tailorStatus === "idle") {
      startTailor();
    }
  }

  async function skipJob() {
    try {
      await setRecommendationStatus(matchId, "DISMISSED");
      navigate("/jobs");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="Job" />;
  }
  if (status === "error") {
    return <PageError title="Job" message={errorMessage} onRetry={loadJob} />;
  }

  const blocks = descriptionToBlocks(job.description);
  const hasMatch = matchId !== null;

  let saveLabel = "Save";
  let saveIcon = null;
  if (isSaved) {
    saveLabel = "Saved";
    saveIcon = <Icon name="check" />;
  }

  // "https://stripe.com/" -> "stripe.com"
  let site = "";
  if (job.companyWebsite) {
    site = job.companyWebsite.replace("https://", "").replace("http://", "").replace(/\/$/, "");
  }

  let applyLink = null;
  let applyLinkShort = null;
  if (job.companyWebsite) {
    applyLink = <a className="btn dark" href={job.companyWebsite} target="_blank" rel="noreferrer">Apply on {site}</a>;
    applyLinkShort = <a className="btn dark" href={job.companyWebsite} target="_blank" rel="noreferrer">Apply</a>;
  }

  let barTailorLabel = "Tailor my CV";
  if (tailorStatus === "working") {
    barTailorLabel = "Tailoring…";
  } else if (tailorStatus === "done") {
    barTailorLabel = "View tailored CV";
  }

  // 5. Render
  return (
    <div className="page">
      <div className="two-col detail">
        <article>
          <Link className="back" to="/jobs"><Icon name="left" />Back to jobs</Link>
          <p className="company-line"><b>{job.companyName}</b>{site !== "" && " · " + site}</p>
          <h1>{job.title}</h1>
          {passedState.reasons && (
            <div className="why-line"><span className="eyelabel">Why it matches</span><ReasonChips reasons={passedState.reasons} /></div>
          )}
          <div className="facts">
            <Fact label="Location" value={job.location} />
            <Fact label="Workplace" value={labelFor(WORKPLACE_LABELS, job.workplaceType)} />
            <Fact label="Type" value={labelFor(EMPLOYMENT_TYPE_LABELS, job.employmentType)} />
            <Fact label="Level" value={labelFor(LEVEL_LABELS, job.level)} />
          </div>
          <div className="jd">
            {blocks.map(function (block, index) {
              return <DescriptionBlock key={index} block={block} />;
            })}
          </div>
        </article>

        <aside className="sticky">
          <TailorBox
            companyName={job.companyName}
            jobTitle={job.title}
            tailorStatus={tailorStatus}
            tailorMessage={tailorMessage}
            tailoredVersionId={tailoredVersionId}
            onTailor={startTailor}
          />
          {applyLink}
          {hasMatch && (
            <div className="row-btns">
              <button className="btn line" type="button" aria-pressed={isSaved} onClick={toggleSave}>{saveIcon}{saveLabel}</button>
              <button className="btn skip" type="button" onClick={skipJob}>Skip</button>
            </div>
          )}
        </aside>
      </div>

      {/* Phones: the actions stay at the bottom of the screen while reading */}
      <div className="actionbar">
        {hasMatch && <button className="btn line" type="button" aria-pressed={isSaved} onClick={toggleSave}>{saveIcon}{saveLabel}</button>}
        <button className="btn sage" type="button" onClick={startTailor} disabled={tailorStatus === "working"} aria-busy={tailorStatus === "working"}>{barTailorLabel}</button>
        {applyLinkShort}
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  if (!value) {
    return null;
  }
  return (
    <div><span className="eyelabel">{label}</span><b>{value}</b></div>
  );
}

function DescriptionBlock({ block }) {
  if (block.type === "h") {
    return <h2>{block.text}</h2>;
  }
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map(function (item, index) {
          return <li key={index}>{item}</li>;
        })}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

// The dark green box: ready -> working -> done (or failed / limit / no CV yet).
function TailorBox({ companyName, jobTitle, tailorStatus, tailorMessage, tailoredVersionId, onTailor }) {
  if (tailorStatus === "working") {
    return (
      <div className="tailor-box" role="status">
        <h2>Tailor my CV for this job</h2>
        <p>Rewriting your base CV for {jobTitle} at {companyName}. This takes about 10 seconds.</p>
        <button className="btn wide" type="button" disabled aria-busy="true"><span className="spinner" aria-hidden="true"></span>Tailoring for {companyName}…</button>
      </div>
    );
  }
  if (tailorStatus === "done") {
    return (
      <div className="tailor-box done" role="status">
        <h2>Tailor my CV for this job</h2>
        <div className="result">
          <p>Your tailored CV for {companyName} is ready. It's on your rail.</p>
          <Link className="btn wide" to={"/tailored?version=" + tailoredVersionId}>View tailored CV<Icon name="right" /></Link>
        </div>
      </div>
    );
  }
  if (tailorStatus === "noResume") {
    return (
      <div className="tailor-box">
        <h2>Tailor my CV for this job</h2>
        <p className="warn">Upload your CV first. Jora tailors from your base CV.</p>
        <Link className="btn wide" to="/resume">Upload my CV</Link>
      </div>
    );
  }
  if (tailorStatus === "failed" || tailorStatus === "limit") {
    return (
      <div className="tailor-box">
        <h2>Tailor my CV for this job</h2>
        <p className="warn">{tailorMessage} Your base CV is unchanged.</p>
        <button className="btn wide" type="button" onClick={onTailor}>Try again</button>
      </div>
    );
  }
  return (
    <div className="tailor-box">
      <h2>Tailor my CV for this job</h2>
      <p>Jora rewrites your base CV for this description. Employers, dates and numbers stay the same, and no new skills are added.</p>
      <button className="btn wide" type="button" onClick={onTailor}>Tailor my CV</button>
    </div>
  );
}

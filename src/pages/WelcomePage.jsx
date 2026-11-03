import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentResume } from "../api/resume";
import { getSearchProfile } from "../api/searchProfile";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import { getCrawlTimesLocal, getNextCrawl, timeUntil } from "../utils/format";

// First run: the setup steps, and how long until the first matches arrive.
export default function WelcomePage() {
  // 1. State
  const [hasResume, setHasResume] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [now, setNow] = useState(new Date());

  // 2. Load once, and tick the countdown every minute
  useEffect(function () {
    loadSetup();
    const timer = setInterval(function () { setNow(new Date()); }, 60000);
    return function () { clearInterval(timer); };
  }, []);

  // 3. Handlers
  async function loadSetup() {
    setStatus("loading");
    try {
      const resume = await getCurrentResume();
      const profile = await getSearchProfile();
      setHasResume(resume !== null);
      setHasProfile(profile !== null);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="Welcome" />;
  }
  if (status === "error") {
    return <PageError title="Welcome" message={errorMessage} onRetry={loadSetup} />;
  }

  const crawlTimes = getCrawlTimesLocal();
  const untilNext = timeUntil(getNextCrawl(now), now);
  let stepsLeft = 0;
  if (!hasResume) {
    stepsLeft = stepsLeft + 1;
  }
  if (!hasProfile) {
    stepsLeft = stepsLeft + 1;
  }
  let sub = "You're all set. Jora is finding jobs for you.";
  if (stepsLeft === 1) {
    sub = "One more step, then Jora starts finding jobs for you.";
  } else if (stepsLeft === 2) {
    sub = "Two more steps, then Jora starts finding jobs for you.";
  }

  // 5. Render
  return (
    <div className="page">
      <PageHeader title="Welcome to Jora" sub={sub} />
      <ol className="steps" aria-label="Setup steps">
        <SetupStep number={1} done={true} title="Create your account" text="Done" />
        <SetupStep
          number={2}
          done={hasResume}
          title="Upload your CV"
          text="PDF, up to 2 MB. Jora turns it into your base CV."
          action={<Link className="btn dark" to="/resume"><Icon name="upload" />Upload</Link>}
        />
        <SetupStep
          number={3}
          done={hasProfile}
          title="Set your search profile"
          text="Job titles, skills and places you want."
          action={<Link className="btn line" to="/profile">Set profile</Link>}
        />
      </ol>
      <div className="wait">
        <div>
          <span className="eyelabel">First matches in</span>
          <div className="clock">{untilNext.hours}<span>h</span> {untilNext.minutes}<span>min</span></div>
        </div>
        <p>
          Jora checks job boards twice a day, at {crawlTimes[0]} and {crawlTimes[1]} your time.
          Your first matches arrive after the next check. You don't need to keep this page open.
        </p>
      </div>
    </div>
  );
}

function SetupStep({ number, done, title, text, action }) {
  if (done) {
    return (
      <li className="step done">
        <span className="num"><Icon name="check" /></span>
        <div><b>{title}</b><span>Done</span></div>
      </li>
    );
  }
  return (
    <li className="step">
      <span className="num">{number}</span>
      <div><b>{title}</b><span>{text}</span></div>
      {action}
    </li>
  );
}

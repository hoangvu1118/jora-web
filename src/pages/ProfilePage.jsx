import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSearchProfile, getSearchProfile, updateSearchProfile } from "../api/searchProfile";
import { useAuth } from "../auth/AuthContext";
import { MultiChoice, SingleChoice } from "../components/ChoiceButtons";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import TokenInput from "../components/TokenInput";
import { EMPLOYMENT_TYPE_LABELS, LEVEL_LABELS, WORKPLACE_LABELS, optionsFrom } from "../utils/labels";
import { getCrawlTimesLocal } from "../utils/format";

const EMPTY_PROFILE = {
  name: "My job search",
  level: null,
  jobTitles: [],
  skills: [],
  locations: [],
  employmentTypes: ["FULL_TIME"],
  workplaceTypes: [],
};

export default function ProfilePage() {
  const auth = useAuth();

  // 1. State
  const [profile, setProfile] = useState(EMPTY_PROFILE); // what the form shows
  const [exists, setExists] = useState(false); // true -> PATCH, false -> POST
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | failed
  const [saveMessage, setSaveMessage] = useState("");

  // 2. Load once
  useEffect(function () {
    loadProfile();
  }, []);

  // 3. Handlers
  async function loadProfile() {
    setStatus("loading");
    try {
      const loaded = await getSearchProfile();
      if (loaded !== null) {
        setProfile(toFormValues(loaded));
        setExists(true);
      }
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  // One change handler for every field: updateField("skills", [...])
  function updateField(field, value) {
    setProfile({ ...profile, [field]: value });
    setSaveStatus("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (profile.jobTitles.length === 0) {
      setSaveStatus("failed");
      setSaveMessage("Add at least one job title, so Jora knows what to look for.");
      return;
    }
    setSaveStatus("saving");
    try {
      let saved;
      if (exists) {
        saved = await updateSearchProfile(profile);
      } else {
        saved = await createSearchProfile(profile);
      }
      setProfile(toFormValues(saved));
      setExists(true);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("failed");
      setSaveMessage(error.message);
    }
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="Search profile" />;
  }
  if (status === "error") {
    return <PageError title="Search profile" message={errorMessage} onRetry={loadProfile} />;
  }

  let saveLabel = "Save profile";
  if (saveStatus === "saving") {
    saveLabel = "Saving…";
  }
  let saveNote = null;
  if (saveStatus === "saved") {
    saveNote = <p className="saved-note" role="status">Saved. New jobs are checked against this from the next crawl.</p>;
  } else if (saveStatus === "failed") {
    saveNote = <p className="err" role="alert">{saveMessage}</p>;
  }
  const crawlTimes = getCrawlTimesLocal();

  // 5. Render
  return (
    <div className="page">
      <PageHeader title="Search profile" sub="Tell Jora what you're looking for. Every new job is checked against this." />
      <div className="two-col">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="profile-name">Profile name</label>
            <input className="input" id="profile-name" value={profile.name} onChange={function (event) { updateField("name", event.target.value); }} />
          </div>
          <TokenInput label="Job titles" values={profile.jobTitles} placeholder="Add a title, then press Enter" onChange={function (values) { updateField("jobTitles", values); }} />
          <TokenInput label="Skills" values={profile.skills} placeholder="Add a skill" onChange={function (values) { updateField("skills", values); }} />
          <TokenInput label="Locations" values={profile.locations} placeholder="Add a city" onChange={function (values) { updateField("locations", values); }} />
          <SingleChoice label="Level" options={optionsFrom(LEVEL_LABELS)} value={profile.level} onChange={function (value) { updateField("level", value); }} />
          <MultiChoice label="Employment type" options={optionsFrom(EMPLOYMENT_TYPE_LABELS)} values={profile.employmentTypes} onChange={function (values) { updateField("employmentTypes", values); }} />
          <MultiChoice label="Workplace" options={optionsFrom(WORKPLACE_LABELS)} values={profile.workplaceTypes} onChange={function (values) { updateField("workplaceTypes", values); }} />
          <div className="form-actions">
            <button className="btn dark" type="submit" disabled={saveStatus === "saving"} aria-busy={saveStatus === "saving"}>{saveLabel}</button>
            {saveNote}
          </div>
        </form>
        <aside className="panel">
          <h2 className="eyelabel">What happens next</h2>
          <p>Jora scores new jobs against this profile after each check, at {crawlTimes[0]} and {crawlTimes[1]} your time.</p>
          <p>New matches wait in <Link to="/suggested">Suggested</Link>. Every match, saved or not, is listed in <Link to="/jobs">Jobs</Link>.</p>
        </aside>
      </div>
      <div className="phone-logout">
        <button className="btn line" type="button" onClick={auth.logOut}>Log out</button>
      </div>
    </div>
  );
}

// The backend sends sets as arrays (or null). The form always wants arrays.
function toFormValues(profile) {
  return {
    name: profile.name || "",
    level: profile.level,
    jobTitles: profile.jobTitles || [],
    skills: profile.skills || [],
    locations: profile.locations || [],
    employmentTypes: profile.employmentTypes || [],
    workplaceTypes: profile.workplaceTypes || [],
  };
}

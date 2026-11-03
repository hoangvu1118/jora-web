import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCurrentResume, tailorResume } from "../api/resume";
import { useAuth } from "../auth/AuthContext";

// Saving a job tailors the CV for it in the background, one job at a time.
// It sits above the pages, so the work goes on while the user moves around the app.
// Read it in any component with useTailorQueue().
//
// One job at a time, because each tailor is a Gemini call of about 10 seconds and the
// backend allows 10 per minute per user. Swiping fast just makes the line longer.
//
// A full page reload forgets jobs that are still waiting. The job stays saved, and the
// user can tailor it from the job page.
const TailorQueueContext = createContext(null);

export function TailorQueueProvider({ children }) {
  const { isLoggedIn } = useAuth();

  // [{ jobId, jobTitle, companyName, status, versionId, message }]
  // status: waiting | working | done | failed
  const [jobs, setJobs] = useState([]);
  const isWorking = useRef(false);

  // Whenever the list changes and nothing is running, start the next waiting job.
  useEffect(function () {
    if (isWorking.current) {
      return;
    }
    const next = findFirstWaiting(jobs);
    if (next !== null) {
      tailorJob(next);
    }
  }, [jobs]);

  // A new user must not see the last user's list.
  useEffect(function () {
    if (!isLoggedIn) {
      setJobs([]);
    }
  }, [isLoggedIn]);

  async function tailorJob(job) {
    isWorking.current = true;
    updateJob(job.jobId, { status: "working" });

    let result;
    try {
      const resume = await getCurrentResume();
      if (resume === null) {
        result = { status: "failed", message: "Upload your CV first." };
      } else {
        const version = await tailorResume(resume.id, job.jobId);
        result = { status: "done", versionId: version.id };
      }
    } catch (error) {
      result = { status: "failed", message: error.message };
    }

    isWorking.current = false;
    // This change runs the effect above again, which starts the next waiting job.
    updateJob(job.jobId, result);
  }

  // job: the job from a recommendation, { id, title, companyName }
  function addJob(job) {
    setJobs(function (current) {
      const existing = findByJobId(current, job.id);
      if (existing !== null && existing.status !== "failed") {
        return current; // already waiting, working or done
      }
      const newJob = { jobId: job.id, jobTitle: job.title, companyName: job.companyName, status: "waiting", versionId: null, message: "" };
      return [...withoutJob(current, job.id), newJob];
    });
  }

  // Undo of a save. Only a job that hasn't started can be taken back.
  // A started one finishes, and its CV stays on the rail.
  function cancelJob(jobId) {
    setJobs(function (current) {
      const job = findByJobId(current, jobId);
      if (job === null || job.status !== "waiting") {
        return current;
      }
      return withoutJob(current, jobId);
    });
  }

  function retryJob(jobId) {
    updateJob(jobId, { status: "waiting", message: "" });
  }

  function updateJob(jobId, changes) {
    setJobs(function (current) {
      const updated = [];
      for (const job of current) {
        if (job.jobId === jobId) {
          updated.push({ ...job, ...changes });
        } else {
          updated.push(job);
        }
      }
      return updated;
    });
  }

  const value = {
    jobs: jobs,
    addJob: addJob,
    cancelJob: cancelJob,
    retryJob: retryJob,
  };
  return <TailorQueueContext.Provider value={value}>{children}</TailorQueueContext.Provider>;
}

export function useTailorQueue() {
  return useContext(TailorQueueContext);
}

// ---------- helpers ----------

function findFirstWaiting(jobs) {
  for (const job of jobs) {
    if (job.status === "waiting") {
      return job;
    }
  }
  return null;
}

function findByJobId(jobs, jobId) {
  for (const job of jobs) {
    if (job.jobId === jobId) {
      return job;
    }
  }
  return null;
}

function withoutJob(jobs, jobId) {
  const kept = [];
  for (const job of jobs) {
    if (job.jobId !== jobId) {
      kept.push(job);
    }
  }
  return kept;
}

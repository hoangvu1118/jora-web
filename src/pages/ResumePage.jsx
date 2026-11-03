import { useEffect, useRef, useState } from "react";
import { archiveResume, createBaseVersion, extractResume, getCurrentResume, uploadResume } from "../api/resume";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import ResumeDocument from "../components/ResumeDocument";
import { formatDay } from "../utils/format";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // matches spring.servlet.multipart.max-file-size

// The words shown while a new CV goes through the three backend steps.
const UPLOAD_STEP_TEXT = {
  uploading: "Uploading your PDF…",
  reading: "Reading the text in your CV…",
  building: "Building your base CV. This takes about 10 seconds…",
};

export default function ResumePage() {
  // 1. State
  const [resume, setResume] = useState(null); // { id, fileName, createdAt, baseVersion } or null
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadStep, setUploadStep] = useState("idle"); // idle | uploading | reading | building
  const [uploadError, setUploadError] = useState("");
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const fileInput = useRef(null);

  // 2. Load once
  useEffect(function () {
    loadResume();
  }, []);

  // 3. Handlers
  async function loadResume() {
    setStatus("loading");
    try {
      const current = await getCurrentResume();
      setResume(current);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  async function handleFile(file) {
    setUploadError("");
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      setUploadError("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("This PDF is bigger than 2 MB. Please choose a smaller file.");
      return;
    }
    try {
      setUploadStep("uploading");
      const uploaded = await uploadResume(file);
      setUploadStep("reading");
      await extractResume(uploaded.id);
      setUploadStep("building");
      await createBaseVersion(uploaded.id);
      const current = await getCurrentResume();
      setResume(current);
    } catch (error) {
      setUploadError(error.message);
    }
    setUploadStep("idle");
  }

  async function buildBaseVersion() {
    setUploadError("");
    try {
      setUploadStep("building");
      await createBaseVersion(resume.id);
      const current = await getCurrentResume();
      setResume(current);
    } catch (error) {
      setUploadError(error.message);
    }
    setUploadStep("idle");
  }

  async function confirmArchive() {
    try {
      await archiveResume(resume.id);
      setResume(null);
      setIsConfirmingArchive(false);
    } catch (error) {
      setUploadError(error.message);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="My resume" />;
  }
  if (status === "error") {
    return <PageError title="My resume" message={errorMessage} onRetry={loadResume} />;
  }

  const isBusy = uploadStep !== "idle";

  // The upload box looks the same everywhere; only its words change.
  let dropTitle = "Upload your CV";
  let dropText = "PDF up to 2 MB. Jora turns it into your base CV.";
  if (resume !== null) {
    dropTitle = "Upload a new CV";
    dropText = "PDF up to 2 MB. It becomes your new base CV. Tailored copies you already made stay as they are.";
  }
  let dropButton = <button className="btn line" type="button" onClick={function () { fileInput.current.click(); }}>Choose file</button>;
  if (isBusy) {
    dropText = UPLOAD_STEP_TEXT[uploadStep];
    dropButton = <span className="spinner" aria-hidden="true"></span>;
  }
  const dropZone = (
    <div className="drop" onDragOver={function (event) { event.preventDefault(); }} onDrop={handleDrop} aria-busy={isBusy}>
      <Icon name="upload" />
      <b>{dropTitle}</b>
      <p role="status">{dropText}</p>
      {uploadError !== "" && <p className="err" role="alert">{uploadError}</p>}
      {dropButton}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf"
        hidden
        onChange={function (event) { handleFile(event.target.files[0]); event.target.value = ""; }}
      />
    </div>
  );

  // No CV yet: just the upload box.
  if (resume === null) {
    return (
      <div className="page">
        <PageHeader title="My resume" sub="Upload your CV once. Every tailored copy is made from it." />
        <div className="upload-only">{dropZone}</div>
      </div>
    );
  }

  let document;
  if (resume.baseVersion) {
    document = (
      <div>
        <div className="doc-bar">
          <div className="left"><span className="status base">Base CV</span><span className="muted">Made {formatDay(resume.createdAt)}</span></div>
        </div>
        <article className="doc">
          <ResumeDocument content={resume.baseVersion.content} />
        </article>
      </div>
    );
  } else {
    document = (
      <div className="empty-state">
        <h2>Your base CV isn't built yet</h2>
        <p>Jora has your PDF but hasn't turned it into a base CV. This takes about 10 seconds.</p>
        <button className="btn dark" type="button" onClick={buildBaseVersion} disabled={isBusy} aria-busy={isBusy}>Build my base CV</button>
      </div>
    );
  }

  // 5. Render
  return (
    <div className="page">
      <PageHeader title="My resume" sub="Your base CV. Every tailored copy is made from this one." />
      <div className="side-col">
        <aside className="stack-col">
          <div className="panel">
            <h2 className="eyelabel">Uploaded file</h2>
            <div className="file">
              <div className="ico">PDF</div>
              <div><b>{resume.fileName}</b><span>Uploaded {formatDay(resume.createdAt)}</span></div>
            </div>
          </div>
          {dropZone}
          {!isConfirmingArchive && (
            <button className="btn quiet" type="button" onClick={function () { setIsConfirmingArchive(true); }}>Archive this resume</button>
          )}
          {isConfirmingArchive && (
            <div className="inline-confirm show" role="alert">
              Archive it? You can still read it and its tailored copies, but not change them.
              <button className="btn dark" type="button" onClick={confirmArchive}>Archive</button>
              <button className="btn quiet" type="button" onClick={function () { setIsConfirmingArchive(false); }}>Cancel</button>
            </div>
          )}
        </aside>
        {document}
      </div>
    </div>
  );
}

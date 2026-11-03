import { useId, useState } from "react";
import TokenInput from "./TokenInput";

// A form for changing the text of a CV (a ResumeContent).
// It works on its own copy, and hands the finished copy to onSave.
//
// Every change follows the same three steps (see updateDraft):
// make a copy of the draft, change the copy, then save the copy as the new draft.
//
// Bullet lists are one textarea each, one bullet per line, so adding or removing a bullet
// is just adding or removing a line. Empty lines are dropped when saving.
export default function ResumeEditor({ content, isSaving, errorMessage, onSave, onCancel }) {
  const [draft, setDraft] = useState(function () {
    return withEmptyLists(structuredClone(content));
  });

  function updateDraft(change) {
    const copy = structuredClone(draft);
    change(copy);
    setDraft(copy);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(cleanContent(draft));
  }

  let saveLabel = "Save changes";
  if (isSaving) {
    saveLabel = "Saving…";
  }

  return (
    <form className="doc doc-edit" onSubmit={handleSubmit} aria-label="Edit this CV">
      <HeaderFields header={draft.header} updateDraft={updateDraft} />

      {draft.experiences.length > 0 && <h3>Experience</h3>}
      {draft.experiences.map(function (experience, index) {
        return (
          <div className="edit-entry" key={"experience-" + index}>
            <div className="edit-grid">
              <TextField
                label="Job title"
                value={experience.jobTitle}
                onChange={function (value) { updateDraft(function (copy) { copy.experiences[index].jobTitle = value; }); }}
              />
              <TextField
                label="Company"
                value={experience.companyName}
                onChange={function (value) { updateDraft(function (copy) { copy.experiences[index].companyName = value; }); }}
              />
              <MonthField
                label="Started"
                value={experience.startDate}
                onChange={function (value) { updateDraft(function (copy) { copy.experiences[index].startDate = value; }); }}
              />
              <MonthField
                label="Ended (empty if you still work here)"
                value={experience.endDate}
                onChange={function (value) { updateDraft(function (copy) { copy.experiences[index].endDate = value; }); }}
              />
            </div>
            <BulletsField
              label="What you did"
              lines={experience.bullets}
              onChange={function (lines) { updateDraft(function (copy) { copy.experiences[index].bullets = lines; }); }}
            />
          </div>
        );
      })}

      {draft.projects.length > 0 && <h3>Projects</h3>}
      {draft.projects.map(function (project, index) {
        return (
          <div className="edit-entry" key={"project-" + index}>
            <TextField
              label="Project name"
              value={project.title}
              onChange={function (value) { updateDraft(function (copy) { copy.projects[index].title = value; }); }}
            />
            <TokenInput
              label="Technologies"
              values={project.technologies}
              placeholder="Add a technology, then press Enter"
              onChange={function (values) { updateDraft(function (copy) { copy.projects[index].technologies = values; }); }}
            />
            <BulletsField
              label="What you built"
              lines={project.bullets}
              onChange={function (lines) { updateDraft(function (copy) { copy.projects[index].bullets = lines; }); }}
            />
          </div>
        );
      })}

      {draft.education.length > 0 && <h3>Education</h3>}
      {draft.education.map(function (school, index) {
        return (
          <div className="edit-entry" key={"education-" + index}>
            <div className="edit-grid">
              <TextField
                label="Degree"
                value={school.degree}
                onChange={function (value) { updateDraft(function (copy) { copy.education[index].degree = value; }); }}
              />
              <TextField
                label="School"
                value={school.university}
                onChange={function (value) { updateDraft(function (copy) { copy.education[index].university = value; }); }}
              />
              <MonthField
                label="Started"
                value={school.startDate}
                onChange={function (value) { updateDraft(function (copy) { copy.education[index].startDate = value; }); }}
              />
              <MonthField
                label="Finished"
                value={school.endDate}
                onChange={function (value) { updateDraft(function (copy) { copy.education[index].endDate = value; }); }}
              />
            </div>
          </div>
        );
      })}

      {draft.skillGroups.length > 0 && <h3>Skills</h3>}
      {draft.skillGroups.map(function (group, index) {
        return (
          <div className="edit-entry" key={"skills-" + index}>
            <TextField
              label="Group name"
              value={group.category}
              onChange={function (value) { updateDraft(function (copy) { copy.skillGroups[index].category = value; }); }}
            />
            <TokenInput
              label="Skills"
              values={group.items}
              placeholder="Add a skill, then press Enter"
              onChange={function (values) { updateDraft(function (copy) { copy.skillGroups[index].items = values; }); }}
            />
          </div>
        );
      })}

      {draft.extraSections.map(function (section, index) {
        return (
          <div className="edit-entry" key={"extra-" + index}>
            <h3>{section.title}</h3>
            <TextField
              label="Section title"
              value={section.title}
              onChange={function (value) { updateDraft(function (copy) { copy.extraSections[index].title = value; }); }}
            />
            <BulletsField
              label="Lines"
              lines={section.items}
              onChange={function (lines) { updateDraft(function (copy) { copy.extraSections[index].items = lines; }); }}
            />
          </div>
        );
      })}

      <div className="edit-actions">
        <button className="btn dark" type="submit" disabled={isSaving} aria-busy={isSaving}>{saveLabel}</button>
        <button className="btn quiet" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        {errorMessage !== "" && <p className="err" role="alert">{errorMessage}</p>}
      </div>
    </form>
  );
}

// ---------- fields ----------

function HeaderFields({ header, updateDraft }) {
  return (
    <div className="edit-entry">
      <TextField
        label="Your name"
        value={header.name}
        onChange={function (value) { updateDraft(function (copy) { copy.header.name = value; }); }}
      />
      <div className="edit-grid">
        <TextField
          label="Email"
          value={header.email}
          onChange={function (value) { updateDraft(function (copy) { copy.header.email = value; }); }}
        />
        <TextField
          label="Phone"
          value={header.phoneNumber}
          onChange={function (value) { updateDraft(function (copy) { copy.header.phoneNumber = value; }); }}
        />
        <TextField
          label="LinkedIn"
          value={header.linkedIn}
          onChange={function (value) { updateDraft(function (copy) { copy.header.linkedIn = value; }); }}
        />
        <TextField
          label="GitHub"
          value={header.github}
          onChange={function (value) { updateDraft(function (copy) { copy.header.github = value; }); }}
        />
      </div>
    </div>
  );
}

// Each field below gets its own id from React (useId), so a label always points at its own box.
function TextField({ label, value, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input className="input" id={id} value={value || ""} onChange={function (event) { onChange(event.target.value); }} />
    </div>
  );
}

// A YearMonth from the backend looks like "2021-03", which is exactly what <input type="month"> uses.
function MonthField({ label, value, onChange }) {
  const id = useId();

  function handleChange(event) {
    if (event.target.value === "") {
      onChange(null);
    } else {
      onChange(event.target.value);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input className="input" id={id} type="month" value={value || ""} onChange={handleChange} />
    </div>
  );
}

function BulletsField({ label, lines, onChange }) {
  const id = useId();
  const hintId = id + "-hint";
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <span className="hint" id={hintId}>One bullet per line.</span>
      <textarea
        className="input"
        id={id}
        aria-describedby={hintId}
        value={lines.join("\n")}
        onChange={function (event) { onChange(event.target.value.split("\n")); }}
      />
    </div>
  );
}

// ---------- helpers ----------

// The backend can leave lists or the header out. The form needs them to be there.
function withEmptyLists(content) {
  if (!content.header) {
    content.header = {};
  }
  if (!content.experiences) {
    content.experiences = [];
  }
  if (!content.projects) {
    content.projects = [];
  }
  if (!content.education) {
    content.education = [];
  }
  if (!content.skillGroups) {
    content.skillGroups = [];
  }
  if (!content.extraSections) {
    content.extraSections = [];
  }
  for (const experience of content.experiences) {
    if (!experience.bullets) {
      experience.bullets = [];
    }
  }
  for (const project of content.projects) {
    if (!project.bullets) {
      project.bullets = [];
    }
    if (!project.technologies) {
      project.technologies = [];
    }
  }
  for (const group of content.skillGroups) {
    if (!group.items) {
      group.items = [];
    }
  }
  for (const section of content.extraSections) {
    if (!section.items) {
      section.items = [];
    }
  }
  return content;
}

// Drops the empty lines people leave in the bullet boxes.
function cleanContent(draft) {
  const content = structuredClone(draft);
  for (const experience of content.experiences) {
    experience.bullets = withoutBlankLines(experience.bullets);
  }
  for (const project of content.projects) {
    project.bullets = withoutBlankLines(project.bullets);
  }
  for (const section of content.extraSections) {
    section.items = withoutBlankLines(section.items);
  }
  return content;
}

function withoutBlankLines(lines) {
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed !== "") {
      kept.push(trimmed);
    }
  }
  return kept;
}

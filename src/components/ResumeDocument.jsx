import { formatYearMonth, joinParts } from "../utils/format";

// Draws a ResumeContent (header, experiences, projects, education, skillGroups, extraSections).
// `changedBullets` (optional Set) marks bullets that differ from the base CV.

function Bullet({ text, changedBullets }) {
  if (changedBullets && changedBullets.has(text)) {
    return <li><mark>{text}</mark></li>;
  }
  return <li>{text}</li>;
}

function BulletList({ bullets, changedBullets }) {
  if (!bullets || bullets.length === 0) {
    return null;
  }
  return (
    <ul>
      {bullets.map(function (bullet, index) {
        return <Bullet key={index} text={bullet} changedBullets={changedBullets} />;
      })}
    </ul>
  );
}

function dateRange(start, end) {
  if (!start) {
    return "";
  }
  return formatYearMonth(start) + " – " + formatYearMonth(end);
}

export default function ResumeDocument({ content, changedBullets }) {
  const header = content.header || {};
  let name = header.name;
  if (!name) {
    name = "Your CV";
  }
  const experiences = content.experiences || [];
  const projects = content.projects || [];
  const education = content.education || [];
  const skillGroups = content.skillGroups || [];
  const extraSections = content.extraSections || [];

  return (
    <>
      <h2>{name}</h2>
      <p className="contact">{joinParts([header.email, header.phoneNumber, header.linkedIn, header.github])}</p>

      {experiences.length > 0 && <h3>Experience</h3>}
      {experiences.map(function (experience, index) {
        return (
          <div key={index}>
            <div className="item">
              <b>{joinParts([experience.jobTitle, experience.companyName], ", ")}</b>
              <span>{dateRange(experience.startDate, experience.endDate)}</span>
            </div>
            <BulletList bullets={experience.bullets} changedBullets={changedBullets} />
          </div>
        );
      })}

      {projects.length > 0 && <h3>Projects</h3>}
      {projects.map(function (project, index) {
        return (
          <div key={index}>
            <div className="item">
              <b>{project.title}</b>
              <span>{joinParts(project.technologies || [])}</span>
            </div>
            <BulletList bullets={project.bullets} changedBullets={changedBullets} />
          </div>
        );
      })}

      {education.length > 0 && <h3>Education</h3>}
      {education.map(function (school, index) {
        return (
          <div className="item" key={index}>
            <b>{joinParts([school.degree, school.university], ", ")}</b>
            <span>{dateRange(school.startDate, school.endDate)}</span>
          </div>
        );
      })}

      {skillGroups.length > 0 && <h3>Skills</h3>}
      {skillGroups.map(function (group, index) {
        return (
          <p key={index}><b>{group.category}:</b> {(group.items || []).join(", ")}</p>
        );
      })}

      {extraSections.map(function (section, index) {
        return (
          <div key={index}>
            <h3>{section.title}</h3>
            <BulletList bullets={section.items} />
          </div>
        );
      })}
    </>
  );
}

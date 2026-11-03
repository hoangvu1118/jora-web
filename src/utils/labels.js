// Backend enum value -> words on screen. One map per enum.

export const MATCH_REASON_LABELS = {
  TITLE_MATCH: "Title",
  LOCATION_MATCH: "Location",
  EMPLOYMENT_TYPE_MATCH: "Job type",
  KEYWORD_MATCH: "Keywords",
  SKILL_MATCH: "Skills",
};

export const LEVEL_LABELS = {
  INTERN: "Intern",
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MIDDLE: "Mid-level",
  SENIOR: "Senior",
  MANAGER: "Manager",
  OTHER: "Other",
};

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const WORKPLACE_LABELS = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On site",
};

export const RECOMMENDATION_STATUS_LABELS = {
  NEW: "New",
  VIEWED: "Viewed",
  SAVED: "Saved",
  DISMISSED: "Skipped",
};

// Returns the label, or the raw value when the map doesn't know it (for example a free-text level).
export function labelFor(labels, value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (labels[value]) {
    return labels[value];
  }
  return value;
}

// Turns a map into [{ value, label }] for choice buttons, in the map's order.
export function optionsFrom(labels) {
  const options = [];
  for (const value of Object.keys(labels)) {
    options.push({ value: value, label: labels[value] });
  }
  return options;
}

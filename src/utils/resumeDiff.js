// Finds the bullet points of a tailored CV that are not in the base CV word for word.
// The Tailored CVs screen marks those bullets when "Highlight changes" is on.

function collectBullets(content) {
  const bullets = [];
  if (!content) {
    return bullets;
  }
  for (const experience of content.experiences || []) {
    for (const bullet of experience.bullets || []) {
      bullets.push(bullet);
    }
  }
  for (const project of content.projects || []) {
    for (const bullet of project.bullets || []) {
      bullets.push(bullet);
    }
  }
  return bullets;
}

export function findChangedBullets(baseContent, tailoredContent) {
  const baseBullets = new Set(collectBullets(baseContent));
  const changed = new Set();
  for (const bullet of collectBullets(tailoredContent)) {
    if (!baseBullets.has(bullet)) {
      changed.add(bullet);
    }
  }
  return changed;
}

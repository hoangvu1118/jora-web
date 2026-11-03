// The demo swipe deck on the landing page (sample jobs, nothing is saved).
// This is the approved page's own script, kept as it was. It works on the landing's
// Shadow DOM directly, so it doesn't follow the React page pattern used in src/pages.

const JOBS = [
  { title: "Senior Backend Engineer", company: "Stripe", location: "Singapore", workplace: "Hybrid", type: "Full time", level: "Senior",
    reasons: ["Title", "Skills", "Location"], blurb: "Own payment APIs that move billions. Java, Kafka and Postgres at scale." },
  { title: "Software Engineer, Platform", company: "Canva", location: "Sydney", workplace: "Remote", type: "Full time", level: "Mid",
    reasons: ["Title", "Keywords"], blurb: "Build the internal platform that 4,000 engineers deploy on every day." },
  { title: "Java Developer", company: "Atlassian", location: "Remote, APAC", workplace: "Remote", type: "Full time", level: "Mid",
    reasons: ["Skills", "Employment type"], blurb: "Spring Boot services behind Jira Cloud. Strong testing culture." },
  { title: "Backend Engineer, Search", company: "Grab", location: "Ho Chi Minh City", workplace: "On site", type: "Full time", level: "Mid",
    reasons: ["Title", "Location", "Skills"], blurb: "Ranking and retrieval for food and mart search across 8 countries." },
  { title: "Platform Engineer", company: "Xero", location: "Melbourne", workplace: "Hybrid", type: "Contract", level: "Senior",
    reasons: ["Keywords"], blurb: "Event-driven ledger services. Redis, Kafka and AWS are daily tools." }
];

const THRESHOLD = 110;

function setup(root) {
  const stack = root.querySelector("[data-stack]");
  const savedCount = root.querySelector("[data-saved]");
  const dismissedCount = root.querySelector("[data-dismissed]");
  const leftCount = root.querySelector("[data-left]");
  let index = 0;
  let saved = 0;
  let dismissed = 0;

  function cardHtml(job) {
    let chips = "";
    for (const r of job.reasons) {
      chips += '<span class="chip">' + r + "</span>";
    }
    return (
      '<div class="stamp stamp-save">Saved</div><div class="stamp stamp-skip">Not for me</div>' +
      '<div class="card-top"><span class="company">' + job.company + '</span><span class="level">' + job.level + "</span></div>" +
      "<h3>" + job.title + "</h3>" +
      '<p class="meta">' + job.location + " · " + job.workplace + " · " + job.type + "</p>" +
      '<p class="blurb">' + job.blurb + "</p>" +
      '<div class="why"><span class="why-label">Why it matches</span><div class="chips">' + chips + "</div></div>"
    );
  }

  function render() {
    stack.innerHTML = "";
    const remaining = JOBS.length - index;
    leftCount.textContent = String(remaining);
    if (remaining === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = "<h3>That's everyone for today.</h3><p>New matches arrive after the next crawl, twice a day.</p>" +
        '<button type="button" class="btn ghost" data-restart>Show them again</button>';
      stack.appendChild(empty);
      empty.querySelector("[data-restart]").addEventListener("click", function () {
        index = 0;
        render();
      });
      return;
    }
    const shown = Math.min(3, remaining);
    for (let depth = shown - 1; depth >= 0; depth--) {
      const card = document.createElement("article");
      card.className = "card depth-" + depth;
      card.innerHTML = cardHtml(JOBS[index + depth]);
      stack.appendChild(card);
      if (depth === 0) {
        makeDraggable(card);
      }
    }
  }

  function fly(card, direction) {
    card.classList.add("leaving");
    const x = direction * (window.innerWidth + 200);
    card.style.transform = "translate(" + x + "px, -40px) rotate(" + direction * 28 + "deg)";
    if (direction > 0) {
      saved++;
      savedCount.textContent = String(saved);
    } else {
      dismissed++;
      dismissedCount.textContent = String(dismissed);
    }
    index++;
    setTimeout(render, 320);
  }

  function topCard() {
    return stack.querySelector(".card.depth-0");
  }

  function makeDraggable(card) {
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dragging = false;

    card.addEventListener("pointerdown", function (e) {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      card.setPointerCapture(e.pointerId);
      card.classList.add("dragging");
    });
    card.addEventListener("pointermove", function (e) {
      if (!dragging) {
        return;
      }
      dx = e.clientX - startX;
      const dy = (e.clientY - startY) * 0.3;
      card.style.transform = "translate(" + dx + "px, " + dy + "px) rotate(" + dx / 18 + "deg)";
      const strength = Math.min(Math.abs(dx) / THRESHOLD, 1);
      if (dx > 0) {
        card.style.setProperty("--save", strength);
        card.style.setProperty("--skip", 0);
      } else {
        card.style.setProperty("--skip", strength);
        card.style.setProperty("--save", 0);
      }
    });
    function end() {
      if (!dragging) {
        return;
      }
      dragging = false;
      card.classList.remove("dragging");
      if (dx > THRESHOLD) {
        fly(card, 1);
      } else if (dx < -THRESHOLD) {
        fly(card, -1);
      } else {
        card.style.transform = "";
        card.style.setProperty("--save", 0);
        card.style.setProperty("--skip", 0);
      }
      dx = 0;
    }
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  root.querySelector("[data-skip]").addEventListener("click", function () {
    const card = topCard();
    if (card) {
      card.style.setProperty("--skip", 1);
      fly(card, -1);
    }
  });
  root.querySelector("[data-save]").addEventListener("click", function () {
    const card = topCard();
    if (card) {
      card.style.setProperty("--save", 1);
      fly(card, 1);
    }
  });
  root.querySelector("[data-tailor]").addEventListener("click", function (e) {
    const btn = e.currentTarget;
    btn.textContent = "Tailoring…";
    setTimeout(function () {
      btn.textContent = "Tailor my CV";
    }, 1200);
  });
  root.addEventListener("keydown", function (e) {
    const card = topCard();
    if (!card) {
      return;
    }
    if (e.key === "ArrowRight") {
      fly(card, 1);
    }
    if (e.key === "ArrowLeft") {
      fly(card, -1);
    }
  });

  render();
}

// Starts every demo deck inside `root` (the landing's shadow root).
export function startLandingDeck(root) {
  root.querySelectorAll("[data-deck]").forEach(setup);
}

// A fake Jora API on port 8080, so the screens can be built and tested without Spring Boot.
// Run: npm run mock   (then npm run dev in a second terminal)
// It keeps everything in memory and forgets it on restart. Any email + 8-char password logs in.

import http from "node:http";

const PORT = 8080;

// ---------- sample data ----------
const jobs = [
  { id: 1, title: "Senior Backend Engineer", companyName: "Stripe", companyWebsite: "https://stripe.com", location: "Singapore", level: "SENIOR", employmentType: "FULL_TIME", workplaceType: "HYBRID", status: "OPEN",
    description: "<p>Stripe's Payments Core team builds the APIs that move money for millions of businesses.</p><h3>What you'll do</h3><ul><li>Design and run high-volume Java services.</li><li>Build event pipelines on Kafka and keep them idempotent.</li></ul><h3>What we're looking for</h3><ul><li>5+ years building backend systems.</li><li>Experience with PostgreSQL and distributed messaging.</li></ul>" },
  { id: 2, title: "Java Developer", companyName: "Atlassian", companyWebsite: "https://atlassian.com", location: "APAC", level: "MIDDLE", employmentType: "FULL_TIME", workplaceType: "REMOTE", status: "OPEN",
    description: "<p>Spring Boot services behind Jira Cloud, with a strong testing culture.</p>" },
  { id: 3, title: "Backend Engineer, Search", companyName: "Grab", companyWebsite: "https://grab.com", location: "Ho Chi Minh City", level: "MIDDLE", employmentType: "FULL_TIME", workplaceType: "ONSITE", status: "OPEN",
    description: "<p>Ranking and retrieval for food and mart search across 8 countries.</p>" },
  { id: 4, title: "Platform Engineer", companyName: "Xero", companyWebsite: "https://xero.com", location: "Melbourne", level: "SENIOR", employmentType: "CONTRACT", workplaceType: "HYBRID", status: "OPEN",
    description: "<p>Event-driven ledger services. Redis, Kafka and AWS are daily tools.</p>" },
  { id: 5, title: "Software Engineer, Payments", companyName: "Wise", companyWebsite: "https://wise.com", location: "Singapore", level: "MIDDLE", employmentType: "FULL_TIME", workplaceType: "HYBRID", status: "OPEN",
    description: "<p>Move money across 160 countries.</p>" },
  { id: 6, title: "Software Engineer, Platform", companyName: "Canva", companyWebsite: "https://canva.com", location: "Sydney", level: "MIDDLE", employmentType: "FULL_TIME", workplaceType: "REMOTE", status: "OPEN",
    description: "<p>Build the platform behind Canva's editor.</p>" },
];

const recommendations = [
  { id: 101, jobId: 1, score: 90, matchReason: ["TITLE_MATCH", "SKILL_MATCH", "LOCATION_MATCH"], recommendationStatus: "NEW" },
  { id: 102, jobId: 2, score: 80, matchReason: ["SKILL_MATCH", "EMPLOYMENT_TYPE_MATCH"], recommendationStatus: "NEW" },
  { id: 103, jobId: 3, score: 75, matchReason: ["TITLE_MATCH", "LOCATION_MATCH"], recommendationStatus: "NEW" },
  { id: 104, jobId: 4, score: 60, matchReason: ["KEYWORD_MATCH"], recommendationStatus: "NEW" },
  { id: 105, jobId: 5, score: 55, matchReason: ["TITLE_MATCH", "SKILL_MATCH"], recommendationStatus: "NEW" },
  { id: 106, jobId: 6, score: 50, matchReason: ["TITLE_MATCH", "KEYWORD_MATCH"], recommendationStatus: "SAVED" },
];

const baseContent = {
  header: { name: "Emily Carter", email: "emily.carter@gmail.com", phoneNumber: null, linkedIn: null, github: "github.com/emilycarter" },
  education: [{ university: "National University of Singapore", degree: "BSc Computer Science", startDate: "2016-08", endDate: "2020-06" }],
  experiences: [
    { jobTitle: "Software Engineer", companyName: "Lazada", startDate: "2021-03", endDate: null,
      bullets: ["Built REST APIs in Java and Spring Boot for the checkout and payments teams.", "Moved order events to Kafka, removing 4 nightly batch jobs.", "Wrote integration tests for 12 services and joined the payments on-call rota."] },
    { jobTitle: "Graduate Developer", companyName: "Carousell", startDate: "2020-09", endDate: "2021-02",
      bullets: ["Fixed 60+ bugs in the listings service and added PostgreSQL indexes that cut report time by 30%."] },
  ],
  projects: [{ title: "Expense tracker", technologies: ["React", "Spring Boot"], bullets: ["Shared expense app with 200 monthly users, deployed on AWS."] }],
  skillGroups: [{ category: "Languages", items: ["Java", "Kotlin", "SQL", "TypeScript"] }, { category: "Tools", items: ["Spring Boot", "Kafka", "PostgreSQL", "Docker", "AWS", "React"] }],
  extraSections: [],
};

let searchProfile = { Id: 1, name: "Backend roles in APAC", level: "MIDDLE", jobTitles: ["Backend Engineer", "Software Engineer"], skills: ["Java", "Kafka"], locations: ["Singapore", "Remote"], employmentTypes: ["FULL_TIME"], workplaceTypes: ["REMOTE", "HYBRID"] };
let resume = { id: 1, fileName: "emily-carter-cv.pdf", createdAt: "2026-11-01T09:00:00", archived: false };
let nextVersionId = 3;
const versions = [
  { id: 1, type: "BASE", status: "DRAFT", jobId: null, createdAt: "2026-11-01T09:01:00", content: baseContent },
  { id: 2, type: "TAILORED", status: "DRAFT", jobId: 1, createdAt: "2026-11-02T10:00:00", content: tailoredFrom(baseContent, "payments") },
];

function tailoredFrom(content, focus) {
  const copy = JSON.parse(JSON.stringify(content));
  copy.experiences[0].bullets[0] = "Built " + focus + "-facing REST APIs in Java and Spring Boot for the checkout and payments teams.";
  copy.experiences[1].bullets[0] = "Added PostgreSQL indexes that cut report time by 30%, and fixed 60+ bugs in the listings service.";
  return copy;
}

// ---------- helpers ----------
function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  if (body === undefined) {
    res.end();
  } else {
    res.end(JSON.stringify(body));
  }
}

function problem(res, status, detail) {
  send(res, status, { title: http.STATUS_CODES[status], status: status, detail: detail });
}

function readJson(req) {
  return new Promise(function (resolve) {
    let data = "";
    req.on("data", function (chunk) { data += chunk; });
    req.on("end", function () {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function jobSummary(job) {
  return { id: job.id, title: job.title, companyName: job.companyName, location: job.location, level: job.level, employmentType: job.employmentType, workplaceType: job.workplaceType };
}

function findJob(id) {
  return jobs.find(function (job) { return job.id === id; });
}

function versionBrief(version) {
  return { id: version.id, type: version.type, status: version.status, content: version.content };
}

// ---------- routes ----------
const server = http.createServer(async function (req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;
  console.log(method, req.url);

  if (method === "POST" && (path === "/api/v1/auth/login" || path === "/api/v1/auth/register")) {
    const body = await readJson(req);
    if (!body.email || !body.password || body.password.length < 8) {
      return problem(res, 400, "Password must be at least 8 characters long");
    }
    if (path.endsWith("register")) {
      return send(res, 201, { email: body.email, role: "USER" });
    }
    return send(res, 200, { username: "Emily Carter", token: "mock-token", userId: 1 });
  }

  if (req.headers.authorization !== "Bearer mock-token") {
    return problem(res, 403, "Not logged in");
  }

  // Recommendations
  if (method === "GET" && path === "/api/v1/jobRecommendation") {
    const items = recommendations.map(function (rec) {
      return { id: rec.id, job: jobSummary(findJob(rec.jobId)), matchReason: rec.matchReason, recommendationStatus: rec.recommendationStatus };
    });
    return send(res, 200, { items: items, hasNext: false, lastScore: null, lastId: null });
  }
  let match = path.match(/^\/api\/v1\/jobRecommendation\/(\d+)$/);
  if (method === "PATCH" && match) {
    const body = await readJson(req);
    const rec = recommendations.find(function (r) { return r.id === Number(match[1]); });
    rec.recommendationStatus = body.recommendationStatus;
    return send(res, 204);
  }

  // Jobs
  match = path.match(/^\/api\/v1\/job\/(\d+)$/);
  if (method === "GET" && match) {
    const job = findJob(Number(match[1]));
    if (!job) {
      return problem(res, 404, "Job not found");
    }
    return send(res, 200, job);
  }

  // Search profile
  if (path === "/api/v1/searchProfiles") {
    if (method === "GET") {
      if (searchProfile === null) {
        return problem(res, 404, "No search profile yet");
      }
      return send(res, 200, searchProfile);
    }
    if (method === "POST" || method === "PATCH") {
      const body = await readJson(req);
      searchProfile = { Id: 1, ...body };
      return send(res, 200, searchProfile);
    }
  }

  // Resume
  if (method === "GET" && path === "/api/v1/resume/current") {
    if (resume === null || resume.archived) {
      return problem(res, 404, "No active resume");
    }
    const base = versions.find(function (v) { return v.type === "BASE"; });
    let baseVersion = null;
    if (base) {
      baseVersion = versionBrief(base);
    }
    return send(res, 200, { id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt, baseVersion: baseVersion });
  }
  if (method === "POST" && path === "/api/v1/resume") {
    await wait(600);
    resume = { id: 1, fileName: "new-cv.pdf", createdAt: new Date().toISOString(), archived: false };
    return send(res, 201, { id: 1, fileName: "new-cv.pdf", fileSize: 120000, fileType: "application/pdf" });
  }
  if (method === "POST" && path.endsWith("/extract")) {
    await wait(600);
    return send(res, 200, "raw text");
  }
  if (method === "POST" && /^\/api\/v1\/resume\/\d+\/versions$/.test(path)) {
    await wait(1500);
    return send(res, 200, versionBrief(versions[0]));
  }
  if (method === "GET" && /^\/api\/v1\/resume\/\d+\/versions$/.test(path)) {
    const list = [];
    for (const version of versions) {
      if (version.type === "TAILORED") {
        const job = findJob(version.jobId);
        list.push({ id: version.id, status: version.status, jobId: job.id, jobTitle: job.title, companyName: job.companyName, createdAt: version.createdAt });
      }
    }
    list.reverse();
    return send(res, 200, list);
  }
  match = path.match(/^\/api\/v1\/resume\/\d+\/versions\/(\d+)(\/final)?$/);
  if (match) {
    const version = versions.find(function (v) { return v.id === Number(match[1]); });
    if (!version) {
      return problem(res, 404, "Version not found");
    }
    if (method === "POST" && match[2]) {
      version.status = "FINAL";
    }
    return send(res, 200, versionBrief(version));
  }
  if (method === "POST" && path.endsWith("/archive")) {
    resume.archived = true;
    return send(res, 204);
  }
  match = path.match(/^\/api\/v1\/resume\/\d+\/tailor\/(\d+)$/);
  if (method === "POST" && match) {
    await wait(1500);
    const jobId = Number(match[1]);
    let version = versions.find(function (v) { return v.type === "TAILORED" && v.jobId === jobId; });
    if (version) {
      return send(res, 200, versionBrief(version));
    }
    const job = findJob(jobId);
    version = { id: nextVersionId, type: "TAILORED", status: "DRAFT", jobId: jobId, createdAt: new Date().toISOString(), content: tailoredFrom(baseContent, job.companyName) };
    nextVersionId = nextVersionId + 1;
    versions.push(version);
    return send(res, 201, versionBrief(version));
  }

  problem(res, 404, "No mock for " + method + " " + path);
});

server.listen(PORT, function () {
  console.log("Mock Jora API on http://localhost:" + PORT);
});

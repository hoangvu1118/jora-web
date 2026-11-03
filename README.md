# jora-web

The Jora frontend: React 19 + Vite + React Router. It follows the approved design
(`jora-design/app.html`), and it uses the same CSS class names.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, calls to /api go to Spring Boot on :8080
```

No backend running? Start the fake API in a second terminal instead of Spring Boot:

```bash
npm run mock       # fake API on :8080 with sample jobs and a sample CV
```

Then log in with any email and any password of 8+ characters.

Build for production: `npm run build` (output in `dist/`). Set `VITE_API_URL` (see `.env.example`)
when the API lives on another address.

## Folders

```
src/
  main.jsx            starts React, the router and login state
  App.jsx             every screen and its address
  api/                the ONLY place that calls the backend
    client.js         apiRequest(): adds the token, turns ProblemDetail errors into ApiError
    auth.js jobs.js recommendations.js resume.js searchProfile.js
  auth/               AuthContext (who is logged in) + RequireLogin
  components/         small pieces used by several screens (Icon, Hanger, TokenInput, SwipeDeck…)
  pages/              one file per screen
    landing/          the approved landing page (markup, CSS, demo deck), shown at "/"
  utils/              plain helpers: labels for enums, dates, crawl times, CV diff
  styles/             base.css (tokens + shared parts) and app.css (screens), copied from the design
mock/server.js        fake API for working without Spring Boot
```

## The pattern every screen follows

Every file in `pages/` is written in the same five steps. Copy one when you add a screen.

```jsx
export default function JobsPage() {
  // 1. State: the data, plus ONE status for the request
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Load once when the screen opens
  useEffect(function () {
    loadItems();
  }, []);

  // 3. Handlers: async, try/catch, then set state
  async function loadItems() {
    setStatus("loading");
    try {
      const page = await getRecommendations(null, 20);
      setItems(page.items);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  // 4. Decide what to show with if/else, ABOVE the return
  if (status === "loading") {
    return <PageLoading title="Jobs" />;
  }
  if (status === "error") {
    return <PageError title="Jobs" message={errorMessage} onRetry={loadItems} />;
  }

  // 5. Render
  return <div className="page">…</div>;
}
```

House rules:

- Pages never call `fetch`. They call a function from `api/`, and `api/` calls `apiRequest`.
- No ternaries (`a ? b : c`). Decide with `if/else` above the return and keep the result in a variable.
  Inside JSX, `{condition && <Thing />}` is used only for "show this or nothing".
- Loops are plain `for (const x of list)`. `.map()` is used only to turn a list into JSX.
- Functions are `function name() {}`, also for event handlers (`onClick={function () { … }}`).
- Words for enum values live in `utils/labels.js` (`MIDDLE` → "Mid-level"), never in a page.
- Styling: reuse the class names from `styles/`. No inline styles, except the deck's drag position.

## The landing page

`/` shows the approved landing page to visitors. Logged-in users go to `/jobs`. It is the one page
that doesn't follow the pattern above: it is the design file as it was, inside a Shadow DOM so its
CSS and the app's CSS can't affect each other. To change its words or layout, edit
`src/pages/landing/landing.html` and `landing.css`. Log in, Sign up and Upload my resume go to `/login`.

## Backend to add

The screens call four things the Spring Boot app doesn't have yet. The shapes are written next
to each call in `src/api/resume.js`. `mock/server.js` already answers them, so you can see what
they should return.

1. **`GET /api/v1/resume/current`**: the user's newest non-archived resume.
   Returns `{ id, fileName, createdAt, baseVersion }`, where `baseVersion` is a
   `ResumeVersionBriefResponse` or `null`. Returns 404 when there is none.
   Without it, the app can't find the user's CV after a reload.
2. **`GET /api/v1/resume/{resumeId}/versions?type=TAILORED`**: the hangers on the Tailored CVs rail.
   Returns `[{ id, status, jobId, jobTitle, companyName, createdAt }]`, newest first.
3. **`POST /api/v1/resume/{resumeId}/versions/{versionId}/final`**: marks a DRAFT as FINAL
   (locked) and returns the version.
4. **CORS, for production only**: in development Vite forwards `/api`, so the browser never needs it.
   If the frontend and API end up on different domains, add a `CorsConfigurationSource` bean
   (`SecurityConfig` already calls `.cors(...)`).

Two smaller notes:

- Recommendations don't include a short job blurb, so swipe cards link to the full job instead.
- Editing a CV's text isn't in the backend yet, so there's no Edit button.

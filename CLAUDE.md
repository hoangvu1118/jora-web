# jora-web: rules for working in this repo

Jora's frontend: React 19 + Vite + React Router, plain JavaScript (no TypeScript).
The owner, Hoang, is learning React by reading and copying this code. **Readable beats clever.**
Every change must follow the style below, and so must every review comment.

## Every page follows the same 5 steps

```jsx
export default function SomePage() {
  // 1. State: the data, plus ONE status for the request
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Load once when the screen opens
  useEffect(function () {
    loadItems();
  }, []);

  // 3. Handlers: async, try/catch, then set state
  async function loadItems() { ... }

  // 4. Decide what to show with if/else, ABOVE the return
  if (status === "loading") {
    return <PageLoading title="..." />;
  }
  if (status === "error") {
    return <PageError title="..." message={errorMessage} onRetry={loadItems} />;
  }

  // 5. Render
  return <div className="page">...</div>;
}
```

Copy an existing page in `src/pages/` when adding a new one.

## House rules

- **No ternaries** (`a ? b : c`). For either/or, use `if/else` above the return and keep the result in a variable.
  Inside JSX, use `{condition && <Thing />}` only for "show this or nothing".
- **Plain loops.** Use `for (const x of list)` to build arrays. Use `.map()` only to turn a list into JSX.
  Don't chain `filter` / `reduce` / `find` / `sort`, and don't write clever one-liners.
- **Named functions.** Write `function name() {}` everywhere, including handlers: `onClick={function () { ... }}`.
- **API calls only through `src/api/`.** Pages never call `fetch`. Each `api/*.js` function calls
  `apiRequest()` in `api/client.js`, which adds the token and turns ProblemDetail errors into `ApiError`.
- **Enum words live in `src/utils/labels.js`** (`MIDDLE` -> "Mid-level"). Never hard-code them in a page.
- **Styling:** reuse the class names in `src/styles/` (copied from the approved design).
  No new colours or fonts, and no inline styles (the swipe deck's drag position is the one exception).
- The landing page (`src/pages/landing/`, shown at `/`) is the approved design kept as is, inside a
  Shadow DOM. It is the one exception to the page pattern. Don't change its words or animation unless Hoang asks.
- Keep functions small, with one job each, and add a short comment that says why (not what) when it isn't obvious.

## Working here

- Run `npm run mock` (a fake API on :8080) plus `npm run dev`, or point Vite at the real Spring Boot app on :8080.
- Run `npm run build` before pushing. It must pass.
- Don't push to `main` or open PRs unless Hoang asks. He reviews everything.
- Backend endpoints the app still needs are listed in README.md ("Backend to add").

/**
 * PRACTICE 2 — SearchBox with debounce  (suggested time box: 15 min)
 *
 * Props
 *   onSearch  function  (query: string) => void
 *   delay     number    debounce delay in ms, default 300
 *
 * Requirements (each one has a test in __tests__/SearchBox.test.jsx)
 *   1. Render <input type="search" aria-label="Search memories">, controlled
 *      by React state — the typed text shows up immediately.
 *   2. Do NOT call onSearch on mount.
 *   3. Call onSearch(value.trim()) once, `delay` ms after the user stops typing.
 *      Typing again before the delay is up restarts the wait.
 *   4. Pressing Escape clears the input and calls onSearch('') right away
 *      (cancelling any pending debounced call).
 *   5. No onSearch call after the component unmounts (clean up your timer).
 *
 * Do it with useState + useEffect + setTimeout — no lodash.
 * Run:  npm test -- SearchBox
 */
export default function SearchBox({ onSearch, delay = 300 }) {
  // TODO: implement
  return <p>TODO: implement SearchBox</p>
}

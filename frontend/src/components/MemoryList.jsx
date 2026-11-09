/**
 * PRACTICE 1 — MemoryList  (suggested time box: 25 min)
 *
 * Props
 *   query         string    current search keyword ('' = none)
 *   tag           string    current tag filter ('' = none)
 *   refreshKey    number    changes when the list should reload (e.g. after a create)
 *   fetchMemories function  ({ q, tag }) => Promise<{ items: Memory[], total: number }>
 *                           (injected so tests can pass a fake; App passes api.listMemories)
 *
 * Requirements (each one has a test in __tests__/MemoryList.test.jsx)
 *   1. On mount, call fetchMemories({ q: query, tag }).
 *   2. While a request is in flight, render an element with role="status"
 *      whose text includes "Loading".
 *   3. On success, render <ul className="memory-list"> with one <li> per item,
 *      showing the item's title in an <h3> and its content in a <p>.
 *   4. If items is empty, render the text "No memories found".
 *   5. On failure, render role="alert" containing the error's message, plus a
 *      button named "Retry" that fetches again.
 *   6. Fetch again whenever query, tag or refreshKey changes.
 *   7. Race condition: if props change while an older request is still pending,
 *      the older response must NOT overwrite the newer one.
 *
 * Run:  npm test -- MemoryList
 */
export default function MemoryList(props) {
  // TODO: implement
  return <p>TODO: implement MemoryList</p>
}

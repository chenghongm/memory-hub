import { act, fireEvent, render, screen } from '@testing-library/react'
import MemoryList from '../MemoryList.jsx'

const item = (id, title) => ({
  id, title, content: `content of ${title}`, tags: [], source: 'manual',
  created_at: '2026-11-09T00:00:00Z', updated_at: '2026-11-09T00:00:00Z',
})

// A promise we can resolve/reject from the test, to control timing.
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const baseProps = { query: '', tag: '', refreshKey: 0 }

test('1+2: fetches on mount with query and tag, shows loading', async () => {
  const d = deferred()
  const fetchMemories = vi.fn(() => d.promise)
  render(<MemoryList {...baseProps} query="coffee" tag="food" fetchMemories={fetchMemories} />)

  expect(fetchMemories).toHaveBeenCalledWith(expect.objectContaining({ q: 'coffee', tag: 'food' }))
  expect(screen.getByRole('status')).toHaveTextContent(/loading/i)

  await act(async () => d.resolve({ items: [], total: 0 }))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('3: renders one list item per memory with title and content', async () => {
  const fetchMemories = vi.fn().mockResolvedValue({ items: [item(1, 'Coffee'), item(2, 'Tea')], total: 2 })
  render(<MemoryList {...baseProps} fetchMemories={fetchMemories} />)

  expect(await screen.findByRole('heading', { name: 'Coffee' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('content of Tea')).toBeInTheDocument()
})

test('4: shows empty state', async () => {
  const fetchMemories = vi.fn().mockResolvedValue({ items: [], total: 0 })
  render(<MemoryList {...baseProps} fetchMemories={fetchMemories} />)
  expect(await screen.findByText(/no memories found/i)).toBeInTheDocument()
})

test('5: shows error with Retry, and Retry fetches again', async () => {
  const fetchMemories = vi
    .fn()
    .mockRejectedValueOnce(new Error('500: database down'))
    .mockResolvedValueOnce({ items: [item(1, 'Back online')], total: 1 })
  render(<MemoryList {...baseProps} fetchMemories={fetchMemories} />)

  expect(await screen.findByRole('alert')).toHaveTextContent('500: database down')
  fireEvent.click(screen.getByRole('button', { name: /retry/i }))

  expect(await screen.findByRole('heading', { name: 'Back online' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(fetchMemories).toHaveBeenCalledTimes(2)
})

test('6: refetches when query, tag or refreshKey change', async () => {
  const fetchMemories = vi.fn().mockResolvedValue({ items: [], total: 0 })
  const { rerender } = render(<MemoryList {...baseProps} fetchMemories={fetchMemories} />)
  await screen.findByText(/no memories found/i)

  rerender(<MemoryList {...baseProps} query="a" fetchMemories={fetchMemories} />)
  rerender(<MemoryList {...baseProps} query="a" tag="work" fetchMemories={fetchMemories} />)
  rerender(<MemoryList {...baseProps} query="a" tag="work" refreshKey={1} fetchMemories={fetchMemories} />)
  await screen.findByText(/no memories found/i)

  const calls = fetchMemories.mock.calls.map(([args]) => [args.q, args.tag])
  expect(calls).toContainEqual(['a', ''])
  expect(calls).toContainEqual(['a', 'work'])
  expect(fetchMemories.mock.calls.length).toBeGreaterThanOrEqual(4)
})

test('7: a slow stale response does not overwrite a newer one', async () => {
  const slow = deferred()
  const fast = deferred()
  const fetchMemories = vi.fn(({ q }) => (q === 'old' ? slow.promise : fast.promise))

  const { rerender } = render(<MemoryList {...baseProps} query="old" fetchMemories={fetchMemories} />)
  rerender(<MemoryList {...baseProps} query="new" fetchMemories={fetchMemories} />)

  await act(async () => fast.resolve({ items: [item(2, 'New result')], total: 1 }))
  await act(async () => slow.resolve({ items: [item(1, 'Stale result')], total: 1 }))

  expect(screen.getByRole('heading', { name: 'New result' })).toBeInTheDocument()
  expect(screen.queryByText('Stale result')).not.toBeInTheDocument()
})

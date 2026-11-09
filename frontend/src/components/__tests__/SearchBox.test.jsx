import { act, fireEvent, render, screen } from '@testing-library/react'
import SearchBox from '../SearchBox.jsx'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const input = () => screen.getByRole('searchbox', { name: 'Search memories' })
const type = (value) => fireEvent.change(input(), { target: { value } })
const wait = (ms) => act(() => vi.advanceTimersByTime(ms))

test('1: controlled input shows typed text immediately', () => {
  render(<SearchBox onSearch={vi.fn()} />)
  type('nvidia')
  expect(input()).toHaveValue('nvidia')
})

test('2: does not call onSearch on mount', () => {
  const onSearch = vi.fn()
  render(<SearchBox onSearch={onSearch} />)
  wait(1000)
  expect(onSearch).not.toHaveBeenCalled()
})

test('3: calls onSearch once, trimmed, after the delay', () => {
  const onSearch = vi.fn()
  render(<SearchBox onSearch={onSearch} delay={300} />)

  type('n')
  wait(100)
  type('nv')
  wait(100)
  type('  nvidia  ')
  wait(299)
  expect(onSearch).not.toHaveBeenCalled()

  wait(1)
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith('nvidia')
})

test('3b: respects a custom delay', () => {
  const onSearch = vi.fn()
  render(<SearchBox onSearch={onSearch} delay={1000} />)
  type('x')
  wait(999)
  expect(onSearch).not.toHaveBeenCalled()
  wait(1)
  expect(onSearch).toHaveBeenCalledWith('x')
})

test('4: Escape clears immediately and cancels the pending call', () => {
  const onSearch = vi.fn()
  render(<SearchBox onSearch={onSearch} />)
  type('half typed')
  fireEvent.keyDown(input(), { key: 'Escape' })

  expect(input()).toHaveValue('')
  expect(onSearch).toHaveBeenLastCalledWith('')

  wait(1000)
  expect(onSearch).not.toHaveBeenCalledWith('half typed')
})

test('5: no call after unmount', () => {
  const onSearch = vi.fn()
  const { unmount } = render(<SearchBox onSearch={onSearch} />)
  type('bye')
  unmount()
  wait(1000)
  expect(onSearch).not.toHaveBeenCalled()
})

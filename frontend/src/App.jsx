import { useState } from 'react'
import { listMemories } from './api.js'
import MemoryForm from './components/MemoryForm.jsx'
import TagFilter from './components/TagFilter.jsx'
import SearchBox from './components/SearchBox.jsx' // ← you build this
import MemoryList from './components/MemoryList.jsx' // ← you build this

export default function App() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  // Bump after a create so the list and tag counts reload.
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <main className="app">
      <h1>Memory Hub</h1>
      <MemoryForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <SearchBox onSearch={setQuery} />
      <TagFilter selected={tag} onSelect={setTag} refreshKey={refreshKey} />
      <MemoryList query={query} tag={tag} refreshKey={refreshKey} fetchMemories={listMemories} />
    </main>
  )
}

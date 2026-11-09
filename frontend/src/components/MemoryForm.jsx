import { useState } from 'react'
import { createMemory } from '../api.js'

const EMPTY = { title: '', content: '', tags: '' }

/** Done for you: a controlled form that creates a memory. */
export default function MemoryForm({ onCreated }) {
  const [values, setValues] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function update(field) {
    return (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!values.title.trim() || !values.content.trim()) {
      setError('Title and content are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createMemory({
        title: values.title.trim(),
        content: values.content.trim(),
        tags: values.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setValues(EMPTY)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="memory-form" onSubmit={handleSubmit}>
      <input placeholder="Title" value={values.title} onChange={update('title')} />
      <textarea placeholder="Content" rows={3} value={values.content} onChange={update('content')} />
      <input placeholder="Tags, comma separated" value={values.tags} onChange={update('tags')} />
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Add memory'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

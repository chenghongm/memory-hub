import { useEffect, useState } from 'react'
import { listTags } from '../api.js'

/** Done for you: tag chips; click one to filter, click again to clear. */
export default function TagFilter({ selected, onSelect, refreshKey }) {
  const [tags, setTags] = useState([])

  useEffect(() => {
    listTags().then(setTags).catch(() => setTags([]))
  }, [refreshKey])

  if (tags.length === 0) return null

  return (
    <div className="tag-filter">
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          className={tag === selected ? 'chip active' : 'chip'}
          onClick={() => onSelect(tag === selected ? '' : tag)}
        >
          {tag} <span className="count">{count}</span>
        </button>
      ))}
    </div>
  )
}

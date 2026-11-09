// Thin wrapper over the FastAPI backend. Every function returns a Promise
// and throws an Error (with a readable message) on a non-2xx response.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* body wasn't JSON */
    }
    throw new Error(`${res.status}: ${detail}`)
  }
  return res.status === 204 ? null : res.json()
}

/** @returns {Promise<{items: Memory[], total: number}>} */
export function listMemories({ q = '', tag = '', limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (q) params.set('q', q)
  if (tag) params.set('tag', tag)
  return request(`/api/memories?${params}`)
}

export function createMemory(body) {
  return request('/api/memories', { method: 'POST', body: JSON.stringify(body) })
}

export function updateMemory(id, patch) {
  return request(`/api/memories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function deleteMemory(id) {
  return request(`/api/memories/${id}`, { method: 'DELETE' })
}

/** @returns {Promise<{tag: string, count: number}[]>} */
export function listTags() {
  return request('/api/tags')
}

/**
 * @typedef {Object} Memory
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 * @property {string} source
 * @property {string} created_at
 * @property {string} updated_at
 */

// Edge-compatible proxy for backend email existence check
export default async function handler(req, res) {
  if (req.method === 'POST' && req.url === '/api/check-email') {
    try {
      const body = await new Promise((resolve) => {
        let data = ''
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => resolve(data ? JSON.parse(data) : {}))
      })

      const response = await fetch(process.env.BACKEND_URL + '/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await response.json()
      res.status(response.status).json(json)
      return
    } catch (e) {
      res.status(500).json({ error: 'internal_error' })
      return
    }
  }
  res.status(404).json({ error: 'not_found' })
}


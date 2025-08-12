import React, { useMemo, useState } from 'react'

const initialData = null

export default function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(initialData)

  const placeholder = 'https://www.google.com/maps/place/... or https://example.com'

  const items = useMemo(() => {
    if (!data) return []
    const labelMap = [
      ['Business Name', 'Company Name'],
      ['Address'],
      ['Phone', 'Phone Number'],
      ['Website'],
      ['Email', 'Email Address'],
      ['Description']
    ]

    return labelMap.map(keys => {
      const [primary, ...alts] = keys
      const value = [primary, ...alts].map(k => data?.[k]).find(v => v && v !== 'N/A') || 'N/A'
      return { label: primary, value }
    })
  }, [data])

  async function handleExtract() {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a valid URL')
      return
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('URL must start with http:// or https://')
      return
    }

    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      })
      if (!res.ok) {
        let message = 'Failed to extract business information'
        try {
          const text = await res.text()
          if (text) {
            message = JSON.parse(text).error || message
          }
        } catch {}
        throw new Error(message)
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadCSV() {
    if (!data) return
    try {
      const res = await fetch('/api/download-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to generate CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'business_info.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to download CSV file')
    }
  }

  return (
    <div className="app">
      <header className="container header">
        <h1 className="title">Business Information Extractor</h1>
        <p className="subtitle">Paste a Google Maps or business website URL to extract details</p>
      </header>

      <main className="container">
        <section className="card">
          <div className="field-row">
            <input
              className="input"
              type="url"
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button className="button" onClick={handleExtract} disabled={loading || !url.trim()}>
              {loading ? (
                <span className="spinner" aria-label="loading" />
              ) : (
                'Extract Data'
              )}
            </button>
          </div>
          {error && <div className="alert">{error}</div>}
        </section>

        {loading && (
          <section className="card">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </section>
        )}

        {data && (
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Extracted Business Information</h2>
              <button className="button outline" onClick={handleDownloadCSV}>Download CSV</button>
            </div>

            <div className="grid">
              {items.map(({ label, value }) => (
                <div key={label} className="item">
                  <div className="item-label">{label}</div>
                  {label === 'Website' && value && value !== 'N/A' ? (
                    <a className="item-value link" href={value} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : (
                    <div className="item-value">{String(value)}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="badge-row">
              <span className="badge">Data extracted successfully</span>
            </div>
          </section>
        )}

        <p className="footnote">The data will appear above and can be downloaded as CSV.</p>
      </main>

      <footer className="container footer">
        <span>© {new Date().getFullYear()} Business Extractor</span>
      </footer>
    </div>
  )
}

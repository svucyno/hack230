import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarField from '../components/StarField'
import CandidateCard from '../components/CandidateCard'
import BatchSummary from '../components/BatchSummary'

const API = 'http://localhost:8000'

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState([])
  const [summary,    setSummary]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [sortBy,     setSortBy]     = useState('score_desc')
  const [filterMin,  setFilterMin]  = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/candidates`),
      axios.get(`${API}/batch-summary`),
    ])
      .then(([cRes, sRes]) => {
        setCandidates(cRes.data)
        setSummary(sRes.data)
      })
      .catch(() => toast.error('Failed to load data from backend.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await axios.delete(`${API}/candidate/${id}`)
      setCandidates(prev => prev.filter(c => c.id !== id))
      toast.success('Candidate removed from orbit.')
    } catch {
      toast.error('Delete failed.')
    }
  }

  const filtered = useMemo(() => {
    let list = candidates.filter(c => {
      const score = c.scores?.overall ?? 0
      if (score < filterMin) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.skills?.technical?.some(s => s.toLowerCase().includes(q))
      )
    })

    switch (sortBy) {
      case 'score_desc': list.sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0)); break
      case 'score_asc':  list.sort((a, b) => (a.scores?.overall ?? 0) - (b.scores?.overall ?? 0)); break
      case 'name':       list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
      case 'date_desc':  list.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)); break
    }
    return list
  }, [candidates, search, sortBy, filterMin])

  const topId = summary?.top_performer?.id

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <StarField count={120} />

      <div className="page-container" style={{ padding: '80px 24px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '32px' }}
          >
            <p style={{
              fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.3em', color: '#7b2fff',
              textShadow: '0 0 10px rgba(123,47,255,0.6)',
              marginBottom: '8px',
            }}>
              ◈ ORBITAL COMMAND CENTER ◈
            </p>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff' }}>
              Mission Control
              <span className="gradient-text"> — Candidate Profiles</span>
            </h1>
          </motion.div>

          {/* ── Batch Stats Bar ── */}
          {summary && summary.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'flex', gap: '12px', flexWrap: 'wrap',
                marginBottom: '28px',
              }}
            >
              {[
                { label: 'Total',    value: summary.total,         icon: '🚀', color: '#00d4ff' },
                { label: 'Avg Score', value: `${summary.average_score?.toFixed(1)}%`, icon: '📊', color: '#7b2fff' },
                { label: 'Top Score', value: `${summary.max_score}%`, icon: '⭐', color: '#ffd700' },
                { label: 'Freshers',  value: summary.fresher_count, icon: '🌱', color: '#00ff88' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 18px', borderRadius: '12px',
                    border: `1px solid ${s.color}33`,
                    flex: '1 1 120px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                  <div>
                    <p style={{ fontWeight: 800, color: s.color, fontSize: '1.1rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {s.value}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#606070' }}>{s.label}</p>
                  </div>
                </motion.div>
              ))}

              {/* Toggle batch summary */}
              <button
                onClick={() => setShowSummary(v => !v)}
                className="btn-primary"
                style={{ padding: '12px 20px', fontSize: '0.85rem' }}
              >
                {showSummary ? '🔭 Hide Summary' : '📡 Full Summary'}
              </button>
            </motion.div>
          )}

          {/* Full Batch Summary (expandable) */}
          {showSummary && summary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass"
              style={{ padding: '28px', borderRadius: '20px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <BatchSummary summary={summary} candidates={candidates} />
            </motion.div>
          )}

          {/* ── Controls ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex', gap: '12px', flexWrap: 'wrap',
              marginBottom: '28px', alignItems: 'center',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#606070',
              }}>
                🔍
              </span>
              <input
                className="input-glass"
                placeholder="Search name, email, skill..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>

            {/* Sort */}
            <select
              className="select-glass"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ flex: '0 0 auto' }}
            >
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
              <option value="name">Name A–Z</option>
              <option value="date_desc">Latest First</option>
            </select>

            {/* Score filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
              <span style={{ fontSize: '0.82rem', color: '#606070', whiteSpace: 'nowrap' }}>
                Min score: <span style={{ color: '#00d4ff', fontWeight: 700 }}>{filterMin}%</span>
              </span>
              <input
                type="range" min={0} max={100} step={5}
                value={filterMin}
                onChange={e => setFilterMin(+e.target.value)}
                style={{ accentColor: '#00d4ff', width: '100px' }}
              />
            </div>
          </motion.div>

          {/* ── Candidate Grid ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🌀</div>
              <p style={{ color: '#606070', marginTop: '16px' }}>Loading candidates from orbit...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
              <p style={{ color: '#606070', fontSize: '1rem' }}>
                {candidates.length === 0
                  ? 'No resumes uploaded yet. Visit the Launch Pad to get started.'
                  : 'No candidates match your filters.'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {filtered.map((candidate, i) => (
                <div key={candidate.id} style={{ position: 'relative' }}>
                  <CandidateCard
                    candidate={candidate}
                    index={i}
                    isTopPerformer={candidate.id === topId}
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(candidate.id, e)}
                    style={{
                      position: 'absolute', top: '12px', right: '12px',
                      background: 'rgba(255,45,120,0.1)',
                      border: '1px solid rgba(255,45,120,0.2)',
                      borderRadius: '8px',
                      color: '#ff2d78',
                      width: '26px', height: '26px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      zIndex: 10,
                      transition: 'all 0.2s ease',
                    }}
                    title="Remove candidate"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,120,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,45,120,0.1)'}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

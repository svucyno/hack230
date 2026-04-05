import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarField from '../components/StarField'
import ScoreChart from '../components/ScoreChart'
import SkillTags from '../components/SkillTags'
import Timeline from '../components/Timeline'
import JobSuggestions from '../components/JobSuggestions'

const API = 'http://localhost:8000'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getScoreColor(score) {
  if (score >= 70) return '#00ff88'
  if (score >= 45) return '#00d4ff'
  return '#ff2d78'
}

function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80 }}
      className="glass"
      style={{
        padding: '28px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <h2 style={{
        fontSize: '1rem', fontWeight: 700, color: '#fff',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

export default function CandidateProfile() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    axios.get(`${API}/candidate/${id}`)
      .then(res => setCandidate(res.data))
      .catch(() => {
        toast.error('Candidate not found.')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StarField count={100} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🌀</div>
          <p style={{ color: '#606070', marginTop: '16px' }}>Scanning profile...</p>
        </div>
      </div>
    )
  }

  if (!candidate) return null

  const score      = candidate.scores?.overall ?? 0
  const scoreColor = getScoreColor(score)
  const initials   = getInitials(candidate.name)

  const contactLinks = [
    { icon: '✉️', label: candidate.email,    href: `mailto:${candidate.email}` },
    { icon: '📞', label: candidate.phone,    href: `tel:${candidate.phone}` },
    { icon: '🔗', label: 'LinkedIn',         href: candidate.linkedin ? `https://${candidate.linkedin}` : null },
    { icon: '💻', label: 'GitHub',           href: candidate.github   ? `https://${candidate.github}`   : null },
    { icon: '📍', label: candidate.location, href: null },
  ].filter(c => c.label && c.label !== '—' && c.label !== '')

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <StarField count={100} />

      <div className="page-container" style={{ padding: '80px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#a0a0b0',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '6px',
              width: 'fit-content',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a0a0b0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            ← Mission Control
          </motion.button>

          {/* ── Hero Section ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{
              padding: '36px',
              borderRadius: '24px',
              border: `1px solid ${scoreColor}33`,
              boxShadow: `0 0 40px ${scoreColor}11`,
            }}
          >
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '100px', height: '100px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, ${scoreColor}44, rgba(123,47,255,0.3))`,
                  border: `3px solid ${scoreColor}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px', fontWeight: 900,
                  color: scoreColor,
                  boxShadow: `0 0 30px ${scoreColor}33, 0 0 60px ${scoreColor}11`,
                  flexShrink: 0,
                }}
              >
                {initials}
              </motion.div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, color: '#fff' }}>
                    {candidate.name || 'Unknown Candidate'}
                  </h1>
                  {candidate.is_fresher && <span className="badge-fresher">🌱 Fresher</span>}
                </div>

                {/* Contact badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {contactLinks.map(({ icon, label, href }) => (
                    <span
                      key={label}
                      onClick={href ? () => window.open(href, '_blank') : undefined}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        fontSize: '0.78rem', color: '#a0a0b0',
                        cursor: href ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={href ? e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; e.currentTarget.style.color = '#00d4ff' } : undefined}
                      onMouseLeave={href ? e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#a0a0b0' } : undefined}
                    >
                      {icon} {label}
                    </span>
                  ))}
                </div>

                {/* File meta */}
                <p style={{ fontSize: '0.75rem', color: '#404050' }}>
                  📄 {candidate.file_name} ·{' '}
                  {candidate.uploaded_at ? new Date(candidate.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>

              {/* Score (right) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <ScoreChart scores={candidate.scores} />
              </div>
            </div>
          </motion.div>

          {/* ── Skills ── */}
          <Section title="🧪 Skills">
            <SkillTags
              technical={candidate.skills?.technical ?? []}
              soft={candidate.skills?.soft ?? []}
            />
          </Section>

          {/* Education + Experience side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <Section title="🎓 Education">
              <Timeline items={candidate.education} type="education" />
            </Section>

            {(candidate.experience?.length > 0 || candidate.internships?.length > 0) && (
              <Section title="💼 Experience & Internships">
                <Timeline
                  items={[...(candidate.experience || []), ...(candidate.internships || [])]}
                  type="experience"
                />
              </Section>
            )}
          </div>

          {/* Projects */}
          {candidate.projects?.length > 0 && (
            <Section title="🚀 Projects">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {candidate.projects.map((proj, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      padding: '16px',
                      background: 'rgba(0,212,255,0.04)',
                      borderRadius: '12px',
                      borderLeft: '3px solid rgba(0,212,255,0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {proj.name || `Project ${i + 1}`}
                      </p>
                      {proj.link && (
                        <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: '#00d4ff', textDecoration: 'none' }}
                        >
                          🔗 View
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginTop: '6px', lineHeight: 1.5 }}>
                        {proj.description.slice(0, 220)}{proj.description.length > 220 ? '…' : ''}
                      </p>
                    )}
                    {proj.tech_stack?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {proj.tech_stack.map(t => (
                          <span key={t} className="skill-tag tech" style={{ fontSize: '0.7rem' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications + Hobbies */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {candidate.certifications?.length > 0 && (
              <Section title="🏅 Certifications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {candidate.certifications.map((cert, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      background: 'rgba(123,47,255,0.08)',
                      borderRadius: '10px',
                      border: '1px solid rgba(123,47,255,0.2)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{cert.name}</p>
                        {cert.issuer && <p style={{ fontSize: '0.72rem', color: '#7b2fff', marginTop: '2px' }}>{cert.issuer}</p>}
                      </div>
                      {cert.year && <span style={{ fontSize: '0.72rem', color: '#606070', whiteSpace: 'nowrap' }}>{cert.year}</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {candidate.hobbies?.length > 0 && (
              <Section title="🎯 Hobbies & Interests">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {candidate.hobbies.map((h, i) => (
                    <motion.span
                      key={h}
                      className="skill-tag soft"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {h}
                    </motion.span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ── Job Suggestions ── */}
          <Section title="🌌 Job Fit Analysis">
            <JobSuggestions
              recommended={candidate.job_suggestions?.recommended ?? []}
              notRecommended={candidate.job_suggestions?.not_recommended ?? []}
            />
          </Section>

        </div>
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } },
}

function getScoreColor(score) {
  if (score >= 70) return '#00ff88'
  if (score >= 45) return '#00d4ff'
  return '#ff2d78'
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function ScoreArc({ score, size = 70 }) {
  const radius     = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset      = circumference - (score / 100) * circumference
  const color       = getScoreColor(score)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  )
}

/**
 * CandidateCard — Floating glassmorphism card for dashboard grid.
 */
export default function CandidateCard({ candidate, index = 0, isTopPerformer = false }) {
  const navigate  = useNavigate()
  const score     = candidate.scores?.overall ?? 0
  const scoreColor = getScoreColor(score)
  const initials  = getInitials(candidate.name)
  const topSkills = candidate.skills?.technical?.slice(0, 3) ?? []
  const bestJob   = candidate.job_suggestions?.recommended?.[0]?.job_title ?? '—'

  const floatDelay = index * 0.25

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -12, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      onClick={() => navigate(`/candidate/${candidate.id}`)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        animation: `float ${3 + (index % 3) * 0.5}s ease-in-out infinite`,
        animationDelay: `${floatDelay}s`,
      }}
    >
      {/* Top performer badge */}
      {isTopPerformer && (
        <div style={{
          position: 'absolute',
          top: '-12px', right: '16px',
          zIndex: 10,
        }}>
          <span className="badge-top">⭐ Top Performer</span>
        </div>
      )}

      <div
        className="glass"
        style={{
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid',
          borderColor: isTopPerformer ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)',
          boxShadow: isTopPerformer
            ? '0 0 30px rgba(255,215,0,0.1), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${scoreColor}66`
          e.currentTarget.style.boxShadow = `0 0 30px ${scoreColor}22, 0 12px 40px rgba(0,0,0,0.5)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isTopPerformer ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'
          e.currentTarget.style.boxShadow = isTopPerformer
            ? '0 0 30px rgba(255,215,0,0.1), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header: avatar + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar */}
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${scoreColor}33, rgba(123,47,255,0.3))`,
            border: `2px solid ${scoreColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800,
            color: scoreColor,
            flexShrink: 0,
            boxShadow: `0 0 15px ${scoreColor}33`,
          }}>
            {initials}
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 700, fontSize: '1rem', color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {candidate.name || 'Unknown'}
            </p>
            <p style={{
              fontSize: '0.75rem', color: '#606070',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {candidate.email || '—'}
            </p>
          </div>

          {/* Score arc */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ScoreArc score={score} size={60} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 800, color: scoreColor,
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {Math.round(score)}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {candidate.is_fresher && <span className="badge-fresher">🌱 Fresher</span>}
          {bestJob !== '—' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 10px',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: '#00d4ff',
              borderRadius: '12px',
              fontSize: '0.72rem', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '160px',
            }}>
              💼 {bestJob}
            </span>
          )}
        </div>

        {/* Skill tags */}
        {topSkills.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {topSkills.map((skill, i) => (
              <motion.span
                key={skill}
                className="skill-tag tech"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                style={{ fontSize: '0.72rem' }}
              >
                {skill}
              </motion.span>
            ))}
            {(candidate.skills?.technical?.length ?? 0) > 3 && (
              <span style={{
                fontSize: '0.72rem', color: '#606070',
                display: 'flex', alignItems: 'center',
              }}>
                +{candidate.skills.technical.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* File info */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.72rem', color: '#404050' }}>
            {candidate.file_name?.substring(0, 22) || '—'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#404050' }}>
            {candidate.uploaded_at
              ? new Date(candidate.uploaded_at).toLocaleDateString()
              : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

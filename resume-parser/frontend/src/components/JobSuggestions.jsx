import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

/**
 * JobSuggestions — Flip card layout for recommended / not-recommended jobs.
 */
export default function JobSuggestions({ recommended = [], notRecommended = [] }) {
  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {/* Recommended */}
      <div style={{ flex: 1, minWidth: '280px' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
          color: '#00ff88', marginBottom: '16px',
          textShadow: '0 0 10px rgba(0,255,136,0.5)',
        }}>
          ✅ RECOMMENDED ROLES ({recommended.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommended.map((job, i) => (
            <motion.div
              key={job.job_title}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 80 }}
            >
              <JobFlipCard job={job} type="recommended" />
            </motion.div>
          ))}
          {recommended.length === 0 && (
            <p style={{ color: '#606070', fontSize: '0.85rem' }}>No recommendations generated.</p>
          )}
        </div>
      </div>

      {/* Not Recommended */}
      <div style={{ flex: 1, minWidth: '280px' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
          color: '#ff2d78', marginBottom: '16px',
          textShadow: '0 0 10px rgba(255,45,120,0.5)',
        }}>
          ❌ NOT RECOMMENDED ({notRecommended.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notRecommended.map((job, i) => (
            <motion.div
              key={job.job_title}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 80 }}
            >
              <JobFlipCard job={job} type="not_recommended" />
            </motion.div>
          ))}
          {notRecommended.length === 0 && (
            <p style={{ color: '#606070', fontSize: '0.85rem' }}>No data.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function JobFlipCard({ job, type }) {
  const [flipped, setFlipped] = useState(false)
  const isRec    = type === 'recommended'
  const color    = isRec ? '#00ff88' : '#ff2d78'
  const bgGlow   = isRec ? 'rgba(0,255,136,0.08)' : 'rgba(255,45,120,0.08)'
  const borderCol = isRec ? 'rgba(0,255,136,0.2)' : 'rgba(255,45,120,0.2)'

  return (
    <div
      style={{ height: '180px', perspective: '1000px', cursor: 'pointer' }}
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'relative', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: bgGlow,
          border: `1px solid ${borderCol}`,
          borderRadius: '16px',
          padding: '18px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Title + match */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', flex: 1 }}>
              {job.job_title}
            </p>
            <span style={{
              fontWeight: 800, color: color, fontSize: '1.1rem',
              fontFamily: 'Space Grotesk, sans-serif',
              textShadow: `0 0 10px ${color}66`,
            }}>
              {Math.round(job.match_percentage)}%
            </span>
          </div>

          {/* Match bar */}
          <div className="progress-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${job.match_percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${color}44, ${color})`,
                borderRadius: '3px',
                boxShadow: `0 0 6px ${color}44`,
              }}
            />
          </div>

          {/* Reason */}
          <p style={{ fontSize: '0.78rem', color: '#a0a0b0', lineHeight: 1.5, flex: 1 }}>
            {job.reason}
          </p>

          <p style={{ fontSize: '0.68rem', color: '#404050', textAlign: 'right' }}>
            Tap to flip →
          </p>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: isRec ? 'rgba(0,255,136,0.12)' : 'rgba(255,45,120,0.12)',
          border: `1px solid ${borderCol}`,
          borderRadius: '16px',
          padding: '18px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: color, letterSpacing: '0.15em' }}>
            {isRec ? '✅ MATCHED SKILLS' : '⚠️ MISSING SKILLS'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, alignContent: 'flex-start' }}>
            {(isRec ? job.matched_skills : job.missing_skills)?.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className={`skill-tag ${isRec ? 'matched' : 'missing'}`}
                style={{ fontSize: '0.72rem' }}
              >
                {skill}
              </span>
            ))}
            {(!isRec && (!job.missing_skills || job.missing_skills.length === 0)) && (
              <p style={{ color: '#606070', fontSize: '0.8rem' }}>All key skills present!</p>
            )}
          </div>
          <p style={{ fontSize: '0.68rem', color: '#404050' }}>
            Required: {job.required_skills?.slice(0,4).join(', ')}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * CountUp — animates a number from 0 to target.
 */
function CountUp({ end, duration = 1500, suffix = '', decimals = 0 }) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const start    = performance.now()
    const animate  = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(+(end * eased).toFixed(decimals))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration, decimals])

  return <>{value.toFixed(decimals)}{suffix}</>
}

/**
 * BatchSummary — Mission Complete screen with aggregate stats.
 */
export default function BatchSummary({ summary, candidates = [] }) {
  if (!summary) return null

  const topPerformer = candidates.find(c => c.id === summary.top_performer?.id)
  const skillEntries = Object.entries(summary.skill_distribution || {}).slice(0, 10)

  const stats = [
    { label: 'Total Parsed',   value: summary.total,         suffix: '',   icon: '🚀', color: '#00d4ff' },
    { label: 'Average Score',  value: summary.average_score, suffix: '%',  icon: '📊', color: '#7b2fff', decimals: 1 },
    { label: 'Top Score',      value: summary.max_score,     suffix: '%',  icon: '⭐', color: '#ffd700' },
    { label: 'Freshers',       value: summary.fresher_count, suffix: '',   icon: '🌱', color: '#00ff88' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Mission Complete Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎯</div>
        <h2 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00d4ff, #7b2fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}>
          Mission Complete
        </h2>
        <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>
          {summary.total} resume{summary.total !== 1 ? 's' : ''} parsed and analysed
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
      }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 80 }}
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: `1px solid ${stat.color}33`,
              textAlign: 'center',
              boxShadow: `0 0 20px ${stat.color}11`,
              animation: `float ${3 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{
              fontSize: '2rem', fontWeight: 900,
              color: stat.color,
              fontFamily: 'Space Grotesk, sans-serif',
              textShadow: `0 0 15px ${stat.color}66`,
            }}>
              <CountUp end={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#606070', marginTop: '4px' }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Top Performer Spotlight */}
      {topPerformer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 80 }}
          className="glass"
          style={{
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid rgba(255,215,0,0.3)',
            boxShadow: '0 0 40px rgba(255,215,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '40px' }}>🏆</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 700, letterSpacing: '0.15em' }}>
              TOP PERFORMER
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {topPerformer.name || summary.top_performer?.name}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#a0a0b0' }}>
              {topPerformer.email}
            </p>
          </div>
          <div style={{
            fontSize: '2.5rem', fontWeight: 900,
            color: '#ffd700',
            fontFamily: 'Space Grotesk, sans-serif',
            textShadow: '0 0 20px rgba(255,215,0,0.6)',
          }}>
            {Math.round(summary.top_performer?.score)}%
          </div>
        </motion.div>
      )}

      {/* Top Skills */}
      {skillEntries.length > 0 && (
        <div>
          <p className="section-heading">🔥 Most Common Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skillEntries.map(([skill, count], i) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: '20px',
                  animation: `float ${2.5 + (i % 5) * 0.4}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.3) % 3}s`,
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#00d4ff' }}>{skill}</span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(0,212,255,0.2)',
                  color: '#00d4ff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                }}>
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution */}
      {summary.score_distribution && (
        <div>
          <p className="section-heading">📊 Score Distribution</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(summary.score_distribution).map(([range, count]) => {
              const maxCount = Math.max(...Object.values(summary.score_distribution), 1)
              const pct = (count / maxCount) * 100
              return (
                <div key={range} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#606070', width: '60px', flexShrink: 0 }}>
                    {range}
                  </span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #00d4ff, #7b2fff)',
                        boxShadow: '0 0 6px rgba(0,212,255,0.4)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#a0a0b0', width: '20px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

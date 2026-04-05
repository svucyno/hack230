import { motion } from 'framer-motion'

function getScoreColor(score) {
  if (score >= 70) return '#00ff88'
  if (score >= 45) return '#00d4ff'
  return '#ff2d78'
}

/**
 * DonutChart — Animated SVG donut with glowing stroke.
 */
export function DonutChart({ score, size = 160, strokeWidth = 12 }) {
  const radius      = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset      = circumference - (score / 100) * circumference
  const color       = getScoreColor(score)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Glow fill */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}66)` }}
        />
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: size > 120 ? '2.2rem' : '1.4rem',
            fontWeight: 900,
            color: color,
            fontFamily: 'Space Grotesk, sans-serif',
            textShadow: `0 0 20px ${color}88`,
            lineHeight: 1,
          }}
        >
          {Math.round(score)}
        </motion.span>
        <span style={{ fontSize: '0.7rem', color: '#606070', marginTop: '2px' }}>/ 100</span>
      </div>
    </div>
  )
}

/**
 * ScoreBar — Horizontal comet-fill progress bar.
 */
export function ScoreBar({ label, score, delay = 0 }) {
  const color = getScoreColor(score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: '#a0a0b0', fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: '0.82rem', fontWeight: 700, color: color,
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          {Math.round(score)}%
        </span>
      </div>
      <div className="progress-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay }}
          style={{
            height: '100%',
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
            position: 'relative',
          }}
        >
          {/* Comet head */}
          <div style={{
            position: 'absolute',
            right: '-2px', top: '-3px',
            width: '8px', height: '8px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}88`,
          }} />
        </motion.div>
      </div>
    </div>
  )
}

/**
 * ScoreChart — Full score display: donut + section bars.
 */
export default function ScoreChart({ scores }) {
  if (!scores) return null

  const sections = [
    { label: 'Skills',         key: 'skills',         delay: 0.1 },
    { label: 'Education',      key: 'education',      delay: 0.2 },
    { label: 'Experience',     key: 'experience',     delay: 0.3 },
    { label: 'Projects',       key: 'projects',       delay: 0.4 },
    { label: 'Certifications', key: 'certifications', delay: 0.5 },
  ]

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Donut */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <DonutChart score={scores.overall} size={160} />
        <p style={{ fontSize: '0.75rem', color: '#606070', letterSpacing: '0.1em' }}>
          OVERALL SCORE
        </p>
      </div>

      {/* Bars */}
      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
        {sections.map(({ label, key, delay }) => (
          <ScoreBar
            key={key}
            label={label}
            score={scores[key] ?? 0}
            delay={delay}
          />
        ))}
      </div>
    </div>
  )
}

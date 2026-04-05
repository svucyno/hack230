import { motion } from 'framer-motion'

/**
 * Timeline — Vertical glowing node timeline for education/experience.
 */
export default function Timeline({ items = [], type = 'education' }) {
  if (!items.length) {
    return <p style={{ color: '#606070', fontSize: '0.85rem' }}>No data available.</p>
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '36px' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        left: '15px', top: '14px', bottom: '14px',
        width: '2px',
        background: 'linear-gradient(180deg, #00d4ff, #7b2fff, transparent)',
        borderRadius: '1px',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 100 }}
            style={{ position: 'relative', display: 'flex', gap: '0' }}
          >
            {/* Dot */}
            <div style={{
              position: 'absolute',
              left: '-28px', top: '4px',
              width: '14px', height: '14px',
              borderRadius: '50%',
              background: i === 0 ? '#00d4ff' : '#7b2fff',
              boxShadow: `0 0 10px ${i === 0 ? '#00d4ff' : '#7b2fff'}, 0 0 20px ${i === 0 ? 'rgba(0,212,255,0.3)' : 'rgba(123,47,255,0.3)'}`,
              zIndex: 1,
            }} />

            {/* Card */}
            <div
              className="glass"
              style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                flex: 1,
              }}
            >
              {type === 'education' && (
                <>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                    {item.degree || '—'}
                  </p>
                  <p style={{ color: '#00d4ff', fontSize: '0.82rem', marginTop: '2px' }}>
                    {item.institution || '—'}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    {item.year && (
                      <span style={{ fontSize: '0.75rem', color: '#606070' }}>📅 {item.year}</span>
                    )}
                    {item.gpa && (
                      <span style={{ fontSize: '0.75rem', color: '#00ff88' }}>GPA: {item.gpa}</span>
                    )}
                  </div>
                </>
              )}

              {type === 'experience' && (
                <>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                    {item.role || '—'}
                  </p>
                  <p style={{ color: '#00d4ff', fontSize: '0.82rem', marginTop: '2px' }}>
                    {item.company || '—'}
                  </p>
                  {item.duration && (
                    <p style={{ fontSize: '0.75rem', color: '#606070', marginTop: '4px' }}>
                      ⏱ {item.duration}
                    </p>
                  )}
                  {item.description && (
                    <p style={{ fontSize: '0.78rem', color: '#a0a0b0', marginTop: '8px', lineHeight: 1.5 }}>
                      {item.description.slice(0, 200)}{item.description.length > 200 ? '…' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

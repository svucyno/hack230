import { motion } from 'framer-motion'

/**
 * SkillTags — Floating levitating skill pill badges with staggered delays.
 */
export default function SkillTags({ technical = [], soft = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {technical.length > 0 && (
        <div>
          <p className="section-heading">⚡ Technical Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {technical.map((skill, i) => (
              <motion.span
                key={skill}
                className="skill-tag tech"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4, scale: 1.08 }}
                style={{
                  animation: `float ${2.5 + (i % 5) * 0.4}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.3) % 2}s`,
                }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {soft.length > 0 && (
        <div>
          <p className="section-heading">🧠 Soft Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {soft.map((skill, i) => (
              <motion.span
                key={skill}
                className="skill-tag soft"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4, scale: 1.08 }}
                style={{
                  animation: `float ${2.8 + (i % 4) * 0.5}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.25) % 2.5}s`,
                }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {technical.length === 0 && soft.length === 0 && (
        <p style={{ color: '#606070', fontSize: '0.85rem' }}>No skills extracted.</p>
      )}
    </div>
  )
}

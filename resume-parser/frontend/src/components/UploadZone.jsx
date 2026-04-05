import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * UploadZone — Wormhole portal styled drag-and-drop file uploader.
 */
export default function UploadZone({ onFilesSelected, uploadedFiles, onRemoveFile }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt')
    )
    if (files.length) onFilesSelected(files)
  }, [onFilesSelected])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    if (files.length) onFilesSelected(files)
    e.target.value = ''
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>

      {/* ── Wormhole Portal ── */}
      <div style={{ position: 'relative', width: '320px', height: '320px' }}>

        {/* Outer orbit ring */}
        <div style={{
          position: 'absolute', inset: '-20px',
          borderRadius: '50%',
          border: '2px solid transparent',
          backgroundImage: 'conic-gradient(from 0deg, transparent 0%, #00d4ff 30%, #7b2fff 60%, transparent 100%)',
          backgroundClip: 'border-box',
          WebkitMaskComposite: 'xor',
          animation: 'orbitRing 3s linear infinite',
          zIndex: 2,
        }} />

        {/* Inner orbit ring */}
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          border: '1px dashed rgba(123, 47, 255, 0.4)',
          animation: 'orbitRingReverse 6s linear infinite',
          zIndex: 2,
        }} />

        {/* Main drop zone */}
        <motion.div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: isDragging
              ? 'radial-gradient(circle at center, rgba(0,212,255,0.25) 0%, rgba(123,47,255,0.15) 50%, rgba(0,0,0,0.4) 100%)'
              : 'radial-gradient(circle at center, rgba(0,212,255,0.10) 0%, rgba(123,47,255,0.08) 50%, rgba(0,0,0,0.5) 100%)',
            border: `2px solid ${isDragging ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.3)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 3,
            animation: 'wormholePulse 3s ease-in-out infinite',
            transition: 'border-color 0.3s ease, background 0.3s ease',
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          {/* Rocket icon */}
          <motion.div
            animate={{ y: isDragging ? -8 : [0, -6, 0] }}
            transition={isDragging ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '56px', lineHeight: 1 }}
          >
            🚀
          </motion.div>

          <div style={{ textAlign: 'center', padding: '0 30px' }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#00d4ff',
              textShadow: '0 0 10px rgba(0,212,255,0.6)',
              marginBottom: '6px',
            }}>
              {isDragging ? 'Release into the void...' : 'Drop Resumes Into The Void'}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#606070' }}>
              PDF · DOCX · TXT
            </p>
          </div>

          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </motion.div>

        {/* Orbiting dot */}
        <div style={{
          position: 'absolute',
          width: '350px', height: '350px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'orbitRing 4s linear infinite',
          zIndex: 2,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute',
            top: '-5px', left: '50%',
            width: '10px', height: '10px',
            background: '#00d4ff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #00d4ff, 0 0 20px rgba(0,212,255,0.5)',
          }} />
        </div>
      </div>

      {/* ── Uploaded Files List ── */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <p className="section-heading" style={{ textAlign: 'center' }}>
              📂 {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} queued
            </p>

            {uploadedFiles.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="glass glow-border-blue"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  animation: `float ${3 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                <span style={{ fontSize: '24px' }}>
                  {file.name.endsWith('.pdf') ? '📄' : file.name.endsWith('.docx') ? '📝' : '📃'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#606070' }}>
                    {formatSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(i) }}
                  style={{
                    background: 'rgba(255,45,120,0.15)',
                    border: '1px solid rgba(255,45,120,0.3)',
                    borderRadius: '8px',
                    color: '#ff2d78',
                    width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,120,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,45,120,0.15)'}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

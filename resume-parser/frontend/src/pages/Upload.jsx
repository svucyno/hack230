import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from 'axios'
import StarField from '../components/StarField'
import UploadZone from '../components/UploadZone'

const API = 'http://localhost:8000'

export default function Upload() {
  const [files,      setFiles]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [progress,   setProgress]   = useState(0)   // 0–100
  const navigate = useNavigate()

  const handleFilesSelected = (newFiles) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      const unique   = newFiles.filter(f => !existing.has(f.name))
      return [...prev, ...unique]
    })
  }

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleLaunch = async () => {
    if (!files.length) {
      toast.error('Add at least one resume first!')
      return
    }

    setLoading(true)
    setProgress(0)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    try {
      const res = await axios.post(`${API}/upload-resumes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / (e.total || 1)))
        },
      })

      const { parsed, errors, total } = res.data

      if (errors?.length) {
        errors.forEach(err => toast.error(`${err.file}: ${err.error}`, { duration: 5000 }))
      }

      if (total > 0) {
        toast.success(`✅ ${total} resume${total > 1 ? 's' : ''} parsed successfully!`)
        setTimeout(() => navigate('/dashboard'), 800)
      } else {
        toast.error('No resumes could be parsed. Check file formats.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Backend error. Is the FastAPI server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <StarField count={180} />

      {/* Hero content */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
        padding: '100px 24px 60px',
        gap: '48px',
      }}>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ textAlign: 'center' }}
        >
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.3em', color: '#00d4ff',
            textShadow: '0 0 10px rgba(0,212,255,0.6)',
            marginBottom: '12px',
          }}>
            ◈ ANTI-GRAVITY RESUME PARSER ◈
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            <span className="gradient-text">Resume</span>
            <span style={{ color: '#fff' }}> Launch </span>
            <span className="gradient-text">Pad</span>
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>
            Upload your resumes into the void.
            Our AI will parse, score, and match them to perfect job roles.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 80 }}
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <UploadZone
            onFilesSelected={handleFilesSelected}
            uploadedFiles={files}
            onRemoveFile={handleRemoveFile}
          />
        </motion.div>

        {/* Launch Button */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '320px' }}
            >
              {/* Progress bar (shown while uploading) */}
              {loading && (
                <div style={{ width: '100%' }}>
                  <div className="progress-track" style={{ height: '8px', borderRadius: '4px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #00d4ff, #7b2fff)',
                        borderRadius: '4px',
                        boxShadow: '0 0 10px rgba(0,212,255,0.6)',
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        position: 'absolute', right: '-2px', top: '-4px',
                        width: '16px', height: '16px',
                        background: '#fff', borderRadius: '50%',
                        boxShadow: '0 0 8px #00d4ff',
                      }} />
                    </motion.div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#606070', textAlign: 'center', marginTop: '6px' }}>
                    Transmitting to the void... {progress}%
                  </p>
                </div>
              )}

              <motion.button
                className="btn-primary"
                onClick={handleLaunch}
                disabled={loading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                animate={loading ? {} : { y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '1.05rem',
                  padding: '16px 32px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🌀</span>
                    Parsing resumes...
                  </>
                ) : (
                  <>🚀 Launch Parser</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text */}
        {files.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ color: '#404050', fontSize: '0.82rem', textAlign: 'center' }}
          >
            Supports PDF, DOCX and TXT · Upload multiple files at once
          </motion.p>
        )}
      </div>
    </div>
  )
}

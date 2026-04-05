import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import CandidateProfile from './pages/CandidateProfile'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25 } },
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 35, 0.95)',
            color: '#fff',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontFamily: 'Outfit, sans-serif',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#0a0a0f' },
          },
          error: {
            iconTheme: { primary: '#ff2d78', secondary: '#0a0a0f' },
          },
        }}
      />

      <Navbar />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageWrapper><Upload /></PageWrapper>} />
          <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/candidate/:id" element={<PageWrapper><CandidateProfile /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}

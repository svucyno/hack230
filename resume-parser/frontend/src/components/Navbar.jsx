import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: '🚀 Launch Pad' },
  { to: '/dashboard', label: '🛰 Mission Control' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4ff, #7b2fff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 0 15px rgba(0,212,255,0.4)',
        }}>
          🪐
        </div>
        <span style={{
          fontWeight: 800, fontSize: '1.1rem',
          background: 'linear-gradient(135deg, #00d4ff, #7b2fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          ResumeOrbit
        </span>
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {navLinks.map(({ to, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: active ? '#00d4ff' : '#a0a0b0',
                background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: active ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

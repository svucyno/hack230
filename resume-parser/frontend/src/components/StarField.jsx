import { useEffect, useRef } from 'react'

/**
 * StarField — Pure CSS animated star background.
 * Renders N stars as divs with random positions + animation params.
 */
export default function StarField({ count = 150 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear existing stars
    container.innerHTML = ''

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div')
      star.className = 'star'

      const size    = Math.random() * 2.5 + 0.5  // 0.5–3px
      const x       = Math.random() * 100
      const y       = Math.random() * 100
      const dur     = Math.random() * 4 + 2       // 2–6s
      const delay   = Math.random() * 6           // 0–6s
      const maxOp   = Math.random() * 0.6 + 0.3   // 0.3–0.9

      star.style.cssText = `
        width:  ${size}px;
        height: ${size}px;
        left:   ${x}%;
        top:    ${y}%;
        --dur:    ${dur}s;
        --delay:  ${delay}s;
        --max-op: ${maxOp};
        animation-delay: ${delay}s;
      `
      container.appendChild(star)
    }

    // Occasional shooting star
    const shootInterval = setInterval(() => {
      const shoot = document.createElement('div')
      shoot.style.cssText = `
        position: absolute;
        height: 1px;
        width: ${Math.random() * 120 + 60}px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
        top: ${Math.random() * 60}%;
        left: ${Math.random() * 70}%;
        transform: rotate(${-15 + Math.random() * 30}deg);
        animation: shootingStar 0.8s ease-out forwards;
        pointer-events: none;
      `
      container.appendChild(shoot)
      setTimeout(() => shoot.remove(), 900)
    }, 3500)

    return () => clearInterval(shootInterval)
  }, [count])

  return (
    <>
      <style>{`
        @keyframes shootingStar {
          from { opacity: 1; transform: translateX(0) rotate(-20deg); }
          to   { opacity: 0; transform: translateX(200px) rotate(-20deg); }
        }
      `}</style>
      <div
        ref={containerRef}
        className="star-bg"
        aria-hidden="true"
      />
    </>
  )
}

'use client'

import Globe from '../components/Globe'

export default function Page() {
  return (
    <main className="page">
      {/* blurred glow background */}
      <div className="glow" />
      <Globe />
      <div className="credit">Three.js globe • Next.js • Vercel-ready</div>
    </main>
  )
}

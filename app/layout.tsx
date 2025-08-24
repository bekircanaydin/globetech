export const metadata = {
  title: 'ThreeJS Globe • Next.js',
  description: 'Interactive globe with hoverable regions and blurred background'
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

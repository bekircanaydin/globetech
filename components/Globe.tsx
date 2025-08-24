\
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { latLngToVector3 } from '../lib/latLngToVector3'
import { REGIONS, type Region } from '../lib/regions'

type HoverState = { region: Region; screen: { x: number; y: number } } | null

export default function Globe() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const [hover, setHover] = useState<HoverState>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0) // transparent canvas over black bg
    container.appendChild(renderer.domElement)

    // Resize handling
    const onResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(container)

    // Lights (subtle)
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.4)
    dir.position.set(5, 3, 5)
    scene.add(dir)

    // Globe group
    const globe = new THREE.Group()
    scene.add(globe)

    const R = 2

    // 1) Base sphere (dark, gives body)
    const base = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    )
    globe.add(base)

    // 2) Wireframe outline
    const wire = new THREE.WireframeGeometry(new THREE.SphereGeometry(R, 32, 16))
    const line = new THREE.LineSegments(
      wire,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.12, transparent: true })
    )
    globe.add(line)

    // 3) Longitude/Latitude dashed lines for that "technical" look
    const grid = new THREE.Group()
    const gridMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.07,
      gapSize: 0.03,
      opacity: 0.35,
      transparent: true
    })

    // latitude rings
    for (let lat = -60; lat <= 60; lat += 20) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 360; i += 3) {
        const p = latLngToVector3(lat, i - 180, R + 0.001)
        pts.push(new THREE.Vector3(p.x, p.y, p.z))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const l = new THREE.Line(geo, gridMat)
      l.computeLineDistances()
      grid.add(l)
    }
    // longitude arcs
    for (let lng = -180; lng < 180; lng += 20) {
      const pts: THREE.Vector3[] = []
      for (let lat = -80; lat <= 80; lat += 3) {
        const p = latLngToVector3(lat, lng, R + 0.001)
        pts.push(new THREE.Vector3(p.x, p.y, p.z))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const l = new THREE.Line(geo, gridMat)
      l.computeLineDistances()
      grid.add(l)
    }
    globe.add(grid)

    // 4) Dotted "coastline vibe" using uniformly distributed points on the sphere surface
    const POINTS = 3500
    const positions = new Float32Array(POINTS * 3)
    // Fibonacci sphere distribution
    const gr = (1 + Math.sqrt(5)) / 2
    for (let i = 0; i < POINTS; i++) {
      const t = i / POINTS
      const lat = Math.asin(2 * t - 1) * (180 / Math.PI) // -90..90 approx mapping
      const lng = (360 * i / gr) % 360 - 180
      const { x, y, z } = latLngToVector3(lat, lng, R + 0.005)
      positions[i * 3 + 0] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    const ptsGeo = new THREE.BufferGeometry()
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const ptsMat = new THREE.PointsMaterial({ size: 0.01, color: 0xffffff, opacity: 0.65, transparent: true })
    const points = new THREE.Points(ptsGeo, ptsMat)
    globe.add(points)

    // 5) Regions (hotspots)
    const hotspots = new THREE.Group()
    scene.add(hotspots)
    const hotspotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.0, transparent: true })
    REGIONS.forEach((r) => {
      const { x, y, z } = latLngToVector3(r.lat, r.lng, R + 0.03)
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), hotspotMat.clone())
      m.position.set(x, y, z)
      // face outward
      m.lookAt(new THREE.Vector3(0,0,0))
      ;(m as any).userData = { region: r }
      hotspots.add(m)

      // small visible dot for the region
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      dot.position.set(x, y, z)
      globe.add(dot)
    })

    // Raycasting for hover
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-10, -10) // off-screen initially

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    container.addEventListener('mousemove', onMouseMove)

    // Drag to rotate
    let isDragging = false
    let lastX = 0, lastY = 0
    const onDown = (e: MouseEvent) => { isDragging = true; lastX = e.clientX; lastY = e.clientY }
    const onUp = () => { isDragging = false }
    const onDrag = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX; lastY = e.clientY
      globe.rotation.y += dx * 0.005
      globe.rotation.x += dy * 0.003
    }
    container.addEventListener('mousedown', onDown)
    container.addEventListener('mouseup', onUp)
    container.addEventListener('mouseleave', onUp)
    container.addEventListener('mousemove', onDrag)

    // Auto-rotate
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getDelta()
      globe.rotation.y += 0.02 * t

      // Hover logic
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(hotspots.children, false)
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh
        const region: Region = (obj as any).userData.region
        // project to screen for tooltip position
        const v = obj.position.clone().project(camera)
        const x = (v.x + 1) / 2 * container.clientWidth
        const y = (-v.y + 1) / 2 * container.clientHeight
        setHover({ region, screen: { x, y } })
      } else {
        setHover((prev) => prev ? null : prev)
      }

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mousedown', onDown)
      container.removeEventListener('mouseup', onUp)
      container.removeEventListener('mouseleave', onUp)
      container.removeEventListener('mousemove', onDrag)

      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.clear()
    }
  }, [])

  return (
    <div ref={mountRef} className="globe-wrap">
      {hover && (
        <div
          ref={tooltipRef}
          className="tooltip"
          style={{ left: hover.screen.x + 14, top: hover.screen.y - 10 }}
        >
          <div className="tooltip-title">{hover.region.title}</div>
          {hover.region.subtitle && <div className="tooltip-sub">{hover.region.subtitle}</div>}
          {hover.region.phone && <div className="tooltip-sub">{hover.region.phone}</div>}
        </div>
      )}
    </div>
  )
}

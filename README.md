# ThreeJS Globe (Next.js • Vercel)

Interactive Three.js globe with hoverable, data‑driven regions and a blurred black background (≈90px).

## Features
- Hover to show tooltip cards (title, subtitle, phone).
- Regions are defined in `lib/regions.ts` (lat/lng in degrees).
- Draggable rotation + gentle autorotate.
- Crisp lines/dots aesthetic similar to the reference image.
- Background is black with a large blurred glow (CSS filter: blur(90px)).
- Ready for Vercel (Next.js 14, App Router, TypeScript).

## Quick Start
```bash
pnpm i  # or npm i / yarn
pnpm dev  # http://localhost:3000
```
> To deploy to Vercel, push this folder to a Git repo and click **Import** in Vercel.

## Add / Edit Regions
Open `lib/regions.ts` and add entries:
```ts
export const REGIONS = [
  { id: 'usa-la', lat: 34.0522, lng: -118.2437, title: 'USA', subtitle: 'Los Angeles, Beverly Hills 55a', phone: '+1 213-555-0173' },
  { id: 'uk-lon', lat: 51.5074, lng: -0.1278, title: 'United Kingdom', subtitle: 'London, Borton str. 88', phone: '+44 20 7946 0958' },
  // add more...
]
```

## Notes
- The globe uses custom lat/long grid + dotted surface to approximate the wireframe/outline look while remaining lightweight and dependency‑free.
- Tooltip position is computed by projecting the hotspot position to screen space.
- If you want coastline outlines from GeoJSON (instead of a dotted sphere), you can later integrate `three-globe` and feed world polygon data.

Enjoy!

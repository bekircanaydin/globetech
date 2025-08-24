export type Region = {
  id: string
  lat: number
  lng: number
  title: string
  subtitle?: string
  phone?: string
  radiusKm?: number
}

export const REGIONS: Region[] = [
  {
    id: 'usa-la',
    lat: 34.0522,
    lng: -118.2437,
    title: 'USA',
    subtitle: 'Los Angeles, Beverly Hills 55a',
    phone: '+1 213-555-0173'
  },
  {
    id: 'uk-lon',
    lat: 51.5074,
    lng: -0.1278,
    title: 'United Kingdom',
    subtitle: 'London, Borton str. 88',
    phone: '+44 20 7946 0958'
  }
]

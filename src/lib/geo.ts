import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import countries110m from 'world-atlas/countries-110m.json'

export type Country = {
  id: string
  name: string
  feature: Feature<Polygon | MultiPolygon>
  /** Center of the largest landmass, so France flies to France and not the Atlantic. */
  center: [number, number]
  bounds: [[number, number], [number, number]]
}

export type LandDot = { lng: number; lat: number; country: string }

let cache: { countries: Country[]; byId: Map<string, Country>; dots: LandDot[] } | null = null

function inRing([x, y]: [number, number], ring: Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Countries plus a halftone grid of land dots, each tagged with its country. Built once. */
export function loadGeo() {
  if (cache) return cache
  const topo = countries110m as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
  const fc = feature(topo, topo.objects.countries) as unknown as {
    features: (Feature<Polygon | MultiPolygon, { name: string }> & { id?: string })[]
  }

  const countries: Country[] = []
  const dots: LandDot[] = []
  const step = 1.3

  for (const f of fc.features) {
    const id = f.id ?? f.properties.name
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    let largest = polygons[0]
    let largestArea = 0
    for (const poly of polygons) {
      const a = d3.geoArea({ type: 'Polygon', coordinates: poly })
      if (a > largestArea) [largest, largestArea] = [poly, a]

      let [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds({ type: 'Polygon', coordinates: poly })
      if (minLng > maxLng) [minLng, maxLng] = [-180, 180] // spans the antimeridian
      for (let lng = Math.ceil(minLng / step) * step; lng <= maxLng; lng += step) {
        for (let lat = Math.ceil(minLat / step) * step; lat <= maxLat; lat += step) {
          const p: [number, number] = [lng, lat]
          if (inRing(p, poly[0]) && !poly.slice(1).some((hole) => inRing(p, hole))) dots.push({ lng, lat, country: id })
        }
      }
    }
    countries.push({
      id,
      name: f.properties.name === 'United States of America' ? 'United States' : f.properties.name,
      feature: f,
      center: d3.geoCentroid({ type: 'Polygon', coordinates: largest }),
      bounds: d3.geoBounds(f),
    })
  }

  countries.sort((a, b) => a.name.localeCompare(b.name))
  cache = { countries, byId: new Map(countries.map((c) => [c.id, c])), dots }
  return cache
}

/** The country under a lng/lat point, if any. */
export function countryAt(lng: number, lat: number) {
  for (const c of loadGeo().countries) {
    const [[minLng, minLat], [maxLng, maxLat]] = c.bounds
    if (lat < minLat || lat > maxLat) continue
    if (minLng <= maxLng && (lng < minLng || lng > maxLng)) continue
    if (d3.geoContains(c.feature, [lng, lat])) return c
  }
  return null
}

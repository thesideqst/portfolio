import { useSyncExternalStore } from 'react'

// Which sky is behind the page: deep space, or a night flight over the world's cities.
// Remembered between visits.

export type SkyMode = 'stars' | 'flight'

const STORAGE_KEY = 'sky-mode'
const listeners = new Set<() => void>()

let mode: SkyMode = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'flight' ? 'flight' : 'stars'
  } catch {
    return 'stars'
  }
})()

export function setSkyMode(next: SkyMode) {
  mode = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Private mode etc.; the choice just won't be remembered.
  }
  listeners.forEach((l) => l())
}

export function useSkyMode() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => mode,
  )
}

// Where the night flight is, for the route caption under the toggle.
export type FlightStatus = { from: string; to: string; km: number } | null

const flightListeners = new Set<() => void>()
let flight: FlightStatus = null

/** Called by the flight a few times a second; only notifies when the caption would change. */
export function setFlightStatus(next: FlightStatus) {
  const round = (s: FlightStatus) => s && { ...s, km: Math.max(0, Math.round(s.km / 10) * 10) }
  const a = round(flight), b = round(next)
  if (a?.from === b?.from && a?.to === b?.to && a?.km === b?.km) return
  flight = b
  flightListeners.forEach((l) => l())
}

export function useFlightStatus() {
  return useSyncExternalStore(
    (l) => {
      flightListeners.add(l)
      return () => flightListeners.delete(l)
    },
    () => flight,
  )
}

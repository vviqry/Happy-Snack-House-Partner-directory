/**
 * Smart Google Maps Helper Utility (proven pattern from Fruity Candy)
 * Parses either <iframe> HTML (Street View or Map embed) OR raw Coordinate Strings.
 * Returns an object containing both the visual preview iframeUrl AND parsed GPS coordinates.
 */

export interface MapParseResult {
  iframeUrl: string
  coordinates: { lat: number; lng: number } | null
}

export interface ParsedMap {
  raw: string
  embedUrl: string | null
  navigationUrl: string
  hasEmbed: boolean
  coords: { lat: number; lng: number } | null
}

/**
 * Extracts latitude and longitude from any Google Maps string format:
 * - Street View / Embed pb parameters (!1d-0.22914!2d100.63125 or !3d-0.22914!2d100.63125 or !2d100.63125!3d-0.22914)
 * - @lat,lng URLs
 * - q=lat,lng, ll=lat,lng, or destination=lat,lng query params
 * - /maps/dir/lat,lng or /maps/dir/.../lat,lng
 * - Raw coordinate string (e.g. "-0.22914, 100.63125")
 */
export function extractCoordinates(input: string): { lat: number; lng: number } | null {
  if (!input) return null

  // 1. Match Street View or Embed pb params (!1d or !3d or !4d for lat, !2d for lng)
  const pbLatMatch = input.match(/!(?:1d|3d|4d)(-?\d+\.\d+)/)
  const pbLngMatch = input.match(/!2d(-?\d+\.\d+)/)
  if (pbLatMatch && pbLngMatch) {
    const val1 = parseFloat(pbLatMatch[1])
    const val2 = parseFloat(pbLngMatch[1])
    // Determine which is lat (-90 to 90) and which is lng (-180 to 180)
    if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
      return { lat: val1, lng: val2 }
    } else if (Math.abs(val2) <= 90 && Math.abs(val1) <= 180) {
      return { lat: val2, lng: val1 }
    }
  }

  // 1b. Check for standard place pin pb: !3d<lat>!4d<lng>
  const pb3d4d = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (pb3d4d) {
    const lat = parseFloat(pb3d4d[1])
    const lng = parseFloat(pb3d4d[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }

  // 2. Match @lat,lng in Google Maps URLs (e.g. @-0.22914,100.63125)
  const atMatch = input.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (atMatch) {
    const lat = parseFloat(atMatch[1])
    const lng = parseFloat(atMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }

  // 3. Match q=lat,lng, ll=lat,lng, or destination=lat,lng
  const qMatch = input.match(/(?:q|ll|destination)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (qMatch) {
    const lat = parseFloat(qMatch[1])
    const lng = parseFloat(qMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }

  // 4. Match /maps/dir/... destination coordinates
  if (input.includes('/maps/dir/')) {
    const dirMatches = [...input.matchAll(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/g)]
    if (dirMatches.length > 0) {
      // In directions URL, take the destination pair (the second pair if 2 pairs exist)
      const match = dirMatches[dirMatches.length > 1 ? 1 : 0]
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng }
      }
    }
  }

  // 5. Match raw coordinate string: e.g. "-0.22914, 100.63125" or "-0.22914 100.63125"
  const rawMatch = input.match(/(-?\d+\.\d+)\s*[\s,]\s*(-?\d+\.\d+)/)
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1])
    const lng = parseFloat(rawMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }

  return null
}

/**
 * Smart Logic Parser:
 * - If input is <iframe>: extracts src for iframeUrl AND extracts (lat, lng) for coordinates.
 * - If input is Coordinates: stores (lat, lng) AND dynamically generates iframeUrl.
 * Returns { iframeUrl, coordinates }
 */
export function parseMapInputDetails(input: string): MapParseResult {
  const trimmed = (input || '').trim()

  if (!trimmed) {
    return { iframeUrl: '', coordinates: null }
  }

  // Extract coordinates
  const coords = extractCoordinates(trimmed)

  // Determine visual iframeUrl
  let iframeUrl = ''

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/)
  if (srcMatch) {
    // Full <iframe> tag provided by user
    iframeUrl = srcMatch[1]
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Direct URL provided
    if (trimmed.includes('google.com/maps/embed') || trimmed.includes('output=embed')) {
      iframeUrl = trimmed
    } else if (coords) {
      iframeUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`
    } else {
      iframeUrl = trimmed
    }
  } else if (coords) {
    // Raw coordinates provided -> generate dynamic Google Maps embed iframeUrl
    iframeUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`
  } else {
    // Fallback query embed
    iframeUrl = `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`
  }

  return {
    iframeUrl,
    coordinates: coords,
  }
}

/**
 * Generates direct Turn-by-Turn GPS Navigation URL using parsed coordinates.
 * Format: https://www.google.com/maps/dir/?api=1&destination=lat,lng
 * Fallback to locationName query if coordinates are null.
 */
export function getDirectionsUrl(input: string, locationName: string = ''): string {
  const result = parseMapInputDetails(input)
  if (result.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${result.coordinates.lat},${result.coordinates.lng}`
  }

  if (locationName && locationName.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName.trim())}`
  }

  if (result.iframeUrl && !result.iframeUrl.includes('/maps/embed')) {
    return result.iframeUrl
  }

  return 'https://www.google.com/maps'
}

/**
 * Extracts visual iframe src for embed rendering.
 */
export function getIframeSrc(input: string): string {
  return parseMapInputDetails(input).iframeUrl
}

/**
 * Compatibility wrapper for existing codebase
 */
export function parseMapInput(input?: string): ParsedMap {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      raw: '',
      embedUrl: null,
      navigationUrl: '',
      hasEmbed: false,
      coords: null,
    }
  }

  const trimmed = input.trim()
  const details = parseMapInputDetails(trimmed)
  const isEmbed =
    details.iframeUrl.includes('google.com/maps/embed') ||
    details.iframeUrl.includes('output=embed') ||
    trimmed.includes('<iframe')

  return {
    raw: trimmed,
    embedUrl: isEmbed ? details.iframeUrl : (details.coordinates ? `https://maps.google.com/maps?q=${details.coordinates.lat},${details.coordinates.lng}&output=embed` : null),
    navigationUrl: getDirectionsUrl(trimmed),
    hasEmbed: isEmbed || !!details.coordinates,
    coords: details.coordinates,
  }
}

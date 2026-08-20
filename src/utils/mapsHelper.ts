export interface ParsedMap {
  raw: string
  embedUrl: string | null
  navigationUrl: string
  hasEmbed: boolean
  coords: { lat: number; lng: number } | null
}

/** Check if a URL is a Google Maps embed URL (not openable in browser tab) */
function isEmbedUrl(url: string): boolean {
  return url.includes('/maps/embed') || url.includes('output=embed')
}

/**
 * Smart Parser for Google Maps inputs:
 * - Supports full <iframe>...</iframe> tags (Standard Maps & Street View 360)
 * - Supports raw embed URLs (https://www.google.com/maps/embed?...)
 * - Supports Google Maps place / share URLs (https://maps.app.goo.gl/..., @lat,lng)
 * - Supports plain coordinates string ("-0.175215, 100.588168")
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

  const raw = input.trim()
  let srcUrl: string | null = null

  // 1. Check for <iframe> tag
  const iframeSrcMatch = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    srcUrl = iframeSrcMatch[1]
  } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
    srcUrl = raw
  }

  // 2. Extract coordinates
  let coords: { lat: number; lng: number } | null = null

  // A. Coordinates from string directly (e.g. "-0.175215, 100.588168")
  const plainCoordMatch = raw.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/)
  if (plainCoordMatch) {
    const lat = parseFloat(plainCoordMatch[1])
    const lng = parseFloat(plainCoordMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      coords = { lat, lng }
    }
  }

  // B. Coordinates from Google Maps embed / Street View URL
  if (!coords && srcUrl) {
    // Check for standard place pin !3d<lat>!4d<lng>
    const pb3d4d = srcUrl.match(/!3d([+-]?\d+(?:\.\d+)?)!4d([+-]?\d+(?:\.\d+)?)/)
    if (pb3d4d) {
      const lat = parseFloat(pb3d4d[1])
      const lng = parseFloat(pb3d4d[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        coords = { lat, lng }
      }
    }

    // Check for !2d<lng>!3d<lat> (Street View / Maps viewport)
    if (!coords) {
      const pb2d3d = srcUrl.match(/!2d([+-]?\d+(?:\.\d+)?)!3d([+-]?\d+(?:\.\d+)?)/)
      if (pb2d3d) {
        const val1 = parseFloat(pb2d3d[1])
        const val2 = parseFloat(pb2d3d[2])
        if (Math.abs(val1) <= 180 && Math.abs(val2) <= 90) {
          coords = { lat: val2, lng: val1 }
        } else if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
          coords = { lat: val1, lng: val2 }
        }
      }
    }

    if (!coords) {
      const pb3d2d = srcUrl.match(/!3d([+-]?\d+(?:\.\d+)?)!2d([+-]?\d+(?:\.\d+)?)/)
      if (pb3d2d) {
        const val1 = parseFloat(pb3d2d[1])
        const val2 = parseFloat(pb3d2d[2])
        if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
          coords = { lat: val1, lng: val2 }
        }
      }
    }

    // C. Coordinates from @lat,lng in URL
    if (!coords) {
      const atMatch = srcUrl.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/)
      if (atMatch) {
        const lat = parseFloat(atMatch[1])
        const lng = parseFloat(atMatch[2])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coords = { lat, lng }
        }
      }
    }

    // D. Coordinates from query params (q=lat,lng or destination=lat,lng or ll=lat,lng)
    if (!coords) {
      const queryCoordMatch = srcUrl.match(
        /[?&](?:q|destination|ll|center)=([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/
      )
      if (queryCoordMatch) {
        const lat = parseFloat(queryCoordMatch[1])
        const lng = parseFloat(queryCoordMatch[2])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coords = { lat, lng }
        }
      }
    }

    // E. Coordinates from /maps/dir/... URLs (Google Maps Directions)
    if (!coords && srcUrl.includes('/maps/dir/')) {
      const dirMatches = [...srcUrl.matchAll(/([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/g)]
      if (dirMatches.length > 0) {
        // Take the destination coordinate (last coordinate pair before viewport /@)
        const match = dirMatches[dirMatches.length > 1 ? 1 : 0]
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coords = { lat, lng }
        }
      }
    }
  }

  // 3. Determine Embed URL
  let embedUrl: string | null = null
  if (
    srcUrl &&
    (srcUrl.includes('google.com/maps/embed') ||
      srcUrl.includes('output=embed') ||
      srcUrl.includes('maps.google.com/maps?'))
  ) {
    embedUrl = srcUrl
  } else if (coords) {
    embedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=id&z=17&output=embed`
  }

  // 4. Determine Navigation URL — NEVER use embed URLs
  let navigationUrl = ''
  if (coords) {
    // Best case: we have coordinates → build a proper directions URL
    navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
  } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // Raw input is a URL — use it only if it's NOT an embed URL
    if (!isEmbedUrl(raw)) {
      navigationUrl = raw
    }
  }

  // Fallback: if we still don't have a navigation URL
  if (!navigationUrl) {
    if (srcUrl && !isEmbedUrl(srcUrl)) {
      // srcUrl is a non-embed URL (unlikely but handle it)
      navigationUrl = srcUrl
    } else if (srcUrl && isEmbedUrl(srcUrl)) {
      // Convert embed URL → regular Google Maps URL by swapping /embed to /place
      const pbMatch = srcUrl.match(/[?&]pb=([^&]+)/)
      if (pbMatch) {
        navigationUrl = `https://www.google.com/maps?pb=${pbMatch[1]}`
      } else {
        // Strip embed params and open as regular maps
        navigationUrl = srcUrl
          .replace('/maps/embed?', '/maps?')
          .replace('&output=embed', '')
          .replace('?output=embed&', '?')
          .replace('?output=embed', '')
      }
    } else {
      // Last resort: use raw text (strip HTML tags) as a Google Maps search
      const cleanText = raw.replace(/<[^>]+>/g, '').trim()
      if (cleanText) {
        navigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanText)}`
      }
    }
  }

  return {
    raw,
    embedUrl,
    navigationUrl,
    hasEmbed: !!embedUrl,
    coords,
  }
}


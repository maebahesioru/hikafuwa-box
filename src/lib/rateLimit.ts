interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = store.get(ip)
  if (!bucket || now > bucket.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

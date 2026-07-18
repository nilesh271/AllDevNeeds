export const formatDate = (date: Date | string, format: string): string => {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  
  const tokens: Record<string, string> = {
    'YYYY': String(d.getFullYear()),
    'YY': String(d.getFullYear()).slice(-2),
    'MM': pad(d.getMonth() + 1),
    'DD': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
    'ddd': d.toLocaleDateString('en-US', { weekday: 'short' }),
    'dddd': d.toLocaleDateString('en-US', { weekday: 'long' }),
    'MMM': d.toLocaleDateString('en-US', { month: 'short' }),
    'MMMM': d.toLocaleDateString('en-US', { month: 'long' }),
  }
  
  return Object.entries(tokens).reduce(
    (result, [token, value]) => result.replace(token, value),
    format
  )
}

export const dateDiff = (date1: Date, date2: Date) => {
  const ms = Math.abs(date2.getTime() - date1.getTime())
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30.44)
  const years = Math.floor(days / 365.25)
  return { ms, seconds, minutes, hours, days, weeks, months, years }
}

/**
 * Interprets a `datetime-local` value as wall-clock time in `timeZone` and
 * returns the corresponding instant. JavaScript's Date constructor otherwise
 * interprets these values in the browser's local timezone.
 */
export const zonedDateTimeToUtc = (value: string, timeZone: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null

  const [, year, month, day, hour, minute, second = '0'] = match
  const wallClockAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )

  const offsetAt = (instant: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instant)
    const values = Object.fromEntries(
      parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]),
    )
    return Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    ) - instant.getTime()
  }

  try {
    // Recalculate once to account for a daylight-saving transition near the input.
    let utc = wallClockAsUtc - offsetAt(new Date(wallClockAsUtc))
    utc = wallClockAsUtc - offsetAt(new Date(utc))
    return new Date(utc)
  } catch {
    return null
  }
}

export const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

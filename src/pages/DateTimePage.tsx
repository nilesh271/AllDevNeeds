import React, { useState, useEffect, useMemo } from 'react'
import { Typography, Card, CardBody, Button, Chip } from '@material-tailwind/react'
import { formatDate, dateDiff, TIMEZONES, zonedDateTimeToUtc } from '../utils/datetime'
import Input from '../components/form/Input'
import Dropdown from '../components/form/Dropdown'
import { BsCheck2, BsClipboard, BsCalendar3, BsGlobe, BsClock, BsHourglassSplit, BsCopy } from 'react-icons/bs'

const FORMATS = [
  { label: 'ISO 8601', value: 'YYYY-MM-DDTHH:mm:ss' },
  { label: 'US Format', value: 'MM/DD/YYYY HH:mm:ss' },
  { label: 'EU Format', value: 'DD/MM/YYYY HH:mm:ss' },
  { label: 'Long Date', value: 'dddd, MMMM DD YYYY' },
  { label: 'Short Date', value: 'MMM DD, YYYY' },
  { label: 'Time Only', value: 'HH:mm:ss' },
  { label: 'Unix Timestamp', value: 'unix' },
]

export default function DateTimePage() {
  const [now, setNow] = useState(new Date())
  const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 16))
  const [fromTz, setFromTz] = useState('UTC')
  const [toTz, setToTz] = useState('Asia/Kolkata')
  const [diff1, setDiff1] = useState(new Date().toISOString().slice(0, 10))
  const [diff2, setDiff2] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const [unixInput, setUnixInput] = useState(String(Math.floor(Date.now() / 1000)))
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [copiedResult, setCopiedResult] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const selectedDate = useMemo(() => new Date(inputDate), [inputDate])
  const diff = useMemo(() => dateDiff(new Date(diff1), new Date(diff2)), [diff1, diff2])

  const convertTimezone = () => {
    const instant = zonedDateTimeToUtc(inputDate, fromTz)
    if (!instant) return 'Invalid date or timezone'
    return instant.toLocaleString('en-US', { timeZone: toTz, dateStyle: 'full', timeStyle: 'long' })
  }

  const getQuickZoneTime = (zone: string) => {
    const instant = zonedDateTimeToUtc(inputDate, fromTz)
    if (!instant) return '—'
    try {
      const timePart = instant.toLocaleTimeString('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const datePart = instant.toLocaleDateString('en-US', {
        timeZone: zone,
        month: 'short',
        day: 'numeric'
      });
      return `${timePart} (${datePart})`;
    } catch {
      return '—'
    }
  }

  const fromUnix = () => {
    const ts = parseInt(unixInput)
    if (isNaN(ts)) return 'Invalid timestamp'
    return new Date(ts * 1000).toLocaleString()
  }

  const timezoneOptions = useMemo(() => TIMEZONES.map(timezone => ({ label: timezone, value: timezone })), [])

  const handleCopyFormat = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedFormat(label);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  const handleCopyResult = async (type: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedResult(type);
    setTimeout(() => setCopiedResult(null), 1500);
  };

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3 text-sky-500">
          <BsCalendar3 className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            DateTime Converter
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Convert date-time representations, swap local/UTC timezones, and inspect unix epoch stamps.
          </Typography>
        </div>
      </div>

      {/* Live clock dashboard row */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mb-6">
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 bg-gradient-to-r from-sky-500 to-blue-600 border-none text-white overflow-hidden">
          <CardBody className="p-5 flex flex-col justify-between h-full relative">
            <div>
              <Typography className="text-sky-100/90 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <BsGlobe className="h-3.5 w-3.5" /> UTC TIME (GMT)
              </Typography>
              <Typography className="text-4xl font-extrabold font-mono tracking-widest text-white mt-1">
                {now.toUTCString().slice(17, 25)}
              </Typography>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-sky-100/80 font-medium">
              <span>{now.toUTCString().slice(0, 16)}</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-[11px] text-white">
                Unix: {Math.floor(now.getTime() / 1000)}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <CardBody className="p-5 flex flex-col justify-between h-full">
            <div>
              <Typography className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <BsClock className="h-3.5 w-3.5 text-sky-500" /> LOCAL TIME (BROWSER)
              </Typography>
              <Typography className="text-4xl font-extrabold font-mono tracking-widest text-gray-900 dark:text-white mt-1">
                {now.toLocaleTimeString('en-US', { hour12: false })}
              </Typography>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-450 font-medium">
              <span>{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[11px]">
                TZ: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Format converter */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 space-y-4">
            <Typography variant="h6" className="text-gray-900 dark:text-white font-bold flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
              <span>📅 Format Converter</span>
            </Typography>
            
            <Input
              type="datetime-local"
              label="Input Date &amp; Time"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              className="dark:text-white font-mono text-base"
              labelProps={{ className: 'dark:text-gray-450 dark:peer-focus:text-white' }}
              containerProps={{ className: "w-full" }}
            />

            <div className="mt-4 space-y-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block mb-2 font-semibold">CLICK ROW TO COPY</span>
              {FORMATS.map(fmt => {
                const displayVal = fmt.value === 'unix'
                  ? String(Math.floor(selectedDate.getTime() / 1000))
                  : formatDate(selectedDate, fmt.value);
                
                return (
                  <button
                    key={fmt.value}
                    onClick={() => handleCopyFormat(fmt.label, displayVal)}
                    className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-gray-50/50 dark:hover:bg-gray-950/20 rounded-lg text-left transition-colors group relative border-b border-gray-100/50 dark:border-gray-850/50 last:border-none"
                  >
                    <span className="text-gray-500 dark:text-gray-450 text-xs font-semibold w-28 shrink-0">
                      {fmt.label}
                    </span>
                    <div className="flex items-center gap-2 overflow-hidden pl-2">
                      <code className="text-sky-600 dark:text-sky-400 text-xs font-mono font-semibold break-all text-right select-all">
                        {displayVal}
                      </code>
                      <span className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 transition-opacity shrink-0">
                        {copiedFormat === fmt.label ? (
                          <BsCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <BsClipboard className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Timezone converter */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 space-y-4">
            <Typography variant="h6" className="text-gray-900 dark:text-white font-bold flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
              <span>🌍 Timezone Converter</span>
            </Typography>
            
            <div className="space-y-4">
              <Input
                type="datetime-local"
                label="Date &amp; Time"
                value={inputDate}
                onChange={e => setInputDate(e.target.value)}
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-450 dark:peer-focus:text-white' }}
                containerProps={{ className: "w-full" }}
              />

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Dropdown label="From Timezone" value={fromTz} onChange={v => setFromTz(v || 'UTC')} options={timezoneOptions} />
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => { const t = fromTz; setFromTz(toTz); setToTz(t) }}
                  className="border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 py-2.5 px-3 rounded-lg"
                  title="Swap timezones"
                >
                  ⇄ Swap
                </Button>
                <Dropdown label="To Timezone" value={toTz} onChange={v => setToTz(v || 'UTC')} options={timezoneOptions} />
              </div>
            </div>

            {/* Timezone conversion result box */}
            <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/25 rounded-xl border border-sky-100 dark:border-sky-900/50 flex justify-between items-center relative group">
              <div>
                <Typography className="text-sky-700 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Converted Time ({toTz})
                </Typography>
                <Typography className="text-gray-900 dark:text-gray-200 font-bold text-sm">
                  {convertTimezone()}
                </Typography>
              </div>
              <button
                onClick={() => handleCopyResult('timezone', convertTimezone())}
                className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-100/50 dark:hover:bg-sky-950/50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Copy Time"
              >
                {copiedResult === 'timezone' ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
              </button>
            </div>

            {/* Quick conversion list for other timezones */}
            <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-850 space-y-2">
              <Typography className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Major World Zones at a Glance
              </Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'UTC (GMT)', zone: 'UTC' },
                  { label: 'EST / EDT (New York)', zone: 'America/New_York' },
                  { label: 'PST / PDT (San Francisco)', zone: 'America/Los_Angeles' },
                  { label: 'GMT / BST (London)', zone: 'Europe/London' },
                  { label: 'JST (Tokyo)', zone: 'Asia/Tokyo' },
                  { label: 'AEST / AEDT (Sydney)', zone: 'Australia/Sydney' },
                ].map(item => {
                  const timeStr = getQuickZoneTime(item.zone);
                  return (
                    <button
                      key={item.zone}
                      onClick={() => handleCopyResult(item.zone, `${item.label}: ${timeStr}`)}
                      className="flex flex-col p-2 bg-gray-50/50 dark:bg-gray-950/20 hover:bg-sky-50/20 dark:hover:bg-sky-950/30 border border-gray-100 dark:border-gray-850 rounded-xl text-left group transition-all"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase">{item.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 transition-opacity">
                          {copiedResult === item.zone ? (
                            <BsCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <BsClipboard className="h-3 w-3" />
                          )}
                        </span>
                      </div>
                      <code className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-200 mt-0.5">{timeStr}</code>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Date difference */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 space-y-4">
            <Typography variant="h6" className="text-gray-900 dark:text-white font-bold flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
              <span>⏱️ Date Difference</span>
            </Typography>
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="Start Date"
                value={diff1}
                onChange={e => setDiff1(e.target.value)}
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-450 dark:peer-focus:text-white' }}
                containerProps={{ className: "w-full" }}
              />
              <Input
                type="date"
                label="End Date"
                value={diff2}
                onChange={e => setDiff2(e.target.value)}
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-455 dark:peer-focus:text-white' }}
                containerProps={{ className: "w-full" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: 'Days', value: diff.days },
                { label: 'Weeks', value: diff.weeks },
                { label: 'Months', value: diff.months },
                { label: 'Years', value: diff.years },
                { label: 'Hours', value: diff.hours.toLocaleString() },
                { label: 'Minutes', value: diff.minutes.toLocaleString() },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 rounded-xl">
                  <p className="text-2xl font-bold text-sky-500 font-mono dark:text-sky-400">{item.value}</p>
                  <p className="text-gray-800 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-wider mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Unix timestamp */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 space-y-4">
            <Typography variant="h6" className="text-gray-900 dark:text-white font-bold flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
              <span>🔢 Unix Timestamp</span>
            </Typography>
            
            <div className="space-y-4">
              <Input
                label="Unix Timestamp (seconds)"
                value={unixInput}
                onChange={e => setUnixInput(e.target.value)}
                className="dark:text-white font-mono text-base"
                labelProps={{ className: 'dark:text-gray-450 dark:focus:border-white dark:peer-focus:text-white' }}
                containerProps={{ className: "w-full" }}
              />

              <div className="p-4 bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 rounded-xl flex justify-between items-center group relative">
                <div>
                  <Typography className="text-gray-500 dark:text-gray-450 text-[10px] font-bold uppercase tracking-wider mb-1">Converted to Human Date</Typography>
                  <Typography className="text-gray-900 dark:text-gray-200 font-bold text-sm">{fromUnix()}</Typography>
                </div>
                <button
                  onClick={() => handleCopyResult('humanDate', fromUnix())}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-gray-100/50 dark:hover:bg-gray-950/50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Copy Date"
                >
                  {copiedResult === 'humanDate' ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                </button>
              </div>

              <div className="p-4 bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 rounded-xl flex justify-between items-center group relative">
                <div>
                  <Typography className="text-gray-500 dark:text-gray-455 text-[10px] font-bold uppercase tracking-wider mb-1 font-semibold">Current Unix Timestamp</Typography>
                  <Typography className="text-sky-500 font-bold font-mono text-lg dark:text-sky-400">
                    {Math.floor(now.getTime() / 1000)}
                  </Typography>
                </div>
                <button
                  onClick={() => handleCopyResult('unixNow', String(Math.floor(now.getTime() / 1000)))}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-gray-100/50 dark:hover:bg-gray-950/50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Copy Timestamp"
                >
                  {copiedResult === 'unixNow' ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                </button>
              </div>

              <Button
                fullWidth
                onClick={() => setUnixInput(String(Math.floor(Date.now() / 1000)))}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg shadow-sm"
              >
                Use Current Timestamp
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

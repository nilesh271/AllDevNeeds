import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardBody, Typography, Button, Alert } from '@material-tailwind/react'
import { 
  BsLink45Deg, 
  BsClipboard, 
  BsCheck2, 
  BsTrash, 
  BsPlus, 
  BsInfoCircle, 
  BsGlobe
} from 'react-icons/bs'

interface QueryParam {
  id: string
  key: string
  value: string
}

export default function UrlParserPage() {
  const [urlInput, setUrlInput] = useState(
    'https://www.google.com/search?q=devtools+alldevneeds&oq=devtools&sourceid=chrome&ie=UTF-8#result-section'
  )
  const [queryParams, setQueryParams] = useState<QueryParam[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Parse URL dynamically
  const parsedData = useMemo(() => {
    let targetUrl = urlInput.trim()
    if (!targetUrl) {
      return { isValid: true, urlObj: null, error: null }
    }

    // Auto prepend protocol if it looks like standard domain
    if (!/^[a-zA-Z]+:\/\//.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl
    }

    try {
      const urlObj = new URL(targetUrl)
      return { isValid: true, urlObj, error: null }
    } catch (e: any) {
      return { isValid: false, urlObj: null, error: e.message }
    }
  }, [urlInput])

  // Sync urlInput -> queryParams
  useEffect(() => {
    if (parsedData.urlObj) {
      const params: QueryParam[] = []
      parsedData.urlObj.searchParams.forEach((value, key) => {
        params.push({
          id: Math.random().toString(36).substring(2, 9),
          key,
          value
        })
      })
      // Avoid resetting if items are identical to avoid cursor jumping
      const currentParamKeysStr = queryParams.map(p => `${p.key}=${p.value}`).join('&')
      const newParamKeysStr = params.map(p => `${p.key}=${p.value}`).join('&')
      if (currentParamKeysStr !== newParamKeysStr) {
        setQueryParams(params)
      }
    } else {
      setQueryParams([])
    }
  }, [parsedData.urlObj])

  // Rebuild URL when query params are modified
  const updateUrlFromParams = (updatedParams: QueryParam[]) => {
    if (!parsedData.urlObj) return

    try {
      const newUrl = new URL(parsedData.urlObj.href)
      // Clear existing search params
      newUrl.search = ''
      updatedParams.forEach(p => {
        if (p.key.trim() !== '') {
          newUrl.searchParams.append(p.key, p.value)
        }
      })
      setUrlInput(newUrl.href)
    } catch (e) {
      console.error('Failed to update URL from params', e)
    }
  }

  // Handlers for parameters list
  const handleParamChange = (id: string, field: 'key' | 'value', val: string) => {
    const updated = queryParams.map(p => {
      if (p.id === id) {
        return { ...p, [field]: val }
      }
      return p
    })
    setQueryParams(updated)
    updateUrlFromParams(updated)
  }

  const handleAddParam = () => {
    const newParam: QueryParam = {
      id: Math.random().toString(36).substring(2, 9),
      key: '',
      value: ''
    }
    const updated = [...queryParams, newParam]
    setQueryParams(updated)
    // Don't update URL yet since key is empty
  }

  const handleRemoveParam = (id: string) => {
    const updated = queryParams.filter(p => p.id !== id)
    setQueryParams(updated)
    updateUrlFromParams(updated)
  }

  // Preset loaders
  const loadPreset = (presetUrl: string) => {
    setUrlInput(presetUrl)
  }

  // Copy helper
  const handleCopy = async (text: string, fieldName: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const copyFullUrl = async () => {
    await navigator.clipboard.writeText(urlInput)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 1500)
  }

  // Encode/Decode operations
  const handleUrlEncode = () => {
    try {
      setUrlInput(encodeURIComponent(urlInput))
    } catch (e) {
      console.error(e)
    }
  }

  const handleUrlDecode = () => {
    try {
      setUrlInput(decodeURIComponent(urlInput))
    } catch (e) {
      console.error(e)
    }
  }

  // Structured breakdown of path segments
  const pathSegments = useMemo(() => {
    if (!parsedData.urlObj) return []
    return parsedData.urlObj.pathname.split('/').filter(Boolean)
  }, [parsedData.urlObj])

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      {/* Header Title */}
      <div className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-855 pb-2 animate-fade-in">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-3 text-violet-500">
          <BsLink45Deg className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            URL Parser
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Deconstruct complex URL links, edit queries dynamically, and encode or decode parameters.
          </Typography>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wide">Presets:</span>
        <button
          onClick={() => loadPreset('https://www.google.com/search?q=devtools+alldevneeds&oq=devtools&sourceid=chrome&ie=UTF-8#result-section')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
        >
          Google Search
        </button>
        <button
          onClick={() => loadPreset('https://auth.example.com/oauth2/authorize?client_id=client_9876&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&response_type=code&scope=openid%20profile%20email&state=xyz123')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
        >
          OAuth2 Redirect
        </button>
        <button
          onClick={() => loadPreset('https://api.github.com/repos/facebook/react/issues?milestone=1&state=open&assignee=none&creator=gaearon&per_page=100&page=2')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
        >
          Complex API URL
        </button>
      </div>

      <div className="mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr] items-start animate-fade-in">
        
        {/* Left Column: Input and Parameters Table */}
        <div className="space-y-6">
          {/* Main Input Textarea */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    URL Input
                  </Typography>
                  {urlInput && (
                    <button
                      onClick={() => setUrlInput('')}
                      className="text-xs text-red-500 hover:text-red-650 flex items-center gap-1 font-bold transition-colors select-none"
                      title="Clear URL input"
                    >
                      <BsTrash className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUrlEncode}
                    className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors"
                  >
                    Encode
                  </button>
                  <span className="text-gray-300 dark:text-gray-750">|</span>
                  <button
                    onClick={handleUrlDecode}
                    className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors"
                  >
                    Decode
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Paste URL link here..."
                  className="w-full p-3 rounded-xl border border-blue-gray-250 dark:border-gray-800 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold transition-all leading-relaxed font-mono"
                />
              </div>

              {!parsedData.isValid && parsedData.error && (
                <Alert
                  icon={<BsInfoCircle className="h-5 w-5 shrink-0" />}
                  className="border-l-4 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-505/10 dark:text-amber-250 text-xs font-semibold py-2.5"
                >
                  Malformed URL Warning: {parsedData.error}
                </Alert>
              )}

              <Button
                onClick={copyFullUrl}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5"
              >
                {copiedUrl ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                {copiedUrl ? 'Copied Full URL' : 'Copy Full URL'}
              </Button>
            </CardBody>
          </Card>

          {/* Query Parameters Editor */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2">
                <div>
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    Query Parameters ({queryParams.length})
                  </Typography>
                  <Typography className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider mt-0.5">
                    Modifying values updates the URL above in real-time
                  </Typography>
                </div>
                <button
                  onClick={handleAddParam}
                  className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors animate-pulse-once"
                >
                  <BsPlus className="h-4 w-4" /> Add Parameter
                </button>
              </div>

              {queryParams.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {queryParams.map(param => (
                    <div key={param.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        value={param.key}
                        onChange={e => handleParamChange(param.id, 'key', e.target.value)}
                        className="flex-1 h-9 px-3 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent dark:text-white text-xs font-mono font-semibold focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                      />
                      <span className="text-gray-400 font-bold text-xs">=</span>
                      <input
                        type="text"
                        placeholder="Value"
                        value={param.value}
                        onChange={e => handleParamChange(param.id, 'value', e.target.value)}
                        className="flex-1 h-9 px-3 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent dark:text-white text-xs font-mono font-semibold focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => handleRemoveParam(param.id)}
                        className="p-2 text-red-500 hover:bg-red-55/20 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Remove Parameter"
                      >
                        <BsTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <BsInfoCircle className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <Typography className="text-xs text-gray-500 dark:text-gray-450 font-semibold">
                    No query parameters found in the current URL.
                  </Typography>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Structured Breakdown */}
        <div className="space-y-6">
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2 mb-2">
                URL Component Breakdown
              </Typography>

              {parsedData.urlObj ? (
                <div className="space-y-4">
                  {/* Protocol */}
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                      Protocol
                    </span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 border border-gray-100 dark:border-gray-850 rounded-lg">
                      <code className="text-xs font-semibold text-gray-900 dark:text-white font-mono break-all">
                        {parsedData.urlObj.protocol}
                      </code>
                      <button
                        onClick={() => handleCopy(parsedData.urlObj!.protocol, 'protocol')}
                        className="text-gray-450 hover:text-gray-700 dark:hover:text-white pl-2"
                      >
                        {copiedField === 'protocol' ? <BsCheck2 className="text-emerald-500" /> : <BsClipboard />}
                      </button>
                    </div>
                  </div>

                  {/* Hostname */}
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                      Hostname / Domain
                    </span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 border border-gray-100 dark:border-gray-850 rounded-lg">
                      <code className="text-xs font-semibold text-gray-900 dark:text-white font-mono break-all">
                        {parsedData.urlObj.hostname}
                      </code>
                      <button
                        onClick={() => handleCopy(parsedData.urlObj!.hostname, 'hostname')}
                        className="text-gray-455 hover:text-gray-700 dark:hover:text-white pl-2"
                      >
                        {copiedField === 'hostname' ? <BsCheck2 className="text-emerald-500" /> : <BsClipboard />}
                      </button>
                    </div>
                  </div>

                  {/* Port */}
                  {parsedData.urlObj.port && (
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                        Port
                      </span>
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 border border-gray-100 dark:border-gray-850 rounded-lg">
                        <code className="text-xs font-semibold text-gray-900 dark:text-white font-mono break-all">
                          {parsedData.urlObj.port}
                        </code>
                        <button
                          onClick={() => handleCopy(parsedData.urlObj!.port, 'port')}
                          className="text-gray-450 hover:text-gray-700 dark:hover:text-white pl-2"
                        >
                          {copiedField === 'port' ? <BsCheck2 className="text-emerald-500" /> : <BsClipboard />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Path */}
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                      Path
                    </span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 border border-gray-100 dark:border-gray-850 rounded-lg">
                      <code className="text-xs font-semibold text-gray-900 dark:text-white font-mono break-all">
                        {parsedData.urlObj.pathname}
                      </code>
                      <button
                        onClick={() => handleCopy(parsedData.urlObj!.pathname, 'pathname')}
                        className="text-gray-450 hover:text-gray-700 dark:hover:text-white pl-2"
                      >
                        {copiedField === 'pathname' ? <BsCheck2 className="text-emerald-500" /> : <BsClipboard />}
                      </button>
                    </div>
                  </div>

                  {/* Hash / Fragment */}
                  {parsedData.urlObj.hash && (
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                        Hash / Anchor Fragment
                      </span>
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 border border-gray-100 dark:border-gray-850 rounded-lg">
                        <code className="text-xs font-semibold text-gray-900 dark:text-white font-mono break-all">
                          {parsedData.urlObj.hash}
                        </code>
                        <button
                          onClick={() => handleCopy(parsedData.urlObj!.hash, 'hash')}
                          className="text-gray-450 hover:text-gray-700 dark:hover:text-white pl-2"
                        >
                          {copiedField === 'hash' ? <BsCheck2 className="text-emerald-500" /> : <BsClipboard />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Path Segments Tags */}
                  {pathSegments.length > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-2">
                        Path Segments ({pathSegments.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pathSegments.map((seg, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-violet-50/50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100/30 dark:border-violet-500/10"
                          >
                            /{seg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <BsGlobe className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2 animate-pulse" />
                  <Typography className="text-xs text-gray-500 dark:text-gray-450 font-semibold">
                    Paste a valid URL above to see structured components.
                  </Typography>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  )
}

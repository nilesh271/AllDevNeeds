import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Alert, Button, Card, CardBody, Typography, Option, Select } from '@material-tailwind/react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { BsBraces, BsCheck2, BsClipboard, BsExclamationTriangle, BsTrash, BsFileText, BsCheckCircleFill, BsLayoutSplit } from 'react-icons/bs'
import { RiExchangeLine } from 'react-icons/ri'

const SAMPLES = {
  left: `{
  "appName": "AllDevNeeds",
  "version": 1.2,
  "active": true,
  "features": [
    "Base64 tools",
    "UUID generator",
    "JSON formatter"
  ],
  "stats": {
    "totalUsers": 15430,
    "rating": 4.8
  }
}`,
  right: `{
  "appName": "AllDevNeeds - Diff Edition",
  "version": 1.3,
  "active": true,
  "features": [
    "Base64 tools",
    "UUID generator",
    "JSON diff viewer",
    "Highlight differences"
  ],
  "stats": {
    "totalUsers": 18200,
    "rating": 4.9
  }
}`
}

interface JsonStats {
  size: string
  keys: number
  depth: number
  type: string
}

interface ValidationResult {
  isValid: boolean | null
  message: string
  stats: JsonStats | null
}

export default function JsonDiffPage() {
  const [leftValue, setLeftValue] = useState(() => {
    const saved = localStorage.getItem('json_diff_left')
    return saved !== null ? saved : SAMPLES.left
  })
  const [rightValue, setRightValue] = useState(() => {
    const saved = localStorage.getItem('json_diff_right')
    return saved !== null ? saved : SAMPLES.right
  })

  // Persist left & right JSON states in localStorage
  useEffect(() => {
    if (leftValue) {
      localStorage.setItem('json_diff_left', leftValue)
    } else {
      localStorage.removeItem('json_diff_left')
    }
  }, [leftValue])

  useEffect(() => {
    if (rightValue) {
      localStorage.setItem('json_diff_right', rightValue)
    } else {
      localStorage.removeItem('json_diff_right')
    }
  }, [rightValue])

  const [copiedLeft, setCopiedLeft] = useState(false)
  const [copiedRight, setCopiedRight] = useState(false)
  const [activeView, setActiveView] = useState<'editor' | 'diff'>('editor')

  // Left & Right Editor Tab size states
  const [leftTabSize, setLeftTabSize] = useState<number>(2)
  const [rightTabSize, setRightTabSize] = useState<number>(2)

  // Editor Theme
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('light')

  // Monaco editor refs
  const leftEditorRef = useRef<any>(null)
  const rightEditorRef = useRef<any>(null)

  // Track system theme transitions
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setEditorTheme(isDark ? 'vs-dark' : 'light')

    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains('dark')
      setEditorTheme(darkNow ? 'vs-dark' : 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Calculate live JSON validity and stats for both panels
  const computeValidation = (val: string): ValidationResult => {
    if (!val.trim()) {
      return { isValid: null, message: '', stats: null }
    }
    try {
      const parsed = JSON.parse(val)

      let keyCount = 0
      let maxDepth = 0

      const traverse = (curr: any, depth: number) => {
        if (curr && typeof curr === 'object') {
          maxDepth = Math.max(maxDepth, depth)
          if (Array.isArray(curr)) {
            curr.forEach(item => traverse(item, depth + 1))
          } else {
            const keys = Object.keys(curr)
            keyCount += keys.length
            keys.forEach(k => traverse(curr[k], depth + 1))
          }
        }
      }

      traverse(parsed, 1)

      const sizeBytes = new TextEncoder().encode(val).length
      const formattedSize = sizeBytes < 1024
        ? `${sizeBytes} B`
        : `${(sizeBytes / 1024).toFixed(2)} KB`

      return {
        isValid: true,
        message: 'Valid JSON structure',
        stats: {
          size: formattedSize,
          keys: keyCount,
          depth: maxDepth,
          type: Array.isArray(parsed) ? 'Array' : 'Object'
        }
      }
    } catch (err) {
      return {
        isValid: false,
        message: err instanceof Error ? err.message : 'Invalid JSON format',
        stats: null
      }
    }
  }

  const leftValidation = useMemo(() => computeValidation(leftValue), [leftValue])
  const rightValidation = useMemo(() => computeValidation(rightValue), [rightValue])

  // Check if both sides are identical structurally or raw-wise
  const isIdentical = useMemo(() => {
    if (leftValidation.isValid === true && rightValidation.isValid === true) {
      try {
        return JSON.stringify(JSON.parse(leftValue)) === JSON.stringify(JSON.parse(rightValue))
      } catch {
        return leftValue.trim() === rightValue.trim()
      }
    }
    return leftValue.trim() === rightValue.trim()
  }, [leftValue, rightValue, leftValidation.isValid, rightValidation.isValid])

  // Format handler
  const handleFormat = (side: 'left' | 'right', spaces: number) => {
    const val = side === 'left' ? leftValue : rightValue
    try {
      const parsed = JSON.parse(val)
      const formatted = JSON.stringify(parsed, null, spaces)
      if (side === 'left') {
        setLeftValue(formatted)
        setLeftTabSize(spaces)
      } else {
        setRightValue(formatted)
        setRightTabSize(spaces)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Minify handler
  const handleMinify = (side: 'left' | 'right') => {
    const val = side === 'left' ? leftValue : rightValue
    try {
      const parsed = JSON.parse(val)
      const minified = JSON.stringify(parsed)
      if (side === 'left') {
        setLeftValue(minified)
      } else {
        setRightValue(minified)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Copy handler
  const handleCopy = async (side: 'left' | 'right') => {
    const val = side === 'left' ? leftValue : rightValue
    if (!val) return
    await navigator.clipboard.writeText(val)
    if (side === 'left') {
      setCopiedLeft(true)
      setTimeout(() => setCopiedLeft(false), 1500)
    } else {
      setCopiedRight(true)
      setTimeout(() => setCopiedRight(false), 1500)
    }
  }

  // Load sample data
  const handleLoadSample = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftValue(SAMPLES.left)
    } else {
      setRightValue(SAMPLES.right)
    }
  }

  // Swap Left & Right JSONs
  const handleSwap = () => {
    const temp = leftValue
    setLeftValue(rightValue)
    setRightValue(temp)
  }

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-250 dark:border-gray-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 text-indigo-500">
            <BsBraces className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
              JSON Diff & Formatter
            </Typography>
            <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
              Validate, format, minify JSON, and view diff highlights side by side.
            </Typography>
          </div>
        </div>

        {/* View mode toggle controls */}
        <div className="flex items-center gap-2 self-start md:self-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeView === 'editor' ? 'filled' : 'text'}
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold rounded-lg shadow-none capitalize transition-all ${activeView === 'editor'
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'
              }`}
          >
            <BsLayoutSplit className="h-3.5 w-3.5" /> Editor Mode
          </Button>
          <Button
            size="sm"
            variant={activeView === 'diff' ? 'filled' : 'text'}
            onClick={() => setActiveView('diff')}
            className={`flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold rounded-lg shadow-none capitalize transition-all ${activeView === 'diff'
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'
              }`}
          >
            <RiExchangeLine className="h-4 w-4" /> Compare Mode
          </Button>
        </div>
      </div>

      {/* Main content viewports */}
      <div className="mt-6">
        {/* Identical Alert message shown when in Compare/Diff mode */}
        {activeView === 'diff' && isIdentical && (
          <div className="mb-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              <BsCheckCircleFill className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>Both JSON documents are completely identical! No differences detected.</span>
            </div>
          </div>
        )}
        <div className={activeView === 'editor' ? 'block' : 'hidden'}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT JSON PANEL */}
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <CardBody className="p-4 sm:p-5 flex flex-col h-full space-y-4">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-855 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Typography variant="h6" className="text-gray-900 dark:text-white">
                      Original JSON (Left)
                    </Typography>
                    {leftValidation.isValid === true && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <BsCheckCircleFill className="h-2.5 w-2.5" /> Valid
                      </span>
                    )}
                    {leftValidation.isValid === false && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        ⚠️ Invalid
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleLoadSample('left')}
                      className="text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize"
                    >
                      Sample
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => {
                        setLeftValue('')
                        localStorage.removeItem('json_diff_left')
                      }}
                      className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleCopy('left')}
                      className="text-xs text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize flex items-center gap-1"
                    >
                      {copiedLeft ? <BsCheck2 className="h-3.5 w-3.5" /> : <BsClipboard className="h-3.5 w-3.5" />}
                      {copiedLeft ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Indentation & Minify Settings Sub-row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Typography className="text-xs text-gray-500 font-bold uppercase tracking-wider">Format:</Typography>
                    <div className="flex items-center gap-1">
                      {[2, 4, 8].map(size => (
                        <button
                          key={size}
                          onClick={() => handleFormat('left', size)}
                          disabled={leftValidation.isValid !== true}
                          className={`px-2 py-1 border rounded text-[11px] font-semibold transition-all ${leftTabSize === size
                              ? 'bg-sky-500 border-sky-500 text-white shadow-xs'
                              : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {size} Spaces
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMinify('left')}
                    disabled={leftValidation.isValid !== true}
                    variant="outlined"
                    className="border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold py-1 px-3 text-[11px] capitalize rounded shadow-none"
                  >
                    Minify
                  </Button>
                </div>

                {/* Monaco Editor Container */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden min-h-[380px] h-[440px]">
                  <Editor
                    height="100%"
                    language="json"
                    value={leftValue}
                    onChange={v => setLeftValue(v || '')}
                    theme={editorTheme}
                    onMount={(editor) => {
                      leftEditorRef.current = editor
                    }}
                    options={{
                      tabSize: leftTabSize,
                      insertSpaces: true,
                      detectIndentation: false,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      renderLineHighlight: 'all',
                      scrollbar: {
                        alwaysConsumeMouseWheel: false
                      }
                    }}
                  />
                </div>

                {/* Left validation alert messages */}
                {leftValidation.isValid === false && (
                  <Alert
                    icon={<BsExclamationTriangle className="h-4 w-4 shrink-0" />}
                    className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs py-1.5 px-3 font-medium flex items-center"
                  >
                    <span className="truncate max-w-full block">{leftValidation.message}</span>
                  </Alert>
                )}

                {/* Left Stats Footer */}
                {leftValidation.stats && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-gray-550 dark:text-gray-400 border-t border-gray-150 dark:border-gray-855 pt-2.5">
                    <span>Size: {leftValidation.stats.size}</span>
                    <span>Type: {leftValidation.stats.type}</span>
                    <span>Keys: {leftValidation.stats.keys}</span>
                    <span>Max Depth: {leftValidation.stats.depth}</span>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* RIGHT JSON PANEL */}
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <CardBody className="p-4 sm:p-5 flex flex-col h-full space-y-4">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-855 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Typography variant="h6" className="text-gray-900 dark:text-white">
                      Modified JSON (Right)
                    </Typography>
                    {rightValidation.isValid === true && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <BsCheckCircleFill className="h-2.5 w-2.5" /> Valid
                      </span>
                    )}
                    {rightValidation.isValid === false && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        ⚠️ Invalid
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleLoadSample('right')}
                      className="text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize"
                    >
                      Sample
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => {
                        setRightValue('')
                        localStorage.removeItem('json_diff_right')
                      }}
                      className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleCopy('right')}
                      className="text-xs text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 py-1.5 px-2 rounded-lg font-semibold capitalize flex items-center gap-1"
                    >
                      {copiedRight ? <BsCheck2 className="h-3.5 w-3.5" /> : <BsClipboard className="h-3.5 w-3.5" />}
                      {copiedRight ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Indentation & Minify Settings Sub-row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Typography className="text-xs text-gray-500 font-bold uppercase tracking-wider">Format:</Typography>
                    <div className="flex items-center gap-1">
                      {[2, 4, 8].map(size => (
                        <button
                          key={size}
                          onClick={() => handleFormat('right', size)}
                          disabled={rightValidation.isValid !== true}
                          className={`px-2 py-1 border rounded text-[11px] font-semibold transition-all ${rightTabSize === size
                              ? 'bg-sky-500 border-sky-500 text-white shadow-xs'
                              : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {size} Spaces
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMinify('right')}
                    disabled={rightValidation.isValid !== true}
                    variant="outlined"
                    className="border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold py-1 px-3 text-[11px] capitalize rounded shadow-none"
                  >
                    Minify
                  </Button>
                </div>

                {/* Monaco Editor Container */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden min-h-[380px] h-[440px]">
                  <Editor
                    height="100%"
                    language="json"
                    value={rightValue}
                    onChange={v => setRightValue(v || '')}
                    theme={editorTheme}
                    onMount={(editor) => {
                      rightEditorRef.current = editor
                    }}
                    options={{
                      tabSize: rightTabSize,
                      insertSpaces: true,
                      detectIndentation: false,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      renderLineHighlight: 'all',
                      scrollbar: {
                        alwaysConsumeMouseWheel: false
                      }
                    }}
                  />
                </div>

                {/* Right validation alert messages */}
                {rightValidation.isValid === false && (
                  <Alert
                    icon={<BsExclamationTriangle className="h-4 w-4 shrink-0" />}
                    className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs py-1.5 px-3 font-medium flex items-center"
                  >
                    <span className="truncate max-w-full block">{rightValidation.message}</span>
                  </Alert>
                )}

                {/* Right Stats Footer */}
                {rightValidation.stats && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-gray-550 dark:text-gray-400 border-t border-gray-150 dark:border-gray-855 pt-2.5">
                    <span>Size: {rightValidation.stats.size}</span>
                    <span>Type: {rightValidation.stats.type}</span>
                    <span>Keys: {rightValidation.stats.keys}</span>
                    <span>Max Depth: {rightValidation.stats.depth}</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        <div className={activeView === 'diff' ? 'block' : 'hidden'}>
          {/* COMPARISON VIEW - HIGHLIGHT DIFFERENCES */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <CardBody className="p-4 sm:p-5 flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2.5">
                <Typography variant="h6" className="text-gray-900 dark:text-white flex items-center gap-1.5">
                  <RiExchangeLine className="h-5 w-5 text-indigo-500" /> Delta Visualization
                </Typography>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-red-500/20 border border-red-500 rounded inline-block"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mr-3">Removed</span>
                  <span className="w-3.5 h-3.5 bg-emerald-500/20 border border-emerald-500 rounded inline-block"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Added</span>
                </div>
              </div>

              {/* Monaco DiffEditor Component */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden h-[540px]">
                <DiffEditor
                  height="100%"
                  language="json"
                  original={leftValue}
                  modified={rightValue}
                  theme={editorTheme}
                  options={{
                    readOnly: true,
                    originalEditable: false,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'all',
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    }
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Floating Center Swapper / Actions Toolbar */}
      {activeView === 'editor' && (
        <div className="mt-5 flex justify-center">
          <Button
            size="sm"
            onClick={handleSwap}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 shadow-sm"
          >
            <RiExchangeLine className="h-4 w-4" /> Swap Left & Right JSONs
          </Button>
        </div>
      )}
    </div>
  )
}

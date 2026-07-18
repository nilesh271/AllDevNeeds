import { useState, useEffect, useRef } from 'react'
import {
  Typography, Button, Select, Option, Tooltip,
  Input, Card, CardBody
} from '@material-tailwind/react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'
import { BsDownload, BsUpload, BsCodeSquare, BsClipboard, BsCheck2 } from 'react-icons/bs'
import { subscribeToChanges, createNewSession, getSessionInfo, updateSession } from "../services/codeshare"

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  text: 'txt',
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
  bash: 'sh',
  rust: 'rs',
  go: 'go',
  java: 'java'
}

const EXTENSION_LANGUAGES: Record<string, string> = {
  txt: 'text',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  sh: 'bash',
  rs: 'rust',
  go: 'go',
  java: 'java'
}

const LANGUAGES = ['text', 'javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'rust', 'go', 'java']

const STARTER_CODE: Record<string, string> = {
  text: 'Hello World !!!!',
  javascript: `// Welcome to AllDevNeeds Code Share!
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Generate first 10 Fibonacci numbers
const result = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log('Fibonacci:', result);`,
  typescript: `// TypeScript example
interface User {
  id: number;
  name: string;
  email: string;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! Your ID is \${user.id}\`;
};

const user: User = { id: 1, name: 'Dev', email: 'dev@example.com' };
console.log(greet(user));`,
  python: `# Python example
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Built with AllDevNeeds</p>
</body>
</html>`,
  json: `{
  "name": "AllDevNeeds",
  "version": "1.0.0",
  "tools": [
    "Code Editor",
    "Sticky Notes",
    "File Manager",
    "Learning Hub",
    "DateTime Converter",
    "Video Downloader"
  ],
  "backend": false
}`,
  css: `/* Modern CSS example */
:root {
  --primary: #0ea5e9;
  --bg: #f8fafc;
}

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
}`,
  bash: `#!/bin/bash
# Quick dev setup script

echo "Setting up development environment..."

# Install dependencies
npm install

# Run linter
npm run lint

# Start dev server
npm run dev

echo "Done! Visit http://localhost:5173"`,
  go: `package main

import "fmt"

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    sum := 0
    for _, n := range numbers {
        sum += n
    }
    fmt.Printf("Sum: %d\\n", sum)
}`,
  rust: `fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let sum: i32 = numbers.iter().sum();
    let product: i32 = numbers.iter().product();
    
    println!("Numbers: {:?}", numbers);
    println!("Sum: {}", sum);
    println!("Product: {}", product);
}`,
  java: `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 9, 3};
        bubbleSort(arr);
        for (int n : arr) {
            System.out.print(n + " ");
        }
    }
    
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
    }
}`,
}



export default function CodeSharingPage() {
  const [lang, setLang] = useState('text')
  const [code, setCode] = useState(STARTER_CODE.text)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [highlighted, setHighlighted] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [connected, setConnected] = useState(false)
  const [lastEditedBy, setLastEditedBy] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [fileName, setFileName] = useState('snippet.txt')

  const updateExtension = (name: string, newLang: string) => {
    const parts = name.split('.')
    const newExt = LANGUAGE_EXTENSIONS[newLang] || 'txt'
    if (parts.length > 1) {
      parts[parts.length - 1] = newExt
      return parts.join('.')
    }
    return `${name}.${newExt}`
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionQuery = searchParams.get('session')
  const { user } = useAppSelector(s => s.auth)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debouncedUpdateRef = useRef<any>(null)

  // Initialize the debounced updater once
  useEffect(() => {
    let timeoutId: any
    
    debouncedUpdateRef.current = (codeVal: string, langVal: string, usernameVal: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (sessionId && connected) {
          console.log('Debounced Syncing Local Change to DB:', { codeVal, langVal, usernameVal })
          updateSession(sessionId, codeVal, langVal, usernameVal)
        }
      }, 300)
    }

    return () => clearTimeout(timeoutId)
  }, [sessionId, connected])

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop
      preRef.current.scrollLeft = target.scrollLeft
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      setCode(text)
      
      const extension = file.name.split('.').pop()?.toLowerCase()
      let detectedLang = lang
      if (extension && EXTENSION_LANGUAGES[extension]) {
        detectedLang = EXTENSION_LANGUAGES[extension]
        setLang(detectedLang)
      }
      setFileName(file.name)

      // Sync file contents immediately to the session if connected!
      if (connected && sessionId) {
        const username = user?.username || 'anonymous'
        console.log('Syncing uploaded file immediately:', { sessionId, text, detectedLang, username })
        await updateSession(sessionId, text, detectedLang, username)
      }
    }
    reader.readAsText(file)
  }

  // Dynamically import Prism for syntax highlighting
  const highlight = async () => {
    try {
      const Prism = (await import('prismjs')).default
      await import('prismjs/components/prism-typescript')
      await import('prismjs/components/prism-python')
      await import('prismjs/components/prism-bash')
      await import('prismjs/components/prism-rust')
      await import('prismjs/components/prism-go')
      await import('prismjs/components/prism-java')

      const grammar = Prism.languages[lang] || Prism.languages.javascript
      const html = Prism.highlight(code, grammar, lang)
      setHighlighted(html)
    } catch {
      setHighlighted(code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    }
  }

  // Auto join session if URL query parameter is present on mount
  useEffect(() => {
    if (sessionQuery && !connected) {
      handleJoinSession(sessionQuery)
    }
  }, [sessionQuery])

  // Supabase real-time presence subscription channel
  useEffect(() => {
    if (!connected || !sessionId) return

    const channel = subscribeToChanges(sessionId, (payload) => {
      console.log('Realtime DB Change payload received:', payload)
      const dbCode = payload.new.message
      const dbLang = payload.new.language
      const dbUpdatedBy = payload.new.updated_by

      setCode(current => current !== dbCode ? dbCode : current)
      setLang(current => current !== dbLang ? dbLang : current)
      setLastEditedBy(dbUpdatedBy || null)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [connected, sessionId])

  // Run syntax highlighting immediately on code or language change
  useEffect(() => {
    highlight()
  }, [code, lang])



  const handleLangChange = async (val: string | undefined) => {
    if (!val) return

    setLang(val)
    setCode(STARTER_CODE[val] || '')
    setFileName(prev => updateExtension(prev, val))

    if (connected && sessionId) {
      const username = user?.username || 'anonymous'
      console.log('Changing language dropdown:', { sessionId, val, username })
      await updateSession(sessionId, code, val, username) // Update the session with the new language and current code
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })

      // Trigger debounced update for local tab keypress
      if (connected && sessionId) {
        const username = user?.username || 'anonymous'
        debouncedUpdateRef.current?.(newCode, lang, username)
      }
    }
  }

  const handleOnChange = (newCode: string) => {
    setCode(newCode)
    if (connected && sessionId) {
      const username = user?.username || 'anonymous'
      debouncedUpdateRef.current?.(newCode, lang, username)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCreateNewSession = async () => {
    setConnected(false)
    const username = user?.username || 'anonymous'
    const session = await createNewSession(code, lang, username)

    if (session) {
      setSessionId(session.unique_id)
      setLastEditedBy(username)
      setConnected(true)
      setSearchParams({ session: session.unique_id })
    }
  }

  const handleJoinSession = async (targetSessionId?: string) => {
    const activeId = targetSessionId || sessionId
    if (!activeId) return

    setConnected(false)
    const info = await getSessionInfo(activeId)
    if (info) {
      setSessionId(activeId)
      setCode(info.message)
      setLang(info.language)
      setLastEditedBy(info.updated_by || null)
      setConnected(true)
      setSearchParams({ session: activeId })
    }
  }

  const handleDisconnect = () => {
    setConnected(false)
    setSessionId('')
    setLastEditedBy(null)
    setSearchParams({})
  }

  const lineCount = code.split('\n').length


  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-3 text-violet-505">
            <BsCodeSquare className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
              Code Share
            </Typography>
            <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
              Write, highlight, and share code snippets instantly in real-time.
            </Typography>
          </div>
        </div>

        {/* IDE Layout: Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1.1fr] gap-6 items-start animate-fade-in">
          
          {/* Left Column: Editor Window */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg bg-gray-950 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 transition-all">
              {/* Title bar */}
              <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-900/60 select-none">
                <div className="flex items-center gap-4">
                  {/* macOS control dots */}
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => {
                      const newName = e.target.value
                      setFileName(newName)
                      const ext = newName.split('.').pop()?.toLowerCase()
                      if (ext && EXTENSION_LANGUAGES[ext] && EXTENSION_LANGUAGES[ext] !== lang) {
                        setLang(EXTENSION_LANGUAGES[ext])
                      }
                    }}
                    className="bg-transparent text-gray-300 text-xs font-mono border-b border-transparent hover:border-gray-700 focus:border-violet-500 focus:outline-none px-1.5 py-0.5 rounded transition-all w-48 font-bold"
                    placeholder="filename.txt"
                  />
                </div>

                {/* Inline Language Selector dropdown */}
                <div className="w-36">
                  <select
                    value={lang}
                    onChange={e => handleLangChange(e.target.value)}
                    className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-violet-500 focus:text-white transition-colors cursor-pointer"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>
                        {l.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editor Workspace Container */}
              <div className="relative flex bg-gray-955 h-[520px] overflow-hidden">
                {/* Line numbers (vertically scrollable but scrollbars hidden) */}
                <div
                  ref={lineNumbersRef}
                  className="select-none flex flex-col items-end pr-3 pl-4 pt-4 bg-gray-900/40 text-gray-500 font-mono text-sm leading-6 w-14 overflow-hidden border-r border-gray-900/40"
                  style={{ height: '100%' }}
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <span key={i} className="font-semibold">{i + 1}</span>
                  ))}
                </div>

                {/* Combined Editor Area */}
                <div className="relative flex-1 h-full min-w-0">
                  {/* Transparent input textarea */}
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={e => handleOnChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-4 m-0 resize-none bg-transparent text-transparent caret-white font-mono text-sm leading-6 outline-none z-10 overflow-auto whitespace-pre"
                    style={{ caretColor: '#e2e8f0' }}
                    placeholder="Start coding here..."
                  />

                  {/* Syntax highlighted rendering display overlay */}
                  <pre
                    ref={preRef}
                    className="absolute inset-0 w-full h-full p-4 m-0 font-mono text-sm leading-6 text-gray-100 pointer-events-none overflow-hidden whitespace-pre"
                    style={{ background: 'transparent' }}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-gray-405 text-xs font-mono border-t border-gray-900/60 select-none">
                <div className="flex items-center gap-3">
                  <span className="text-violet-400 font-bold uppercase">{lang}</span>
                  {connected && lastEditedBy && (
                    <>
                      <span className="text-gray-750">|</span>
                      <span className="text-gray-300 font-medium">
                        Last edited by: <span className="underline font-bold text-violet-400">{lastEditedBy}</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span>{lineCount} lines</span>
                  <span>{code.length} chars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Control Panels */}
          <div className="space-y-5">
            {/* 1. Collaboration Control Center */}
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardBody className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-2">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    Collaboration
                  </Typography>
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>

                {connected ? (
                  <div className="space-y-3">
                    <div className="bg-green-50/50 dark:bg-green-500/5 p-3 border border-green-150 dark:border-green-900/20 rounded-xl text-center">
                      <Typography className="text-xs text-green-700 dark:text-green-400 font-bold">
                        Connected to live session!
                      </Typography>
                      <code className="text-[10px] text-gray-500 dark:text-gray-450 block mt-1 font-mono break-all select-all font-semibold">
                        ID: {sessionId}
                      </code>
                    </div>

                    <Button
                      size="sm"
                      fullWidth
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2 py-2 shadow-none hover:shadow-sm"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`
                        navigator.clipboard.writeText(shareUrl)
                        setCopiedLink(true)
                        setTimeout(() => setCopiedLink(false), 1500)
                      }}
                    >
                      {copiedLink ? 'Copied Link!' : 'Copy Share Link'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outlined"
                      fullWidth
                      color="red"
                      className="border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold py-2"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      size="sm"
                      color="green"
                      fullWidth
                      className="font-bold py-2.5 bg-green-500 hover:bg-green-600 shadow-none hover:shadow-sm"
                      onClick={handleCreateNewSession}
                    >
                      Start Live Session
                    </Button>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Join with Session ID"
                        value={sessionId}
                        onChange={e => setSessionId(e.target.value)}
                        className="w-full pl-3 pr-14 py-2 bg-gray-50/50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none text-slate-800 dark:text-slate-100 text-xs rounded-lg placeholder-gray-400 dark:placeholder-gray-500 transition-all font-semibold"
                      />
                      <button
                        onClick={() => handleJoinSession()}
                        disabled={!sessionId}
                        className="absolute right-3 top-2.5 text-xs text-green-500 hover:text-green-650 font-bold disabled:opacity-50 disabled:pointer-events-none transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* 2. File Actions panel */}
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardBody className="p-4 sm:p-5 space-y-4">
                <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">
                  File Utilities
                </Typography>

                <div className="grid grid-cols-1 gap-2.5 select-none">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.js,.ts,.py,.html,.css,.json,.sh,.rs,.go,.java"
                  />

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-between px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-violet-50/20 dark:hover:bg-violet-955/10 rounded-lg text-left text-xs font-semibold text-gray-700 dark:text-gray-305 transition-colors select-none"
                  >
                    <span>Copy to Clipboard</span>
                    {copiedCode ? (
                      <BsCheck2 className="h-4.5 w-4.5 text-green-550 animate-pulse font-bold transition-all scale-110" />
                    ) : (
                      <BsClipboard className="h-3.5 w-3.5 text-gray-450 dark:text-gray-500" />
                    )}
                  </button>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-between px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-violet-50/20 dark:hover:bg-violet-955/10 rounded-lg text-left text-xs font-semibold text-gray-700 dark:text-gray-305 transition-colors"
                  >
                    <span>Import Local File</span>
                    <BsUpload className="h-3.5 w-3.5 text-gray-450 dark:text-gray-505" />
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-violet-50/20 dark:hover:bg-violet-955/10 rounded-lg text-left text-xs font-semibold text-gray-700 dark:text-gray-305 transition-colors"
                  >
                    <span>Export/Download File</span>
                    <BsDownload className="h-3.5 w-3.5 text-gray-450 dark:text-gray-505" />
                  </button>

                  {/* Clear Workspace Button */}
                  <button
                    onClick={() => {
                      setCode('')
                      if (connected && sessionId) {
                        const username = user?.username || 'anonymous'
                        updateSession(sessionId, '', lang, username)
                      }
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 border border-red-100 hover:border-red-200 dark:border-red-955/30 hover:bg-red-50/30 dark:hover:bg-red-955/10 rounded-lg text-left text-xs font-semibold text-red-500 transition-colors"
                  >
                    <span>Clear Workspace</span>
                    <span className="text-[10px] text-red-500 font-bold tracking-wider">RESET</span>
                  </button>
                </div>
              </CardBody>
            </Card>

            {/* 3. Editor Guidelines & Shortcuts */}
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-850 rounded-xl space-y-2 select-none">
              <Typography className="text-sky-700 dark:text-sky-300 text-sm font-bold flex items-center gap-1.5">
                💡 Workspace tips
              </Typography>
              <ul className="text-sky-600 dark:text-sky-400 text-xs list-disc list-inside space-y-1.5 font-semibold">
                <li>Press <kbd className="bg-sky-100/80 dark:bg-sky-800/80 px-1.5 py-0.5 rounded text-[10px] border border-sky-200/20">Tab</kbd> to insert 2 spaces.</li>
                <li>Importing a file auto-detects code syntax dynamically.</li>
                <li>Live active rooms broadcast edits instantly.</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

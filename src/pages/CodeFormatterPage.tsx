import React, { useState, useRef, useEffect } from 'react'
import { Card, CardBody, Typography, Button, Option, Select, Chip } from '@material-tailwind/react'
import Editor, { Monaco } from '@monaco-editor/react'
import { BsCodeSquare, BsCheck2, BsClipboard, BsTrash, BsFileText, BsGear, BsTools } from 'react-icons/bs'
import { format as formatSql } from 'sql-formatter'

const SAMPLES: Record<string, string> = {
  javascript: `function calculateSum (a,b) {
const result=a+b;
  console.log("Result is: " + result) ;
return result
}`,
  typescript: `interface User { id: number; name: string; email?: string }
const greet = (user:User):string => {
return "Hello " + user.name
}`,
  json: `{"name":"alldevneeds","features":["formatting","conversion","utility"],"stats":{"users":15000,"rating":4.9},"active":true}`,
  html: `<div class="container" id="main"><header><h1>Welcome to AllDevNeeds</h1></header><p>Fast local utilities</p><ul><li>JSON Formatter</li><li>Code Formatter</li></ul></div>`,
  css: `.container { max-width: 1200px; padding: 20px; background-color:#fff; border: 1px solid #ddd; border-radius:8px; } h1{color: #333;font-size:24px;}`,
  sql: `SELECT id,name,email FROM users WHERE active=1 AND signup_date>'2026-01-01' GROUP BY id ORDER BY name DESC LIMIT 10;`
};

export default function CodeFormatterPage() {
  const [language, setLanguage] = useState('javascript')
  const [value, setValue] = useState(SAMPLES.javascript)
  const [copied, setCopied] = useState(false)

  // Editor Settings
  const [tabSize, setTabSize] = useState<number>(2)
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const [lineNumbers, setLineNumbers] = useState<'on' | 'off'>('on')
  const [minimap, setMinimap] = useState<boolean>(false)
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('light')

  const editorRef = useRef<any>(null)

  // Track system theme transitions
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setEditorTheme(isDark ? 'vs-dark' : 'light')

    // Optional observer to track live changes
    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains('dark')
      setEditorTheme(darkNow ? 'vs-dark' : 'light')
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [])

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
  }

  const handleFormat = () => {
    if (language === 'sql') {
      try {
        const formatted = formatSql(value, {
          language: 'sql',
          tabWidth: tabSize,
          keywordCase: 'upper'
        });
        setValue(formatted);
      } catch (err) {
        console.error(err);
      }
    } else if (editorRef.current) {
      // Trigger Monaco's native format document command
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }

  const handleMinify = () => {
    if (!value) return;
    let minified = '';
    if (language === 'json') {
      try {
        minified = JSON.stringify(JSON.parse(value));
      } catch {
        minified = value.replace(/\s+/g, '').trim();
      }
    } else if (language === 'css') {
      minified = value
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/\s*([{};:])\s*/g, '$1') // Remove spaces around delimiters
        .trim();
    } else if (language === 'sql') {
      minified = value
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
        .replace(/--.*$/gm, '') // Remove single-line comments
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
    } else {
      // Generic minification
      minified = value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join(' ');
    }
    setValue(minified);
  }

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const handleClear = () => {
    setValue('')
  }

  const handleLoadSample = (lang: string) => {
    setValue(SAMPLES[lang] || '')
  }

  const handleLanguageChange = (newLang: string) => {
    const previousSample = SAMPLES[language]?.trim()
    const currentValue = value?.trim()

    setLanguage(newLang)

    // Load sample ONLY if current text is empty OR matches the previous language's sample
    if (!currentValue || currentValue === previousSample) {
      setValue(SAMPLES[newLang] || '')
    }
  }

  const handleTabSizeChange = (newSize: number) => {
    setTabSize(newSize)
    
    // Update Monaco editor options & model options dynamically
    if (editorRef.current) {
      editorRef.current.updateOptions({
        tabSize: newSize,
        detectIndentation: false
      })
      const model = editorRef.current.getModel()
      if (model) {
        model.updateOptions({
          tabSize: newSize,
          indentSize: newSize,
          insertSpaces: true
        })
      }
    }

    // Trigger format document with new tab size immediately
    setTimeout(() => {
      if (language === 'sql') {
        try {
          const formatted = formatSql(value, {
            language: 'sql',
            tabWidth: newSize,
            keywordCase: 'upper'
          })
          setValue(formatted)
        } catch (err) {
          console.error(err)
        }
      } else if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument')?.run()
      }
    }, 50)
  }

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3 text-sky-500">
          <BsCodeSquare className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            Code Formatter
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Beautify or minify source files locally in your browser using standard syntax formatters.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1fr_3.5fr]">
        {/* Left Settings Sidebar */}
        <div className="space-y-6">
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 space-y-4">
              <Typography variant="h6" className="text-gray-900 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-855 pb-2">
                <BsGear className="h-4 w-4 text-sky-500" /> Settings
              </Typography>

              {/* Language selection dropdown wrapper */}
              <div className="space-y-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Language</Typography>
                <Select
                  label="Select Language"
                  value={language}
                  onChange={(v) => v && handleLanguageChange(v)}
                  menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  className="dark:text-white"
                  labelProps={{ className: 'dark:text-gray-400' }}
                >
                  <Option value="javascript">JavaScript (JS)</Option>
                  <Option value="typescript">TypeScript (TS)</Option>
                  <Option value="json">JSON</Option>
                  <Option value="html">HTML</Option>
                  <Option value="css">CSS</Option>
                  <Option value="sql">SQL</Option>
                </Select>
              </div>

              {/* Tab Space Settings */}
              <div className="space-y-2 pt-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tab Size</Typography>
                <Select
                  label="Tab Spaces"
                  value={String(tabSize)}
                  onChange={(v) => v && handleTabSizeChange(Number(v))}
                  menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  className="dark:text-white"
                  labelProps={{ className: 'dark:text-gray-400' }}
                >
                  <Option value="2">2 Spaces</Option>
                  <Option value="4">4 Spaces</Option>
                  <Option value="8">8 Spaces</Option>
                </Select>
              </div>

              {/* Word wrap toggle */}
              <div className="space-y-2 pt-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Word Wrap</Typography>
                <Select
                  label="Word Wrap"
                  value={wordWrap}
                  onChange={(v) => v && setWordWrap(v as any)}
                  menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  className="dark:text-white"
                  labelProps={{ className: 'dark:text-gray-400' }}
                >
                  <Option value="on">On</Option>
                  <Option value="off">Off</Option>
                </Select>
              </div>

              {/* Line numbers toggle */}
              <div className="space-y-2 pt-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Line Numbers</Typography>
                <Select
                  label="Line Numbers"
                  value={lineNumbers}
                  onChange={(v) => v && setLineNumbers(v as any)}
                  menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  className="dark:text-white"
                  labelProps={{ className: 'dark:text-gray-400' }}
                >
                  <Option value="on">Show</Option>
                  <Option value="off">Hide</Option>
                </Select>
              </div>

              {/* Minimap toggle */}
              <div className="space-y-2 pt-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Minimap</Typography>
                <Select
                  label="Editor Minimap"
                  value={minimap ? 'true' : 'false'}
                  onChange={(v) => v && setMinimap(v === 'true')}
                  menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  className="dark:text-white"
                  labelProps={{ className: 'dark:text-gray-400' }}
                >
                  <Option value="true">Enable</Option>
                  <Option value="false">Disable</Option>
                </Select>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Editor Area */}
        <div className="space-y-4">
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <CardBody className="p-4 sm:p-5 space-y-4 flex flex-col h-full">
              {/* Header options controls row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-105 dark:border-gray-850 pb-3">
                <div className="flex items-center gap-2">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    Code Playground
                  </Typography>
                  <Chip
                    value={language.toUpperCase()}
                    size="sm"
                    className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => handleLoadSample(language)}
                    className="flex items-center gap-1.5 text-sky-600 bg-transparent hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/20 py-1.5 px-3 rounded-lg"
                  >
                    <BsFileText className="h-4 w-4" /> Load Sample
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-3 rounded-lg"
                  >
                    <BsTrash className="h-4 w-4" /> Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    disabled={!value}
                    className={`flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-lg transition-colors ${copied
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {copied ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/10 min-h-[460px] h-[520px]">
                <Editor
                  height="100%"
                  language={language}
                  value={value}
                  onChange={v => setValue(v || '')}
                  theme={editorTheme}
                  onMount={handleEditorDidMount}
                  options={{
                    tabSize: tabSize,
                    insertSpaces: true,
                    detectIndentation: false,
                    wordWrap: wordWrap,
                    lineNumbers: lineNumbers,
                    minimap: { enabled: minimap },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: 'all',
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    }
                  }}
                />
              </div>

              {/* Action Format buttons footer */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleFormat}
                  disabled={!value}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 shadow-sm"
                >
                  <BsTools className="h-4 w-4" /> Format Code
                </Button>
                <Button
                  onClick={handleMinify}
                  disabled={!value}
                  variant="outlined"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold py-2.5 px-6"
                >
                  Minify Code
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Alert, Button, Card, CardBody, Typography } from '@material-tailwind/react'
import Textarea from '../components/form/Textarea'
import { BsBraces, BsCheck2, BsClipboard, BsExclamationTriangle, BsTrash, BsFileText, BsCheckCircleFill } from 'react-icons/bs'

export default function JsonFormatterPage() {
  const [input, setInput] = useState('{"name":"AllDevNeeds","tools":["JSON formatter"]}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Calculate live JSON validity and stats
  const validation = useMemo(() => {
    if (!input.trim()) {
      return { isValid: null, message: '', stats: null };
    }
    try {
      const parsed = JSON.parse(input);
      
      // Calculate key count & depth
      let keyCount = 0;
      let maxDepth = 0;
      
      const traverse = (curr: any, depth: number) => {
        if (curr && typeof curr === 'object') {
          maxDepth = Math.max(maxDepth, depth);
          if (Array.isArray(curr)) {
            curr.forEach(item => traverse(item, depth + 1));
          } else {
            const keys = Object.keys(curr);
            keyCount += keys.length;
            keys.forEach(k => traverse(curr[k], depth + 1));
          }
        }
      };
      
      traverse(parsed, 1);
      
      const sizeBytes = new TextEncoder().encode(input).length;
      const formattedSize = sizeBytes < 1024 
        ? `${sizeBytes} B` 
        : `${(sizeBytes / 1024).toFixed(2)} KB`;

      return {
        isValid: true,
        message: 'Valid JSON structure',
        stats: {
          size: formattedSize,
          keys: keyCount,
          depth: maxDepth,
          type: Array.isArray(parsed) ? 'Array' : 'Object'
        }
      };
    } catch (err) {
      return {
        isValid: false,
        message: err instanceof Error ? err.message : 'Invalid JSON format',
        stats: null
      };
    }
  }, [input]);

  // Run initial formatting on mount
  useEffect(() => {
    if (validation.isValid) {
      transform(2);
    }
  }, []);

  const transform = (spaces: number | string) => {
    try {
      const parsed = JSON.parse(input);
      const indent = spaces === 'tabs' ? '\t' : spaces;
      setOutput(JSON.stringify(parsed, null, indent as any));
      setError('');
    } catch (reason) {
      setOutput('');
      setError(reason instanceof Error ? reason.message : 'The input is not valid JSON.');
    }
    setCopied(false);
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadSample = () => {
    setInput(JSON.stringify({
      appName: "AllDevNeeds",
      version: 1.2,
      active: true,
      features: [
        "Base64 tools",
        "UUID generator",
        "JSON formatter"
      ],
      stats: {
        totalUsers: 15430,
        rating: 4.8
      }
    }, null, 2));
    setError('');
    setOutput('');
  };

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 text-indigo-500">
          <BsBraces className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            JSON Formatter
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Validate, clean up, beautify, or minify JSON data locally.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-2">
        {/* Left Column: JSON Input */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-850 pb-2">
                <div className="flex items-center gap-2">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    JSON Input
                  </Typography>
                  
                  {/* Live Validation Badge */}
                  {validation.isValid === true && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <BsCheckCircleFill className="h-3 w-3" /> Valid
                    </span>
                  )}
                  {validation.isValid === false && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                      ⚠️ Invalid JSON
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadSample}
                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <BsFileText className="h-3.5 w-3.5" /> Load Sample
                  </button>
                  {input && (
                    <button
                      onClick={() => setInput('')}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <BsTrash className="h-3.5 w-3.5" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <Textarea
                label="Paste JSON here"
                value={input}
                onChange={event => { setInput(event.target.value); setError('') }}
                className="min-h-[320px] font-mono text-sm leading-relaxed dark:text-white"
                containerProps={{ className: "w-full min-h-[320px]" }}
              />
            </div>

            {/* Input Stats */}
            {validation.stats && (
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-850 pt-3">
                <span>Size: {validation.stats.size}</span>
                <span>Type: {validation.stats.type}</span>
                <span>Total Keys: {validation.stats.keys}</span>
                <span>Max Depth: {validation.stats.depth}</span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column: Output Result */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-850 pb-2">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Formatted Result
                </Typography>
                <Button
                  size="sm"
                  variant="text"
                  disabled={!output}
                  onClick={copy}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 py-2 px-3 rounded-lg"
                >
                  {copied ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                label="Formatted JSON"
                value={output}
                readOnly
                className="min-h-[320px] font-mono text-sm leading-relaxed dark:text-white"
                containerProps={{ className: "w-full min-h-[320px]" }}
              />
            </div>

            {/* Error Message Panel if invalid JSON */}
            {error && (
              <Alert
                icon={<BsExclamationTriangle className="h-5 w-5" />}
                className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs py-2.5 px-4 font-semibold"
              >
                {error}
              </Alert>
            )}
            
            {/* Live Error parsing helper from validation state */}
            {validation.isValid === false && !error && (
              <Alert
                icon={<BsExclamationTriangle className="h-5 w-5" />}
                className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs py-2.5 px-4 font-semibold"
              >
                {validation.message}
              </Alert>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Formatting Trigger Actions */}
      <div className="mt-6 flex flex-wrap gap-3 max-w-6xl">
        <Button 
          onClick={() => transform(2)} 
          disabled={validation.isValid !== true}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5"
        >
          Format (2 Spaces)
        </Button>
        <Button 
          onClick={() => transform(4)} 
          disabled={validation.isValid !== true}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5"
        >
          Format (4 Spaces)
        </Button>
        <Button 
          onClick={() => transform('tabs')} 
          disabled={validation.isValid !== true}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5"
        >
          Format (Tabs)
        </Button>
        <Button 
          onClick={() => transform(0)} 
          disabled={validation.isValid !== true}
          variant="outlined" 
          className="border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold py-2.5 px-5"
        >
          Minify / Compact
        </Button>
      </div>
    </div>
  );
}

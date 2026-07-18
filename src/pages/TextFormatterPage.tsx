import React, { useState, useMemo } from 'react'
import { Button, Card, CardBody, Typography } from '@material-tailwind/react'
import Textarea from '../components/form/Textarea'
import { BsCheck2, BsClipboard, BsEraser, BsSortAlphaDown, BsArrowLeftRight, BsFileText, BsTrash, BsArrowDownUp } from 'react-icons/bs'

type FormatAction = 
  | 'trim' 
  | 'normalize' 
  | 'remove-empty'
  | 'sort-asc' 
  | 'sort-desc' 
  | 'reverse'
  | 'remove-dup'
  | 'newlines-to-commas'
  | 'commas-to-newlines'
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode';

export default function TextFormatterPage() {
  const [input, setInput] = useState('  Paste text here.  \n\n  Each line can be cleaned up.  ')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeAction, setActiveAction] = useState<FormatAction | null>(null)

  const getTextStats = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r?\n/).length : 0;
    return { chars, words, lines };
  };

  const inputStats = useMemo(() => getTextStats(input), [input]);
  const outputStats = useMemo(() => getTextStats(output), [output]);

  const format = (action: FormatAction) => {
    try {
      let result = '';
      const linesArray = input.split(/\r?\n/);
      
      switch (action) {
        case 'trim':
          result = linesArray.map(line => line.trim()).join('\n');
          break;
        case 'normalize':
          result = input.replace(/\s+/g, ' ').trim();
          break;
        case 'remove-empty':
          result = linesArray.filter(line => line.trim() !== '').join('\n');
          break;
        case 'sort-asc':
          result = linesArray.filter(line => line.trim() !== '').sort((a, b) => a.localeCompare(b)).join('\n');
          break;
        case 'sort-desc':
          result = linesArray.filter(line => line.trim() !== '').sort((a, b) => b.localeCompare(a)).join('\n');
          break;
        case 'reverse':
          result = [...linesArray].reverse().join('\n');
          break;
        case 'remove-dup':
          result = Array.from(new Set(linesArray.map(line => line.trim()).filter(Boolean))).join('\n');
          break;
        case 'newlines-to-commas':
          result = linesArray.map(line => line.trim()).filter(Boolean).join(', ');
          break;
        case 'commas-to-newlines':
          result = input.split(',').map(item => item.trim()).filter(Boolean).join('\n');
          break;
        case 'base64-encode':
          result = btoa(unescape(encodeURIComponent(input)));
          break;
        case 'base64-decode':
          result = decodeURIComponent(escape(atob(input.trim())));
          break;
        case 'url-encode':
          result = encodeURIComponent(input);
          break;
        case 'url-decode':
          result = decodeURIComponent(input);
          break;
        default:
          result = input;
      }
      setOutput(result);
      setActiveAction(action);
    } catch (err) {
      console.error(err);
      setOutput(`Error performing format action: ${err instanceof Error ? err.message : 'Invalid input structure'}`);
      setActiveAction(null);
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
    setInput("  kiwi  \n  banana  \n  apple  \n  banana  \n  orange  \n\n  1, 2, 3, 4  ");
    setOutput('');
    setActiveAction(null);
  };

  const getButtonProps = (action: FormatAction) => {
    const isActive = activeAction === action;
    return {
      variant: (isActive ? "filled" : "outlined") as "filled" | "outlined",
      className: isActive
        ? "flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold justify-start py-2 px-3 rounded-lg shadow-sm"
        : "flex items-center gap-2 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold justify-start py-2 px-3 rounded-lg"
    };
  };

  const getGridButtonProps = (action: FormatAction) => {
    const isActive = activeAction === action;
    return {
      variant: (isActive ? "filled" : "outlined") as "filled" | "outlined",
      className: isActive
        ? "flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-2 shadow-sm rounded-lg"
        : "flex items-center justify-center border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 font-semibold text-xs py-2 rounded-lg"
    };
  };

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3 text-sky-500">
          <BsArrowLeftRight className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            Text Formatter
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Clean up spacing, sort rows, deduplicate lists, encode data, and quickly format text lines.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-2">
        {/* Left Column: Input Panel */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-850 pb-2">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Input
                </Typography>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadSample}
                    className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <BsFileText className="h-3.5 w-3.5" /> Load Sample
                  </button>
                  {input && (
                    <button
                      onClick={() => {
                        setInput('');
                        setActiveAction(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <BsTrash className="h-3.5 w-3.5" /> Clear
                    </button>
                  )}
                </div>
              </div>
              <Textarea
                label="Paste text here"
                value={input}
                onChange={event => {
                  setInput(event.target.value);
                  setActiveAction(null);
                }}
                className="min-h-[288px] dark:text-white text-base"
                containerProps={{ className: "w-full min-h-[288px]" }}
              />
            </div>

            {/* Input Stats */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Lines: {inputStats.lines}</span>
              <span>Words: {inputStats.words}</span>
              <span>Characters: {inputStats.chars}</span>
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Output Panel */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-850 pb-2">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Formatted Output
                </Typography>
                <Button
                  size="sm"
                  disabled={!output}
                  onClick={copy}
                  className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-150 ${
                    copied 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                      : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Result'}
                </Button>
              </div>
              <Textarea
                label="Result"
                value={output}
                readOnly
                className="min-h-[288px] dark:text-white text-base"
                containerProps={{ className: "w-full min-h-[288px]" }}
              />
            </div>

            {/* Output Stats */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Lines: {outputStats.lines}</span>
              <span>Words: {outputStats.words}</span>
              <span>Characters: {outputStats.chars}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Formatting Tools Panel */}
      <div className="mt-6 max-w-6xl">
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 space-y-4">
            <Typography variant="h6" className="text-gray-900 dark:text-white">
              Formatting Options
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category 1: Clean Up */}
              <div className="space-y-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-450 border-b border-gray-100 dark:border-gray-850 pb-1">
                  Clean Up & Spaces
                </Typography>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => format('trim')}
                    {...getButtonProps('trim')}
                  >
                    <BsEraser className="h-4 w-4" /> Trim Line Spaces
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('normalize')}
                    {...getButtonProps('normalize')}
                  >
                    Normalize Whitespace
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('remove-empty')}
                    {...getButtonProps('remove-empty')}
                  >
                    Remove Empty Lines
                  </Button>
                </div>
              </div>

              {/* Category 2: Sorting & Rows */}
              <div className="space-y-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-455 border-b border-gray-100 dark:border-gray-855 pb-1">
                  Sort & List Actions
                </Typography>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => format('sort-asc')}
                    {...getButtonProps('sort-asc')}
                  >
                    <BsSortAlphaDown className="h-4 w-4" /> Sort Lines (A-Z)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('sort-desc')}
                    {...getButtonProps('sort-desc')}
                  >
                    <BsSortAlphaDown className="h-4 w-4 transform rotate-180" /> Sort Lines (Z-A)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('remove-dup')}
                    {...getButtonProps('remove-dup')}
                  >
                    <BsTrash className="h-4 w-4" /> Remove Duplicate Lines
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('reverse')}
                    {...getButtonProps('reverse')}
                  >
                    <BsArrowDownUp className="h-4 w-4" /> Reverse Line Order
                  </Button>
                </div>
              </div>

              {/* Category 3: Conversions */}
              <div className="space-y-2">
                <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-455 border-b border-gray-100 dark:border-gray-855 pb-1">
                  Encoding & Transforms
                </Typography>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => format('newlines-to-commas')}
                    {...getGridButtonProps('newlines-to-commas')}
                  >
                    Lines ➔ Commas
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('commas-to-newlines')}
                    {...getGridButtonProps('commas-to-newlines')}
                  >
                    Commas ➔ Lines
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('base64-encode')}
                    {...getGridButtonProps('base64-encode')}
                  >
                    Base64 Encode
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('base64-decode')}
                    {...getGridButtonProps('base64-decode')}
                  >
                    Base64 Decode
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('url-encode')}
                    {...getGridButtonProps('url-encode')}
                  >
                    URL Encode
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => format('url-decode')}
                    {...getGridButtonProps('url-decode')}
                  >
                    URL Decode
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

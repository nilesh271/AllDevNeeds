import React, { useMemo, useState } from 'react'
import { Card, CardBody, Typography, Button } from '@material-tailwind/react'
import Textarea from '../components/form/Textarea'
import { BsCheck2, BsClipboard, BsCodeSlash, BsTrash, BsFileText } from 'react-icons/bs'

const tokenize = (value: string) => {
  if (!value) return [];
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
};

export default function TextCaseConverterPage() {
  const [input, setInput] = useState('welcome to all dev needs')
  const [copied, setCopied] = useState('')

  const stats = useMemo(() => {
    const chars = input.length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split(/\r?\n/).length : 0;
    return { chars, words, lines };
  }, [input]);

  const variants = useMemo(() => {
    const items = tokenize(input);
    if (!items.length) {
      return [
        ['camelCase', ''],
        ['PascalCase', ''],
        ['snake_case', ''],
        ['kebab-case', ''],
        ['CONSTANT_CASE', ''],
        ['dot.case', ''],
        ['Title Case', ''],
        ['Sentence case', ''],
        ['UPPER CASE', ''],
        ['lower case', '']
      ];
    }
    const lower = items.map(item => item.toLowerCase());
    const title = lower.map(item => (item[0]?.toUpperCase() || '') + item.slice(1));
    
    return [
      ['camelCase', lower[0] + title.slice(1).join('')],
      ['PascalCase', title.join('')],
      ['snake_case', lower.join('_')],
      ['kebab-case', lower.join('-')],
      ['CONSTANT_CASE', lower.join('_').toUpperCase()],
      ['dot.case', lower.join('.')],
      ['Title Case', title.join(' ')],
      ['Sentence case', title[0] + (lower.slice(1).length > 0 ? ' ' + lower.slice(1).join(' ') : '')],
      ['UPPER CASE', lower.join(' ').toUpperCase()],
      ['lower case', lower.join(' ')]
    ];
  }, [input]);

  const copy = async (name: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(name);
    setTimeout(() => setCopied(''), 1500);
  };

  const loadSample = () => {
    setInput('user_profile_updated camelCaseExample snake_case_value');
    setCopied('');
  };

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3 text-sky-500">
          <BsCodeSlash className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            Text Case Converter
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Convert strings for source code variables, configuration names, URL paths, and formatting styles.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-5xl gap-6">
        {/* Input Card */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h6" className="text-gray-900 dark:text-white">
                Source Text
              </Typography>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={loadSample}
                  className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 font-semibold transition-colors"
                >
                  <BsFileText className="h-3.5 w-3.5" /> Sample Text
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
              label="Enter text here"
              value={input}
              onChange={event => { setInput(event.target.value); setCopied('') }}
              className="min-h-32 dark:text-white text-base"
              containerProps={{ className: "w-full min-h-32" }}
            />

            {/* Statistics */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">
              <span>Characters: {stats.chars}</span>
              <span>Words: {stats.words}</span>
              <span>Lines: {stats.lines}</span>
            </div>
          </CardBody>
        </Card>

        {/* Output Grid Card */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6">
            <Typography variant="h6" className="mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
              Casing Conversions (Click to Copy)
            </Typography>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {variants.map(([name, value]) => (
                <button
                  key={name}
                  onClick={() => copy(name, value)}
                  disabled={!value}
                  className="group rounded-xl border border-gray-100 dark:border-gray-850 bg-gray-50/50 hover:bg-sky-50/10 dark:bg-gray-950/20 dark:hover:bg-sky-950/5 hover:border-sky-200 dark:hover:border-sky-950/40 p-4 text-left transition-all duration-150 relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Typography className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-450 leading-none">
                      {name}
                    </Typography>
                    <span className="text-gray-400 dark:text-gray-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors shrink-0">
                      {copied === name ? (
                        <BsCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <BsClipboard className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </div>
                  <code className="mt-3 block break-all text-xs font-semibold font-mono leading-relaxed text-gray-900 dark:text-gray-200">
                    {value || '—'}
                  </code>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

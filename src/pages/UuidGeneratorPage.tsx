import React, { useState, useEffect } from 'react'
import { Button, Card, CardBody, Input, Typography, Select, Option } from '@material-tailwind/react'
import { BsCheck2, BsClipboard, BsStars, BsTrash, BsDownload, BsInfoCircle } from 'react-icons/bs'

// Custom UUID v1 Generator using BigInt
function generateUUIDv1(): string {
  const GREGORIAN_OFFSET = 122192928000000000n;
  const now = BigInt(Date.now()) * 10000n + GREGORIAN_OFFSET;

  const timeLow = (now & 0xffffffffn).toString(16).padStart(8, '0');
  const timeMid = ((now >> 32n) & 0xffffn).toString(16).padStart(4, '0');
  const timeHiAndVersion = (((now >> 48n) & 0x0fffn) | 0x1000n).toString(16).padStart(4, '0');

  const clockSeq = (Math.floor(Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, '0');

  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq.slice(0, 4)}-${node}`;
}

export default function UuidGeneratorPage() {
  const [count, setCount] = useState(5)
  const [version, setVersion] = useState<'v4' | 'v1'>('v4')
  const [options, setOptions] = useState({
    hyphens: true,
    braces: false,
    uppercase: false
  })
  const [uuids, setUuids] = useState<string[]>([])
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Generate initial list on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = () => {
    const list = Array.from({ length: count }, () => {
      let uuid = version === 'v1' ? generateUUIDv1() : crypto.randomUUID();

      if (!options.hyphens) {
        uuid = uuid.replace(/-/g, '');
      }

      if (options.uppercase) {
        uuid = uuid.toUpperCase();
      }

      if (options.braces) {
        uuid = `{${uuid}}`;
      }

      return uuid;
    });
    setUuids(list);
    setCopiedAll(false);
    setCopiedIndex(null);
  };

  const copyAll = async () => {
    if (!uuids.length) return;
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const copySingle = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const downloadTxt = () => {
    if (!uuids.length) return;
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${version}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearUuids = () => {
    setUuids([]);
  };

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-3 text-violet-500">
          <BsStars className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            UUID Generator
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Generate version 4 (random) and version 1 (timestamp) universally unique identifiers.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Left Column: Configuration Parameters */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6 space-y-6">
            <Typography variant="h6" className="text-gray-900 dark:text-white">
              Configuration
            </Typography>

            {/* Version Dropdown */}
            <div className="w-full">
              <Select
                label="UUID Version"
                value={version}
                onChange={val => setVersion((val || 'v4') as 'v4' | 'v1')}
                className="dark:text-white dark:bg-gray-800"
                labelProps={{ className: 'dark:text-gray-400 dark:peer-focus:text-white' }}
                menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
              >
                <Option value="v4" className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                  Version 4 (Randomly generated)
                </Option>
                <Option value="v1" className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                  Version 1 (Time and Node-based)
                </Option>
              </Select>
            </div>

            {/* Count Input */}
            <div className="w-full">
              <Input
                type="number"
                label="Number of UUIDs"
                value={count}
                min={1}
                max={500}
                onChange={e => setCount(Math.max(1, Math.min(500, Number(e.target.value))))}
                crossOrigin={undefined}
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-400 dark:peer-focus:text-white' }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
                Generate up to 500 identifiers in a single batch
              </span>
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-3 pt-2">
              <Typography className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Options
              </Typography>

              <div className="space-y-2.5">
                {/* Hyphens */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.hyphens}
                    onChange={e => setOptions(prev => ({ ...prev, hyphens: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 cursor-pointer"
                  />
                  <div className="grid">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Include Hyphens</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">e.g. 12345678-abcd-...</span>
                  </div>
                </label>

                {/* Braces */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.braces}
                    onChange={e => setOptions(prev => ({ ...prev, braces: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 cursor-pointer"
                  />
                  <div className="grid">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Wrap in Braces</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">e.g. {'{12345678-...}'}</span>
                  </div>
                </label>

                {/* Uppercase */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.uppercase}
                    onChange={e => setOptions(prev => ({ ...prev, uppercase: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 cursor-pointer"
                  />
                  <div className="grid">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">UPPERCASE</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Make hex characters capitalised</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
              <Button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 text-sm"
              >
                <BsStars className="h-4 w-4" /> Generate
              </Button>
              {uuids.length > 0 && (
                <Button
                  onClick={clearUuids}
                  variant="outlined"
                  className="border-gray-300 text-gray-700 hover:text-red-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-850 px-4"
                  title="Clear list"
                >
                  <BsTrash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Output List */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between min-h-[460px]">
          <CardBody className="p-5 sm:p-6 flex flex-col h-full">
            {/* Output Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
              <div>
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  UUID List
                </Typography>
                {uuids.length > 0 && (
                  <Typography className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    Generated {uuids.length} item{uuids.length > 1 ? 's' : ''} (UUID {version.toUpperCase()})
                  </Typography>
                )}
              </div>

              {/* Bulk Actions */}
              {uuids.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={downloadTxt}
                    className="flex items-center gap-1.5 border border-violet-200 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 px-3 py-2 rounded-lg text-xs font-semibold"
                    title="Download as Text file"
                  >
                    <BsDownload className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={copyAll}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                  >
                    {copiedAll ? <BsCheck2 className="h-3.5 w-3.5" /> : <BsClipboard className="h-3.5 w-3.5" />}
                    {copiedAll ? 'Copied list!' : 'Copy all'}
                  </Button>
                </div>
              )}
            </div>

            {/* Main Output container */}
            <div className="flex-1 flex flex-col justify-center">
              {uuids.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Typography className="text-gray-400 dark:text-gray-600 text-sm font-semibold">
                    No identifiers generated
                  </Typography>
                  <Typography className="text-gray-500 dark:text-gray-500 text-xs max-w-xs mx-auto">
                    Choose your configuration options on the left and click Generate to create unique identifiers.
                  </Typography>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                  {uuids.map((uuid, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-850 bg-gray-50/50 hover:bg-violet-50/10 dark:bg-gray-950/20 dark:hover:bg-violet-950/5 hover:border-violet-100 dark:hover:border-violet-950/30 transition-all duration-150"
                    >
                      <span className="font-mono text-xs text-gray-800 dark:text-gray-200 select-all font-semibold leading-none truncate">
                        {uuid}
                      </span>
                      <button
                        onClick={() => copySingle(uuid, index)}
                        className="ml-3 p-1.5 rounded-md text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-violet-950/40 transition-all duration-150 shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <BsCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <BsClipboard className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Information Tips footer */}
            <div className="mt-5 border-t border-gray-100 dark:border-gray-850 pt-4 text-xs text-gray-500 dark:text-gray-500 flex items-start gap-2 font-medium">
              <BsInfoCircle className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
              <div>
                <span>UUID v4 is cryptographically random and suitable for general purpose identifiers.</span>
                <span className="block mt-0.5">UUID v1 is sortable chronologically as it incorporates a high-resolution time element.</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

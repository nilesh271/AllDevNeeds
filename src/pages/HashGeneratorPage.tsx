import React, { useState, useEffect, useRef } from 'react'
import { Button, Card, CardBody, Option, Select, Typography } from '@material-tailwind/react'
import { BsCheck2, BsClipboard, BsShieldLock, BsFileEarmarkCode, BsTrash, BsCloudUpload } from 'react-icons/bs'

const algorithms = ['SHA-256', 'SHA-384', 'SHA-512', 'MD5'] as const
type Algorithm = typeof algorithms[number]

// Custom MD5 Implementation for Uint8Array (since SubtleCrypto does not support MD5)
function md5(buffer: Uint8Array): string {
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  const r = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
  ];

  const words: number[] = [];
  for (let i = 0; i < buffer.length; i++) {
    words[i >> 2] |= (buffer[i] & 0xff) << ((i % 4) * 8);
  }
  
  const byteLength = buffer.length;
  words[byteLength >> 2] |= 0x80 << ((byteLength % 4) * 8);
  
  const lengthInBits = byteLength * 8;
  const wordCount = ((byteLength + 8) >> 6) + 1;
  const totalWords = wordCount * 16;
  
  while (words.length < totalWords) {
    words.push(0);
  }
  
  words[totalWords - 2] = lengthInBits & 0xffffffff;
  words[totalWords - 1] = Math.floor(lengthInBits / 0x100000000);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  for (let i = 0; i < totalWords; i += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;

    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      
      const sum = a + f + k[j] + (words[i + g] || 0);
      const rotated = (sum << r[j]) | (sum >>> (32 - r[j]));
      b = (b + rotated) | 0;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  const toHex = (n: number) => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return s;
  };

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
}

export default function HashGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(true);
  const [casing, setCasing] = useState<'lowercase' | 'uppercase'>('lowercase');

  // File States
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [hashingFile, setHashingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateTextHash = async () => {
    try {
      const uint8 = new TextEncoder().encode(input);
      let calculatedHash = '';
      if (algorithm === 'MD5') {
        calculatedHash = md5(uint8);
      } else {
        const digest = await crypto.subtle.digest(algorithm as string, uint8);
        calculatedHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      }
      setHash(calculatedHash);
    } catch (err) {
      console.error(err);
      setHash('Error generating hash.');
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileHash('');
    setHashingFile(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let calculatedHash = '';
      if (algorithm === 'MD5') {
        calculatedHash = md5(uint8);
      } else {
        const digest = await crypto.subtle.digest(algorithm as string, uint8);
        calculatedHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      }
      setFileHash(calculatedHash);
    } catch (err) {
      console.error(err);
      setFileHash('Error generating hash.');
    } finally {
      setHashingFile(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'text') {
      if (live) {
        generateTextHash();
      }
    } else if (activeTab === 'file' && file) {
      handleFileChange(file);
    }
  }, [input, algorithm, live, activeTab, file]);

  const copy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileHash('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getHashLengthInfo = () => {
    if (algorithm === 'MD5') return '128-bit / 32 hex chars';
    if (algorithm === 'SHA-256') return '256-bit / 64 hex chars';
    if (algorithm === 'SHA-384') return '384-bit / 96 hex chars';
    if (algorithm === 'SHA-512') return '512-bit / 128 hex chars';
    return '';
  };

  const getAlgorithmBadge = () => {
    if (algorithm === 'MD5') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
          ⚠️ Legacy & Insecure
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
        ✓ Secure
      </span>
    );
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const finalDigest = activeTab === 'text' ? hash : fileHash;
  const casedDigest = casing === 'uppercase' ? finalDigest.toUpperCase() : finalDigest.toLowerCase();

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-emerald-500">
          <BsShieldLock className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            Hash Generator
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Create one-way MD5 and cryptographic SHA hashes locally in your browser.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left Column: Input and Parameters */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab('text')}
                className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'text'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Text Hash
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'file'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                File Hash
              </button>
            </div>

            {/* Input Section */}
            {activeTab === 'text' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    Input Text
                  </Typography>
                  {input && (
                    <button
                      onClick={() => setInput('')}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <BsTrash className="h-3.5 w-3.5" /> Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={9}
                  placeholder="Enter or paste text here to generate hash..."
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  className="w-full min-h-[250px] p-3 rounded-xl border border-gray-250 dark:border-gray-800 bg-transparent text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Input File
                </Typography>
                
                {!file ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5'
                        : 'border-gray-300 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 bg-gray-50/50 dark:bg-gray-950/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    />
                    <BsCloudUpload className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3" />
                    <Typography className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                      Drag and drop file here, or click to browse
                    </Typography>
                    <Typography className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Files are processed entirely locally and never uploaded.
                    </Typography>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-950/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-2.5 text-emerald-500">
                          <BsFileEarmarkCode className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <Typography className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                            {file.name}
                          </Typography>
                          <Typography className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatBytes(file.size)}
                          </Typography>
                        </div>
                      </div>
                      <button
                        onClick={clearFile}
                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Remove file"
                      >
                        <BsTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Algorithm Parameters */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-48">
                  <Select
                    label="Algorithm"
                    value={algorithm}
                    onChange={value => setAlgorithm((value || 'SHA-256') as Algorithm)}
                    className="dark:text-white dark:bg-gray-800"
                    labelProps={{ className: 'dark:text-gray-400 dark:peer-focus:text-white' }}
                    menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
                  >
                    {algorithms.map(item => (
                      <Option
                        key={item}
                        value={item}
                        className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                      >
                        {item}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                {/* Real-time Toggle for Text tab */}
                {activeTab === 'text' && (
                  <div className="flex items-center gap-2">
                    <input
                      id="live-switch"
                      type="checkbox"
                      checked={live}
                      onChange={e => setLive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 cursor-pointer"
                    />
                    <label htmlFor="live-switch" className="text-xs font-semibold text-gray-700 dark:text-gray-400 cursor-pointer select-none">
                      Live Update Hashing
                    </label>
                  </div>
                )}

                {/* Manual generate button if live mode is off */}
                {activeTab === 'text' && !live && (
                  <Button onClick={generateTextHash} className="bg-emerald-500 hover:bg-emerald-600 self-start sm:self-auto py-2.5 px-5">
                    Generate Hash
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Digest Output */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6 flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-5">
                <div>
                  <Typography variant="h6" className="text-gray-900 dark:text-white flex items-center gap-2">
                    Digest
                    {getAlgorithmBadge()}
                  </Typography>
                  <Typography className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    {getHashLengthInfo()}
                  </Typography>
                </div>
                
                {/* Copy Button */}
                <Button
                  size="sm"
                  variant="text"
                  disabled={!casedDigest || hashingFile}
                  onClick={() => copy(casedDigest)}
                  className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 py-2 px-3 rounded-lg"
                >
                  {copied ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Formatting options */}
              <div className="flex items-center gap-3 mb-5">
                <Typography className="text-xs font-bold text-gray-700 dark:text-gray-400">Format:</Typography>
                <div className="flex bg-gray-100 dark:bg-gray-950 rounded-lg p-0.5 border border-gray-200 dark:border-gray-850">
                  <button
                    onClick={() => setCasing('lowercase')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      casing === 'lowercase'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    lowercase
                  </button>
                  <button
                    onClick={() => setCasing('uppercase')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      casing === 'uppercase'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    UPPERCASE
                  </button>
                </div>
              </div>

              {/* The digest output display box */}
              {hashingFile ? (
                <div className="flex flex-col items-center justify-center min-h-36 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                  <Typography className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Computing hash...
                  </Typography>
                </div>
              ) : (
                <code
                  onClick={() => casedDigest && copy(casedDigest)}
                  className={`block min-h-36 break-all rounded-xl p-4 text-sm font-semibold font-mono leading-relaxed border transition-all select-all ${
                    casedDigest
                      ? 'bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800'
                      : 'bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-900'
                  }`}
                  title={casedDigest ? "Click to copy hash" : undefined}
                >
                  {casedDigest || 'Your hash will appear here.'}
                </code>
              )}
            </div>

            <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Typography className="text-xs text-gray-500 dark:text-gray-500 leading-normal flex items-center gap-1.5 font-medium">
                ⚡ Running locally in sandbox. Web Crypto API handles SHA hashes; pure JS computes MD5.
              </Typography>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

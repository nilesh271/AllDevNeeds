import React, { useState, useEffect } from 'react'
import { Button, Card, CardBody, Chip, Switch, Typography } from '@material-tailwind/react'
import { BsArrowRepeat, BsCheck2, BsClipboard, BsKey, BsInfoCircle } from 'react-icons/bs'

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}?|;:,.<>';
const SIMILAR_CHARS = /[il1Lo0O]/g;

// Fisher-Yates shuffle
const shuffleArray = (array: string[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16)
  const [lowercase, setLowercase] = useState(true)
  const [uppercase, setUppercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    let pool = '';
    const mandatory: string[] = [];

    const charSets = [
      { active: lowercase, chars: LOWERCASE },
      { active: uppercase, chars: UPPERCASE },
      { active: numbers, chars: NUMBERS },
      { active: symbols, chars: SYMBOLS },
    ];

    charSets.forEach(set => {
      if (set.active) {
        let setChars = set.chars;
        if (excludeSimilar) {
          setChars = setChars.replace(SIMILAR_CHARS, '');
        }
        if (setChars.length > 0) {
          pool += setChars;
          const randomIdx = crypto.getRandomValues(new Uint32Array(1))[0] % setChars.length;
          mandatory.push(setChars[randomIdx]);
        }
      }
    });

    if (!pool.length) {
      setPassword('Select at least one character set');
      return;
    }

    const remainingLength = Math.max(0, length - mandatory.length);
    const remaining = Array.from({ length: remainingLength }, () => {
      const idx = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
      return pool[idx];
    });

    const shuffled = shuffleArray([...mandatory, ...remaining]);
    setPassword(shuffled.join(''));
    setCopied(false);
  };

  // Generate on load or option change
  useEffect(() => {
    handleGenerate();
  }, [length, lowercase, uppercase, numbers, symbols, excludeSimilar]);

  const handleCopy = async () => {
    if (password && !password.startsWith('Select')) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Calculate entropy
  let poolSize = 0;
  if (lowercase) poolSize += excludeSimilar ? 24 : 26;
  if (uppercase) poolSize += excludeSimilar ? 24 : 26;
  if (numbers) poolSize += excludeSimilar ? 8 : 10;
  if (symbols) poolSize += SYMBOLS.length;
  const entropy = poolSize > 0 ? length * Math.log2(poolSize) : 0;

  const getStrength = (ent: number) => {
    if (ent === 0) return { label: 'None', color: 'bg-gray-300 dark:bg-gray-800', width: '0%', textClass: 'text-gray-500' };
    if (ent < 40) return { label: 'Weak (Unsafe)', color: 'bg-red-500', width: '25%', textClass: 'text-red-500' };
    if (ent < 65) return { label: 'Medium', color: 'bg-orange-500', width: '50%', textClass: 'text-orange-500' };
    if (ent < 85) return { label: 'Strong', color: 'bg-yellow-600', width: '75%', textClass: 'text-yellow-600 dark:text-yellow-500' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%', textClass: 'text-emerald-500' };
  };

  const strength = getStrength(entropy);

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-emerald-500">
          <BsKey className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            Password Generator
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Create highly secure passwords locally in your browser. Inputs and outputs never touch the network.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Left Column: Settings Panel */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <CardBody className="p-5 sm:p-6 space-y-6">
            <Typography variant="h6" className="text-gray-900 dark:text-white">
              Password Settings
            </Typography>

            {/* Length Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Typography className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password Length
                </Typography>
                <Chip
                  value={`${length} characters`}
                  size="sm"
                  className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                />
              </div>
              <input
                aria-label="Password length"
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={event => setLength(Number(event.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none"
              />
            </div>

            {/* Switch Grid Options */}
            <div className="space-y-3 pt-2">
              <Typography className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Characters Included
              </Typography>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                  <Switch
                    label="Lowercase (a-z)"
                    checked={lowercase}
                    onChange={e => setLowercase(e.target.checked)}
                    crossOrigin={undefined}
                    className="checked:bg-emerald-500"
                    labelProps={{ className: "text-sm font-semibold text-gray-850 dark:text-gray-350" }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                  <Switch
                    label="Uppercase (A-Z)"
                    checked={uppercase}
                    onChange={e => setUppercase(e.target.checked)}
                    crossOrigin={undefined}
                    className="checked:bg-emerald-500"
                    labelProps={{ className: "text-sm font-semibold text-gray-855 dark:text-gray-350" }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                  <Switch
                    label="Numbers (0-9)"
                    checked={numbers}
                    onChange={e => setNumbers(e.target.checked)}
                    crossOrigin={undefined}
                    className="checked:bg-emerald-500"
                    labelProps={{ className: "text-sm font-semibold text-gray-855 dark:text-gray-350" }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                  <Switch
                    label="Symbols (&#38;#$%)"
                    checked={symbols}
                    onChange={e => setSymbols(e.target.checked)}
                    crossOrigin={undefined}
                    className="checked:bg-emerald-500"
                    labelProps={{ className: "text-sm font-semibold text-gray-855 dark:text-gray-350" }}
                  />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-855">
              <Typography className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Exclusions
              </Typography>
              <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                <Switch
                  label="Exclude Similar Characters"
                  checked={excludeSimilar}
                  onChange={e => setExcludeSimilar(e.target.checked)}
                  crossOrigin={undefined}
                  className="checked:bg-emerald-500"
                  labelProps={{ className: "text-sm font-semibold text-gray-855 dark:text-gray-350" }}
                />
                <span className="text-[10px] text-gray-500 dark:text-gray-550 ml-4 hidden sm:block">
                  Avoids i, l, 1, L, o, 0, O
                </span>
              </div>
            </div>

            {/* Manual Refresh / Generate Trigger */}
            <Button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 text-sm font-semibold"
              fullWidth
            >
              <BsArrowRepeat className="h-4 w-4" /> Generate New Password
            </Button>
          </CardBody>
        </Card>

        {/* Right Column: Output Panel */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between min-h-[420px]">
          <CardBody className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              <Typography variant="h6" className="text-gray-900 dark:text-white">
                Generated Password
              </Typography>

              {/* Password display container */}
              <div className="relative group">
                <code
                  onClick={handleCopy}
                  className={`block min-h-24 break-all rounded-xl p-4 text-base font-semibold font-mono leading-relaxed border transition-all select-all pr-12 cursor-pointer ${
                    password && !password.startsWith('Select')
                      ? 'bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800'
                      : 'bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-650 border-gray-100 dark:border-gray-900'
                  }`}
                  title={password && !password.startsWith('Select') ? "Click to copy" : undefined}
                >
                  {password}
                </code>
                {password && !password.startsWith('Select') && (
                  <button
                    onClick={handleCopy}
                    className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
                    title="Copy password"
                  >
                    {copied ? (
                      <BsCheck2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <BsClipboard className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Strength Meter */}
              {password && !password.startsWith('Select') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-455 font-semibold">Security Strength:</span>
                    <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                  </div>
                  
                  {/* Progress Bar background */}
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-950 rounded-full overflow-hidden border border-gray-200/20">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>

                  <span className="text-[10px] text-gray-400 dark:text-gray-505 block">
                    Estimated entropy: {entropy.toFixed(1)} bits. Higher entropy means harder to brute-force.
                  </span>
                </div>
              )}
            </div>

            {/* Info and Help */}
            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 text-xs text-gray-500 dark:text-gray-500 flex items-start gap-2 font-medium">
              <BsInfoCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <span>Generated passwords use modern browser cryptographically secure random number generators (`crypto.getRandomValues`).</span>
                <span className="block mt-0.5">We guarantee no data is cached or transmitted over the internet.</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Alert, Button, Card, CardBody, Typography } from "@material-tailwind/react";
import Textarea from "../components/form/Textarea"
import { BsCheckCircleFill, BsXCircleFill, BsClipboard, BsCheck2, BsInfoCircleFill, BsShieldCheck } from "react-icons/bs";

const DEFAULT_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzg0MTk2NTY1LCJleHAiOjE3ODQyMDAxNjV9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export default function JwtDecoderPage() {
  const [encodedToken, setEncodedToken] = useState(DEFAULT_JWT)
  const [header, setHeader] = useState("")
  const [payload, setPayload] = useState("")
  const [isValidState, setIsValidState] = useState<null | 0 | 1>(null)
  const [copiedType, setCopiedType] = useState<string | null>(null)

  const decodeJwtHandler = (token: string) => {
    if (!token.trim()) {
      setIsValidState(null)
      setHeader("")
      setPayload("")
      return
    }

    const parts = token.split(".");

    if (parts.length !== 3 || parts.some(part => !part)) {
      setIsValidState(0)
      setHeader("")
      setPayload("")
      return
    }

    const base64UrlDecode = (str: string) => {
      str = str.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (str.length % 4)) % 4);
      str += padding;
      const decoded = atob(str);
      return decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    };

    try {
      const headerObj = JSON.parse(base64UrlDecode(parts[0]));
      const payloadObj = JSON.parse(base64UrlDecode(parts[1]));

      setHeader(JSON.stringify(headerObj, null, 4))
      setPayload(JSON.stringify(payloadObj, null, 4))
      setIsValidState(1)
    } catch (err) {
      setIsValidState(0)
      setHeader("")
      setPayload("")
    }
  }

  useEffect(() => {
    decodeJwtHandler(encodedToken)
  }, [encodedToken])

  const clearHandler = () => {
    setEncodedToken("")
    setIsValidState(null)
  }

  const copyHandler = async (type: string) => {
    let val = ""
    if (type === "encoded") val = encodedToken
    else if (type === "header") val = header
    else if (type === "payload") val = payload

    if (!val) return;
    await navigator.clipboard.writeText(val);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  }

  // Parse claims for explanation panel
  const claims = useMemo(() => {
    if (isValidState !== 1 || !payload) return [];
    try {
      const obj = JSON.parse(payload);
      const list: { name: string; value: string; desc: string; badge?: string; badgeColor?: string }[] = [];

      const formatTime = (seconds: number) => {
        const d = new Date(seconds * 1000);
        return d.toLocaleString();
      };

      const getExpiryBadge = (seconds: number) => {
        const isExpired = Date.now() / 1000 > seconds;
        return {
          text: isExpired ? "Expired 🔴" : "Active 🟢",
          color: isExpired ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
        };
      };

      if (obj.iss !== undefined) {
        list.push({ name: 'iss', value: String(obj.iss), desc: 'Issuer: Identifies the principal that issued the JWT' });
      }
      if (obj.sub !== undefined) {
        list.push({ name: 'sub', value: String(obj.sub), desc: 'Subject: Identifies the subject (usually user ID) of the JWT' });
      }
      if (obj.aud !== undefined) {
        list.push({
          name: 'aud',
          value: Array.isArray(obj.aud) ? obj.aud.join(', ') : String(obj.aud),
          desc: 'Audience: Identifies the recipients that the JWT is intended for'
        });
      }
      if (obj.exp !== undefined && typeof obj.exp === 'number') {
        const badge = getExpiryBadge(obj.exp);
        list.push({
          name: 'exp',
          value: formatTime(obj.exp),
          desc: 'Expiration Time: Identifies the expiration time on or after which the JWT must not be accepted',
          badge: badge.text,
          badgeColor: badge.color
        });
      }
      if (obj.nbf !== undefined && typeof obj.nbf === 'number') {
        list.push({
          name: 'nbf',
          value: formatTime(obj.nbf),
          desc: 'Not Before: Identifies the time before which the JWT must not be accepted'
        });
      }
      if (obj.iat !== undefined && typeof obj.iat === 'number') {
        list.push({
          name: 'iat',
          value: formatTime(obj.iat),
          desc: 'Issued At: Identifies the time at which the JWT was issued'
        });
      }

      // Add custom claims that are useful
      Object.keys(obj).forEach(key => {
        if (!['iss', 'sub', 'aud', 'exp', 'nbf', 'iat'].includes(key)) {
          list.push({
            name: key,
            value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : String(obj[key]),
            desc: 'Custom Claim: Application-specific claim data'
          });
        }
      });

      return list;
    } catch {
      return [];
    }
  }, [isValidState, payload]);

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 text-indigo-500">
          <BsShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
            JWT Decoder
          </Typography>
          <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            Inspect, decode, and extract payload metadata claims from JSON Web Tokens.
          </Typography>
        </div>
      </div>

      <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-[3fr_4fr]">
        {/* Left Column: Encoded Input */}
        <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 h-full flex flex-col justify-between">
          <CardBody className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              <Typography variant="h6" className="text-gray-900 dark:text-white">
                Encoded Token
              </Typography>
              
              <Textarea
                label="Paste JWT Token here..."
                value={encodedToken}
                onChange={e => setEncodedToken(e.target.value)}
                className="min-h-[384px] font-mono text-sm leading-relaxed dark:text-white"
                containerProps={{ className: "w-full min-h-[384px]" }}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => copyHandler("encoded")}
                  disabled={!encodedToken}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5"
                >
                  {copiedType === "encoded" ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
                  {copiedType === "encoded" ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearHandler}
                  className="border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold py-2.5 px-6"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Validation State Alert */}
            <div className="pt-2">
              {isValidState === 0 ? (
                <Alert
                  icon={<BsXCircleFill className="h-5 w-5 shrink-0" />}
                  className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs font-semibold py-3"
                >
                  Invalid JWT structure (must contain 3 segments separated by dots)
                </Alert>
              ) : isValidState === 1 ? (
                <Alert
                  icon={<BsCheckCircleFill className="h-5 w-5 shrink-0" />}
                  className="border-l-4 border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-250 text-xs font-semibold py-3"
                >
                  JWT header and payload decoded successfully
                </Alert>
              ) : (
                <Alert
                  icon={<BsInfoCircleFill className="h-5 w-5 shrink-0" />}
                  className="border-l-4 border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-semibold py-3"
                >
                  Paste your token to begin decoding claims
                </Alert>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Decoded Output Header + Payload */}
        <div className="space-y-6">
          {/* Header segment */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3 border-b border-gray-105 dark:border-gray-850 pb-2">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Header (Algorithm &amp; Token Type)
                </Typography>
                <Button
                  size="sm"
                  variant="text"
                  disabled={!header}
                  onClick={() => copyHandler("header")}
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 py-1.5 px-3 rounded-lg animate-pulse-once"
                >
                  {copiedType === "header" ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                  {copiedType === "header" ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                label="Header JSON"
                value={header}
                readOnly
                className="min-h-[144px] font-mono text-sm leading-relaxed dark:text-white bg-gray-50/30 dark:bg-gray-950/10 border-indigo-50/50"
                containerProps={{ className: "w-full min-h-[144px]" }}
              />
            </CardBody>
          </Card>

          {/* Payload segment */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3 border-b border-gray-105 dark:border-gray-850 pb-2">
                <Typography variant="h6" className="text-gray-900 dark:text-white">
                  Payload (Data &amp; Claims)
                </Typography>
                <Button
                  size="sm"
                  variant="text"
                  disabled={!payload}
                  onClick={() => copyHandler("payload")}
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 py-1.5 px-3 rounded-lg animate-pulse-once"
                >
                  {copiedType === "payload" ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                  {copiedType === "payload" ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                label="Payload JSON"
                value={payload}
                readOnly
                className="min-h-[288px] font-mono text-sm leading-relaxed dark:text-white bg-gray-50/30 dark:bg-gray-950/10 border-indigo-50/50"
                containerProps={{ className: "w-full min-h-[288px]" }}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Claims Inspector Panel */}
      {claims.length > 0 && (
        <div className="mt-6 max-w-6xl">
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
                Claims Explorer
              </Typography>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-850 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                      <th className="pb-3 pl-2 w-24">Claim</th>
                      <th className="pb-3 w-60">Value</th>
                      <th className="pb-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50 dark:divide-gray-850/50 text-sm">
                    {claims.map((claim, idx) => (
                      <tr key={`${claim.name}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{claim.name}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-955 dark:text-gray-100 break-all select-all">
                          <div className="flex items-center gap-2">
                            <span>{claim.value}</span>
                            {claim.badge && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${claim.badgeColor}`}>
                                {claim.badge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-xs text-gray-500 dark:text-gray-400">{claim.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

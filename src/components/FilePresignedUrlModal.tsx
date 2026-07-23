import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogHeader, DialogBody, DialogFooter,
  Button, Typography, Select, Option, Input, Chip
} from '@material-tailwind/react'
import { FileRecord } from '../store/filesSlice'
import { getPresignedUrl } from '../services/fileManager'
import { BsLink45Deg, BsCheck2, BsClipboard, BsClockHistory } from 'react-icons/bs'

interface FilePresignedUrlModalProps {
  open: boolean
  file: FileRecord | null
  onClose: () => void
}

const EXPIRATION_OPTIONS = [
  { label: '15 Minutes', value: 900 },
  { label: '1 Hour', value: 3600 },
  { label: '24 Hours', value: 86400 },
  { label: '7 Days', value: 604800 },
]

export default function FilePresignedUrlModal({ open, file, onClose }: FilePresignedUrlModalProps) {
  const [expiresIn, setExpiresIn] = useState<number>(3600)
  const [presignedUrl, setPresignedUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open && file) {
      handleGenerateUrl(3600)
    } else {
      setPresignedUrl('')
      setCopied(false)
      setError('')
    }
  }, [open, file])

  const handleGenerateUrl = async (sec = expiresIn) => {
    if (!file) return
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const url = await getPresignedUrl(file, sec)
      setPresignedUrl(url)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate signed URL')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!presignedUrl) return
    await navigator.clipboard.writeText(presignedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!file) return null

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="sm"
      className="m-3 min-w-[calc(100%-1.5rem)] sm:min-w-[480px] dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
    >
      <DialogHeader className="flex items-center justify-between text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 text-base sm:text-lg">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-500 shrink-0">
            <BsLink45Deg className="h-5 w-5" />
          </div>
          <div className="min-w-0 truncate">
            <Typography variant="h6" className="text-gray-900 dark:text-white text-sm sm:text-base truncate">
              Share Presigned URL
            </Typography>
            <Typography className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-normal truncate">
              Secure, temporary link for public download
            </Typography>
          </div>
        </div>
      </DialogHeader>

      <DialogBody className="space-y-4 pt-4 px-4 sm:px-6">
        {/* File Metadata summary */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2">
          <div className="min-w-0 truncate flex-1">
            <Typography className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {file.name}
            </Typography>
            <Typography className="text-[11px] text-gray-500 dark:text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </Typography>
          </div>
          <Chip
            value={file.storage.toUpperCase()}
            size="sm"
            className={`font-bold shrink-0 text-[10px] ${
              file.storage === 'supabase'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : file.storage === 's3'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
            }`}
          />
        </div>

        {/* Expiration dropdown */}
        <div className="space-y-2">
          <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <BsClockHistory className="h-3.5 w-3.5 text-sky-500" /> URL Expiration Time
          </Typography>
          <Select
            label="Select Expiration"
            value={String(expiresIn)}
            onChange={(val) => {
              if (val) {
                const sec = Number(val)
                setExpiresIn(sec)
                handleGenerateUrl(sec)
              }
            }}
            menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
            className="dark:text-white text-xs"
            labelProps={{ className: 'dark:text-gray-400 text-xs' }}
          >
            {EXPIRATION_OPTIONS.map((opt) => (
              <Option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* Presigned URL output */}
        <div className="space-y-2">
          <Typography className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Generated Signed Link
          </Typography>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              readOnly
              value={loading ? 'Generating signed URL...' : presignedUrl}
              className="dark:text-white font-mono text-xs"
              containerProps={{ className: 'min-w-0 flex-1' }}
              crossOrigin=""
            />
            <Button
              onClick={handleCopy}
              disabled={loading || !presignedUrl}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 w-full sm:w-auto ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {copied ? <BsCheck2 className="h-4 w-4" /> : <BsClipboard className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {error && (
            <Typography className="text-xs text-red-500 dark:text-red-400">
              {error}
            </Typography>
          )}
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-gray-100 dark:border-gray-800 pt-3">
        <Button variant="text" onClick={onClose} className="dark:text-gray-300 hover:dark:bg-gray-800 text-xs">
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

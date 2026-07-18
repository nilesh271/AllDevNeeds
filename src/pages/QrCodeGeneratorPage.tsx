import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardBody, Typography, Button, Alert } from '@material-tailwind/react'
import { QRCodeCanvas } from 'qrcode.react'
import jsQR from 'jsqr'
import { 
  BsQrCode, 
  BsCheck2, 
  BsClipboard, 
  BsDownload, 
  BsWifi, 
  BsEnvelope, 
  BsTelephone, 
  BsCardChecklist, 
  BsLink, 
  BsFileText, 
  BsUpload,
  BsCameraVideo,
  BsCameraVideoOff,
  BsXCircle,
  BsExclamationTriangle,
  BsInfoCircle,
  BsWhatsapp
} from 'react-icons/bs'
import Input from '../components/form/Input'

type QrType = 'url' | 'wifi' | 'email' | 'phone' | 'vcard' | 'text' | 'whatsapp'

function SelectDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="relative w-full">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-800 focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 rounded-xl px-3 text-sm font-semibold transition-all appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function QrCodeGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'decode'>('generate')

  // === GENERATOR STATES ===
  const [qrType, setQrType] = useState<QrType>('url')
  const [urlInput, setUrlInput] = useState('https://google.com')
  const [textInput, setTextInput] = useState('Hello World')
  const [emailInput, setEmailInput] = useState({ address: 'dev@example.com', subject: 'Hello', body: 'Sent from AllDevNeeds' })
  const [wifiInput, setWifiInput] = useState({ ssid: 'Home_WiFi', password: 'SecretPassword', encryption: 'WPA' })
  const [phoneInput, setPhoneInput] = useState({ number: '+1234567890', message: 'Hello there!' })
  const [vcardInput, setVcardInput] = useState({ name: 'John Doe', org: 'Dev Co', tel: '+1234567890', email: 'john@example.com', url: 'https://example.com' })
  const [whatsappInput, setWhatsappInput] = useState({ countryCode: '91', number: '9876543210', message: 'Hello from AllDevNeeds!' })

  // Styling settings
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(256)
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [logoSrc, setLogoSrc] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // === DECODER STATES ===
  const [decodedResult, setDecodedResult] = useState<string | null>(null)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [webcamPermission, setWebcamPermission] = useState<boolean | null>(null) // null = unasked, true = granted, false = denied
  const [copiedDecoded, setCopiedDecoded] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)

  // Clean up stream on component unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    }
  }, [])

  // Compile QR code value
  const compiledValue = useMemo(() => {
    switch (qrType) {
      case 'url':
        return urlInput || 'https://example.com'
      case 'text':
        return textInput || 'Hello World'
      case 'email':
        return `mailto:${emailInput.address || ''}?subject=${encodeURIComponent(emailInput.subject || '')}&body=${encodeURIComponent(emailInput.body || '')}`
      case 'wifi':
        return `WIFI:T:${wifiInput.encryption || 'WPA'};S:${wifiInput.ssid || ''};P:${wifiInput.password || ''};;`
      case 'phone':
        return phoneInput.message
          ? `SMSTO:${phoneInput.number || ''}:${phoneInput.message}`
          : `tel:${phoneInput.number || ''}`
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardInput.name || ''}\nORG:${vcardInput.org || ''}\nTEL:${vcardInput.tel || ''}\nEMAIL:${vcardInput.email || ''}\nURL:${vcardInput.url || ''}\nEND:VCARD`
      case 'whatsapp':
        const cleanCountry = whatsappInput.countryCode.replace(/\D/g, '')
        const cleanNumber = whatsappInput.number.replace(/\D/g, '')
        return `https://wa.me/${cleanCountry}${cleanNumber}?text=${encodeURIComponent(whatsappInput.message)}`
      default:
        return ''
    }
  }, [qrType, urlInput, textInput, emailInput, wifiInput, phoneInput, vcardInput, whatsappInput])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoSrc(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const downloadPng = () => {
    const canvas = document.getElementById('qr-canvas-element') as HTMLCanvasElement
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcode-${qrType}-${Date.now()}.png`
    link.click()
  }

  const copyToClipboard = async () => {
    const canvas = document.getElementById('qr-canvas-element') as HTMLCanvasElement
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      })
    } catch (err) {
      console.error('Failed to copy QR code image', err)
    }
  }

  // === DECODER LOGIC ===
  const startWebcam = async () => {
    setDecodeError(null)
    setDecodedResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      setWebcamPermission(true)
      setIsScanning(true)
      
      // Delay slightly to let video element bind
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.play().catch(e => console.error("Playback failed", e))
          animationFrameIdRef.current = requestAnimationFrame(scanFrame)
        }
      }, 100)
    } catch (err: any) {
      console.error(err)
      setWebcamPermission(false)
      setIsScanning(false)
      setDecodeError('Camera access was denied or no capture device was found. Please follow the instructions below to enable camera permissions.')
    }
  }

  const stopWebcam = () => {
    setIsScanning(false)
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      if (code) {
        setDecodedResult(code.data)
        stopWebcam()
        return
      }
    }
    // Continue scanning if still active
    animationFrameIdRef.current = requestAnimationFrame(scanFrame)
  }

  const handleImageDecode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDecodeError(null)
    setDecodedResult(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          setDecodedResult(code.data)
        } else {
          setDecodeError('Could not find a valid QR Code in the uploaded image. Please ensure the QR is clear and well-lit.')
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const copyDecodedText = async () => {
    if (!decodedResult) return
    await navigator.clipboard.writeText(decodedResult)
    setCopiedDecoded(true)
    setTimeout(() => setCopiedDecoded(false), 1500)
  }

  // Parse decoded QR info for display
  const parsedDecodedData = useMemo(() => {
    if (!decodedResult) return null

    if (decodedResult.startsWith('WIFI:')) {
      const ssid = decodedResult.match(/S:([^;]+)/)?.[1] || 'Unknown SSID'
      const password = decodedResult.match(/P:([^;]+)/)?.[1] || 'None'
      const encryption = decodedResult.match(/T:([^;]+)/)?.[1] || 'Open'
      return {
        type: 'Wi-Fi Network',
        icon: BsWifi,
        details: [
          { key: 'Network Name (SSID)', val: ssid },
          { key: 'Security Type', val: encryption },
          { key: 'Password', val: password },
        ],
        wifiString: decodedResult
      }
    }

    if (decodedResult.startsWith('https://wa.me/') || decodedResult.includes('api.whatsapp.com/send')) {
      let phone = ''
      let text = ''
      if (decodedResult.startsWith('https://wa.me/')) {
        const parts = decodedResult.replace('https://wa.me/', '').split('?')
        phone = parts[0] || ''
        const textParam = parts[1]?.match(/text=([^&]+)/)?.[1] || ''
        text = decodeURIComponent(textParam)
      } else {
        phone = decodedResult.match(/phone=([^&]+)/)?.[1] || ''
        const textParam = decodedResult.match(/text=([^&]+)/)?.[1] || ''
        text = decodeURIComponent(textParam)
      }
      return {
        type: 'WhatsApp Message',
        icon: BsWhatsapp,
        details: [
          { key: 'Phone Number', val: phone },
          { key: 'Message Text', val: text }
        ],
        link: decodedResult
      }
    }

    if (decodedResult.startsWith('http://') || decodedResult.startsWith('https://')) {
      return {
        type: 'Website Link',
        icon: BsLink,
        details: [
          { key: 'URL', val: decodedResult }
        ],
        link: decodedResult
      }
    }

    if (decodedResult.startsWith('mailto:')) {
      const address = decodedResult.match(/mailto:([^?]+)/)?.[1] || ''
      const subject = decodeURIComponent(decodedResult.match(/subject=([^&]+)/)?.[1] || '')
      const body = decodeURIComponent(decodedResult.match(/body=([^&]+)/)?.[1] || '')
      return {
        type: 'Email Address',
        icon: BsEnvelope,
        details: [
          { key: 'Recipient', val: address },
          { key: 'Subject', val: subject },
          { key: 'Message', val: body },
        ]
      }
    }

    if (decodedResult.startsWith('tel:')) {
      return {
        type: 'Phone Number',
        icon: BsTelephone,
        details: [
          { key: 'Number', val: decodedResult.replace('tel:', '') }
        ]
      }
    }

    if (decodedResult.startsWith('SMSTO:')) {
      const parts = decodedResult.split(':')
      const number = parts[1] || ''
      const message = parts.slice(2).join(':') || ''
      return {
        type: 'SMS Message',
        icon: BsTelephone,
        details: [
          { key: 'Send To', val: number },
          { key: 'Text Message', val: message }
        ]
      }
    }

    return {
      type: 'Plain Text',
      icon: BsFileText,
      details: [
        { key: 'Content', val: decodedResult }
      ]
    }
  }, [decodedResult])

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-850 pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-3 text-violet-500">
            <BsQrCode className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h3" className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in">
              QR Code Engine
            </Typography>
            <Typography className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
              Create vector QR graphics or scan/decrypt barcodes via webcam &amp; files.
            </Typography>
          </div>
        </div>
      </div>

      {/* Top level tabs selector */}
      <div className="mt-3 flex justify-start">
        <div className="flex bg-gray-150 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button
            onClick={() => { stopWebcam(); setActiveTab('generate') }}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg transition-all duration-250 select-none ${
              activeTab === 'generate'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-violet-650 dark:hover:text-violet-400'
            }`}
          >
            <BsQrCode className="h-4 w-4" />
            <span>Generate QR Code</span>
          </button>
          <button
            onClick={() => { setActiveTab('decode') }}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg transition-all duration-250 select-none ${
              activeTab === 'decode'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-violet-655 dark:hover:text-violet-400'
            }`}
          >
            <BsCameraVideo className="h-4 w-4" />
            <span>Decode QR Code</span>
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        /* ==================== GENERATOR VIEW ==================== */
        <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1.8fr_1fr] animate-fade-in">
          {/* Left Card: Input fields */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-6">
              <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-2">
                1. Choose QR Code Content
              </Typography>

              {/* Type selector buttons grid */}
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {[
                  { value: 'url', label: 'URL', icon: BsLink, colorClass: 'text-blue-500 dark:text-blue-400' },
                  { value: 'text', label: 'Text', icon: BsFileText, colorClass: 'text-amber-600 dark:text-amber-400' },
                  { value: 'wifi', label: 'Wi-Fi', icon: BsWifi, colorClass: 'text-indigo-500 dark:text-indigo-400' },
                  { value: 'email', label: 'Email', icon: BsEnvelope, colorClass: 'text-rose-500 dark:text-rose-400' },
                  { value: 'phone', label: 'SMS/Call', icon: BsTelephone, colorClass: 'text-cyan-600 dark:text-cyan-400' },
                  { value: 'whatsapp', label: 'WhatsApp', icon: BsWhatsapp, colorClass: 'text-emerald-500 dark:text-emerald-400' },
                  { value: 'vcard', label: 'vCard', icon: BsCardChecklist, colorClass: 'text-teal-500 dark:text-teal-400' },
                ].map(({ value, label, icon: Icon, colorClass }) => {
                  const active = qrType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setQrType(value as QrType)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${
                        active
                          ? 'border-violet-500 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-sm font-bold ring-2 ring-violet-500/10'
                          : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 hover:border-violet-200 dark:hover:border-violet-900/30 font-semibold'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1.5 ${colorClass}`} />
                      <span className="text-[11px] tracking-wide uppercase font-bold">{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Configured fields per selection type */}
              <div className="space-y-4 pt-2">
                {qrType === 'url' && (
                  <Input
                    label="Target Website URL"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="dark:text-white"
                    containerProps={{ className: "w-full" }}
                  />
                )}

                {qrType === 'text' && (
                  <div className="space-y-1">
                    <Typography className="text-xs text-gray-500 dark:text-gray-450 font-semibold mb-1">Plain Text Message</Typography>
                    <textarea
                      rows={4}
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Enter raw text details here..."
                      className="w-full p-3 rounded-lg border border-blue-gray-200 dark:border-gray-800 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold transition-all"
                    />
                  </div>
                )}

                {qrType === 'wifi' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Network Name (SSID)"
                      value={wifiInput.ssid}
                      onChange={e => setWifiInput({ ...wifiInput, ssid: e.target.value })}
                      className="dark:text-white font-semibold"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Password"
                      value={wifiInput.password}
                      onChange={e => setWifiInput({ ...wifiInput, password: e.target.value })}
                      className="dark:text-white font-semibold"
                      containerProps={{ className: "w-full" }}
                    />
                    <div className="md:col-span-2">
                      <SelectDropdown
                        label="Security Protocol"
                        value={wifiInput.encryption}
                        onChange={v => setWifiInput({ ...wifiInput, encryption: v })}
                        options={[
                          { label: 'WPA/WPA2', value: 'WPA' },
                          { label: 'WEP', value: 'WEP' },
                          { label: 'Unencrypted (Open)', value: 'nopass' }
                        ]}
                      />
                    </div>
                  </div>
                )}

                {qrType === 'email' && (
                  <div className="space-y-4">
                    <Input
                      label="Recipient Email Address"
                      value={emailInput.address}
                      onChange={e => setEmailInput({ ...emailInput, address: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Subject Line"
                      value={emailInput.subject}
                      onChange={e => setEmailInput({ ...emailInput, subject: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <div className="space-y-1">
                      <Typography className="text-xs text-gray-500 dark:text-gray-455 font-semibold mb-1">Email Body Content</Typography>
                      <textarea
                        rows={3}
                        value={emailInput.body}
                        onChange={e => setEmailInput({ ...emailInput, body: e.target.value })}
                        className="w-full p-3 rounded-lg border border-blue-gray-200 dark:border-gray-800 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>
                )}

                {qrType === 'phone' && (
                  <div className="space-y-4">
                    <Input
                      label="Phone Number"
                      value={phoneInput.number}
                      onChange={e => setPhoneInput({ ...phoneInput, number: e.target.value })}
                      className="dark:text-white font-mono"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Prefilled SMS message (Optional)"
                      value={phoneInput.message}
                      onChange={e => setPhoneInput({ ...phoneInput, message: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">
                      * If prefilled message is blank, it defaults to a standard voice dial tel link.
                    </span>
                  </div>
                )}

                {qrType === 'vcard' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={vcardInput.name}
                      onChange={e => setVcardInput({ ...vcardInput, name: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Organization"
                      value={vcardInput.org}
                      onChange={e => setVcardInput({ ...vcardInput, org: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Telephone"
                      value={vcardInput.tel}
                      onChange={e => setVcardInput({ ...vcardInput, tel: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <Input
                      label="Email Address"
                      value={vcardInput.email}
                      onChange={e => setVcardInput({ ...vcardInput, email: e.target.value })}
                      className="dark:text-white"
                      containerProps={{ className: "w-full" }}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Website URL"
                        value={vcardInput.url}
                        onChange={e => setVcardInput({ ...vcardInput, url: e.target.value })}
                        className="dark:text-white"
                        containerProps={{ className: "w-full" }}
                      />
                    </div>
                  </div>
                )}

                {qrType === 'whatsapp' && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-[140px] shrink-0">
                        <SelectDropdown
                          label="Country Code"
                          value={whatsappInput.countryCode}
                          onChange={v => setWhatsappInput({ ...whatsappInput, countryCode: v })}
                          options={[
                            { label: 'India (+91)', value: '91' },
                            { label: 'USA (+1)', value: '1' },
                            { label: 'UK (+44)', value: '44' },
                            { label: 'Canada (+1)', value: '1' },
                            { label: 'Australia (+61)', value: '61' },
                            { label: 'Germany (+49)', value: '49' },
                            { label: 'UAE (+971)', value: '971' },
                            { label: 'Saudi Arabia (+966)', value: '966' },
                            { label: 'Singapore (+65)', value: '65' }
                          ]}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                          WhatsApp Phone Number
                        </label>
                        <input
                          type="text"
                          value={whatsappInput.number}
                          onChange={e => setWhatsappInput({ ...whatsappInput, number: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full h-10 px-3 border border-gray-250 dark:border-gray-800 rounded-xl bg-transparent dark:text-white text-sm font-semibold focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Typography className="text-xs text-gray-500 dark:text-gray-455 font-semibold mb-1">Pre-filled Chat Message</Typography>
                      <textarea
                        rows={3}
                        value={whatsappInput.message}
                        onChange={e => setWhatsappInput({ ...whatsappInput, message: e.target.value })}
                        placeholder="Enter text message..."
                        className="w-full p-3 rounded-lg border border-blue-gray-200 dark:border-gray-855 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Styling Controls */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-855 space-y-4">
                <div className="flex items-center justify-between">
                  <Typography variant="h6" className="text-gray-900 dark:text-white">
                    2. Design Options
                  </Typography>
                  <button
                    type="button"
                    onClick={() => { setFgColor('#000000'); setBgColor('#ffffff'); }}
                    className="text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors animate-pulse-once"
                  >
                    Reset Colors
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Foreground color picker */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Foreground Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={e => setFgColor(e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={e => setFgColor(e.target.value)}
                        className="flex-1 h-10 px-3 border border-gray-250 dark:border-gray-800 rounded-xl bg-transparent dark:text-white text-sm font-semibold focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Background color picker */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="flex-1 h-10 px-3 border border-gray-250 dark:border-gray-800 rounded-xl bg-transparent dark:text-white text-sm font-semibold focus:border-violet-500 dark:focus:border-violet-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <SelectDropdown
                      label="QR Dimension Size"
                      value={String(size)}
                      onChange={v => setSize(Number(v))}
                      options={[
                        { label: '128px (Small)', value: '128' },
                        { label: '256px (Medium)', value: '256' },
                        { label: '384px (Large)', value: '384' },
                        { label: '512px (Ultra)', value: '512' }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <SelectDropdown
                      label="Error Correction Level"
                      value={ecc}
                      onChange={v => setEcc(v as any)}
                      options={[
                        { label: 'L (7% Recovery)', value: 'L' },
                        { label: 'M (15% Recovery)', value: 'M' },
                        { label: 'Q (25% Recovery)', value: 'Q' },
                        { label: 'H (30% Recovery - Recommended for logos)', value: 'H' }
                      ]}
                    />
                  </div>

                  {/* Upload logo overlay */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Center Logo Overlay (Optional)</label>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 flex items-center justify-center gap-1.5 border border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 px-4 font-bold rounded-xl transition-colors text-sm"
                      >
                        <BsUpload className="h-4 w-4 shrink-0" /> Upload logo
                      </button>
                      {logoSrc && (
                        <button
                          onClick={() => setLogoSrc('')}
                          className="text-xs font-bold text-red-500 hover:underline pl-2 animate-pulse-once"
                        >
                          Remove Logo
                        </button>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Right Card: QR Preview Container */}
          <div className="space-y-6">
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900 text-center h-full flex flex-col justify-between">
              <CardBody className="p-5 sm:p-6 flex flex-col justify-between items-center h-full space-y-6">
                <div className="w-full text-center">
                  <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2 mb-4">
                    QR Preview
                  </Typography>
                </div>

                {/* Box holding canvas component */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-center min-h-[300px] w-full max-w-[300px] shadow-inner relative group">
                  <QRCodeCanvas
                    id="qr-canvas-element"
                    value={compiledValue}
                    size={256} // Always render canvas at fixed size in container, download scales it up
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={ecc}
                    includeMargin={true}
                    imageSettings={
                      logoSrc 
                        ? {
                            src: logoSrc,
                            x: undefined,
                            y: undefined,
                            height: 48,
                            width: 48,
                            excavate: true
                          }
                        : undefined
                    }
                  />
                </div>

                {/* Utility actions footer */}
                <div className="w-full space-y-3">
                  <Button
                    onClick={downloadPng}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 shadow-sm"
                  >
                    <BsDownload className="h-4 w-4" /> Download PNG
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 font-semibold py-2.5"
                  >
                    {copied ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                    {copied ? 'Copied Image' : 'Copy Image'}
                  </Button>

                  {/* Displaying raw compiled URI string */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-850 text-left">
                    <Typography className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider mb-1">
                      Compiled Data Value
                    </Typography>
                    <code className="text-xs font-mono text-gray-900 dark:text-gray-200 break-all select-all block bg-gray-50 dark:bg-gray-950/30 p-2 rounded border border-gray-100 dark:border-gray-850 leading-relaxed font-semibold">
                      {compiledValue}
                    </code>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        /* ==================== DECODER VIEW ==================== */
        <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr] animate-fade-in">
          {/* Left Column: Image scanner or webcam */}
          <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardBody className="p-5 sm:p-6 space-y-6">
              <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-2">
                Scan QR Code Source
              </Typography>

              {/* Action scanner buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={isScanning ? stopWebcam : startWebcam}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 ${
                    isScanning 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  {isScanning ? <BsCameraVideoOff className="h-5 w-5" /> : <BsCameraVideo className="h-5 w-5" />}
                  {isScanning ? 'Stop Live Scan' : 'Scan with Webcam'}
                </Button>

                <div className="flex-1 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageDecode}
                    className="hidden"
                    id="qr-file-upload-input"
                  />
                  <label
                    htmlFor="qr-file-upload-input"
                    className="w-full h-full flex items-center justify-center gap-2 border border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold rounded-xl cursor-pointer text-sm transition-colors text-center py-3"
                  >
                    <BsUpload className="h-4 w-4" /> Upload QR Image
                  </label>
                </div>
              </div>

              {/* Dynamic Scanning Panel */}
              <div className="relative border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/30 flex flex-col items-center justify-center min-h-[320px]">
                {isScanning ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover max-h-[360px]"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Retro green scanline overlay */}
                    <div className="absolute inset-0 border-2 border-violet-500/30 pointer-events-none rounded-2xl flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-violet-500/60 rounded-xl relative flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-violet-500" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-500" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-500" />
                        <div className="w-full h-0.5 bg-violet-500/80 absolute animate-bounce" style={{ top: '50%' }} />
                      </div>
                    </div>
                    <span className="absolute bottom-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      Align QR in frame
                    </span>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <BsQrCode className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto" />
                    <Typography className="text-gray-500 dark:text-gray-450 text-sm font-semibold max-w-sm">
                      Select camera scanning mode above or upload a saved static QR image from your filesystem.
                    </Typography>
                  </div>
                )}
              </div>

              {/* Detailed webcam permission denial instruction panel */}
              {webcamPermission === false && (
                <div className="animate-fade-in">
                  <Alert
                    icon={<BsExclamationTriangle className="h-5 w-5 shrink-0" />}
                    className="border-l-4 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-250 text-xs font-semibold py-4"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Camera Permission Required</p>
                      <p>If you're using Chrome/Firefox/Safari and blocked the webcam, please follow these instructions:</p>
                      <ul className="list-decimal pl-4 space-y-1 mt-2">
                        <li>Locate the <strong>Lock (Settings) icon</strong> in your browser address url bar next to the domain name.</li>
                        <li>Click it to open site permissions configurations.</li>
                        <li>Find <strong>Camera</strong> and update the toggle settings to <strong>Allow</strong>.</li>
                        <li>Reload the page and press <strong>Scan with Webcam</strong> again.</li>
                      </ul>
                    </div>
                  </Alert>
                </div>
              )}

              {/* Standard error warning */}
              {decodeError && !webcamPermission === false && (
                <Alert
                  icon={<BsXCircle className="h-5 w-5 shrink-0" />}
                  className="border-l-4 border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200 text-xs font-semibold py-3"
                >
                  {decodeError}
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Right Column: Parsed output */}
          <div className="space-y-6">
            <Card className="border border-blue-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardBody className="p-5 sm:p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <Typography variant="h6" className="text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2 mb-4">
                    Decrypted Content Result
                  </Typography>

                  {decodedResult ? (
                    <div className="space-y-4">
                      {/* Badge identifier */}
                      <div className="flex items-center gap-2">
                        {parsedDecodedData && (
                          <>
                            <div className="p-2 bg-violet-50 dark:bg-violet-500/10 text-violet-500 rounded-lg">
                              <parsedDecodedData.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <Typography className="text-gray-900 dark:text-white font-bold text-sm leading-none">
                                {parsedDecodedData.type}
                              </Typography>
                              <span className="text-[10px] text-gray-500 dark:text-gray-450 uppercase tracking-wider font-semibold">Decrypted format</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Display structured values in list */}
                      {parsedDecodedData && (
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-950/20 p-4 border border-gray-100 dark:border-gray-850 rounded-xl">
                          {parsedDecodedData.details.map((item, idx) => (
                            <div key={idx} className="border-b border-gray-100/50 dark:border-gray-850/50 last:border-none pb-2 last:pb-0">
                              <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase block mb-0.5">{item.key}</span>
                              <code className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-205 break-all select-all block leading-relaxed">
                                {item.val || '—'}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Helper Action buttons based on type */}
                      {parsedDecodedData?.link && (
                        <a
                          href={parsedDecodedData.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-center shadow-sm text-sm"
                        >
                          {parsedDecodedData.type === 'WhatsApp Message' ? (
                            <>
                              <BsWhatsapp className="h-4 w-4" /> Send WhatsApp Message
                            </>
                          ) : (
                            <>
                              <BsLink className="h-4 w-4" /> Visit Website URL
                            </>
                          )}
                        </a>
                      )}

                      <div className="pt-2">
                        <Button
                          fullWidth
                          onClick={copyDecodedText}
                          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2.5"
                        >
                          {copiedDecoded ? <BsCheck2 className="h-4 w-4 text-emerald-500" /> : <BsClipboard className="h-4 w-4" />}
                          {copiedDecoded ? 'Copied Content' : 'Copy Raw Text'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                      <BsInfoCircle className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                      <Typography className="text-gray-500 dark:text-gray-450 text-xs font-semibold max-w-xs mx-auto">
                        Waiting for QR scan... Results will display structurally once parsed.
                      </Typography>
                    </div>
                  )}
                </div>

                {decodedResult && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-850">
                    <span className="text-[10px] text-gray-500 dark:text-gray-450 font-bold uppercase tracking-wider block mb-1">
                      Raw Data Decrypted String
                    </span>
                    <code className="text-xs font-mono font-semibold text-gray-950 dark:text-gray-200 break-all select-all block bg-gray-50 dark:bg-gray-950/30 p-3 rounded-xl border border-gray-100 dark:border-gray-850 leading-relaxed max-h-32 overflow-y-auto">
                      {decodedResult}
                    </code>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

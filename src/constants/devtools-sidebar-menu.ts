export const DEVTOOLS_SIDEBAR_MENU = [
  {
    id: 'dashboard',
    iconId: 'dashboard',
    label: 'Dashboard',
    path: '/dev-tools'
  },
  {
    id: 'generators',
    iconId: 'generators',
    label: 'Generators',
    children: [
      {
        id: 'passwordGenerator',
        label: 'Password Generator',
        path: '/password-generator'
      },
      {
        id: 'uuidGenerator',
        label: 'UUID Generator',
        path: '/uuid-generator'
      },
      {
        id: 'hashGenerator',
        label: 'Hash Generator',
        path: '/hash-generator'
      },
      {
        id: 'qrGenerator',
        label: 'QR Code Generator',
        path: '/qr-generator'
      }
    ]
  },
  {
    id: 'textTools',
    iconId: 'textTools',
    label: 'Text Tools',
    children: [
      {
        id: 'textCaseConverter',
        label: 'Text Case Converter',
        path: '/text-case-converter'
      },
      {
        id: 'textFormatter',
        label: 'Text Formatter',
        path: '/text-formatter'
      },
      {
        id: 'jsonFormatter',
        label: 'JSON Diff',
        path: '/json-diff'
      },
      {
        id: 'codeFormatter',
        label: 'Code Formatter',
        path: '/code-formatter'
      },
      {
        id: 'urlParser',
        label: 'URL Parser',
        path: '/url-parser'
      }
    ]
  },
  {
    id: 'security',
    iconId: 'security',
    label: 'Security',
    children: [
      {
        id: 'jwtDecoder',
        label: 'JWT Decoder',
        path: '/jwt-decoder'
      }
    ]
  },
  {
    id: 'datetime',
    iconId: 'datetime',
    label: 'Date & Time',
    children: [
      {
        id: 'datetimeConverter',
        label: 'DateTime Converter',
        path: '/datetime'
      }
    ]
  }
]

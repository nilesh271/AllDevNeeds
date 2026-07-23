import React, { useState, useMemo } from 'react'
import { Card, CardBody, Typography } from '@material-tailwind/react'
import { IconType } from 'react-icons'
import { BsBraces, BsCalendar3, BsCodeSlash, BsFileEarmarkText, BsKey, BsLightningCharge, BsLock, BsShieldLock, BsStars, BsSearch, BsCodeSquare, BsQrCode, BsLink } from 'react-icons/bs'
import { Link } from 'react-router-dom'

type Tool = { name: string; description: string; path: string; icon: IconType; accent: string }

const sections: { name: string; icon: IconType; tools: Tool[] }[] = [
  {
    name: 'Generators',
    icon: BsLightningCharge,
    tools: [
      {
        name: 'Password Generator',
        description: 'Create secure passwords with custom character sets and entropy calculations.',
        path: '/password-generator',
        icon: BsKey,
        accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      },
      { 
        name: 'UUID Generator', 
        description: 'Generate bulk UUID identifiers with braces, capitalization, and custom segment config.', 
        path: '/uuid-generator', 
        icon: BsStars, 
        accent: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' 
      },
      { 
        name: 'Hash Generator', 
        description: 'Calculate cryptographic digests (MD5, SHA-256, SHA-512) for text and local drag-and-drop file uploads.', 
        path: '/hash-generator', 
        icon: BsShieldLock, 
        accent: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
      },
      { 
        name: 'QR Code Generator', 
        description: 'Create high-resolution QR codes for custom links, Wi-Fi profiles, contact cards, and text scripts.', 
        path: '/qr-generator', 
        icon: BsQrCode, 
        accent: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' 
      },
    ]
  },
  {
    name: 'Text Tools', 
    icon: BsFileEarmarkText, 
    tools: [
      { 
        name: 'Text Case Converter', 
        description: 'Convert text variables to camelCase, PascalCase, snake_case, CONSTANT_CASE, and standard casing styles.', 
        path: '/text-case-converter', 
        icon: BsCodeSlash, 
        accent: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' 
      },
      { 
        name: 'Text Formatter', 
        description: 'Clean whitespace, trim padding, reverse lists, deduplicate rows, and encode base64 or URL entities.', 
        path: '/text-formatter', 
        icon: BsFileEarmarkText, 
        accent: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' 
      },
      { 
        name: 'JSON Diff & Formatter', 
        description: 'Validate syntax structural integrity, format, minify, and compare two JSON files to highlight differences side by side.', 
        path: '/json-diff', 
        icon: BsBraces, 
        accent: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' 
      },
      { 
        name: 'Code Formatter', 
        description: 'Format, beautify, and minify HTML, CSS, JavaScript, TypeScript, and JSON files inside a fully featured Monaco editor.', 
        path: '/code-formatter', 
        icon: BsCodeSquare, 
        accent: 'text-pink-500 bg-pink-550/10 dark:bg-pink-500/10' 
      },
      { 
        name: 'URL Parser', 
        description: 'Deconstruct complex URL links, edit queries dynamically, and encode or decode parameters.', 
        path: '/url-parser', 
        icon: BsLink, 
        accent: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' 
      },
    ]
  },
  {
    name: 'Security & Time', 
    icon: BsLock, 
    tools: [
      { 
        name: 'JWT Decoder', 
        description: 'Decode and inspect signature segments of JSON Web Tokens and explore claim definitions.', 
        path: '/jwt-decoder', 
        icon: BsLock, 
        accent: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' 
      },
      { 
        name: 'DateTime Converter', 
        description: 'Convert timezone offsets, epoch timestamps, compare dates, and preview quick global zone conversions.', 
        path: '/datetime', 
        icon: BsCalendar3, 
        accent: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' 
      },
    ]
  },
]

export default function Dashboard() {
  const [search, setSearch] = useState('')

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const query = search.toLowerCase();
    return sections.map(section => {
      const matchingTools = section.tools.filter(tool => 
        tool.name.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query)
      );
      return {
        ...section,
        tools: matchingTools
      };
    }).filter(section => section.tools.length > 0);
  }, [search]);

  return (
    <div className="page-container px-4 pb-10 sm:px-6 lg:px-8">
      {/* Welcome Banner Card */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white shadow-lg sm:p-8 border-0">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography variant="h2" className="text-2xl font-bold sm:text-3xl text-white">
              Developer Toolkit
            </Typography>
            <Typography className="mt-2 max-w-xl text-sm text-sky-100 sm:text-base font-medium">
              Fast, secure, private utilities for everyday development. Everything executes locally in your browser sandbox.
            </Typography>
          </div>
        </div>
      </div>

      {/* Filter / Search input row */}
      <div className="mt-8 max-w-lg shadow-sm hover:shadow transition-shadow duration-200 rounded-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tools... (e.g. json, jwt, uuid)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-indigo-100 dark:border-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-500/10 text-sm font-semibold transition-all"
          />
          <BsSearch className="absolute left-4 top-4 h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-3.5 text-xs font-semibold text-gray-400 hover:text-indigo-500 dark:text-gray-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tools Grid Sections */}
      <div className="mt-8 space-y-9">
        {filteredSections.map(section => {
          const SectionIcon = section.icon
          return (
            <section key={section.name} className="animate-fade-in">
              <div className="mb-4 flex items-center gap-2">
                <SectionIcon className="h-5 w-5 text-sky-500" />
                <Typography variant="h5" className="font-bold text-gray-900 dark:text-white">
                  {section.name}
                </Typography>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-50 dark:bg-gray-950 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-850">
                  {section.tools.length} {section.tools.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.tools.map(tool => {
                  const ToolIcon = tool.icon
                  return (
                    <Link key={tool.path} to={tool.path} className="group">
                      <Card className="h-full border border-gray-150 dark:border-gray-850 dark:bg-gray-900 hover:border-sky-300 dark:hover:border-sky-800 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                        <CardBody className="p-5 flex flex-col justify-between h-full">
                          <div>
                            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${tool.accent}`}>
                              <ToolIcon className="h-5 w-5" />
                            </div>
                            <Typography variant="h6" className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                              {tool.name}
                            </Typography>
                            <Typography className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                              {tool.description}
                            </Typography>
                          </div>
                          <Typography className="mt-5 text-xs font-bold text-gray-600 dark:text-gray-455 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <span>Open tool</span>
                            <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">
                              →
                            </span>
                          </Typography>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="mt-12 text-center py-12 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl bg-gray-50/20 dark:bg-gray-950/10">
            <Typography className="text-gray-500 dark:text-gray-455 text-sm font-semibold">
              No developer tools matching "{search}" found.
            </Typography>
            <button 
              onClick={() => setSearch('')}
              className="mt-2 text-xs text-sky-500 hover:text-sky-600 font-bold transition-colors"
            >
              Clear search query
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

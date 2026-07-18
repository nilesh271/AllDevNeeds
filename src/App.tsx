import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './hooks/redux'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

import CodeSharingPage from './pages/CodeSharingPage'
import StickyNotesPage from './pages/StickyNotesPage'
import LearningPage from './pages/LearningPage'
import LearningDetailPage from './pages/LearningDetailPage'
import AdminPage from './pages/AdminPage'
import FileUploadPage from './pages/FileUploadPage'
import DateTimePage from './pages/DateTimePage'
import VideoDownloaderPage from './pages/VideoDownloaderPage'
import Dashboard from './pages/Dashboard'
import DevToolsLayout from './layouts/DevToolsLayout'
import JwtDecoderPage from './pages/JwtDecoderPage'
import PasswordGeneratorPage from './pages/PasswordGeneratorPage'
import UuidGeneratorPage from './pages/UuidGeneratorPage'
import HashGeneratorPage from './pages/HashGeneratorPage'
import TextCaseConverterPage from './pages/TextCaseConverterPage'
import TextFormatterPage from './pages/TextFormatterPage'
import JsonFormatterPage from './pages/JsonFormatterPage'
import CodeFormatterPage from './pages/CodeFormatterPage'
import QrCodeGeneratorPage from './pages/QrCodeGeneratorPage'
import UrlParserPage from './pages/UrlParserPage'

export default function App() {
  const { isAuthenticated } = useAppSelector(s => s.auth)

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        {/* <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} /> */}
        <Route path="/code" element={<CodeSharingPage />} />
        <Route path="/notes" element={<StickyNotesPage />} />
        <Route path="/files" element={<FileUploadPage />} />
        
        <Route path="/video-downloader" element={<VideoDownloaderPage />} />
        
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/:id" element={<LearningDetailPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route element={<DevToolsLayout />}>
        <Route path="/dev-tools" element={<Dashboard />} />
        <Route path="/datetime" element={<DateTimePage />} />
        <Route path="/jwt-decoder" element={<JwtDecoderPage />} />
        <Route path="/password-generator" element={<PasswordGeneratorPage />} />
        <Route path="/uuid-generator" element={<UuidGeneratorPage />} />
        <Route path="/hash-generator" element={<HashGeneratorPage />} />
        <Route path="/text-case-converter" element={<TextCaseConverterPage />} />
        <Route path="/text-formatter" element={<TextFormatterPage />} />
        <Route path="/json-formatter" element={<JsonFormatterPage />} />
        <Route path="/code-formatter" element={<CodeFormatterPage />} />
        <Route path="/qr-generator" element={<QrCodeGeneratorPage />} />
        <Route path="/url-parser" element={<UrlParserPage />} />
      </Route>
    </Routes>
  )
}

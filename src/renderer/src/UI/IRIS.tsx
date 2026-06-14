import { useState, Suspense, lazy } from 'react'
import {
  RiShieldFlashLine,
  RiLayoutGridLine,
  RiBrainLine,
  RiFolderOpenLine,
  RiPhoneLine,
  RiSettings4Line,
  RiImageLine
} from 'react-icons/ri'
import ViewSkeleton from '@renderer/components/ViewSkelrton'

import DashboardView from '../views/Dashboard'
import PhoneView from '../views/Phone'
import { Status } from '@renderer/types/panel'

const WorkFlowEditorView = lazy(() => import('../views/WorkFlowEditor'))
const NotesView = lazy(() => import('../views/Notes'))
// const SettingsView = lazy(() => import('../views/Settings'))
const GalleryView = lazy(() => import('../views/Gallery'))

interface IrisProps {
  isConnected: boolean
  toggleConnection: () => void
  systemStatus: Status
  isSpeaking: boolean
  isMuted: boolean
  handleMicToggle: () => void
}

const glassPanel = 'bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl'

const IRIS = ({
  isConnected,
  toggleConnection,
  systemStatus,
  isSpeaking,
  isMuted,
  handleMicToggle
}: IrisProps) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD')

  // Upgraded label names for a more "OS" feel
  const tabs = [
    { id: 'DASHBOARD', label: 'Command Center', icon: <RiLayoutGridLine size={18} /> },
    { id: 'Macros', label: 'Neural Macros', icon: <RiBrainLine size={18} /> },
    { id: 'NOTES', label: 'Memory Bank', icon: <RiFolderOpenLine size={18} /> },
    { id: 'GALLERY', label: 'Vision Gallery', icon: <RiImageLine size={18} /> },
    { id: 'PHONE', label: 'Mobile Link', icon: <RiPhoneLine size={18} /> },
    { id: 'SETTINGS', label: 'System Config', icon: <RiSettings4Line size={18} /> }
  ]

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 font-sans overflow-hidden select-none relative">
      {/* ------------------------------------------- */}
      {/* SIDEBAR NAVIGATION MODULE                   */}
      {/* ------------------------------------------- */}
      <div className="w-64 h-full flex flex-col bg-zinc-950/80 border-r border-white/5 z-50 backdrop-blur-xl shadow-2xl">
        {/* Header / Logo */}
        <div className="h-24 w-full flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <RiShieldFlashLine className="text-emerald-500 text-2xl animate-pulse" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black tracking-widest text-lg text-zinc-100">IRIS_OS</span>
              <span className="text-[10px] font-mono text-emerald-500/60 tracking-wider mt-1 uppercase">
                System Core v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase mb-2 px-2 mt-2">
            Modules
          </span>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer px-4 py-3 text-[12px] font-bold tracking-widest rounded-xl transition-all duration-300 flex items-center gap-3 w-full text-left ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* System Status Footer in Sidebar */}
        <div className="p-4 border-t border-white/5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
          >
            <div
              className={`h-2 w-2 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-300">
                {isConnected ? 'System Online' : 'System Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------- */}
      {/* MAIN CONTENT AREA                           */}
      {/* ------------------------------------------- */}
      <div className="flex-1 overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black">
        {/* Subtle Engineering Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

        <div className="relative h-full w-full p-6 overflow-y-auto">
          {/* We use standard divs instead of absolute positioning so the parent controls the padding/layout nicely */}
          <div className={`h-full w-full ${activeTab === 'DASHBOARD' ? 'block' : 'hidden'}`}>
            <DashboardView
              isConnected={isConnected}
              toggleConnection={toggleConnection}
              systemStatus={systemStatus}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              handleMicToggle={handleMicToggle}
            />
          </div>

          <div className={`h-full w-full ${activeTab === 'PHONE' ? 'block' : 'hidden'}`}>
            <PhoneView glassPanel={glassPanel} />
          </div>

          <Suspense fallback={<ViewSkeleton />}>
            {activeTab === 'Macros' && <WorkFlowEditorView />}
            {activeTab === 'NOTES' && <NotesView glassPanel={glassPanel} />}
            {activeTab === 'GALLERY' && <GalleryView />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default IRIS

import { useState, useEffect } from 'react'
import {
  RiSubtractLine,
  RiCloseLine,
  RiCheckboxBlankLine,
  RiCheckboxMultipleBlankLine,
  RiCpuLine,
  RiPulseLine
} from 'react-icons/ri'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    if (window.electron && window.electron.process) {
      setIsMac(window.electron.process.platform === 'darwin')
    } else {
      setIsMac(navigator.userAgent.toLowerCase().includes('mac'))
    }
  }, [])

  const minimize = () => window.electron.ipcRenderer.send('window-min')
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
    window.electron.ipcRenderer.send('window-max')
  }
  const close = () => window.electron.ipcRenderer.send('window-close')

  return (
    <div className="w-full h-14 flex items-center justify-between bg-[#050505] border-b border-white/5 drag-region select-none z-50 relative">
      {/* ── LEFT: Heavy Branding ── */}
      <div className="flex items-center h-full min-w-500 pl-5 no-drag">
        {isMac ? (
          <div className="flex items-center gap-2.5 group/mac">
            <button
              onClick={close}
              className="w-3.5 h-3.5 rounded-full bg-zinc-800 hover:bg-[#ff5f56] border border-black/20 transition-colors flex items-center justify-center shadow-inner"
            >
              <RiCloseLine
                size={10}
                className="opacity-0 group-hover/mac:opacity-100 text-[#4c0002]"
              />
            </button>
            <button
              onClick={minimize}
              className="w-3.5 h-3.5 rounded-full bg-zinc-800 hover:bg-[#ffbd2e] border border-black/20 transition-colors flex items-center justify-center shadow-inner"
            >
              <RiSubtractLine
                size={10}
                className="opacity-0 group-hover/mac:opacity-100 text-[#5c3e00]"
              />
            </button>
            <button
              onClick={toggleMaximize}
              className="w-3.5 h-3.5 rounded-full bg-zinc-800 hover:bg-[#27c93f] border border-black/20 transition-colors flex items-center justify-center shadow-inner"
            >
              <RiCheckboxBlankLine
                size={8}
                className="opacity-0 group-hover/mac:opacity-100 text-[#024d04]"
              />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <RiCpuLine size={16} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold font-mono tracking-[0.2em] text-zinc-100 uppercase">
              IRIS-X
            </span>
          </div>
        )}
      </div>

      {/* ── CENTER: Wide HUD Capsule ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-between w-[320px] bg-[#0a0a0c] border border-white/10 rounded-full px-5 py-2 shadow-2xl pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
            System Core
          </span>
        </div>

        <div className="w-px h-3 bg-zinc-800" />

        <div className="flex items-center gap-2 text-emerald-400">
          <RiPulseLine size={14} className="animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest font-bold uppercase drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
            Active
          </span>
        </div>
      </div>

      {/* ── RIGHT: Scaled Windows Controls ── */}
      <div className="flex h-full min-w-[200px] justify-end no-drag">
        {!isMac ? (
          <div className="flex h-full items-center">
            <button
              onClick={minimize}
              className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RiSubtractLine size={18} />
            </button>
            <button
              onClick={toggleMaximize}
              className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMaximized ? (
                <RiCheckboxMultipleBlankLine size={16} />
              ) : (
                <RiCheckboxBlankLine size={16} />
              )}
            </button>
            <button
              onClick={close}
              className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-500/90 hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.2)] transition-all"
            >
              <RiCloseLine size={20} />
            </button>
          </div>
        ) : (
          <div className="w-14 h-full pointer-events-none" />
        )}
      </div>
    </div>
  )
}

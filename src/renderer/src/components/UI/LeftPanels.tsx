import { useState, useEffect, useRef } from 'react'
import {
  Camera,
  Network,
  Cpu,
  MemoryStick,
  Thermometer,
  Monitor,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { getSystemStatus, SystemStats } from '@renderer/services/system-info'
import { LeftPanelsProps } from '@renderer/types/panel'

function getHealthColor(value: number, type: 'cpu' | 'ram' | 'temp') {
  let ratio = Math.min(1, Math.max(0, value / 100))
  if (type === 'temp') {
    ratio = Math.min(1, Math.max(0, (value - 20) / 50))
  }
  const hue = 120 * (1 - ratio)
  const saturation = 85
  const lightness = 50
  const mainColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  const darkColor = `hsl(${hue}, ${saturation}%, 15%)`
  const linear = `linear-linear(90deg, ${darkColor}, ${mainColor})`
  const glow = mainColor
  return { linear, glow }
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          active ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88]' : 'bg-slate-600'
        }`}
      />
    </span>
  )
}

function GlassPanel({ children, className = '', accent = 'green' }: any) {
  const accentMap: Record<string, string> = {
    green: 'from-[#00ff88]/[0.04]',
    cyan: 'from-[#22d3ee]/[0.04]',
    orange: 'from-[#f97316]/[0.04]',
    yellow: 'from-[#eab308]/[0.04]',
    purple: 'from-[#a855f7]/[0.04]',
    none: 'from-transparent'
  }
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#080d0b]/70 backdrop-blur-2xl border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/10 ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${accentMap[accent]} to-transparent z-0`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent z-0" />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  )
}

function NeonBar({ value, color, glow }: { value: number; color: string; glow: string }) {
  const safeValue = Math.min(100, Math.max(0, value || 0))
  return (
    <div className="relative h-0.75 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${safeValue}%`,
          background: color,
          boxShadow: `0 0 8px ${glow}, 0 0 16px ${glow}55`
        }}
      />
      <div
        className="absolute left-0 top-0 h-full w-full rounded-full opacity-30"
        style={{
          background: `linear-linear(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,
          animation: 'shimmer 2s infinite',
          backgroundSize: '200% 100%'
        }}
      />
    </div>
  )
}

function IconRing({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-xl border"
      style={{
        borderColor: `${color}33`,
        background: `${color}11`,
        boxShadow: `0 0 12px ${color}22`
      }}
    >
      {children}
    </div>
  )
}

function MetricCard({
  icon,
  watermarkIcon,
  label,
  value,
  unit,
  barValue,
  barColor,
  barGlow,
  accentColor,
  children
}: any) {
  return (
    <GlassPanel className="flex flex-col gap-3 p-4 group" accent="none">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: accentColor }}
      />
      {watermarkIcon && (
        <div
          className="absolute -bottom-6 -right-6 opacity-[0.05] group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-700 pointer-events-none"
          style={{ color: accentColor }}
        >
          {watermarkIcon}
        </div>
      )}
      <div className="flex items-center justify-between">
        <IconRing color={accentColor}>{icon}</IconRing>
        <span
          className="font-mono text-[8px] tracking-[0.22em] uppercase"
          style={{ color: `${accentColor}99` }}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {children ?? (
          <div className="flex flex-col gap-2">
            <div className="text-right font-mono text-xl font-semibold leading-none tracking-wider text-white drop-shadow-md">
              {value}{' '}
              {unit && <span className="ml-0.5 text-xs font-normal text-white/30">{unit}</span>}
            </div>
            {barValue !== undefined && <NeonBar value={barValue} color={barColor} glow={barGlow} />}
          </div>
        )}
      </div>
    </GlassPanel>
  )
}

export default function LeftPanels({
  status,
  visionMode
}: LeftPanelsProps & { visionMode?: 'off' | 'camera' | 'screen' }) {
  const isActive = status !== 'STANDBY'
  const [bootPhase, setBootPhase] = useState(true)
  const [bootLogs, setBootLogs] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stats, setStats] = useState<SystemStats>({
    cpu: '0.0',
    memory: { total: '0.0', free: '0.0', usedPercentage: '0.0' },
    temperature: 0,
    os: { type: 'UNKNOWN', uptime: '0h' },
    network: { tx: 0, rx: 0, latency: 0 }
  })

  // ─── 60 FPS Native Video & 1 FPS Gemini Feeder ───
  useEffect(() => {
    if (visionMode === 'off' || !visionMode || !isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }

    let intervalId: NodeJS.Timeout

    const startVision = async () => {
      try {
        let stream: MediaStream
        if (visionMode === 'camera') {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        } else {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        intervalId = setInterval(() => {
          if (videoRef.current && canvasRef.current && (window as any).iris?.sendVisionFrame) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.drawImage(videoRef.current, 0, 0, 640, 480)

            const base64Full = canvasRef.current.toDataURL('image/jpeg', 0.8)
            const cleanBase64 = base64Full.replace(/^data:image\/jpeg;base64,/, '')

            ;(window as any).iris.sendVisionFrame(cleanBase64)
          }
        }, 1000)
      } catch (err) {
        console.error('Hardware access denied or failed:', err)
      }
    }

    startVision()

    return () => {
      clearInterval(intervalId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [visionMode, isActive])

  // ─── Backend Polling (System Stats) ───
  useEffect(() => {
    if (!isActive) {
      setBootPhase(true)
      setBootLogs([])
      return
    }

    if (bootPhase) {
      const logs = [
        '› KERNEL_INIT ........... OK',
        '› MOUNT_VFS ............. OK',
        '› HW_TELEM_LINK ..... SYNC',
        '› OPTICS_DRIVER ... READY',
        '› SYSTEM_READY'
      ]
      let i = 0
      const bootInterval = setInterval(() => {
        if (i < logs.length) {
          setBootLogs((p) => [...p, logs[i]])
          i++
        } else {
          clearInterval(bootInterval)
          setTimeout(() => setBootPhase(false), 900)
        }
      }, 150)
      return () => clearInterval(bootInterval)
    }

    let pollInterval: NodeJS.Timeout
    const fetchStats = async () => {
      const liveStats = await getSystemStatus()
      if (liveStats) {
        setStats(liveStats)
      }
    }

    fetchStats()
    pollInterval = setInterval(fetchStats, 3000)
    return () => clearInterval(pollInterval)
  }, [isActive, bootPhase])

  const cpuValue = parseFloat(stats.cpu) || 0
  const ramValue = parseFloat(stats.memory.usedPercentage) || 0
  const tempValue = stats.temperature || 0

  const cpuColors = getHealthColor(cpuValue, 'cpu')
  const ramColors = getHealthColor(ramValue, 'ram')
  const tempColors = getHealthColor(tempValue, 'temp')

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── 1. OPTICS FEED ── */}
      <GlassPanel className="p-4" accent="none">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot active={isActive && visionMode !== 'off'} />
            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400 uppercase">
              Optics Feed
            </span>
          </div>
          <span
            className={`rounded-md border px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase transition-all duration-500 ${
              visionMode && visionMode !== 'off'
                ? 'border-[#00ff88]/25 bg-[#00ff88]/10 text-[#00ff88]'
                : 'border-white/10 bg-white/5 text-slate-600'
            }`}
          >
            {visionMode && visionMode !== 'off' ? 'Tracking' : isActive ? 'Standby' : 'Offline'}
          </span>
        </div>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-black/40">
          {/* THE FIX: Absolute inset-0 guarantees it fills the box and ignores Flexbox squishing */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 z-10 w-full h-full object-cover transition-opacity duration-500 ${
              visionMode && visionMode !== 'off' ? 'opacity-80' : 'opacity-0 pointer-events-none'
            }`}
          />

          <canvas ref={canvasRef} width="640" height="480" className="hidden" />

          {/* THE FIX: Absolute overlay so it doesn't push the video out of the way */}
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 text-slate-600 transition-opacity duration-500 ${!visionMode || visionMode === 'off' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div
              className={`rounded-xl border p-2 transition-all duration-500 ${
                isActive
                  ? 'border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]/50'
                  : 'border-white/5 bg-white/5'
              }`}
            >
              <Camera size={20} strokeWidth={1.5} />
            </div>
            <span className="font-mono text-[8px] tracking-[0.3em] uppercase">No Signal</span>
          </div>

          {[
            'top-2 left-2 border-t border-l',
            'top-2 right-2 border-t border-r',
            'bottom-2 left-2 border-b border-l',
            'bottom-2 right-2 border-b border-r'
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute h-3.5 w-3.5 z-30 ${pos} rounded-sm transition-colors duration-500 ${
                visionMode && visionMode !== 'off' ? 'border-[#00ff88]/50' : 'border-white/10'
              }`}
            />
          ))}
          {isActive && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-[#00ff88]/40 to-transparent z-30"
              style={{ animation: 'scanline 3s ease-in-out infinite' }}
            />
          )}
        </div>
      </GlassPanel>

      {/* ── 2. NETWORK TELEMETRY ── */}
      <GlassPanel className="p-4" accent="none">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconRing color={isActive ? '#00ff88' : '#444'}>
              <Network size={16} style={{ color: isActive ? '#00ff88' : '#555' }} strokeWidth={2} />
            </IconRing>
            <span className="font-mono text-[9px] tracking-[0.18em] text-slate-400 uppercase">
              Network Telemetry
            </span>
          </div>
          <span
            className={`rounded-md border px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase transition-all duration-500 ${
              isActive
                ? 'border-[#00ff88]/25 bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.15)]'
                : 'border-white/10 bg-white/5 text-slate-600'
            }`}
          >
            {isActive ? 'Secure Uplink' : 'Offline'}
          </span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <div className="mb-1.5 font-mono text-[8px] tracking-[0.18em] text-slate-500 uppercase">
              WSS Latency
            </div>
            <div className="font-mono text-lg font-semibold leading-none tracking-wider text-[#00ff88]">
              {isActive ? stats.network?.latency : '—'}
              <span className="ml-0.5 text-[10px] font-normal text-white/30">ms</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <div className="mb-1.5 font-mono text-[8px] tracking-[0.18em] text-slate-500 uppercase">
              Uptime
            </div>
            <div className="font-mono text-lg font-semibold leading-none tracking-wider text-white">
              {isActive ? stats.os?.uptime : '—'}
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
              style={{ color: '#ec4899', background: '#ec489911', border: '1px solid #ec489922' }}
            >
              <ArrowUp size={12} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <NeonBar
                value={isActive ? stats.network?.tx : 0}
                color="linear-linear(90deg, #550022, #ec4899)"
                glow="#ec4899"
              />
            </div>
            <span className="w-6 shrink-0 font-mono text-right text-[9px] text-[#ec4899]">TX</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
              style={{ color: '#3b82f6', background: '#3b82f611', border: '1px solid #3b82f622' }}
            >
              <ArrowDown size={12} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <NeonBar
                value={isActive ? stats.network?.rx : 0}
                color="linear-linear(90deg, #002255, #3b82f6)"
                glow="#3b82f6"
              />
            </div>
            <span className="w-6 shrink-0 font-mono text-right text-[9px] text-[#3b82f6]">RX</span>
          </div>
        </div>
      </GlassPanel>

      {/* ── 3. METRIC CARDS GRID ── */}
      <div className="grid flex-1 grid-cols-2 gap-3 min-h-0">
        <MetricCard
          icon={<Cpu size={14} className="text-[#00ff88]" />}
          watermarkIcon={<Cpu size={90} className="-rotate-6" />}
          label="CPU Load"
          value={isActive ? stats.cpu : '—'}
          unit="%"
          barValue={isActive ? cpuValue : 0}
          barColor={cpuColors.linear}
          barGlow={cpuColors.glow}
          accentColor={cpuColors.glow}
        />

        <MetricCard
          icon={<MemoryStick size={14} className="text-orange-500" />}
          watermarkIcon={<MemoryStick size={90} className="rotate-6" />}
          label="RAM Usage"
          value={isActive ? stats.memory.usedPercentage : '—'}
          unit="%"
          barValue={isActive ? ramValue : 0}
          barColor={ramColors.linear}
          barGlow={ramColors.glow}
          accentColor={ramColors.glow}
        />

        <MetricCard
          icon={<Thermometer size={14} className="text-yellow-400" />}
          watermarkIcon={<Thermometer size={90} className="rotate-12" />}
          label="Temp"
          value={isActive ? tempValue.toFixed(0) : '—'}
          unit="°C"
          barValue={isActive ? tempValue : 0}
          barColor={tempColors.linear}
          barGlow={tempColors.glow}
          accentColor={tempColors.glow}
        />

        <MetricCard
          icon={<Monitor size={14} className="text-purple-400" />}
          watermarkIcon={<Monitor size={90} className="-rotate-12" />}
          label="System"
          accentColor="#a855f7"
        >
          <div className="mt-1 flex flex-col justify-end h-full">
            {bootPhase && isActive ? (
              <div className="flex flex-col gap-px overflow-hidden text-right">
                {bootLogs.map((log, i) => (
                  <span
                    key={i}
                    className="font-mono text-[7px] leading-relaxed tracking-wide text-[#00ff88]/70"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {log}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-right font-mono text-xl font-semibold tracking-widest text-white drop-shadow-md">
                {isActive ? stats.os?.type : <span className="text-slate-600">—</span>}
                {isActive && (
                  <div className="mt-1 text-right font-mono text-[8px] tracking-[0.3em] text-purple-400/50 uppercase">
                    Active
                  </div>
                )}
              </div>
            )}
          </div>
        </MetricCard>
      </div>
    </div>
  )
}

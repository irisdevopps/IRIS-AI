import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  ShieldCheck,
  TerminalSquare,
  Network,
  Database,
  Lock,
  CheckCircle2,
  Loader2,
  Activity
} from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const [bootLogs, setBootLogs] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  const handleGoogleLogin = () => {
    window.open(`${import.meta.env.VITE_BACKEND_KEY}/users/google`, '_blank')
  }

  // Simplified, professional startup sequence
  useEffect(() => {
    const sequence = [
      'Starting core services...',
      'Verifying local file system...',
      'Loading AI routing protocols...',
      'Securing internal network bridge...',
      'System ready for authentication.'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < sequence.length) {
        setBootLogs((prev) => [...prev, sequence[currentStep]])
        currentStep++
      } else {
        setIsReady(true)
        clearInterval(interval)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [])

  // Smooth, deliberate animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  }

  const cardVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }
  }

  const sidePanelVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans flex items-center justify-center p-4 lg:p-8 relative overflow-hidden select-none">
      {/* Subtle Ambient Lighting (No harsh neon blurs) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Professional Dot Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* ── LEFT PANEL: Startup Sequence ── */}
        <motion.div
          variants={sidePanelVariants}
          className="hidden lg:flex col-span-3 flex-col bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative"
        >
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <TerminalSquare className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
              Startup Sequence
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-end font-mono text-xs leading-relaxed gap-3">
            <AnimatePresence>
              {bootLogs.map((log, index) => {
                const isLast = index === bootLogs.length - 1
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 ${isLast && isReady ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}
                  >
                    <span className="mt-0.5">
                      {isLast && isReady ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Loader2 size={14} className="animate-spin opacity-50" />
                      )}
                    </span>
                    <span>{log}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── CENTER PANEL: Main Authentication ── */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center"
        >
          <div className="w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl relative">
            {/* Header / Branding */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 shadow-inner flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-zinc-100" />
              </div>
              <h1 className="text-3xl font-bold tracking-wide text-white mb-2">IRIS OS</h1>
              <p className="text-zinc-400 text-sm font-medium">Intelligent Local Environment</p>
            </div>

            {/* Information Notice */}
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300 leading-relaxed">
                Authentication is processed securely via Google to verify your identity. Your
                workspace, API keys, and files remain strictly local and encrypted.
              </p>
            </div>

            {/* Premium OAuth Button */}
            <motion.button
              whileHover={{ scale: isReady ? 1.02 : 1 }}
              whileTap={{ scale: isReady ? 0.98 : 1 }}
              onClick={handleGoogleLogin}
              disabled={!isReady}
              className={`relative flex w-full items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
                !isReady
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  : 'bg-white text-black hover:bg-zinc-200 border border-white cursor-pointer'
              }`}
            >
              <FcGoogle className="w-5 h-5" />
              {isReady ? 'Continue with Google' : 'Initializing System...'}
            </motion.button>

            <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium">
              <Lock size={12} />
              End-to-End Encrypted Handshake
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL: System Diagnostics ── */}
        <motion.div
          variants={sidePanelVariants}
          className="hidden lg:flex col-span-3 flex-col bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
              System Diagnostics
            </h3>
          </div>

          <div className="flex flex-col gap-8 flex-1">
            {/* Diagnostic Row 1 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-2">
                  <Network size={14} /> Network Bridge
                </span>
                <span className={isReady ? 'text-emerald-400' : 'text-zinc-500'}>
                  {isReady ? 'Connected' : 'Waiting...'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-1000 ${isReady ? 'w-full bg-emerald-500' : 'w-1/3 bg-zinc-600 animate-pulse'}`}
                />
              </div>
            </div>

            {/* Diagnostic Row 2 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-2">
                  <Database size={14} /> Local Storage
                </span>
                <span className="text-zinc-500">Secured</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="w-full h-full bg-zinc-600" />
              </div>
            </div>

            {/* Diagnostic Row 3 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-2">
                  <Lock size={14} /> Biometric Engine
                </span>
                <span className="text-zinc-500">Standby</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="w-[15%] h-full bg-zinc-600" />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <p className="text-xs text-zinc-500 leading-relaxed">
              IRIS operates strictly within a local environment. No user data is transmitted to
              centralized servers without explicit permission.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

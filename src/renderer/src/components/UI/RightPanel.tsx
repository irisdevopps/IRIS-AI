import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'model' | 'system'
  text: string
}

export default function RightPanel() {
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [activeModelText, setActiveModelText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadHistory = async () => {
      if ((window as any).iris?.getHistory) {
        try {
          const pastMemories = await (window as any).iris.getHistory()
          console.log({ pastMemories })
          const recentMemories: Message[] = pastMemories.slice(-30).map((m: any) => ({
            role: m.role.toLowerCase() as 'user' | 'model' | 'system',
            text: m.text
          }))
          setChatHistory(recentMemories)
        } catch (err) {
          console.error('Failed to load history', err)
        }
      }
    }
    loadHistory()

    if ((window as any).iris) {
      ;(window as any).iris.onTranscript(
        (data: { role: string; text: string; isFinal: boolean }) => {
          if (data.role === 'user') {
            const newMessage: Message = { role: 'user', text: data.text }
            setChatHistory((prev) => [...prev, newMessage].slice(-30))
          } else if (data.role === 'model') {
            setActiveModelText((prev) => prev + data.text)
          }
        }
      )
      ;(window as any).iris.onTranscriptComplete(() => {
        setActiveModelText((prev) => {
          if (prev.trim().length > 0) {
            const newMessage: Message = { role: 'model', text: prev.trim() }
            setChatHistory((history) => [...history, newMessage].slice(-30))
          }
          return ''
        })
      })
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory, activeModelText])

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
        <span className="text-[9px] text-slate-500 tracking-[0.2em] font-mono uppercase">
          Transcript
        </span>
        <span className="text-[8px] text-[#00ff41] tracking-widest uppercase font-mono animate-pulse">
          Live-Log
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-4 overflow-y-auto scrollbar-small flex flex-col gap-3 font-mono text-[11px] custom-scrollbar scroll-smooth"
      >
        {chatHistory.length === 0 && activeModelText === '' && (
          <div className="text-[9px] text-slate-600 text-center uppercase tracking-wider my-2 opacity-50">
            [System Notice]: Awaiting Link...
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-md leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#00ff41]/10 border border-[#00ff41]/20 text-[#00ff41] text-right rounded-br-sm'
                  : 'bg-white/3 border border-white/5 text-slate-300 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {activeModelText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] p-3 rounded-md leading-relaxed bg-white/3 border border-white/5 text-slate-300 rounded-bl-sm">
              {activeModelText}
              <span className="inline-block w-1.5 h-3 ml-1 bg-[#00ff41] animate-pulse align-middle"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

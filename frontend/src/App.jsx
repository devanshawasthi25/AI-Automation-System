import { useState, useEffect, useRef, useCallback } from "react"
import "./App.css"
import GameHub from "./Games.jsx"

// ═══════════════════════════════════════════════════════════════
//  🔊  SOUND ENGINE
// ═══════════════════════════════════════════════════════════════
const getAudioCtx = (() => {
  let ctx = null
  return () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === "suspended") ctx.resume()
    return ctx
  }
})()

function playButtonClick() {
  const ctx = getAudioCtx(), now = ctx.currentTime
  const bufLen = ctx.sampleRate * 0.04, buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.4
  const noise = ctx.createBufferSource(); noise.buffer = buf
  const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 4200; nf.Q.value = 1.2
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  noise.connect(nf); nf.connect(ng); ng.connect(ctx.destination); noise.start(now); noise.stop(now + 0.04)
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.type = "sine"; osc.frequency.setValueAtTime(900, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.08)
  gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.12)
  const osc2 = ctx.createOscillator(), gain2 = ctx.createGain()
  osc2.type = "triangle"; osc2.frequency.setValueAtTime(2200, now); osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.05)
  gain2.gain.setValueAtTime(0.08, now); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc2.connect(gain2); gain2.connect(ctx.destination); osc2.start(now); osc2.stop(now + 0.07)
}

function playDogBark() {
  const ctx = getAudioCtx(), now = ctx.currentTime
  const barks = [{ start: 0, freq: 420, peak: 680, end: 310, dur: 0.13 }, { start: 0.17, freq: 480, peak: 740, end: 350, dur: 0.11 }]
  barks.forEach(({ start, freq, peak, end, dur }) => {
    const t = now + start, osc = ctx.createOscillator(), gain = ctx.createGain()
    osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq, t); osc.frequency.linearRampToValueAtTime(peak, t + dur * 0.3); osc.frequency.exponentialRampToValueAtTime(end, t + dur)
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.28, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1800; filter.Q.value = 2.5
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + dur + 0.05)
  })
  const t3 = now + 0.35, osc3 = ctx.createOscillator(), g3 = ctx.createGain()
  osc3.type = "sine"; osc3.frequency.setValueAtTime(900, t3); osc3.frequency.exponentialRampToValueAtTime(1400, t3 + 0.06); osc3.frequency.exponentialRampToValueAtTime(700, t3 + 0.12)
  g3.gain.setValueAtTime(0.1, t3); g3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.14)
  osc3.connect(g3); g3.connect(ctx.destination); osc3.start(t3); osc3.stop(t3 + 0.15)
}

function playNavClick() {
  const ctx = getAudioCtx(), now = ctx.currentTime
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.type = "sine"; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(340, now + 0.07)
  gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
  osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.1)
}

// ═══════════════════════════════════════════════════════════════
//  SVG ICONS
// ═══════════════════════════════════════════════════════════════
const SendIcon    = () => <svg className="btn-icon send-icon"    viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const SearchIcon  = () => <svg className="btn-icon search-icon"  viewBox="0 0 24 24" fill="none"><circle className="search-ring" cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
const GlobeIcon   = () => <svg className="btn-icon globe-icon"   viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
const BoltIcon    = () => <svg className="btn-icon bolt-icon"    viewBox="0 0 24 24" fill="none"><path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const RefreshIcon = () => <svg className="btn-icon refresh-icon" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 20v-5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.06 9A8 8 0 0 1 20 12M3.94 12a8 8 0 0 0 15.94 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>

// ═══════════════════════════════════════════════════════════════
//  📝  MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════
function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2,-2)}</strong>
    if (part.startsWith("*")  && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1,-1)}</em>
    if (part.startsWith("`")  && part.endsWith("`")) return <code key={i} className="inline-code">{part.slice(1,-1)}</code>
    return part
  })
}

function MarkdownRenderer({ text }) {
  if (!text) return null
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="md-root">
      {blocks.map((block, bi) => {
        const lines = block.split("\n")
        if (/^#{1,3} /.test(lines[0])) {
          const lvl = lines[0].match(/^(#{1,3}) /)[1].length
          const Tag = ["h3","h4","h5"][lvl-1]
          return <Tag key={bi} className={`md-h${lvl}`}>{renderInline(lines[0].replace(/^#{1,3} /,""))}</Tag>
        }
        const isBullet = l => /^[*\-•] /.test(l.trim())
        if (lines.some(isBullet)) {
          return (
            <ul key={bi} className="md-ul">
              {lines.map((line, i) => {
                const t = line.trim(); if (!t) return null
                if (isBullet(t)) return <li key={i} className="md-li">{renderInline(t.replace(/^[*\-•] /,""))}</li>
                return <p key={i} className="md-p">{renderInline(t)}</p>
              })}
            </ul>
          )
        }
        const isNum = l => /^\d+[.)]\s/.test(l.trim())
        if (lines.some(isNum)) {
          return <ol key={bi} className="md-ol">{lines.filter(l=>l.trim()).map((line,i)=><li key={i} className="md-li">{renderInline(line.replace(/^\d+[.)]\s/,""))}</li>)}</ol>
        }
        if (block.trim().startsWith("```")) {
          const code = block.replace(/^```[a-z]*\n?/,"").replace(/```$/,"")
          return <pre key={bi} className="md-code"><code>{code}</code></pre>
        }
        const para = lines.join(" ").trim(); if (!para) return null
        return <p key={bi} className="md-p">{renderInline(para)}</p>
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  🐶  NEON DOG
// ═══════════════════════════════════════════════════════════════
const NeonDog = ({ visible, waving, onClick }) => (
  <div className={`dog-container ${visible?"dog-out":""} ${waving?"dog-waving":""}`} onClick={onClick}>
    <div className={`dog-bubble ${waving?"bubble-show":""}`}>Woof! 🐾</div>
    <svg className="dog-svg" viewBox="0 0 280 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-cyan" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-mag"  x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-eye"  x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="bodyFill" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#0d1040"/><stop offset="100%" stopColor="#050818"/></radialGradient>
        <radialGradient id="eyeGrad"  cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#00ffee"/><stop offset="100%" stopColor="#0055ff"/></radialGradient>
        <linearGradient id="collarGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ff00cc"/><stop offset="50%" stopColor="#7b2fff"/><stop offset="100%" stopColor="#00ccff"/></linearGradient>
      </defs>
      <g className="dog-tail" filter="url(#glow-cyan)"><path d="M218 300 Q255 260 248 220 Q242 190 262 170" stroke="#00ffff" strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M218 300 Q255 260 248 220 Q242 190 262 170" stroke="#001a2a" strokeWidth="7" strokeLinecap="round" fill="none"/><circle cx="262" cy="168" r="10" fill="#001a2a" stroke="#00ffff" strokeWidth="3"/><circle cx="262" cy="168" r="5" fill="#00ffff" opacity="0.8"/></g>
      <ellipse cx="140" cy="295" rx="85" ry="75" fill="url(#bodyFill)"/><ellipse cx="140" cy="295" rx="85" ry="75" stroke="#00ffff" strokeWidth="2.5" fill="none" filter="url(#glow-cyan)" opacity="0.9"/>
      <path d="M80 280 Q140 265 200 280" stroke="#00ffff" strokeWidth="1" opacity="0.25" fill="none"/><path d="M75 300 Q140 285 205 300" stroke="#00ffff" strokeWidth="1" opacity="0.2" fill="none"/>
      <rect x="88" y="340" width="32" height="45" rx="16" fill="url(#bodyFill)" stroke="#00ffff" strokeWidth="2" filter="url(#glow-cyan)"/><rect x="158" y="340" width="32" height="45" rx="16" fill="url(#bodyFill)" stroke="#00ffff" strokeWidth="2" filter="url(#glow-cyan)"/>
      <ellipse cx="104" cy="386" rx="20" ry="10" fill="url(#bodyFill)" stroke="#ff00cc" strokeWidth="2" filter="url(#glow-mag)"/><ellipse cx="174" cy="386" rx="20" ry="10" fill="url(#bodyFill)" stroke="#ff00cc" strokeWidth="2" filter="url(#glow-mag)"/>
      <path d="M94 385 L94 390 M104 387 L104 392 M114 385 L114 390" stroke="#ff00cc" strokeWidth="1.5" strokeLinecap="round"/><path d="M164 385 L164 390 M174 387 L174 392 M184 385 L184 390" stroke="#ff00cc" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="70" y="228" width="140" height="22" rx="11" fill="url(#bodyFill)" stroke="url(#collarGrad)" strokeWidth="3" filter="url(#glow-soft)"/>
      <circle cx="140" cy="258" r="13" fill="url(#bodyFill)" stroke="#ffcc00" strokeWidth="2.5" filter="url(#glow-mag)"/><text x="140" y="263" textAnchor="middle" fill="#ffcc00" fontSize="10" fontWeight="bold" fontFamily="monospace">AI</text>
      <g className="dog-ear-left" filter="url(#glow-cyan)"><ellipse cx="82" cy="128" rx="26" ry="36" fill="url(#bodyFill)" stroke="#00ffff" strokeWidth="2.5" transform="rotate(-15 82 128)"/><ellipse cx="82" cy="130" rx="14" ry="22" fill="none" stroke="#ff00cc" strokeWidth="1.5" transform="rotate(-15 82 130)" opacity="0.7"/></g>
      <g className="dog-ear-right" filter="url(#glow-cyan)"><ellipse cx="198" cy="128" rx="26" ry="36" fill="url(#bodyFill)" stroke="#00ffff" strokeWidth="2.5" transform="rotate(15 198 128)"/><ellipse cx="198" cy="130" rx="14" ry="22" fill="none" stroke="#ff00cc" strokeWidth="1.5" transform="rotate(15 198 130)" opacity="0.7"/></g>
      <ellipse cx="140" cy="160" rx="78" ry="72" fill="url(#bodyFill)"/><ellipse cx="140" cy="160" rx="78" ry="72" stroke="#00ffff" strokeWidth="2.5" fill="none" filter="url(#glow-cyan)"/>
      <ellipse cx="140" cy="185" rx="40" ry="28" fill="url(#bodyFill)"/><ellipse cx="140" cy="185" rx="40" ry="28" stroke="#4f6ef7" strokeWidth="1.8" fill="none" filter="url(#glow-cyan)" opacity="0.7"/>
      <ellipse cx="108" cy="152" rx="20" ry="20" fill="#020510" stroke="#00ffff" strokeWidth="1.5" filter="url(#glow-eye)"/><ellipse cx="172" cy="152" rx="20" ry="20" fill="#020510" stroke="#00ffff" strokeWidth="1.5" filter="url(#glow-eye)"/>
      <circle cx="108" cy="152" r="13" fill="url(#eyeGrad)" filter="url(#glow-eye)"/><circle cx="172" cy="152" r="13" fill="url(#eyeGrad)" filter="url(#glow-eye)"/>
      <circle className="dog-pupil-l" cx="109" cy="153" r="7" fill="#000510"/><circle className="dog-pupil-r" cx="173" cy="153" r="7" fill="#000510"/>
      <circle cx="113" cy="148" r="3.5" fill="white" opacity="0.9"/><circle cx="177" cy="148" r="3.5" fill="white" opacity="0.9"/>
      <path className="dog-brow-l" d="M90 134 Q108 126 126 134" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#glow-cyan)"/>
      <path className="dog-brow-r" d="M154 134 Q172 126 190 134" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#glow-cyan)"/>
      <ellipse cx="140" cy="177" rx="14" ry="10" fill="#001a1a" stroke="#00ffff" strokeWidth="2" filter="url(#glow-cyan)"/>
      <path d="M140 187 L130 196 M140 187 L150 196" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" filter="url(#glow-cyan)"/>
      <path className="dog-mouth" d="M118 198 Q140 214 162 198" stroke="#00ffff" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow-cyan)"/>
      <g className="dog-tongue"><path d="M127 208 Q140 232 153 208" fill="#ff2266" filter="url(#glow-mag)"/><path d="M132 218 Q140 230 148 218" fill="#cc0044"/><path d="M127 208 Q140 232 153 208" stroke="#ff66aa" strokeWidth="1.5" fill="none"/></g>
      <g className="dog-arm" filter="url(#glow-cyan)"><ellipse cx="56" cy="265" rx="18" ry="30" fill="url(#bodyFill)" stroke="#00ffff" strokeWidth="2" transform="rotate(20 56 265)"/><ellipse cx="38" cy="232" rx="22" ry="18" fill="url(#bodyFill)" stroke="#ff00cc" strokeWidth="2.5" filter="url(#glow-mag)"/><path d="M26 228 L22 222 M38 225 L36 218 M50 228 L54 222" stroke="#ff00cc" strokeWidth="2" strokeLinecap="round"/></g>
      <circle cx="76" cy="165" r="2.5" fill="#ff00cc" opacity="0.7" filter="url(#glow-mag)"/><circle cx="204" cy="165" r="2.5" fill="#ff00cc" opacity="0.7" filter="url(#glow-mag)"/>
    </svg>
  </div>
)

// ═══════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════
const MEMORY_KEY = "ai_suite_memory"
const USER_KEY   = "ai_suite_user"

export default function App() {

  // ── core UI ──────────────────────────────────────────────────
  const [tool,       setTool]       = useState("chat")
  const [sidebarOpen,setSidebarOpen]= useState(true)

  // ── dog ──────────────────────────────────────────────────────
  const [dogVisible, setDogVisible] = useState(false)
  const [dogWaving,  setDogWaving]  = useState(false)
  const dogTimerRef    = useRef(null)

  // ── voice ─────────────────────────────────────────────────────
  const recognitionRef = useRef(null)
  const abortRef       = useRef(null)
  const [isListening,    setIsListening]    = useState(false)
  const [isSpeaking,     setIsSpeaking]     = useState(false)
  const [autoSpeak,      setAutoSpeak]      = useState(false)
  const [autoSubmit,     setAutoSubmit]     = useState(true)   // auto-send after voice done

  // ── smart memory ──────────────────────────────────────────────
  const [userName,    setUserName]    = useState("")
  const [nameInput,   setNameInput]   = useState("")
  const [messages,    setMessages]    = useState([])           // [{role,content,ts,file?,image?}]
  const [showMemory,  setShowMemory]  = useState(false)
  const chatEndRef   = useRef(null)
  const memoryEndRef  = useRef(null)

  // ── file / image ──────────────────────────────────────────────
  const fileRef  = useRef(null)
  const imgRef   = useRef(null)
  const [attachedFile,  setAttachedFile]  = useState(null)    // {name, type, content}
  const [attachedImage, setAttachedImage] = useState(null)    // {name, dataUrl}
  const [filePreview,   setFilePreview]   = useState("")

  // ── other panels ─────────────────────────────────────────────
  const [topic,        setTopic]        = useState("")
  const [research,     setResearch]     = useState("")
  const [scrapeUrl,    setScrapeUrl]    = useState("")
  const [scrapeResult, setScrapeResult] = useState("")
  const [chatInput,    setChatInput]    = useState("")
  const [isStreaming,  setIsStreaming]  = useState(false)
  const [gameOpen,     setGameOpen]     = useState(false)
  const [analyzeInput, setAnalyzeInput] = useState("")
  const [analyzeResult,setAnalyzeResult]= useState("")
  const [analyzeFile,   setAnalyzeFile]  = useState(null)   // {name, content}
  const analyzeFileRef = useRef(null)
  const [health,       setHealth]       = useState("")

  // ── load memory on mount ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(MEMORY_KEY)
    const user  = localStorage.getItem(USER_KEY)
    if (saved)  setMessages(JSON.parse(saved))
    if (user)   setUserName(user)
  }, [])

  // ── save messages whenever they change ───────────────────────
  useEffect(() => {
    if (messages.length) localStorage.setItem(MEMORY_KEY, JSON.stringify(messages))
  }, [messages])

  // ── scroll to bottom on new message ──────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  // ── scroll memory panel to bottom ────────────────────────────
  useEffect(() => {
    if (showMemory) {
      setTimeout(() => memoryEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }, [messages, showMemory])

  // ── dog entrance ─────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setDogVisible(true),  600)
    const t2 = setTimeout(() => setDogWaving(true),   900)
    const t3 = setTimeout(() => setDogWaving(false), 3100)
    const t4 = setTimeout(() => setDogVisible(false),4200)
    return () => [t1,t2,t3,t4].forEach(clearTimeout)
  }, [])

  const triggerDog = () => {
    if (dogTimerRef.current) clearTimeout(dogTimerRef.current)
    setDogVisible(true); setDogWaving(true)
    dogTimerRef.current = setTimeout(() => {
      setDogWaving(false)
      setTimeout(() => setDogVisible(false), 1000)
    }, 2400)
  }
  const handleDogClick = () => { playDogBark(); triggerDog() }

  // ── nav ───────────────────────────────────────────────────────
  const handleNav = (id) => { playNavClick(); setTool(id); if (id === "health") checkHealth() }

  // ── save username ─────────────────────────────────────────────
  const saveUser = () => {
    if (!nameInput.trim()) return
    localStorage.setItem(USER_KEY, nameInput.trim())
    setUserName(nameInput.trim())
    setNameInput("")
  }

  const switchUser = () => {
    setUserName("")
    setNameInput("")
    localStorage.removeItem(USER_KEY)
  }

  // ── clear memory ─────────────────────────────────────────────
  const clearMemory = () => {
    setMessages([])
    localStorage.removeItem(MEMORY_KEY)
  }

  // ── speak helper ─────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!text || !window.speechSynthesis) return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 1.05; utt.pitch = 1.0; utt.volume = 1.0
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.name.includes("Google") && v.lang === "en-US") || voices.find(v => v.lang === "en-US")
    if (v) utt.voice = v
    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [isSpeaking])

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false) }

  // ── voice input ───────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (isListening) { recognitionRef.current?.stop(); return }
    playNavClick()
    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false
    rec.onstart  = () => setIsListening(true)
    rec.onend    = () => setIsListening(false)
    rec.onerror  = () => setIsListening(false)
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("")
      setChatInput(transcript)
      if (e.results[e.results.length - 1].isFinal) {
        setIsListening(false)
        // ── Auto-submit when voice ends ──────────────────────────
        if (autoSubmit && transcript.trim()) {
          setTimeout(() => runChatWithPrompt(transcript.trim()), 400)
        }
      }
    }
    rec.start()
  }

  // ── file attach ───────────────────────────────────────────────
  const handleFileAttach = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      setAttachedFile({ name: file.name, type: file.type, content })
      // preview first 300 chars for CSV, or just filename for PDF
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setFilePreview(content.slice(0, 400))
      } else {
        setFilePreview(`PDF loaded: ${file.name} (${(file.size/1024).toFixed(1)} KB)`)
      }
    }
    if (file.type === "application/pdf") reader.readAsDataURL(file)
    else reader.readAsText(file)
    e.target.value = ""
  }

  // ── image attach ──────────────────────────────────────────────
  const handleImageAttach = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAttachedImage({ name: file.name, dataUrl: ev.target.result })
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const removeFile  = () => { setAttachedFile(null);  setFilePreview("") }
  const removeImage = () => setAttachedImage(null)

  // ── MAIN CHAT (with memory + streaming) ──────────────────────
  const stopResponse = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    // mark last assistant message as done (keep partial text)
    setMessages(prev => {
      const last = [...prev].reverse().find(m => m.role === "assistant")
      if (!last) return prev
      return prev.map(m => m.ts === last.ts ? { ...m, streaming: false } : m)
    })
  }

  const runChatWithPrompt = async (promptText) => {
    if (!promptText.trim() && !attachedFile && !attachedImage) return
    playButtonClick(); triggerDog()

    // cancel any previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // build context from memory (last 10 messages)
    const history = messages.slice(-10).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")

    let fullPrompt = promptText
    if (attachedFile) fullPrompt += `\n\n[File: ${attachedFile.name}]\n${attachedFile.content?.slice(0, 2000)}`
    if (history)      fullPrompt = `Previous conversation:\n${history}\n\nUser: ${fullPrompt}`

    const userMsg = { role: "user", content: promptText, ts: Date.now(), file: attachedFile?.name, image: attachedImage?.dataUrl }
    setMessages(prev => [...prev, userMsg])
    setChatInput("")
    setAttachedFile(null); setFilePreview(""); setAttachedImage(null)
    setIsStreaming(true)

    const aIdx = Date.now() + 1
    setMessages(prev => [...prev, { role: "assistant", content: "", ts: aIdx, streaming: true }])

    let finalText = ""
    let stopped   = false

    try {
      const body = { prompt: fullPrompt }
      if (attachedImage) body.image = attachedImage.dataUrl

      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      const contentType = res.headers.get("content-type") || ""
      if (res.body && (contentType.includes("text/event-stream") || contentType.includes("text/plain"))) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split("\n")) {
            const text = line.startsWith("data: ") ? line.slice(6) : line
            if (text && text !== "[DONE]") {
              finalText += text
              setMessages(prev => prev.map(m => m.ts === aIdx ? { ...m, content: finalText } : m))
            }
          }
        }
      } else {
        const data = await res.json()
        finalText = data.response || ""
        let i = 0
        await new Promise(resolve => {
          const type = () => {
            if (controller.signal.aborted) { stopped = true; resolve(); return }
            if (i <= finalText.length) {
              setMessages(prev => prev.map(m => m.ts === aIdx ? { ...m, content: finalText.slice(0, i) } : m))
              i += Math.floor(Math.random() * 4) + 2
              setTimeout(type, 16)
            } else resolve()
          }
          type()
        })
        if (stopped) finalText = finalText.slice(0, i)
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // stopped by user — keep whatever was typed so far
      } else {
        finalText = "❌ Error: " + err.message
        setMessages(prev => prev.map(m => m.ts === aIdx ? { ...m, content: finalText } : m))
      }
    } finally {
      setMessages(prev => prev.map(m => m.ts === aIdx ? { ...m, content: finalText, streaming: false } : m))
      setIsStreaming(false)
      abortRef.current = null
      if (autoSpeak && finalText && !stopped) setTimeout(() => speakText(finalText), 200)
    }
  }

  const runChat = () => runChatWithPrompt(chatInput)

  // ── other API calls ───────────────────────────────────────────
  const runResearch = async () => {
    playButtonClick(); triggerDog()
    const res  = await fetch(`http://127.0.0.1:8000/research?topic=${topic}`)
    const data = await res.json()
    setResearch(data.research)
  }
  const runScraper = async () => {
    playButtonClick(); triggerDog()
    const res  = await fetch(`http://127.0.0.1:8000/scrape?url=${scrapeUrl}`)
    const data = await res.json()
    setScrapeResult(JSON.stringify(data, null, 2))
  }
  const handleAnalyzeFile = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      setAnalyzeFile({ name: file.name, content })
      // pre-fill input with filename hint
      setAnalyzeInput(`[File: ${file.name}] `)
    }
    if (file.name.endsWith(".pdf")) reader.readAsDataURL(file)
    else reader.readAsText(file)
    e.target.value = ""
  }

  const runAnalyze = async () => {
    playButtonClick(); triggerDog()
    let textToSend = analyzeInput
    if (analyzeFile) textToSend = analyzeFile.content?.slice(0, 4000) + (analyzeInput ? "\n\nAdditional context: " + analyzeInput : "")
    const res  = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textToSend })
    })
    const data = await res.json()
    setAnalyzeResult(data.result)
  }
  const checkHealth = async () => {
    playButtonClick(); triggerDog()
    const res  = await fetch("http://127.0.0.1:8000/health")
    const data = await res.json()
    setHealth(data.status)
  }

  const navItems = [
    { id:"chat",     icon:"💬", label:"Chat"     },
    { id:"research", icon:"🔍", label:"Research" },
    { id:"scraper",  icon:"🌐", label:"Scraper"  },
    { id:"analyze",  icon:"🧠", label:"Analyze"  },
    { id:"health",   icon:"❤️", label:"Health"   },
  ]

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen?"open":"closed"}`}>
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Tony<span className="logo-accent">.AI</span></span>
          <button className="close-btn" onClick={() => { playNavClick(); setSidebarOpen(false) }}>✕</button>
        </div>
        <div className="rail">
          <button className="rail-logo-btn" onClick={() => { playNavClick(); setSidebarOpen(true) }}>⚡</button>
          {navItems.map(item => (
            <button key={item.id} className={`rail-btn ${tool===item.id?"active":""}`} onClick={() => handleNav(item.id)} title={item.label}>{item.icon}</button>
          ))}
        </div>
        <nav className="nav">
          {navItems.map(item => (
            <button key={item.id} className={`navBtn ${tool===item.id?"active":""}`} onClick={() => handleNav(item.id)}>
              <span className="navBtn-icon">{item.icon}</span>
              <span className="navBtn-label">{item.label}</span>
              {tool===item.id && <span className="navBtn-dot"/>}
            </button>
          ))}
        </nav>

        {/* ── Memory panel in sidebar ── */}
        {sidebarOpen && (
          <div className="memory-section">
            <div className="memory-header" onClick={() => setShowMemory(p=>!p)}>
              <span>🧠 Memory</span>
              <span className="memory-count">{messages.length}</span>
              <span className="memory-chevron">{showMemory?"▲":"▼"}</span>
            </div>
            {showMemory && (
              <div className="memory-body">
                {/* ── User row ── */}
                {!userName ? (
                  <div className="memory-user-setup">
                    <input className="memory-name-input" placeholder="Your name…" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveUser()}/>
                    <button className="memory-save-btn" onClick={saveUser}>Save</button>
                  </div>
                ) : (
                  <div className="memory-user-row">
                    <span className="memory-user-tag">👤 {userName}</span>
                    <button className="memory-switch-btn" onClick={switchUser} title="Switch user">⇄ Switch</button>
                  </div>
                )}

                {/* ── Messages list ── */}
                <div className="memory-msgs">
                  {messages.length === 0 && (
                    <p className="memory-empty">No messages yet</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`memory-msg ${m.role}`}>
                      <span className="memory-role">{m.role === "user" ? (userName||"You") : "AI"}</span>
                      <span className="memory-snippet">{m.content?.slice(0,60)}{m.content?.length > 60 ? "…" : ""}</span>
                    </div>
                  ))}
                  <div ref={memoryEndRef}/>
                </div>

                {/* ── Actions ── */}
                {messages.length > 0 && (
                  <button className="memory-clear-btn" onClick={clearMemory}>🗑 Clear memory</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* footer always pinned at bottom */}
        <div className="sidebar-footer">
          <span className="status-dot"/><span className="status-text">Backend: 8000</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <header className="header">
          <h1 className="page-title">{navItems.find(n=>n.id===tool)?.icon}&nbsp;{navItems.find(n=>n.id===tool)?.label}</h1>
          <p className="page-sub">AI Dashboard Developed By Devansh Awasthi</p>
        </header>

        <div className="panel-wrap">

          {/* ════════ CHAT ════════ */}
          {tool==="chat" && (
            <div className="panel chat-panel animate-in">

              {/* ── voice + auto toggles ── */}
              <div className="chat-toggles">
                <button className={`toggle-btn ${autoSubmit?"toggle-on":""}`} onClick={() => setAutoSubmit(p=>!p)} title="Auto-send when voice ends">
                  <span className="toggle-icon">🎙</span>
                  <span>Auto-send</span>
                  <span className={`toggle-pill ${autoSubmit?"on":""}`}>{autoSubmit?"ON":"OFF"}</span>
                </button>
                <button className={`toggle-btn ${autoSpeak?"toggle-on":""}`} onClick={() => { setAutoSpeak(p=>!p); if(isSpeaking) stopSpeaking() }} title="Auto-speak AI response">
                  <span className="toggle-icon">🔊</span>
                  <span>Auto-speak</span>
                  <span className={`toggle-pill ${autoSpeak?"on":""}`}>{autoSpeak?"ON":"OFF"}</span>
                </button>
                {userName && <span className="chat-user-badge">👤 {userName}</span>}
              </div>

              {/* ── message history ── */}
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <p>Start a conversation…</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className="bubble-meta">
                      <span className="bubble-name">{msg.role==="user"?(userName||"You"):"AI"}</span>
                      {msg.file && <span className="bubble-file">📎 {msg.file}</span>}
                    </div>
                    {msg.image && <img src={msg.image} alt="attachment" className="bubble-img"/>}
                    <div className="bubble-content">
                      {msg.streaming
                        ? <>{msg.content}<span className="typing-cursor">▍</span></>
                        : <MarkdownRenderer text={msg.content}/>
                      }
                    </div>
                    {/* speak individual message */}
                    {msg.role==="assistant" && !msg.streaming && msg.content && (
                      <button className={`bubble-speak ${isSpeaking?"speak-active":""}`} onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)} title="Read aloud">
                        {isSpeaking ? <span className="speak-wave"><i/><i/><i/><i/></span> : "🔊"}
                      </button>
                    )}
                  </div>
                ))}
                {isStreaming && messages[messages.length-1]?.content === "" && (
                  <div className="typing-dots"><span/><span/><span/></div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* ── file/image previews ── */}
              {(attachedFile || attachedImage) && (
                <div className="attachments-row">
                  {attachedFile && (
                    <div className="attachment-chip">
                      <span>{attachedFile.name.endsWith(".pdf")?"📄":"📊"} {attachedFile.name}</span>
                      <button onClick={removeFile}>✕</button>
                    </div>
                  )}
                  {attachedImage && (
                    <div className="attachment-chip img-chip">
                      <img src={attachedImage.dataUrl} alt="" className="attach-thumb"/>
                      <span>{attachedImage.name}</span>
                      <button onClick={removeImage}>✕</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── input bar ── */}
              <div className="chat-input-bar">
                {/* hidden file inputs */}
                <input ref={fileRef} type="file" accept=".pdf,.csv,.txt" style={{display:"none"}} onChange={handleFileAttach}/>
                <input ref={imgRef} type="file" accept="image/*"           style={{display:"none"}} onChange={handleImageAttach}/>

                {/* attach file */}
                <button className="attach-btn" onClick={() => fileRef.current.click()} title="Attach PDF or CSV">
                  <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>

                {/* attach image */}
                <button className="attach-btn" onClick={() => imgRef.current.click()} title="Attach image">
                  <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                <input
                  className="field-input chat-text-input"
                  placeholder={isListening ? "Listening…" : "Ask anything… (Enter to send)"}
                  value={chatInput}
                  onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&runChat()}
                  disabled={isStreaming}
                />

                {/* mic */}
                <button className={`mic-btn ${isListening?"mic-active":""}`} onClick={startListening} title={isListening?"Stop":"Speak"}>
                  <span className="mic-wave"><i/><i/><i/><i/><i/></span>
                  <svg className="mic-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 19v3M9 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* send / stop toggle */}
                {isStreaming ? (
                  <button className="action-btn stop-btn" onClick={stopResponse}>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>
                    </svg>
                    <span className="btn-label">Stop</span>
                  </button>
                ) : (
                  <button className="action-btn" onClick={runChat}>
                    <SendIcon/><span className="btn-label">Send</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ════════ RESEARCH ════════ */}
          {tool==="research" && (
            <div className="panel animate-in">
              <label className="field-label">Topic</label>
              <div className="input-row">
                <input className="field-input" placeholder="Enter a topic to research…" value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runResearch()}/>
                <button className="action-btn" onClick={runResearch}><SearchIcon/><span className="btn-label">Search</span></button>
              </div>
              {research && <div className="output-box animate-in"><span className="output-label">Results</span><div className="output-text"><MarkdownRenderer text={research}/></div></div>}
            </div>
          )}

          {/* ════════ SCRAPER ════════ */}
          {tool==="scraper" && (
            <div className="panel animate-in">
              <label className="field-label">URL</label>
              <div className="input-row">
                <input className="field-input" placeholder="https://example.com" value={scrapeUrl} onChange={e=>setScrapeUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runScraper()}/>
                <button className="action-btn" onClick={runScraper}><GlobeIcon/><span className="btn-label">Scrape</span></button>
              </div>
              {scrapeResult && <div className="output-box animate-in"><span className="output-label">Data</span><pre className="output-pre">{scrapeResult}</pre></div>}
            </div>
          )}

          {/* ════════ ANALYZE ════════ */}
          {tool==="analyze" && (
            <div className="panel animate-in">
              <input ref={analyzeFileRef} type="file" accept=".pdf,.csv,.txt,.md" style={{display:"none"}} onChange={handleAnalyzeFile}/>

              <label className="field-label">Text or File</label>

              {/* file chip */}
              {analyzeFile && (
                <div className="analyze-file-chip">
                  <span>{analyzeFile.name.endsWith(".pdf") ? "📄" : "📊"} {analyzeFile.name}</span>
                  <span className="analyze-file-size">{(analyzeFile.content?.length/1024).toFixed(1)} KB</span>
                  <button className="analyze-file-remove" onClick={() => { setAnalyzeFile(null); setAnalyzeInput("") }}>✕</button>
                </div>
              )}

              {/* input + upload + analyze */}
              <div className="input-row" style={{marginTop: analyzeFile ? "10px" : "0"}}>
                <button className="attach-btn" onClick={() => analyzeFileRef.current.click()} title="Upload PDF, CSV or TXT">
                  <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <input
                  className="field-input"
                  placeholder={analyzeFile ? "Optional: add context or question about the file…" : "Paste text or upload a file…"}
                  value={analyzeInput}
                  onChange={e=>setAnalyzeInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&runAnalyze()}
                />
                <button className="action-btn" onClick={runAnalyze}><BoltIcon/><span className="btn-label">Analyze</span></button>
              </div>

              {/* supported formats hint */}
              <p className="analyze-hint">Supports PDF, CSV, TXT — up to 4000 chars sent to AI</p>

              {analyzeResult && (
                <div className="output-box animate-in">
                  <span className="output-label">Analysis</span>
                  <div className="output-text"><MarkdownRenderer text={analyzeResult}/></div>
                </div>
              )}
            </div>
          )}

          {/* ════════ HEALTH ════════ */}
          {tool==="health" && (
            <div className="panel animate-in">
              <div className="health-card">
                <div className="health-icon-wrap">❤️</div>
                <div className="health-info">
                  <span className="health-label">System Status</span>
                  <span className={`health-value ${health?"ok":"waiting"}`}>{health||"Checking…"}</span>
                </div>
                <button className="action-btn health-refresh-btn" onClick={checkHealth}><RefreshIcon/><span className="btn-label">Refresh</span></button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Game invite bubble (while AI responds) ── */}
      {isStreaming && !gameOpen && (
        <div className="game-invite" onClick={() => setGameOpen(true)}>
          <span className="game-invite-icon">🎮</span>
          <span>AI is thinking…<br/><strong>Play a game!</strong></span>
        </div>
      )}

      {/* ── Game Hub ── */}
      {gameOpen && <GameHub onClose={() => setGameOpen(false)} />}

      <NeonDog visible={dogVisible} waving={dogWaving} onClick={() => { handleDogClick(); if(isStreaming) setGameOpen(true) }}/>
    </div>
  )
}
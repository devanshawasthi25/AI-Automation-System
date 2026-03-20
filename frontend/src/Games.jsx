import { useState, useEffect, useRef } from "react"

// ═══════════════════════════════════════════════════════════════
//  SUDOKU
// ═══════════════════════════════════════════════════════════════
function makeSudoku() {
  const base = [
    [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
  ]
  const sol = [
    [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
  ]
  return { puzzle: base.map(r=>[...r]), solution: sol }
}

function Sudoku({ onClose }) {
  const { puzzle, solution } = makeSudoku()
  const [board, setBoard]     = useState(puzzle.map(r=>[...r]))
  const [selected, setSelected] = useState(null)
  const [errors, setErrors]   = useState({})
  const [won, setWon]         = useState(false)

  const handleInput = (val) => {
    if (!selected) return
    const [r,c] = selected
    if (puzzle[r][c] !== 0) return
    const nb = board.map(row=>[...row]); nb[r][c] = val
    const ne = {...errors}
    if (val !== 0 && val !== solution[r][c]) ne[`${r}-${c}`] = true
    else delete ne[`${r}-${c}`]
    setBoard(nb); setErrors(ne)
    if (nb.every((row,ri)=>row.every((cell,ci)=>cell===solution[ri][ci]))) setWon(true)
  }

  return (
    <div className="game-inner">
      <div className="game-top-bar">
        <span className="game-title">🔢 Sudoku</span>
        <button className="game-back-btn" onClick={onClose}>← Back</button>
      </div>
      {won && <div className="game-win-banner">🎉 Solved!</div>}
      <div className="sudoku-grid">
        {board.map((row,r)=>row.map((cell,c)=>{
          const isFixed=puzzle[r][c]!==0
          const isSel=selected&&selected[0]===r&&selected[1]===c
          const isErr=errors[`${r}-${c}`]
          const sameNum=selected&&cell!==0&&cell===board[selected[0]][selected[1]]
          const thickR = c===2||c===5 ? "br-thick" : ""
          const thickB = r===2||r===5 ? "bb-thick" : ""
          return (
            <div key={`${r}-${c}`}
              className={`sudoku-cell ${isFixed?"fixed":""} ${isSel?"sel":""} ${isErr?"err":""} ${sameNum&&!isSel?"same":""} ${thickR} ${thickB}`}
              onClick={()=>!isFixed&&setSelected([r,c])}
            >{cell||""}</div>
          )
        }))}
      </div>
      <div className="sudoku-numpad">
        {[1,2,3,4,5,6,7,8,9].map(n=>(
          <button key={n} className="numpad-btn" onClick={()=>handleInput(n)}>{n}</button>
        ))}
        <button className="numpad-btn erase" onClick={()=>handleInput(0)}>✕</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  CHECKERS
// ═══════════════════════════════════════════════════════════════
function initCheckers() {
  const b = Array(8).fill(null).map(()=>Array(8).fill(null))
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={color:"black",king:false}
  for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={color:"red",king:false}
  return b
}
function getCheckerMoves(board,r,c) {
  const piece=board[r][c]; if(!piece) return []
  const dirs=piece.color==="red"?[[-1,-1],[-1,1]]:[[1,-1],[1,1]]
  if(piece.king) dirs.push(...(piece.color==="red"?[[1,-1],[1,1]]:[[-1,-1],[-1,1]]))
  const moves=[]
  for(const[dr,dc]of dirs){
    const nr=r+dr,nc=c+dc
    if(nr<0||nr>7||nc<0||nc>7)continue
    if(!board[nr][nc]){moves.push({r:nr,c:nc,jump:false});continue}
    if(board[nr][nc].color!==piece.color){const jr=nr+dr,jc=nc+dc;if(jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc])moves.push({r:jr,c:jc,jump:true,capR:nr,capC:nc})}
  }
  return moves
}

function Checkers({ onClose }) {
  const [board,setBoard]=useState(initCheckers)
  const [selected,setSelected]=useState(null)
  const [turn,setTurn]=useState("red")
  const [msg,setMsg]=useState("")
  const moves=selected?getCheckerMoves(board,selected[0],selected[1]):[]

  const handleClick=(r,c)=>{
    if(selected){
      const mv=moves.find(m=>m.r===r&&m.c===c)
      if(mv){
        const nb=board.map(row=>row.map(p=>p?{...p}:null))
        nb[r][c]={...nb[selected[0]][selected[1]],king:nb[selected[0]][selected[1]].king||(turn==="red"&&r===0)||(turn==="black"&&r===7)}
        nb[selected[0]][selected[1]]=null
        if(mv.jump) nb[mv.capR][mv.capC]=null
        setBoard(nb);setSelected(null)
        const next=turn==="red"?"black":"red";setTurn(next)
        if(next==="black") setTimeout(()=>doAI(nb),500)
        return
      }
    }
    if(board[r][c]?.color===turn) setSelected([r,c])
    else setSelected(null)
  }

  const doAI=(b)=>{
    const all=[]
    for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(b[r][c]?.color==="black") getCheckerMoves(b,r,c).forEach(m=>all.push({r,c,m}))
    if(!all.length){setMsg("Red wins! 🎉");return}
    const jumps=all.filter(a=>a.m.jump)
    const pick=(jumps.length?jumps:all)[Math.floor(Math.random()*(jumps.length||all.length))]
    const nb=b.map(row=>row.map(p=>p?{...p}:null))
    nb[pick.m.r][pick.m.c]={...nb[pick.r][pick.c],king:nb[pick.r][pick.c].king||(pick.m.r===7)}
    nb[pick.r][pick.c]=null
    if(pick.m.jump) nb[pick.m.capR][pick.m.capC]=null
    setBoard(nb);setTurn("red")
  }

  return (
    <div className="game-inner">
      <div className="game-top-bar"><span className="game-title">🔴 Checkers</span><button className="game-back-btn" onClick={onClose}>← Back</button></div>
      <div className="checkers-info">{msg||(turn==="red"?"Your turn 🔴":"AI thinking…⚫")}</div>
      <div className="checkers-board">
        {board.map((row,r)=>row.map((cell,c)=>{
          const dark=(r+c)%2===1
          const isSel=selected&&selected[0]===r&&selected[1]===c
          const isMove=moves.some(m=>m.r===r&&m.c===c)
          return(
            <div key={`${r}-${c}`} className={`checker-cell ${dark?"dark":"light"} ${isSel?"csel":""} ${isMove?"cmove":""}`} onClick={()=>handleClick(r,c)}>
              {cell&&<div className={`checker-piece ${cell.color} ${cell.king?"king":""}`}>{cell.king?"♛":""}</div>}
              {isMove&&<div className="checker-dot"/>}
            </div>
          )
        }))}
      </div>
      <button className="game-restart-btn" onClick={()=>{setBoard(initCheckers());setTurn("red");setSelected(null);setMsg("")}}>↺ Restart</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  CHESS
// ═══════════════════════════════════════════════════════════════
const PIECES={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"}
function initChess(){return[["r","n","b","q","k","b","n","r"],["p","p","p","p","p","p","p","p"],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],["P","P","P","P","P","P","P","P"],["R","N","B","Q","K","B","N","R"]]}
function isWhite(p){return p&&p===p.toUpperCase()}
function isBlack(p){return p&&p===p.toLowerCase()}
function basicChessMoves(board,r,c){
  const p=board[r][c];if(!p)return[]
  const moves=[],white=isWhite(p),type=p.toLowerCase()
  const add=(nr,nc)=>{if(nr<0||nr>7||nc<0||nc>7)return false;if(white&&isWhite(board[nr][nc]))return false;if(!white&&isBlack(board[nr][nc]))return false;moves.push([nr,nc]);return!board[nr][nc]}
  const slide=(dr,dc)=>{for(let i=1;i<8;i++)if(!add(r+dr*i,c+dc*i))break}
  if(type==="p"){const dir=white?-1:1,start=white?6:1;if(!board[r+dir]?.[c]){add(r+dir,c);if(r===start&&!board[r+2*dir]?.[c])add(r+2*dir,c)}[[r+dir,c-1],[r+dir,c+1]].forEach(([nr,nc])=>{if(board[nr]?.[nc]&&(white?isBlack(board[nr][nc]):isWhite(board[nr][nc])))moves.push([nr,nc])})}
  if(type==="r"||type==="q")[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>slide(dr,dc))
  if(type==="b"||type==="q")[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>slide(dr,dc))
  if(type==="n")[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc))
  if(type==="k")[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>add(r+dr,c+dc))
  return moves
}

function Chess({ onClose }) {
  const [board,setBoard]=useState(initChess)
  const [sel,setSel]=useState(null)
  const [turn,setTurn]=useState("white")
  const [msg,setMsg]=useState("")
  const moves=sel?basicChessMoves(board,sel[0],sel[1]):[]

  const handleClick=(r,c)=>{
    if(msg)return
    if(sel){
      const mv=moves.find(([mr,mc])=>mr===r&&mc===c)
      if(mv){
        const nb=board.map(row=>[...row]);let placed=nb[sel[0]][sel[1]]
        if(placed==="P"&&r===0)placed="Q";if(placed==="p"&&r===7)placed="q"
        nb[r][c]=placed;nb[sel[0]][sel[1]]=null
        if(!nb.some(row=>row.includes("k")))setMsg("You win! ♔")
        if(!nb.some(row=>row.includes("K")))setMsg("AI wins! ♚")
        setBoard(nb);setSel(null);if(!msg){setTurn("black");setTimeout(()=>doAI(nb),600)}
        return
      }
    }
    if(turn==="white"&&isWhite(board[r][c]))setSel([r,c])
    else if(turn==="black"&&isBlack(board[r][c]))setSel([r,c])
    else setSel(null)
  }

  const doAI=(b)=>{
    const all=[]
    for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(isBlack(b[r][c]))basicChessMoves(b,r,c).forEach(m=>all.push({r,c,m}))
    if(!all.length){setMsg("You win! ♔");return}
    const caps=all.filter(({m})=>isWhite(b[m[0]][m[1]]))
    const pick=(caps.length?caps:all)[Math.floor(Math.random()*(caps.length||all.length))]
    const nb=b.map(row=>[...row]);let placed=nb[pick.r][pick.c]
    if(placed==="p"&&pick.m[0]===7)placed="q"
    nb[pick.m[0]][pick.m[1]]=placed;nb[pick.r][pick.c]=null
    if(!nb.some(row=>row.includes("K")))setMsg("AI wins! ♚")
    setBoard(nb);setTurn("white")
  }

  return (
    <div className="game-inner">
      <div className="game-top-bar"><span className="game-title">♟ Chess</span><button className="game-back-btn" onClick={onClose}>← Back</button></div>
      <div className="checkers-info">{msg||(turn==="white"?"Your turn ♙":"AI thinking… ♟")}</div>
      <div className="chess-board">
        {board.map((row,r)=>row.map((cell,c)=>{
          const light=(r+c)%2===0,isSel=sel&&sel[0]===r&&sel[1]===c,isMove=moves.some(([mr,mc])=>mr===r&&mc===c)
          return(<div key={`${r}-${c}`} className={`chess-cell ${light?"chess-light":"chess-dark"} ${isSel?"csel":""} ${isMove?"cmove":""}`} onClick={()=>handleClick(r,c)}>
            {cell&&<span className={`chess-piece ${isWhite(cell)?"white-piece":"black-piece"}`}>{PIECES[cell]}</span>}
            {isMove&&<div className="chess-dot"/>}
          </div>)
        }))}
      </div>
      <button className="game-restart-btn" onClick={()=>{setBoard(initChess());setTurn("white");setSel(null);setMsg("")}}>↺ New Game</button>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  CATCH TONY  — fixed double-count + faster
// ═══════════════════════════════════════════════════════════════
function CatchDog({ onClose }) {
  const [active,  setActive]  = useState(null)
  const [score,   setScore]   = useState(0)
  const [misses,  setMisses]  = useState(0)
  const [running, setRunning] = useState(false)
  const [best,    setBest]    = useState(0)
  const timerRef  = useRef(null)
  const scoreRef  = useRef(0)
  const activeRef = useRef(null)   // mirrors active without stale closure
  const runRef    = useRef(false)

  const getHideDelay = () => Math.max(380, 1000 - scoreRef.current * 22)
  const getNextDelay = () => Math.max(150, 380 - scoreRef.current * 8)

  const showNext = () => {
    if (!runRef.current) return
    const h = Math.floor(Math.random() * 9)
    activeRef.current = h
    setActive(h)
    timerRef.current = setTimeout(() => {
      if (activeRef.current === h) {
        // missed
        activeRef.current = null
        setActive(null)
        setMisses(m => {
          const nm = m + 1
          if (nm >= 5) {
            runRef.current = false
            setRunning(false)
          } else {
            timerRef.current = setTimeout(showNext, getNextDelay())
          }
          return nm
        })
      }
    }, getHideDelay())
  }

  const startGame = () => {
    clearTimeout(timerRef.current)
    setScore(0); scoreRef.current = 0
    setMisses(0); setActive(null); activeRef.current = null
    runRef.current = true
    setRunning(true)
    timerRef.current = setTimeout(showNext, 500)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleHoleClick = (e, i) => {
    e.stopPropagation()           // ← stops bubble → fixes double-count
    if (!runRef.current) return
    if (activeRef.current !== i) return
    clearTimeout(timerRef.current)
    activeRef.current = null
    setActive(null)
    const ns = scoreRef.current + 1
    scoreRef.current = ns
    setScore(ns)
    setBest(b => Math.max(b, ns))
    timerRef.current = setTimeout(showNext, getNextDelay())
  }

  const FACES = ["🐶","🐾","🦴","🐕","🐩","🦮"]
  const face  = FACES[Math.min(5, Math.floor(score / 4))]
  const speed = Math.min(10, 1 + Math.floor(score / 4))

  return (
    <div className="game-inner">
      <div className="game-top-bar">
        <span className="game-title">🐶 Catch Tony!</span>
        <button className="game-back-btn" onClick={onClose}>← Back</button>
      </div>
      <div className="catchdog-stats">
        <span>🎯 {score}</span>
        <span>❌ {misses}/5</span>
        <span className="best-score">🏆 {best}</span>
      </div>
      {!running && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"10px 0"}}>
          {score > 0 && <div className="game-win-banner">{score >= best && score > 0 ? `🏆 New Best: ${score}!` : `Score: ${score} 🐾`}</div>}
          <button className="game-restart-btn big" onClick={startGame}>
            {score > 0 ? "↺ Play Again" : "▶ Start"}
          </button>
        </div>
      )}
      <div className="catchdog-grid">
        {Array(9).fill(0).map((_, i) => (
          <div
            key={i}
            className="catchdog-hole"
            onClick={(e) => handleHoleClick(e, i)}
          >
            <div className={`catchdog-mound ${active === i ? "up" : ""}`}>
              {active === i && (
                <span
                  className="catchdog-dog"
                  style={{pointerEvents:"none"}}  // ← children never fire click
                >
                  {face}
                </span>
              )}
            </div>
            <div className="catchdog-dirt" style={{pointerEvents:"none"}}/>
          </div>
        ))}
      </div>
      {running && <p className="game-hint">Speed {speed}/10 🔥 — Tap Tony!</p>}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  LUDO  — proper working board
// ═══════════════════════════════════════════════════════════════

// 52-cell clockwise path on a 15×15 grid
// Red enters at LP[0], Blue enters at LP[26]
const LP = (() => {
  const p = []
  for (let c = 1; c <= 5; c++)  p.push([6, c])       // 0-4   left arm →
  for (let r = 5; r >= 0; r--) p.push([r, 6])        // 5-10  top-arm left col ↑
  p.push([0,7])                                        // 11
  p.push([0,8])                                        // 12
  for (let r = 1; r <= 5; r++)  p.push([r, 8])       // 13-17 top-arm right col ↓
  for (let c = 9; c <= 13; c++) p.push([6, c])       // 18-22 right arm →
  p.push([7,13], [8,13])                               // 23-24
  for (let c = 12; c >= 9; c--) p.push([8, c])      // 25-28 right arm left row ←
  for (let r = 9; r <= 13; r++) p.push([r, 8])      // 29-33 bottom-arm right col ↓
  p.push([14,8],[14,7],[14,6])                         // 34-36
  for (let r = 13; r >= 9; r--) p.push([r, 6])      // 37-41 bottom-arm left col ↑
  for (let c = 5; c >= 1; c--) p.push([8, c])       // 42-46 left arm bottom row ←
  p.push([7,1])                                        // 47
  // last 4: loop back (col 0 approach — no home-stretch conflict)
  p.push([7,0],[8,0],[9,0],[10,0])                     // 48-51
  return p
})()

// Home stretches (pieces travel here after lap — toward center [7,7])
// Red:  row 7, cols 2→6
// Blue: row 7, cols 12→8
const HS = {
  red:  [[7,2],[7,3],[7,4],[7,5],[7,6]],   // hs[0..4], hs[4] = done-zone
  blue: [[7,12],[7,11],[7,10],[7,9],[7,8]], // hs[0..4]
}
const ENTRY = { red:0, blue:26 }
const SAFE_SET = new Set([0,8,13,21,26,34,39,47])

// path lookup for rendering: "r,c" → idx
const PM = {}
LP.forEach(([r,c],i) => { PM[`${r},${c}`] = i })

// which col is which home-stretch
const HS_MAP = {}
HS.red.forEach(([r,c],i)  => { HS_MAP[`${r},${c}`] = {color:"red",  step:i} })
HS.blue.forEach(([r,c],i) => { HS_MAP[`${r},${c}`] = {color:"blue", step:i} })

// coloring of home zones (6×6 corners)
function zoneColor(r,c){
  if(r<=5 && c<=5)  return "red"
  if(r<=5 && c>=9)  return "blue"
  if(r>=9 && c<=5)  return "green"
  if(r>=9 && c>=9)  return "yellow"
  return null
}

// Get board [row,col] for a piece
function pieceCell(color, pos){
  if(pos < 0)  return null    // still in home base
  if(pos >= 52){              // in home stretch
    const step = pos - 52
    return HS[color][step] ?? null
  }
  const abs = (pos + ENTRY[color]) % 52
  return LP[abs]
}

const PC = { red:"#ff4466", blue:"#4488ff" }

function DieFace({n}){
  const lay = {
    1:[[50,50]],
    2:[[25,25],[75,75]],
    3:[[25,25],[50,50],[75,75]],
    4:[[25,25],[75,25],[25,75],[75,75]],
    5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
    6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
  }
  return (
    <div style={{width:"100%",height:"100%",position:"relative"}}>
      {(lay[n]||[]).map(([x,y],i)=>(
        <div key={i} style={{position:"absolute",width:7,height:7,borderRadius:"50%",
          background:"#00ffff",boxShadow:"0 0 5px rgba(0,255,255,0.9)",
          left:`${x}%`,top:`${y}%`,transform:"translate(-50%,-50%)"}}/>
      ))}
    </div>
  )
}

function Ludo({ onClose }){
  const init = () => ({ red:[-1,-1,-1,-1], blue:[-1,-1,-1,-1] })
  const [pieces,  setPieces]  = useState(init)
  const [turn,    setTurn]    = useState(0)       // 0=red 1=blue
  const [dice,    setDice]    = useState(null)
  const [rolled,  setRolled]  = useState(false)
  const [winner,  setWinner]  = useState(null)
  const [rolling, setRolling] = useState(false)
  const [flash,   setFlash]   = useState("")

  const color = turn===0?"red":"blue"
  const opp   = turn===0?"blue":"red"
  const diceRef = useRef(null)   // avoid stale closure

  const rollDie = () => {
    if(rolled||winner||rolling) return
    setRolling(true)
    let n=0, last=1
    const iv = setInterval(()=>{
      last = Math.ceil(Math.random()*6)
      setDice(last); n++
      if(n>9){
        clearInterval(iv)
        diceRef.current = last
        setDice(last); setRolled(true); setRolling(false)
      }
    },75)
  }

  // Can this piece move with current dice?
  const canMove = (pos) => {
    const d = diceRef.current
    if(!d) return false
    if(pos===-1)  return d===6
    if(pos>=52){
      const step = pos-52
      return step+d <= 4    // can reach home (step 4 = done)
    }
    return true
  }

  const doMove = (idx) => {
    const d = diceRef.current
    if(!rolled||!d||winner) return
    const pos = pieces[color][idx]
    if(!canMove(pos)) return

    const np = {red:[...pieces.red], blue:[...pieces.blue]}
    let newPos

    if(pos===-1){
      newPos = 0
    } else if(pos>=52){
      newPos = pos+d
      if(newPos>56) return
    } else {
      newPos = pos+d
      if(newPos>=52){
        const extra = newPos-52
        if(extra>4) return
        newPos = 52+extra
      }
    }

    np[color][idx] = newPos

    // capture on main track
    if(newPos<52 && newPos>=0){
      const absNew = (newPos + ENTRY[color]) % 52
      if(!SAFE_SET.has(absNew)){
        np[opp] = np[opp].map(p => {
          if(p<0||p>=52) return p
          const absOpp = (p + ENTRY[opp]) % 52
          if(absOpp===absNew){ setFlash("💥 Captured!"); setTimeout(()=>setFlash(""),1200); return -1 }
          return p
        })
      }
    }

    setPieces(np)
    if(np[color].every(p=>p>=56)){ setWinner(color); return }
    if(d!==6) setTurn(t=>1-t)
    diceRef.current = null
    setRolled(false); setDice(null)
  }

  // build cell→pieces map
  const cellMap = {}
  Object.entries(pieces).forEach(([col,arr])=>{
    arr.forEach((pos,i)=>{
      const cell = pieceCell(col, pos)
      if(!cell) return
      const k = `${cell[0]},${cell[1]}`
      if(!cellMap[k]) cellMap[k]=[]
      cellMap[k].push({color:col, idx:i})
    })
  })

  const CSIZE = 18   // cell px

  const renderCell = (r,c) => {
    const zone  = zoneColor(r,c)
    const pIdx  = PM[`${r},${c}`]
    const hsInfo= HS_MAP[`${r},${c}`]
    const isPath = pIdx !== undefined
    const isSafe = isPath && SAFE_SET.has(pIdx)
    const isCenter = r===7&&c===7
    const onCell = cellMap[`${r},${c}`]||[]
    const myPiece = onCell.find(p=>p.color===color)
    const clickable = myPiece && rolled && canMove(pieces[color][myPiece.idx])

    let bg="#07081a"
    if(zone==="red")    bg="rgba(255,40,80,0.18)"
    if(zone==="blue")   bg="rgba(40,100,255,0.18)"
    if(zone==="green")  bg="rgba(40,200,100,0.08)"
    if(zone==="yellow") bg="rgba(255,200,0,0.08)"
    if(isPath)          bg="rgba(255,255,255,0.07)"
    if(isSafe)          bg="rgba(255,255,255,0.18)"
    if(hsInfo?.color==="red")  bg="rgba(255,40,80,0.25)"
    if(hsInfo?.color==="blue") bg="rgba(40,100,255,0.25)"
    if(pIdx===0)        bg="rgba(255,40,80,0.5)"    // Red entry
    if(pIdx===26)       bg="rgba(40,100,255,0.5)"   // Blue entry
    if(isCenter)        bg="rgba(255,200,0,0.25)"

    return (
      <div
        key={`${r},${c}`}
        onClick={() => { if(myPiece && rolled) doMove(myPiece.idx) }}
        style={{
          width:CSIZE, height:CSIZE,
          background:bg,
          border: (isPath||hsInfo||isCenter)
            ? `1px solid rgba(0,255,255,0.14)`
            : `1px solid rgba(255,255,255,0.02)`,
          borderRadius: (isSafe||pIdx===0||pIdx===26||isCenter) ? "50%" : 2,
          position:"relative",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor: clickable?"pointer":"default",
          boxShadow: clickable ? `0 0 8px ${PC[color]}` : "none",
          transition:"box-shadow 0.15s",
        }}
      >
        {isCenter && <span style={{fontSize:10,lineHeight:1}}>⭐</span>}
        {isSafe && !onCell.length && !isCenter &&
          <span style={{fontSize:7,opacity:0.6,lineHeight:1}}>★</span>}
        {pIdx===0  && !onCell.length && <span style={{fontSize:6,color:PC.red}}>▶</span>}
        {pIdx===26 && !onCell.length && <span style={{fontSize:6,color:PC.blue}}>▶</span>}

        {onCell.map((p,pi)=>(
          <div key={pi} style={{
            position:"absolute",
            width:  onCell.length>1?8:12,
            height: onCell.length>1?8:12,
            borderRadius:"50%",
            background:`radial-gradient(circle at 35% 35%, ${p.color==="red"?"#ff7799,#cc1133":"#88aaff,#1144cc"})`,
            border:`1.5px solid ${PC[p.color]}`,
            boxShadow: (p.color===color&&rolled&&canMove(pieces[p.color][p.idx]))
              ? `0 0 8px ${PC[p.color]}` : "none",
            top:  onCell.length>1?(pi<2?"2px":"9px"):"50%",
            left: onCell.length>1?(pi%2===0?"2px":"9px"):"50%",
            transform: onCell.length===1?"translate(-50%,-50%)":"none",
            animation: (p.color===color&&rolled&&canMove(pieces[p.color][p.idx]))
              ?"token-pulse 0.7s ease-in-out infinite alternate":"none",
            zIndex:2,
          }}/>
        ))}
      </div>
    )
  }

  const homePieces = (col) => pieces[col].filter(p=>p===-1)
  const donePieces = (col) => pieces[col].filter(p=>p>=56).length

  return (
    <div className="game-inner ludo-inner">
      <div className="game-top-bar">
        <span className="game-title">🎲 Ludo</span>
        <button className="game-back-btn" onClick={onClose}>← Back</button>
      </div>

      {winner && <div className="game-win-banner">🏆 {winner.toUpperCase()} wins!</div>}
      {flash   && <div className="game-win-banner" style={{background:"rgba(255,100,0,0.15)",borderColor:"rgba(255,100,0,0.4)",color:"#ff8844"}}>{flash}</div>}

      {/* Turn + score */}
      <div className="ludo-status-row">
        <div className="ludo-turn-pill" style={{background:color==="red"?"rgba(255,40,80,0.15)":"rgba(40,100,255,0.15)",borderColor:PC[color],color:PC[color]}}>
          {winner?`🏆 ${winner}`:`${color.toUpperCase()}'S TURN`}
        </div>
        <span style={{fontSize:11,color:"#aaa"}}>
          🔴 {donePieces("red")}/4 &nbsp; 🔵 {donePieces("blue")}/4
        </span>
      </div>

      {/* Board */}
      <div style={{
        display:"grid",
        gridTemplateColumns:`repeat(15,${CSIZE}px)`,
        gridTemplateRows:`repeat(15,${CSIZE}px)`,
        gap:1,
        background:"rgba(0,255,255,0.06)",
        border:"1.5px solid rgba(0,255,255,0.2)",
        borderRadius:8,
        overflow:"hidden",
        flexShrink:0,
      }}>
        {Array.from({length:15},(_,r) =>
          Array.from({length:15},(_,c) => renderCell(r,c))
        )}
      </div>

      {/* Home bases */}
      <div className="ludo-bases-row">
        {["red","blue"].map(col=>(
          <div key={col} className="ludo-base-mini"
            style={{borderColor:col==="red"?"rgba(255,40,80,0.4)":"rgba(40,100,255,0.4)",
                    background:col==="red"?"rgba(255,40,80,0.07)":"rgba(40,100,255,0.07)"}}>
            <span style={{fontSize:10,fontWeight:800,color:PC[col]}}>
              {col.toUpperCase()} BASE
            </span>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
              {homePieces(col).map((_,i)=>{
                const realIdx = pieces[col].indexOf(-1, i===0?0:pieces[col].indexOf(-1,0)+1)
                // find the i-th -1 in pieces[col]
                let cnt=-1, ri=-1
                for(let j=0;j<4;j++){ if(pieces[col][j]===-1){ cnt++; if(cnt===i){ri=j;break} } }
                const pulsing = col===color && rolled && diceRef.current===6
                return (
                  <div key={i}
                    onClick={(e)=>{ e.stopPropagation(); if(col===color&&rolled&&diceRef.current===6) doMove(ri) }}
                    style={{
                      width:20,height:20,borderRadius:"50%",
                      background:`radial-gradient(circle at 35% 35%,${col==="red"?"#ff7799,#cc1133":"#88aaff,#1144cc"})`,
                      border:`2px solid ${PC[col]}`,
                      cursor:pulsing?"pointer":"default",
                      animation:pulsing?"token-pulse 0.6s ease-in-out infinite alternate":"none",
                      boxShadow:pulsing?`0 0 12px ${PC[col]}`:"none",
                      transition:"box-shadow 0.2s",
                    }}
                  />
                )
              })}
              {Array.from({length:donePieces(col)}).map((_,i)=>(
                <div key={`d${i}`} style={{width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✅</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dice + hint */}
      <div className="ludo-controls">
        <div
          className={`ludo-die-big ${rolling?"rolling":""} ${rolled&&!rolling?"rolled":""}`}
          onClick={rollDie}
        >
          {dice ? <DieFace n={dice}/> : <span className="die-roll-hint">🎲</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <p className="ludo-hint">
            {!rolled&&!rolling?"Tap 🎲 to roll"
             :rolling?"Rolling…"
             :diceRef.current===6&&homePieces(color).length?"⭐ Got 6! Tap base piece"
             :"Tap a glowing 🔴/🔵 piece"}
          </p>
        </div>
      </div>

      <button className="game-restart-btn" onClick={()=>{
        setPieces(init());setTurn(0);setDice(null);setRolled(false)
        setWinner(null);setRolling(false);setFlash("");diceRef.current=null
      }}>↺ New Game</button>
    </div>
  )
}


const GAME_LIST = [
  { id:"sudoku",   icon:"🔢", name:"Sudoku",      desc:"Fill the grid" },
  { id:"checkers", icon:"🔴", name:"Checkers",    desc:"vs AI"         },
  { id:"chess",    icon:"♟",  name:"Chess",       desc:"vs AI"         },
  { id:"catchdog", icon:"🐶", name:"Catch Tony!", desc:"Tap the dog"   },
  { id:"ludo",     icon:"🎲", name:"Ludo",        desc:"2-player dice" },
]

export default function GameHub({ onClose }) {
  const [active, setActive] = useState(null)

  if (active==="sudoku")   return <div className="game-hub"><Sudoku   onClose={()=>setActive(null)}/></div>
  if (active==="checkers") return <div className="game-hub"><Checkers onClose={()=>setActive(null)}/></div>
  if (active==="chess")    return <div className="game-hub"><Chess    onClose={()=>setActive(null)}/></div>
  if (active==="catchdog") return <div className="game-hub"><CatchDog onClose={()=>setActive(null)}/></div>
  if (active==="ludo")     return <div className="game-hub"><Ludo     onClose={()=>setActive(null)}/></div>

  return (
    <div className="game-hub">
      <div className="game-hub-header">
        <span className="game-hub-title">🎮 Mini Games</span>
        <span className="game-hub-sub">Play while AI thinks…</span>
        <button className="game-close-hub" onClick={onClose}>✕</button>
      </div>
      <div className="game-hub-grid">
        {GAME_LIST.map(g=>(
          <button key={g.id} className="game-card" onClick={()=>setActive(g.id)}>
            <span className="game-card-icon">{g.icon}</span>
            <span className="game-card-name">{g.name}</span>
            <span className="game-card-desc">{g.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
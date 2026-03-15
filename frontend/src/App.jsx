import { useState } from "react"

export default function App() {

  const [topic,setTopic] = useState("")
  const [research,setResearch] = useState("")
  const [scrapeUrl,setScrapeUrl] = useState("")
  const [scrapeResult,setScrapeResult] = useState("")

  const runResearch = async () => {

    const res = await fetch(
      `http://127.0.0.1:8000/research?topic=${topic}`
    )

    const data = await res.json()

    setResearch(data.research)
  }

  const runScraper = async () => {

    const res = await fetch(
      `http://127.0.0.1:8000/scrape?url=${scrapeUrl}`
    )

    const data = await res.json()

    setScrapeResult(JSON.stringify(data,null,2))
  }

  return (

    <div style={{padding:"40px",fontFamily:"Arial"}}>

      <h1>AI Automation Dashboard</h1>

      <hr/>

      <h2>AI Research Agent</h2>

      <input
        placeholder="Enter research topic"
        onChange={(e)=>setTopic(e.target.value)}
      />

      <button onClick={runResearch}>
        Research
      </button>

      <p>{research}</p>

      <hr/>

      <h2>Web Scraper</h2>

      <input
        placeholder="Enter website URL"
        onChange={(e)=>setScrapeUrl(e.target.value)}
      />

      <button onClick={runScraper}>
        Scrape
      </button>

      <pre>{scrapeResult}</pre>

    </div>
  )
}
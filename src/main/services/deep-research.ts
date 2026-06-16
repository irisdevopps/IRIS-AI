import { BrowserWindow, safeStorage, app } from 'electron'
import { tavily } from '@tavily/core'
import Groq from 'groq-sdk'
import fsSync from 'fs'
import path from 'path'

function emitProgress(payload: { status: string; file: string; totalFound: number }) {
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    win.webContents.send('oracle-progress', payload)
  }
}

export async function executeDeepResearch({
  query,
  groqKey
}: {
  query: string
  tavilyKey: string
  groqKey: string
}) {
  try {
    let tavilyKey = ''
    const secureConfigPath = path.join(app.getPath('userData'), 'iris_secure_vault.json')

    if (fsSync.existsSync(secureConfigPath)) {
      try {
        const data = JSON.parse(fsSync.readFileSync(secureConfigPath, 'utf8'))
        if (safeStorage.isEncryptionAvailable()) {
          tavilyKey = safeStorage.decryptString(Buffer.from(data.tavily, 'base64'))
        } else {
          tavilyKey = Buffer.from(data.tavily, 'base64').toString('utf8')
        }
      } catch (e) {}
    }

    if (!tavilyKey || !groqKey) {
      throw new Error('Missing API Keys. Please configure Tavily and Groq in the Command Center.')
    }

    emitProgress({
      status: 'scanning',
      file: 'IRIS and Tavily Neural Search Active...',
      totalFound: 1
    })

    const tvly = tavily({ apiKey: tavilyKey })
    const tavilyData = await tvly.search(query, {
      searchDepth: 'advanced',
      includeAnswer: true,
      maxResults: 5
    })

    const rawContext = tavilyData.results
      .map((r: any) => `Source: ${r.url}\nContent: ${r.content}`)
      .join('\n\n')

    emitProgress({
      status: 'reading',
      file: 'Llama 3.1 Instantly Synthesizing Data...',
      totalFound: 2
    })

    const groq = new Groq({ apiKey: groqKey })
    const prompt = `
      You are an elite research analyst. Answer: "${query}".
      Output ONLY a JSON object with a key "summary" containing a detailed, well-formatted markdown summary of your findings.
      Context: ${rawContext}
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    })

    const jsonString =
      chatCompletion.choices[0]?.message?.content || '{"summary": "No data generated."}'
    const parsedData = JSON.parse(jsonString)
    const extractedSummary = parsedData.summary || 'No data generated.'

    emitProgress({
      status: 'embedded',
      file: 'Research synthesis complete...',
      totalFound: 3
    })

    return { success: true, summary: extractedSummary }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

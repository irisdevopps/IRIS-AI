import fs from 'fs'
import path from 'path'
import { app, BrowserWindow } from 'electron'
import { exec } from 'child_process'
import { GoogleGenAI } from '@google/genai'

// --- Internal Helpers ---

// Safely resolve the path at runtime and ensure the directory exists
function getProjectsDir(): string {
  const projectsDir = path.resolve(app.getPath('userData'), 'Projects')
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true })
  }
  return projectsDir
}

// Route the streaming chunks directly to the frontend terminal/UI
function emitCodeChunk(chunk: string) {
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    win.webContents.send('live-code-chunk', chunk)
  }
}

// --- Exported Direct Functions ---

export async function startLiveCoding({
  prompt,
  filename,
  geminiKey
}: {
  prompt: string
  filename: string
  geminiKey: string
}) {
  try {
    const projectsDir = getProjectsDir()
    const filePath = path.join(projectsDir, filename)

    // Write the initial connection log
    fs.writeFileSync(filePath, '// Boss, connection established. Waiting for AI stream...\n')

    if (!geminiKey || geminiKey.trim() === '') {
      throw new Error('Missing Gemini API Key. Please configure it in the Command Center Vault.')
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey })

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `You are an elite developer. Write the code for: "${prompt}". Output ONLY the raw code for the file ${filename}. Do NOT wrap it in markdown blockquotes.`
    })

    let fullCode = ''

    // Stream the chunks back to the UI in real-time
    for await (const chunk of response) {
      if (chunk.text) {
        fullCode += chunk.text
        emitCodeChunk(chunk.text)
      }
    }

    // Save the finalized file to disk
    fs.writeFileSync(filePath, fullCode)
    return { success: true, filePath }
  } catch (err) {
    emitCodeChunk(`\n\n❌ [SYSTEM FAILURE]: ${String(err)}`)
    return { success: false, error: String(err) }
  }
}

export async function openInVsCode(filePath: string) {
  try {
    // Execute the command natively to pop open the editor
    exec(`code "${filePath}"`)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

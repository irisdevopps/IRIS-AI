import { startTunnel } from 'untun'

// Maintain the active tunnel state at the module level
let activeTunnel: any = null

// Exported directly to open a local port to the internet
export async function openWormhole(port: number) {
  try {
    // Prevent overlapping tunnels by closing any existing one first
    if (activeTunnel) {
      await activeTunnel.close()
      activeTunnel = null
    }

    activeTunnel = await startTunnel({
      port,
      acceptCloudflareNotice: true
    })

    const tunnelUrl = await activeTunnel.getURL()

    return {
      success: true,
      url: tunnelUrl,
      password: null
    }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// Exported directly to close the active tunnel safely
export async function closeWormhole() {
  try {
    if (activeTunnel) {
      await activeTunnel.close()
      activeTunnel = null
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

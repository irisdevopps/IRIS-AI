import { exec } from 'child_process'
import os from 'os'

const runPowerShell = (cmd: string): Promise<string> => {
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, (error, stdout) => {
      if (error) {
        return resolve('')
      }
      resolve(stdout ? stdout.trim() : '')
    })
  })
}

export async function getLiveLocation() {
  try {
    if (os.platform() === 'win32') {
      const psCommand = `Add-Type -AssemblyName System.Device; $w = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High); $w.Start(); $t = 0; while($w.Position.Location.IsUnknown -and $t -lt 20) { Start-Sleep -Milliseconds 250; $t++ }; if(!$w.Position.Location.IsUnknown) { Write-Output "$($w.Position.Location.Latitude),$($w.Position.Location.Longitude)" }`

      const osLocation = await runPowerShell(psCommand)

      if (osLocation && osLocation.includes(',')) {
        const [lat, lon] = osLocation.split(',')

        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          { headers: { 'User-Agent': 'IRIS-X-Desktop-Application-v1' } }
        )
        const geoData = await geoRes.json()

        return {
          city: geoData.city || geoData.locality,
          region: geoData.principalSubdivision,
          country: geoData.countryName,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          fullString: `${geoData.city || geoData.locality}, ${geoData.principalSubdivision}, ${geoData.countryName}`
        }
      }
    }

    try {
      const ipapiRes = await fetch('https://ipapi.co/json/', {
        headers: { 'User-Agent': 'IRIS-X-Desktop-Application-v1' }
      })
      const ipapiData = await ipapiRes.json()

      if (ipapiData && ipapiData.city) {
        return {
          city: ipapiData.city,
          region: ipapiData.region,
          country: ipapiData.country_name,
          lat: ipapiData.latitude,
          lon: ipapiData.longitude,
          timezone: ipapiData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          fullString: `${ipapiData.city}, ${ipapiData.region}, ${ipapiData.country_name}`
        }
      }
    } catch (e) {
    }

    const ipinfoRes = await fetch('https://ipinfo.io/json', {
      headers: { 'User-Agent': 'IRIS-X-Desktop-Application-v1' }
    })
    const ipinfoData = await ipinfoRes.json()

    if (ipinfoData && ipinfoData.loc) {
      const [lat, lon] = ipinfoData.loc.split(',')
      return {
        city: ipinfoData.city,
        region: ipinfoData.region,
        country: ipinfoData.country,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        timezone: ipinfoData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        fullString: `${ipinfoData.city}, ${ipinfoData.region}, ${ipinfoData.country}`
      }
    }

    return null
  } catch (error: any) {
    console.error('[LocationManager] System failed to fetch live location:', error)
    return null
  }
}

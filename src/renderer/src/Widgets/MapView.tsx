import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { RiMapPin2Fill, RiCloseLine, RiRouteFill, RiTimeLine } from 'react-icons/ri'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// Setup Default Leaflet Icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center as L.LatLngTuple, 13, { duration: 2 })
  }, [center, map])
  return null
}

export default function LeafletMapWidget() {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<LatLngExpression>([51.505, -0.09])
  const [locationName, setLocationName] = useState<any>('Standby')

  const [isRouteMode, setIsRouteMode] = useState(false)
  const [routeData, setRouteData] = useState<any>(null)

  useEffect(() => {
    if (!window.electron?.ipcRenderer) return

    const handleMapUpdate = (_event: any, data: any) => {
      const { lat, lng, name } = data
      if (lat && lng) {
        setIsRouteMode(false)
        setPosition([lat, lng])
        setLocationName(name)
        setIsVisible(true)
      }
    }

    const handleMapRoute = (_event: any, data: any) => {
      setIsRouteMode(true)
      setRouteData(data)
      setPosition(data.start)
      setIsVisible(true)
    }

    // Listen to the IPC channels sent from the backend
    window.electron.ipcRenderer.on('map-update', handleMapUpdate)
    window.electron.ipcRenderer.on('map-route', handleMapRoute)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('map-update')
      window.electron.ipcRenderer.removeAllListeners('map-route')
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-xl p-8 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full max-w-6xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* ── TOP HUD BAR ── */}
            <div className="absolute top-6 left-6 right-6 z-1000 flex justify-between items-start pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl pointer-events-auto shadow-xl flex items-center gap-4">
                {isRouteMode && routeData ? (
                  <>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <RiRouteFill size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-white font-bold text-sm tracking-wide">
                        {routeData.info.origin} <span className="text-zinc-500 mx-2">→</span>{' '}
                        {routeData.info.destination}
                      </h2>
                      <div className="flex items-center gap-3 text-xs font-mono mt-1">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <RiMapPin2Fill size={12} /> {routeData.info.distance}
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <RiTimeLine size={12} /> {routeData.info.duration}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <RiMapPin2Fill size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                        Target Location
                      </span>
                      <h2 className="text-white font-bold text-base tracking-wide">
                        {locationName}
                      </h2>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsVisible(false)}
                className="bg-black/80 backdrop-blur-md border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 p-3 rounded-2xl pointer-events-auto transition-all shadow-xl"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* ── MAP CONTAINER ── */}
            <div className="flex-1 w-full bg-[#050505]">
              <MapContainer
                {...({ center: position, zoom: isRouteMode ? 6 : 13 } as any)}
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                zoomControl={false} // Clean UI, you can scroll to zoom
              >
                {/* Premium Dark Mode Map Tiles */}
                <TileLayer
                  {...({
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  } as any)}
                />

                {!isRouteMode && (
                  <Marker position={position}>
                    <Popup>{locationName}</Popup>
                  </Marker>
                )}

                {isRouteMode && routeData && (
                  <>
                    <Marker position={routeData.start}>
                      <Popup>Origin: {routeData.info.origin}</Popup>
                    </Marker>
                    <Marker position={routeData.end}>
                      <Popup>Destination: {routeData.info.destination}</Popup>
                    </Marker>

                    {/* Glowing Emerald Route Path */}
                    <Polyline
                      positions={routeData.path}
                      pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8, lineCap: 'round' }}
                    />

                    <MapUpdater center={routeData.start} />
                  </>
                )}

                {!isRouteMode && <MapUpdater center={position} />}
              </MapContainer>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

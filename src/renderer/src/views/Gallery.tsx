import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RiImage2Line,
  RiDeleteBinLine,
  RiFolderOpenLine,
  RiCloseLine,
  RiMagicLine,
  RiFileWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDownloadLine,
  RiVideoLine,
  RiPlayCircleLine,
  RiSearchEyeLine
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'

interface GalleryAsset {
  filename: string
  displayName: string
  path: string
  url: string
  createdAt: Date
  type: 'image' | 'video'
}

const GalleryView = () => {
  const [allAssets, setAllAssets] = useState<GalleryAsset[]>([])
  const [visibleAssets, setVisibleAssets] = useState<GalleryAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<GalleryAsset | null>(null)

  const [direction, setDirection] = useState(0)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 12
  const observer = useRef<IntersectionObserver | null>(null)

  const lastAssetRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleAssets.length < allAssets.length) {
          setPage((prev) => prev + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [visibleAssets.length, allAssets.length]
  )

  const fetchGallery = async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('get-gallery')
      if (Array.isArray(data)) {
        // Map types based on extension and SORT by newest first (descending)
        const typedData = data
          .map((item: any) => ({
            ...item,
            type: item.filename.toLowerCase().endsWith('.mp4') ? 'video' : 'image'
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setAllAssets(typedData)
      }
    } catch (e) {
      console.error('Failed to fetch visual vault artifacts.', e)
    }
  }

  useEffect(() => {
    fetchGallery()
    const interval = setInterval(fetchGallery, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const endIndex = page * ITEMS_PER_PAGE
    setVisibleAssets(allAssets.slice(0, endIndex))
  }, [page, allAssets])

  const deleteAsset = async (filename: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await window.electron.ipcRenderer.invoke('delete-image', filename)

    if (selectedAsset) {
      const currentIndex = allAssets.findIndex((img) => img.filename === selectedAsset.filename)
      const nextAsset = allAssets[currentIndex + 1] || allAssets[currentIndex - 1]
      setSelectedAsset(nextAsset || null)
    }
    fetchGallery()
  }

  const openLocation = async (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await window.electron.ipcRenderer.invoke('open-image-location', path)
  }

  const saveCopy = async (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await window.electron.ipcRenderer.invoke('save-image-external', path)
  }

  const navigateAsset = useCallback(
    (newDirection: number) => {
      if (!selectedAsset || allAssets.length === 0) return
      setDirection(newDirection)
      const currentIndex = allAssets.findIndex((img) => img.filename === selectedAsset.filename)
      if (currentIndex === -1) return
      let newIndex = currentIndex + newDirection
      if (newIndex >= allAssets.length) newIndex = 0
      if (newIndex < 0) newIndex = allAssets.length - 1
      setSelectedAsset(allAssets[newIndex])
    },
    [selectedAsset, allAssets]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAsset) return
      if (e.key === 'ArrowRight') navigateAsset(1)
      if (e.key === 'ArrowLeft') navigateAsset(-1)
      if (e.key === 'Escape') setSelectedAsset(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAsset, navigateAsset])

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 800 : -800,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 800 : -800,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    })
  }

  return (
    <div className="flex-1 bg-neutral-950 h-full p-8 md:p-10 animate-in fade-in duration-500 flex flex-col overflow-hidden selection:bg-emerald-500/30 text-white font-sans">
      {/* Premium Header */}
      <div className="flex items-end justify-between pb-6 border-b border-white/5 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-br from-emerald-500/20 to-teal-500/5 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl animate-pulse" />
            <RiSearchEyeLine className="text-emerald-400 relative z-10" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-[0.25em] text-white uppercase flex items-center gap-2">
              Visual Vault{' '}
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono tracking-normal text-emerald-400 border border-white/5">
                V2.0
              </span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-1 tracking-widest uppercase">
              Encrypted Media Storage Node
            </p>
          </div>
        </div>

        <div className="text-xs font-bold tracking-widest text-emerald-400 bg-emerald-950/40 px-4 py-2 rounded-lg border border-emerald-500/20 shadow-sm flex items-center gap-2">
          <RiMagicLine size={14} className="animate-pulse" /> {allAssets.length} ARTIFACTS
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {allAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-5">
            <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 shadow-inner">
              <RiImage2Line size={40} className="opacity-20" />
            </div>
            <p className="text-sm font-bold tracking-[0.3em] opacity-40 uppercase">
              Vault is Empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12 auto-rows-max">
            {visibleAssets.map((asset, index) => {
              const isLast = index === visibleAssets.length - 1
              const isVideo = asset.type === 'video'

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={`${asset.filename}-${index}`}
                  ref={isLast ? lastAssetRef : null}
                  onClick={() => {
                    setDirection(0)
                    setSelectedAsset(asset)
                  }}
                  className="group relative aspect-square md:aspect-4/5 bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] transition-all duration-500 cursor-pointer"
                >
                  {/* Thumbnail Rendering */}
                  {isVideo ? (
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100 grayscale-30 group-hover:grayscale-0"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.displayName}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100 grayscale-30 group-hover:grayscale-0"
                    />
                  )}

                  {/* Error State Fallback */}
                  <div className="hidden absolute inset-0 items-center justify-center flex-col gap-3 bg-neutral-950">
                    <RiFileWarningLine className="text-red-500/40" size={32} />
                    <span className="text-[10px] font-bold tracking-widest text-neutral-500">
                      CORRUPT ARTIFACT
                    </span>
                  </div>

                  {/* Video Indicator Overlay */}
                  {isVideo && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 z-10">
                      <RiVideoLine size={12} className="text-emerald-400" />
                      <span className="text-[9px] font-bold tracking-widest text-white">MP4</span>
                    </div>
                  )}

                  {/* Hover Information Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5 translate-y-4 group-hover:translate-y-0">
                    <div className="mb-4">
                      <p className="text-xs text-white font-black mb-1 tracking-wider capitalize truncate">
                        {asset.displayName}
                      </p>
                      <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest">
                        {new Date(asset.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      <button
                        onClick={(e) => openLocation(asset.path, e)}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-emerald-500 hover:text-black transition-colors backdrop-blur-md"
                        title="Locate File"
                      >
                        <RiFolderOpenLine size={16} />
                      </button>
                      <button
                        onClick={(e) => deleteAsset(asset.filename, e)}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md"
                        title="Purge Artifact"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Center Play Button for Videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                      <RiPlayCircleLine
                        size={48}
                        className="text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform duration-500"
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Immersive Detail Overlay */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(25px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center"
          >
            {/* Top Bar Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-linear-to-b from-black/80 to-transparent">
              <div className="text-left px-5 py-2.5 bg-black/40 backdrop-blur-xl rounded-xl border border-white/5">
                <h3 className="text-lg font-black text-white capitalize tracking-wide flex items-center gap-3">
                  {selectedAsset.type === 'video' ? (
                    <RiVideoLine className="text-emerald-400" />
                  ) : (
                    <RiImage2Line className="text-emerald-400" />
                  )}
                  {selectedAsset.displayName}
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono tracking-widest mt-1">
                  {new Date(selectedAsset.createdAt).toLocaleString()} • {selectedAsset.filename}
                </p>
              </div>

              <button
                onClick={() => setSelectedAsset(null)}
                className="cursor-pointer p-4 bg-white/5 hover:bg-red-500 hover:text-white rounded-full text-neutral-400 transition-all border border-white/10"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Navigation Areas */}
            <div
              className="absolute left-0 top-0 bottom-0 w-32 z-40 flex items-center justify-start pl-8 group cursor-pointer hover:bg-linear-to-r hover:from-black/60 hover:to-transparent transition-colors"
              onClick={() => navigateAsset(-1)}
            >
              <div className="p-5 bg-black/40 group-hover:bg-white text-white group-hover:text-black rounded-full transition-all border border-white/10 transform group-hover:-translate-x-2 backdrop-blur-md">
                <RiArrowLeftSLine size={32} />
              </div>
            </div>

            <div
              className="absolute right-0 top-0 bottom-0 w-32 z-40 flex items-center justify-end pr-8 group cursor-pointer hover:bg-linear-to-l hover:from-black/60 hover:to-transparent transition-colors"
              onClick={() => navigateAsset(1)}
            >
              <div className="p-5 bg-black/40 group-hover:bg-white text-white group-hover:text-black rounded-full transition-all border border-white/10 transform group-hover:translate-x-2 backdrop-blur-md">
                <RiArrowRightSLine size={32} />
              </div>
            </div>

            {/* Main Media Viewer */}
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden pt-12 pb-24 px-32">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={selectedAsset.filename}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  {selectedAsset.type === 'video' ? (
                    <video
                      src={selectedAsset.url}
                      controls
                      autoPlay
                      className="max-w-full max-h-full rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-white/10 outline-none ring-0 bg-black"
                    />
                  ) : (
                    <img
                      src={selectedAsset.url}
                      className="max-w-full max-h-full rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-white/10 object-contain bg-black"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Action Bar */}
            <div className="absolute bottom-8 z-50 flex gap-4 p-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <button
                onClick={(e) => openLocation(selectedAsset.path, e)}
                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl text-xs font-bold tracking-widest transition-all"
              >
                <RiFolderOpenLine size={18} /> LOCATE
              </button>
              <button
                onClick={(e) => saveCopy(selectedAsset.path, e)}
                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-xl text-xs font-bold tracking-widest transition-all border border-emerald-500/20"
              >
                <RiDownloadLine size={18} /> EXPORT
              </button>
              <button
                onClick={(e) => deleteAsset(selectedAsset.filename, e)}
                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold tracking-widest transition-all border border-red-500/20"
              >
                <RiDeleteBinLine size={18} /> PURGE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GalleryView

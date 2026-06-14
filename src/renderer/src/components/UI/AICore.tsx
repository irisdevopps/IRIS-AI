import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const DualSphere = ({ isConnected, isSpeaking }: { isConnected: boolean; isSpeaking: boolean }) => {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  const timeRef = useRef(0)
  const animState = useRef({ volume: 0 })

  const count = 4000
  const { positions, originalPositions, spreadFactors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const orig = new Float32Array(count * 3)
    const spread = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = Math.random() * 2 - 1

      const vector = new THREE.Vector3(x, y, z)
      vector.normalize().multiplyScalar(1.5)

      pos[i * 3] = vector.x
      pos[i * 3 + 1] = vector.y
      pos[i * 3 + 2] = vector.z

      orig[i * 3] = vector.x
      orig[i * 3 + 1] = vector.y
      orig[i * 3 + 2] = vector.z

      spread[i] = Math.random()
    }
    return { positions: pos, originalPositions: orig, spreadFactors: spread }
  }, [])

  const colorIdle = useMemo(() => new THREE.Color('#00ff41'), [])
  const colorActive = useMemo(() => new THREE.Color('#ffffff'), [])
  const currentColor = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    if (!state) return
    if (!groupRef.current || !pointsRef.current || !innerRef.current) return

    timeRef.current += delta
    const t = timeRef.current

    const targetScale = !isConnected ? 0.5 : isSpeaking ? 0.7 : 0.65
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)

    pointsRef.current.rotation.y += delta * 0.05
    pointsRef.current.rotation.z += delta * 0.05
    innerRef.current.rotation.y -= delta * 0.2

    let simulatedVolume = 0
    if (isSpeaking) {
      const pulse = Math.pow(Math.abs(Math.sin(t * 12) * Math.cos(t * 8)), 2)
      const noise = Math.random() * 0.3
      simulatedVolume = pulse + noise
    } else if (isConnected) {
      simulatedVolume = Math.abs(Math.sin(t * 2)) * 0.05
    }

    animState.current.volume = THREE.MathUtils.lerp(animState.current.volume, simulatedVolume, 0.3)
    const currentVolume = animState.current.volume

    currentColor.lerpColors(colorIdle, colorActive, currentVolume * 1.5)
    ;(pointsRef.current.material as THREE.PointsMaterial).color.copy(currentColor)
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity = isConnected ? 1.02 : 0.4

    const currentPos = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      const expansion = 1 + currentVolume * spreadFactors[i] * 0.5

      currentPos[ix] = originalPositions[ix] * expansion
      currentPos[iy] = originalPositions[iy] * expansion
      currentPos[iz] = originalPositions[iz] * expansion
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.computeBoundingSphere()

    const coreBeat = isSpeaking ? Math.sin(t * 15) * 0.03 : Math.sin(t * 2) * 0.01
    innerRef.current.scale.setScalar(1 + coreBeat)
  })

  const innerColor = isConnected ? '#2b7308' : '#0b1f08'

  return (
    <group ref={groupRef}>
      <mesh ref={innerRef}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshPhysicalMaterial
          color={innerColor}
          metalness={0.9}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={1.0}
        />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          transparent={true}
          opacity={0.9}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export default function AICore({ isConnected = false, isSpeaking = false }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={1.5} color="#00ff41" />
        <DualSphere isConnected={isConnected} isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  )
}

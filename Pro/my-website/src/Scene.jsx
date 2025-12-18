import React, { useRef, useMemo, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { TextureLoader } from "three"

const images = Array.from({ length: 30 }, (_, i) => `/src/assets/${i + 1}.png`)

function FloatingImageSphere() {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)

  const textures = useMemo(
    () => images.map(img => new TextureLoader().load(img)),
    []
  )

  const TARGET_COUNT = 80
  const allTextures = useMemo(() => {
    const repeated = []
    for (let i = 0; i < TARGET_COUNT; i++) {
      repeated.push(textures[i % textures.length])
    }
    return repeated
  }, [textures])

  // sphere positions
  const spheres = useMemo(() => {
    const temp = []
    const baseRadius = 4
    const N = allTextures.length
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    allTextures.forEach((tex, i) => {
      const theta = (2 * Math.PI * i) / goldenRatio
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N)
      const x = baseRadius * Math.sin(phi) * Math.cos(theta)
      const y = baseRadius * Math.sin(phi) * Math.sin(theta)
      const z = baseRadius * Math.cos(phi)
      temp.push({ texture: tex, position: [x, y, z] })
    })
    return temp
  }, [allTextures])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
      groupRef.current.rotation.x += 0.0005
    }
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? [1.4, 1.4, 1.4] : [1, 1, 1]} // enlarge the entire orb
    >
      { spheres.map((s, idx) => {
    const scale = hovered ? 0.5 : 0.8
    const pos = s.position.map(v => (hovered ? v * 1.20 : v))

    return (
      <mesh
        key={idx}
        position={pos}
        scale={[scale, scale, scale]}
        ref={mesh => {
          if (mesh) {
            const normal = new THREE.Vector3(...s.position).normalize()
            const quaternion = new THREE.Quaternion()
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
            mesh.setRotationFromQuaternion(quaternion)
          }
        }}
      >
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial
          map={s.texture}
          transparent
          opacity={1}
          alphaTest={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    )
  })}
    </group>
  )
}


export default function Scene() {
  return (
    <div
      style={{
        position: "absolute",           // so it can sit on top of your screenshot
        top: "50%",                     // vertical center
        left: "50%",                    // horizontal center
        transform: "translate(-50%, -50%)", // 👈 fixed missing comma between values
        width: "75vw",                  // responsive width
        height: "67vh",                 // responsive height
        zIndex: 2,                      // appears above background
        background: "white",
        pointerEvents: "none",          // optional: allows clicking through
        marginTop: "-220px",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        style={{
          width: "100%",
          height: "120%",
          display: "block",
          background: "transparent",
          marginTop: "-55px",
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <FloatingImageSphere />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}

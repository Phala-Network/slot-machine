import * as THREE from "three"
import { useLoader, useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { GLTF } from "three-stdlib"
import { useState, useEffect } from 'react'

import { useAtom } from 'jotai'
import { type ReelStateAtom, countSubject } from '@/atoms'

export const WHEEL_SEGMENT = Math.PI / 4

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.Mesh
    Cylinder_1: THREE.Mesh
  }
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial
    ["Material.002"]: THREE.MeshStandardMaterial
  }
}

type ReelProps = JSX.IntrinsicElements["group"] & {
  stateAtom: ReelStateAtom
}

const Reel = ({ stateAtom, ...props }: ReelProps): JSX.Element => {
  const [{id, spinUntil, infiniteRolling}, setState] = useAtom(stateAtom)

  const { nodes, materials } = useGLTF(`${resource_path}models/reel.glb`) as GLTFResult

  const colorMap = useLoader(THREE.TextureLoader, `${resource_path}images/reel_${id}.png`)

  const [x, setX] = useState(0)
  const [segment, setSegment] = useState(0)

  useEffect(() => {
    if (spinUntil !== undefined) {
      setX(0)
      setSegment(0)
    }
  }, [spinUntil])

  useFrame(() => {
    const rotationSpeed = 0.15

    if (infiniteRolling) {
      const next = x + rotationSpeed
      setX(next)
      setSegment(Math.floor(next / WHEEL_SEGMENT))
    } else if (spinUntil !== undefined) {
      const targetRotationX = Math.ceil((spinUntil - segment) * WHEEL_SEGMENT)
      if (x < targetRotationX) {
        const next = x + rotationSpeed
        setX(next)
        setSegment(Math.floor(next / WHEEL_SEGMENT))
      }
      else if (x >= targetRotationX) {
        setState(prev => ({ ...prev, spinUntil: undefined }))
        countSubject.next({ type: 'count', value: targetRotationX, id })
      }
    }
  })

  return (
    <group
      {...props}
      scale={[10, 10, 10]}
      rotation={[x, 0, 0]}
      dispose={null}
    >
      <group
        rotation={[segment * WHEEL_SEGMENT - 0.2, 0, -Math.PI / 2]}
        scale={[1, 0.29, 1]}
      >
        <mesh castShadow receiveShadow geometry={nodes.Cylinder.geometry}>
          <meshStandardMaterial map={colorMap} />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cylinder_1.geometry}
          material={materials["Material.002"]}
        />
      </group>
    </group>
  )
}


let resource_path = "/"

;(async function () {
  // @ts-ignore
  resource_path = await window.ipcRenderer.getResourcePath() as string
  // useGLTF.preload("/models/reel.glb")
  useGLTF.preload(`${resource_path}models/reel.glb`)
})()

export default Reel

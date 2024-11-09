import * as THREE from "three"
import { useLoader, useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { GLTF } from "three-stdlib"
import { useState, useEffect } from 'react'

import { useAtom } from 'jotai'
import { type ReelStateAtom, countSubject } from '@/atoms'

// Because of we have 8 items per roll
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
  const [targetRotationX, setTarget] = useState(0)

  useEffect(() => {
    if (spinUntil !== undefined) {
      setX(0)
      setTarget((spinUntil - 0) * WHEEL_SEGMENT)
    }
  }, [spinUntil])

  useFrame(() => {
    const rotationSpeed = 0.15

    if (infiniteRolling) {
      setX(x + rotationSpeed)
    } else if (spinUntil !== undefined) {
      if (x < targetRotationX) {
        setX(x + rotationSpeed)
      }
      else if (x >= targetRotationX) {
        setState(prev => ({ ...prev, spinUntil: undefined }))
        setX(targetRotationX)
        countSubject.next({ type: 'count', value: targetRotationX, id })
      }
    }
  })

  return (
    <group
      {...props}
      rotation={[x, 0, -Math.PI / 2]}
      dispose={null}
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

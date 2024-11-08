import { useAtomValue } from 'jotai'
import { Canvas } from "@react-three/fiber"

import { slotMachineAtom, reel1Atom, reel2Atom, reel3Atom } from '../../atoms'
import Reel from "./Reel"

const SlotMachine = () => {
  useAtomValue(slotMachineAtom)
  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 20] }} className="max-w-full max-h-full">
      <color args={["#141417"]} attach="background" />
      <directionalLight position={[-2, 3, 2]} intensity={1} />
      <directionalLight position={[2, 3, 2]} intensity={1} />
      <ambientLight intensity={3} />
      <Reel
        position={[-7, 0, 0]}
        stateAtom={reel1Atom}
      />
      <Reel
        position={[0, 0, 0]}
        stateAtom={reel2Atom}
      />
      <Reel
        position={[7, 0, 0]}
        stateAtom={reel3Atom}
      />
    </Canvas>
  )
}

export default SlotMachine

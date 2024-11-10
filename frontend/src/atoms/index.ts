import { atom, PrimitiveAtom, getDefaultStore } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { ofetch } from 'ofetch'
import { Subject, merge } from 'rxjs'
import { filter, map, scan } from 'rxjs/operators'

import { audioActionAtom, audioInstanceAtom } from './audioAtoms'
export * from './settingsAtoms'

import { settingsAtom } from './settingsAtoms'

export interface ReelState {
  id: number
  spinUntil: number | undefined
  infiniteRolling?: boolean
}

export type ReelStateAtom = PrimitiveAtom<ReelState>

const isWinnerAtom = atom(false)

interface InitEvent {
  type: 'init';
  counter: number;
}

interface CountEvent {
  type: 'count';
  id: number;
  value: number;
}

interface State {
  target: number
  current: number
  result: number[]
}

const initSubject = new Subject<InitEvent>()
export const countSubject = new Subject<CountEvent>()

const initStateUpdates$ = initSubject.pipe(
  map(event => (_: State) => ({
    target: event.counter,
    current: 0,
    result: [],
  }))
)

const countStateUpdates$ = countSubject.pipe(
  map((evt) => (state: State) => {
    const store = getDefaultStore()
    const audioMgr = store.get(audioInstanceAtom)
    audioMgr.sfx.clicker?.play()

    if (evt.id === 0) {
      setTimeout(() => {
        store.set(reel2Atom, { ...store.get(reel2Atom), infiniteRolling: false })
      }, 500)
    } else if (evt.id === 1) {
      setTimeout(() => {
        store.set(reel3Atom, { ...store.get(reel3Atom), infiniteRolling: false })
      }, 500)
    }

    return {
      ...state,
      current: state.current + 1,
      result: [...state.result, evt.value],
    }
  })
)

const state$ = merge(
  initStateUpdates$,
  countStateUpdates$
).pipe(
  scan((state, updateFn) => updateFn(state), {
    target: 0,
    current: 0,
    result: [] as number[],
  })
)

const completion$ = state$.pipe(
  map(state => {
    if (state.current === state.target) {
      return { type: 'finish' as const, ...state }
    }
    return { type: 'count' as const, ...state }
  })
)

completion$.pipe(
  filter(event => event.type === 'finish')
).subscribe(async (state) => {
    await new Promise(r => setTimeout(r, 500))
    const store = getDefaultStore()
    const audioMgr = store.get(audioInstanceAtom)
    if (store.get(isWinnerAtom)) {
      audioMgr.sfx.win?.play()
    }

})

/**
 * The Atom Family of Reel state, which store the spin target and the spin
 * status.
 */
const reelStateFamily = atomFamily((id: number) => {
  return atom<ReelState>(
    {
      id,
      spinUntil: undefined,
    }
  )
})

export const reel1Atom = reelStateFamily(0)
export const reel2Atom = reelStateFamily(1)
export const reel3Atom = reelStateFamily(2)

export const isRunningAtom = atom(false)

type SlotMachineActions =
  { type: 'spinTo', reel1: number, reel2: number, reel3: number } |
  { type: 'remoteSpin' }


export const slotMachineAtom = atom(
  get => {
    const reel1 = get(reel1Atom)
    const reel2 = get(reel2Atom)
    const reel3 = get(reel3Atom)
    return (
      reel1.spinUntil !== undefined &&
      reel2.spinUntil !== undefined &&
      reel3.spinUntil !== undefined
    )
  },
  async (get, set, action: SlotMachineActions) => {
    const reels = [get(reel1Atom), get(reel2Atom), get(reel3Atom)]
    const isRunning = get(isRunningAtom)
    const settings = get(settingsAtom)

    if (action.type === 'spinTo') {
      set(reel1Atom, { ...get(reel1Atom), spinUntil: action.reel1 })
      set(reel2Atom, { ...get(reel2Atom), spinUntil: action.reel2 })
      set(reel3Atom, { ...get(reel3Atom), spinUntil: action.reel3 })
    } else if (action.type === 'remoteSpin') {
      if (!isRunning && reels.every(i => i.spinUntil === undefined)) {
        set(isRunningAtom, true)
        set(audioActionAtom, { type: 'PLAY_SFX', sfxType: 'lever' })

        await new Promise(r => setTimeout(r, 300))

        //
        // begin rolling animation without getting the result
        //
        set(reel1Atom, { ...get(reel1Atom), infiniteRolling: true })
        set(reel2Atom, { ...get(reel2Atom), infiniteRolling: true })
        set(reel3Atom, { ...get(reel3Atom), infiniteRolling: true })

        initSubject.next({ type: 'init', counter: 3 })

        //
        // Local Spin means debug mode and no need for API server.
        //
        if (settings.debug_flag) {
          const [reel1, reel2, reel3] = [getRandomStopSegment(), getRandomStopSegment(), getRandomStopSegment()]
          // Let infinite rolling runs 0.75s
          await new Promise(r => setTimeout(r, 750))
          console.log('spin result', reel1, reel2, reel3)
          set(reel1Atom, { ...get(reel1Atom), spinUntil: reel1, infiniteRolling: false })
          set(reel2Atom, { ...get(reel2Atom), spinUntil: reel2 })
          set(reel3Atom, { ...get(reel3Atom), spinUntil: reel3 })
        } else {
          console.log('begin get result from API')
          try {
            const result = await ofetch(settings.url, { method: 'POST' })
            console.log('slots: ', result.slots, result)
            set(isWinnerAtom, result.is_winner)
            set(reel1Atom, { ...get(reel1Atom), spinUntil: result.slots[0] + 15, infiniteRolling: false })
            set(reel2Atom, { ...get(reel2Atom), spinUntil: result.slots[1] + 15 })
            set(reel3Atom, { ...get(reel3Atom), spinUntil: result.slots[2] + 15 })

            await window.ipcRenderer.invoke('save-quote', result)
            if (settings.upload_quote) {
              const checksum = await window.ipcRenderer.invoke('upload-quote', result)
              if (settings.print_report) {
                await window.ipcRenderer.invoke('print-report', { ...result, checksum })
              }
            }
          } catch (_) {
            // Silent the errors.
          } finally {
            set(isRunningAtom, false)
          }
        }
      } else {
        console.log('running, skip')
      }
    }
  }
)

function getRandomStopSegment(max: number = 7, min: number = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

slotMachineAtom.onMount = (set) => {
  window.ipcRenderer.on('trigger-slot', async () => {
    set({ type: 'remoteSpin' })
  })
}

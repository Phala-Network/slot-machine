import { atom } from 'jotai'
import { z } from 'zod'

export const settingsSchema = z.object({
  url: z.string().url(),
  upload_quote: z.boolean(),
  print_report: z.boolean(),
  debug_flag: z.boolean(),
})

export type Settings = z.infer<typeof settingsSchema>

type SettingsAtomActions =
  | { type: 'UPDATE', data: Settings }
  | { type: 'RELOAD' }

export const settingsAtom = (function() {
  const theAtom = atom<Settings>({
    // export const apiEndpointAtom = atom('https://agents.phala.network/slot_machine/spin')
    // export const apiEndpointAtom = atom('http://127.0.0.1:8000/slot_machine/spin')
    url: 'http://127.0.0.1:8000/slot_machine/spin',
    upload_quote: true,
    print_report: true,
    debug_flag: false,
  })

  theAtom.onMount = (set) => {
    window.ipcRenderer.invoke('load-config').then(config => {
      set(config)
    })
  }

  return atom(
    get => get(theAtom) as Settings & { data_dir: string },
    async (get, set, action: SettingsAtomActions) => {
      if (action.type ==='UPDATE') {
        const updated = { ...get(theAtom), ...action.data }
        set(theAtom, updated)
        window.ipcRenderer.invoke('save-config', updated)
      } else if (action.type === 'RELOAD') {
        const loaded = await window.ipcRenderer.invoke('load-config')
        set(theAtom, loaded)
      }
    }
  )
})();

export const apiEndpointAtom = atom(get => get(settingsAtom).url)

export const uploadQuoteAtom = atom(get => get(settingsAtom).upload_quote) 

export const printReportAtom = atom(get => get(settingsAtom).print_report)

export const debugFlagAtom = atom(get => get(settingsAtom).debug_flag)



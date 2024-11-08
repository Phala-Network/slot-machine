import {
  Outlet,
  RouterProvider,
  Link,
  createHashHistory,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { TfiSettings, TfiAngleLeft } from "react-icons/tfi"

import { Toaster } from "@/components/ui/toaster"
import { SlotMachine } from '@/components/SlotMachine'
import { SettingsForm } from '@/components/Settings'
import { settingsAtom } from '@/atoms'
import { audioActionAtom } from '@/atoms/audioAtoms'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className='h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden'>
        <Outlet />
        <Toaster />
      </div>
    </>
  )
})

const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function () {
    return (
      <>
        <div className="fixed top-0 right-0 z-10 p-4">
          <Link href="/settings" tabIndex={-1} className="bg-white/5 border border-solid border-white/10 p-2 rounded-full flex items-center justify-center">
            <TfiSettings className="text-white/30 h-6 w-6" />
          </Link>
        </div>
        <SlotMachine />
      </>
    )
  }
})

const SettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <main className="bg-[rgb(245,244,239)] flex-1">
      <header className="h-10 p-4 flex flex-row">
        <Link href="/" tabIndex={-1} className="bg-black/30 border border-solid border-white p-2 rounded-full flex items-center justify-center">
          <TfiAngleLeft className="text-white h-6 w-6" />
        </Link>
      </header>
      <div className="p-4">
        <SettingsForm />
      </div>
    </main>
  )
})

const routeTree = rootRoute.addChildren([IndexRoute, SettingsRoute])

const hashHistory = createHashHistory()

const router = createRouter({ routeTree, history: hashHistory })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  useAtomValue(settingsAtom)
  useAtomValue(audioActionAtom)
  return (
    <RouterProvider router={router} />
  )
}

export default App
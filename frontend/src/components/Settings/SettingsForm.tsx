import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAtom } from 'jotai'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Switch } from '@/components/ui/switch'

import { useToast } from "@/hooks/use-toast"
import { settingsAtom, settingsSchema, type Settings } from '@/atoms'

export function SettingsForm() {
  const [settings, saveSettings] = useAtom(settingsAtom)

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  })

  const { toast } = useToast()

  const onSubmit = (data: Settings) => {
    saveSettings({ type: 'UPDATE', data })
    toast({
      title: "Settings Updated.",
      duration: 1500,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-[40rem]">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem className="ml-4">
              <FormLabel>API</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white/90" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="upload_quote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Upload Quote</FormLabel>
                <FormDescription>
                  Upload RA Quote to TEE Attestation Explorer. Turns it off if poor networking condition.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-readonly
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="print_report"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Print Report</FormLabel>
                <FormDescription>
                  Print the TEE report at the end of the spin. You need connect to a printer and set as default printer first.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-readonly
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="debug_flag"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Debug Mode</FormLabel>
                <FormDescription>
                  Run in local totally, no need for API.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-readonly
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="ml-3">Save</Button>
      </form>
      <div className="mx-4 mt-4 text-xs font-mono text-black/80">
        {settings.data_dir}
      </div>
    </Form>
  )
}

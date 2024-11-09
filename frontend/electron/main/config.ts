import path from 'path'
import fs from 'fs'

import { type BrowserWindow, ipcMain } from 'electron'
import TOML from '@iarna/toml'


//
// Check config file exists or not.
//
function get_config_file_path() {
  const exePath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)
  const configDir = path.join(exePath, 'config')
  const configPath = path.join(configDir, 'config.toml')
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  return configPath
}

function read_or_create_config_file<T extends Record<string, any>>(filepath: string, defaults: T): T {
  try {
    if (fs.existsSync(filepath)) {
      return TOML.parse(fs.readFileSync(filepath, 'utf8')) as T
    }
    return defaults
  } catch (_) {
    return defaults 
  }
}

export function setup_config_handler(win: BrowserWindow) {
  const file_path = get_config_file_path()
  console.log('config file path:', file_path)

  let config = read_or_create_config_file(file_path, {
    url: 'https://agents.phala.network/slot_machine/spin',
    upload_quote: true,
    print_report: true,
    debug_flag: false,
  })

  win.webContents.send('config-load', config)

  ipcMain.handle('save-config', async (_, updated) => {
    try {
      config = updated
      const tomlStr = TOML.stringify(updated)
      fs.writeFileSync(file_path, tomlStr, 'utf8')
      console.info('Config file updated.')
    } catch (err) {
      console.error('Save config failed: ', err)
    }
  })

  ipcMain.handle('load-config', () => {
    console.log('load-config invoke')
    return { ...config, data_dir: process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath) }
  })
}

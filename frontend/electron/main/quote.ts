import path from 'path'
import fs from 'fs'

import { type BrowserWindow, ipcMain } from 'electron'
import { ofetch } from 'ofetch'
import { ProxyAgent } from "undici"

function hexToUint8Array(hex: string) {
  hex = hex.trim();
  if (!hex) {
    throw new Error("Invalid hex string");
  }
  if (hex.startsWith("0x")) {
    hex = hex.substring(2);
  }
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error("Invalid hex string");
    }
    array[i / 2] = byte;
  }
  return array;
}

function get_quote_storage_path() {
  const exePath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)
  const dataDir = path.join(exePath, 'data')
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  return dataDir
}

export function setup_quote_handler(_: BrowserWindow) {
  const data_dir = get_quote_storage_path()
  console.log('data folder path:', data_dir)

  ipcMain.handle('save-quote', (_, { quote, checksum }) => {
    const file_path = `${data_dir}/${checksum}.bin`
    const data = hexToUint8Array(quote)
    fs.writeFileSync(file_path, Buffer.from(data))
    console.log(`save-quote ${checksum} ${file_path}`)
  })

  ipcMain.handle('upload-quote', async (_, { quote }) => {
    const data = hexToUint8Array(quote)
    const blob = new Blob([data], { type: "application/octet-stream" })
    const file = new File([blob], "quote.bin", {
      type: "application/octet-stream",
    })
    const formData = new FormData();
    formData.append("file", file);

    const uploadResult = await ofetch(
      `https://agents.phala.network/api/attestations/verify`,
      {
        method: "POST",
        body: formData,
        // dispatcher: new ProxyAgent('http://127.0.0.1:6152')
      },
    )
    console.log('upload result', uploadResult)
    return uploadResult.checksum
  })
}

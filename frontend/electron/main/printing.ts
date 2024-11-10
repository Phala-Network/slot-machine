import fs from 'node:fs'
import handlebars from 'handlebars'
import * as QRCode from 'qrcode'
import { BrowserWindow, ipcMain } from 'electron'

async function generateQRCode(text: string): Promise<string> {
  try {
    const options: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const base64 = await new Promise((resolve, reject) => {
      QRCode.toDataURL(text, options, function(err, url) {
        if (err) {
          reject(err)
        } else {
          resolve(url)
        }
      })
    })
    return base64 as string;
  } catch (err) {
    throw new Error(`Generate QRCode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function setup_printing(win: BrowserWindow) {
  ipcMain.handle('print-report', async (evt, payload) => {
    //
    // Render the HTML page
    //
    const qrcode = await generateQRCode(`https://ra-quote-explorer.vercel.app/reports/${payload.checksum}?lazy=1`)
    const template_path = (process.env.NODE_ENV === 'development') ? 'report.html' : `${process.resourcesPath}/report.html`
    const source = fs.readFileSync(template_path, 'utf-8')
    const template = handlebars.compile(source)
    const fragment = template({ ...payload, qrcode })
    //
    // Print it
    //
    const printWindow = new BrowserWindow({ show: false })
    await printWindow.loadURL(`data:text/html;charset=utf8,${encodeURIComponent(fragment)}`)
    await new Promise((resolve, reject) => {
      printWindow.webContents.print({ silent: true, pageSize: "A4" }, (success, errType) => {
        if (errType) {
          reject(errType)
        } else {
          resolve(success)
        }
      })
    })
    printWindow.close()
    printWindow.destroy()
  })
}

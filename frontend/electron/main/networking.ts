import { type BrowserWindow } from 'electron'

export function setup_networking(win: BrowserWindow) {
  win.webContents.session.webRequest.onHeadersReceived(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      Object.assign(responseHeaders, {
        'access-control-allow-origin': ['*'],
        'access-control-allow-methods': ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'HEAD', 'PATCH'],
        'access-control-allow-headers': ['Content-Type', 'Origin', 'Accept', 'Authorization', 'X-Requested-With'],
        'access-control-allow-credentials': ['true'],
        'access-control-expose-headers': ['*'],
        'access-control-max-age': ['3600']
      });
      callback({ responseHeaders });
    },
  )

  win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      const requestHeaders = { ...details.requestHeaders };
      
      // 处理 Origin
      if (!requestHeaders['Origin']) {
        requestHeaders['Origin'] = 'http://127.0.0.1:8000';
      }

      // OPTIONS 请求特殊处理
      if (details.method === 'OPTIONS') {
        callback({
          requestHeaders,
          // 对于 OPTIONS 请求，我们直接在客户端处理，不发送到服务器
          // 这样可以避免服务器不支持 OPTIONS 的情况
          cancel: false
        });
        return;
      }

      callback({ requestHeaders });
    }
  );
}

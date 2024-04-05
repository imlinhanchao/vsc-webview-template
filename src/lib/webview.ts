import vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export interface IWebviewOptions {
  name: string;
  path: string;
  onMessage?: (message: any) => void;
}

export interface IMessage {
  command: string;
  data: any;
  response?: (data: any) => void;
}

export class WebView {
  webview?: vscode.Webview;
  context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  setWebview(webview: vscode.Webview, options: IWebviewOptions) {
    this.webview = webview;
    this.webview.options = {
			enableScripts: true,
			enableCommandUris: true,
			localResourceRoots: [
				this.context.extensionUri
			]
		}
    this.webview.html = this.getHtml(options);
    if (options.onMessage) {
      this.webview.onDidReceiveMessage((message) => {
        switch(message.command) {
          case 'ready':
            this.response('path', options.path || '/');
            break;
          default:
            if (message.key) {
              message.response = (data: any) => {
                this.response(message.key, data);
              };
            }
            options.onMessage!(message);
            break;
        }
      });
    }
  }

  response(key: string, data: any) {
    this.webview!.postMessage({ command: key, data });
  }

  getHtml(options: IWebviewOptions) {
    // 通过 dev 文件夹是否存在来判断现在是打包模式还是开发模式
    let exists = fs.existsSync(path.resolve(__dirname, '..', '..', 'dev'));
		
    // 获取 index.html 文件路径
    let mainHtml = exists ? 
			path.resolve(__dirname, '..', '..', 'dev', 'index.html') : 
			path.resolve(__dirname, '..', 'webview', 'index.html');

    const root = this.context.extensionPath;
    // 获取 base 路径的 VSCode uri，这样才能载入本地资源
		let baseUrl = vscode.Uri.file(exists ?
			path.join(root, 'dev', '/') :
			path.join(root, 'out', 'webview', '/')
    );

    // 读取到的文件做一些处理，替换 base 路径，添加 CSP （才能正常执行外部的 js）等。
		return fs.readFileSync(mainHtml).toString().replace(/<base href="[^"]*">/, 
			 `<base href="${this.webview!.asWebviewUri(baseUrl)}">`)
			.replace(/<(script|link) /g, '<$1 nonce="vuescript" ')
			.replace(/<head>/, `<head>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
				img-src *; font-src http://* https://*; style-src http://* https://* 'unsafe-inline'; frame-src *;script-src 'nonce-vuescript';">`);
  }
}
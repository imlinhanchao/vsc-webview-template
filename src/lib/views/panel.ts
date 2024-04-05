import vscode from 'vscode';
import { IMessage, WebView } from "../webview";
import { getConfig } from '../utils';

export class PanelProvider extends WebView implements vscode.WebviewViewProvider {
	public static readonly viewType = 'webview-sample.panel';
	private _view?: vscode.WebviewView;

  constructor(context: vscode.ExtensionContext) {
    super(context);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    this.setWebview(webviewView.webview, {
      name: 'webview-panel',
      path: '/panel',
      onMessage: (message) => this.onMessage(message),
    });
  }

  async onMessage (message: IMessage) {
    switch(message.command) {
      case 'fetch':
        const { fetchUrl } = getConfig();
        const content = await fetch(fetchUrl).then(res => res.text());
        message.response?.(content);
        break;
    }
  }
}
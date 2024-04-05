import vscode from 'vscode';
import { IMessage, WebView } from "../webview";
import { getConfig, prompt } from '../utils';

export class SidebarProvider extends WebView implements vscode.WebviewViewProvider {
	public static readonly viewType = 'webview-sample.sidebar';
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
      name: 'webview-sidebar',
      path: '/sidebar',
      onMessage: (message) => this.onMessage(message),
    });
  }

  async onMessage (message: IMessage) {
    switch(message.command) {
      case 'prompt':
        const data = await prompt(message.data.tooltip, message.data.value);
        message.response?.(data);
        break;
    }
  }
}
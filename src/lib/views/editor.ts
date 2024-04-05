import vscode from 'vscode';
import { IMessage, WebView } from "../webview";

export class EditorWebview extends WebView{
  panel?: vscode.WebviewPanel;
  data: IData = { name: '', age: 0 };

  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.panel = vscode.window.createWebviewPanel(
      'webview-editor',
      'Webview Editor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    this.setWebview(this.panel.webview, {
      name: 'webview-editor',
      path: '/',
      onMessage: (message) => this.onMessage(message),
    });
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  onMessage (message: IMessage) {
    switch(message.command) {
      case 'data':
        this.response('data', this.data);
        break;
      case 'save':
        this.data = message.data;
        vscode.window.showInformationMessage('Data saved: ' + JSON.stringify(this.data));
        break;
    }
  }
}
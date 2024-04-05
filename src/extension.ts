// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EditorWebview } from './lib/views/editor';
import { PanelProvider } from './lib/views/panel';
import { SidebarProvider } from './lib/views/sidebar';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	
	context.subscriptions.push(vscode.commands.registerCommand('webview-sample.editorWebview', () => {
		new EditorWebview(context);
	}));

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, new SidebarProvider(context)));

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(PanelProvider.viewType, new PanelProvider(context)));
}

// This method is called when your extension is deactivated
export function deactivate() {}

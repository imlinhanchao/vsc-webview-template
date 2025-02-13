# 如何在 VSCode 扩展中使用 WebView

开发 VSCode 扩展，有时候 VSCode 本身的交互无法满足需要，这时候就可以使用 WebView 来实现自定义的交互。本文将介绍如何在 VSCode 扩展中使用 WebView。VSCode 目前最新版本已经可以在 Editor，SideBar，Panel 中使用 WebView。基本覆盖了 VSCode 的主要 UI 部分。

<!--more-->

## 1. 创建 WebView

在 Editor 和 SideBar / Panel 中创建 WebView 的方法是不同的。在 Editor 中，可以使用 `vscode.window.createWebviewPanel` 方法，而在 SideBar / Panel 中，需要使用 `vscode.window.registerWebviewViewProvider` 方法。

### 1.1 Editor 中创建 WebView

在 `vscode.window.createWebviewPanel` 方法中，有四个参数：

- `viewType`：WebView 的类型，用于区分不同的 WebView。
- `title`：WebView 的标题。
- `viewColumn`：WebView 的位置，可以是 `vscode.ViewColumn` 枚举值。
- `options`：WebView 的配置，可以设置 WebView 的 `enableScripts`，`retainContextWhenHidden` 等属性。

```ts
const panel = vscode.window.createWebviewPanel(
    'webviewSample',
    'WebView 示例',
    vscode.ViewColumn.Beside,
    {
        enableScripts: true, // 是否启用脚本
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))] // 本地资源根目录
    }
);
```

创建后，可以通过 `panel.webview` 获取 WebView 的实例，然后可以通过 `panel.webview.html` 设置 WebView 的内容。

```ts
panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebView 示例</title>
</head>
<body>
    <h1>WebView 示例</h1>
</body>
</html>
`;
```

这样，就可以在 Editor 中创建一个 WebView 了。可以把这部分代码放在一个 Command 中（Command 需要注册与定义），然后通过 Command Palette 执行。

```ts
vscode.commands.registerCommand('webviewSample.show', () => {
    const panel = vscode.window.createWebviewPanel(
        'webviewSample',
        'WebView 示例',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))]
        }
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebView Sample</title>
    </head>
    <body>
        <h1>Hello WebView in Editor</h1>
    </body>
    </html>
    `;
});
```

这样，按下 `Ctrl + Shift + P` 在 Command Palette 中执行 `webviewSample.show` 命令，打开一个 WebView。

### 1.2 SideBar / Panel 中创建 WebView

在 SideBar / Panel 中创建 WebView，则是使用 `vscode.window.registerWebviewViewProvider` 方法。这个方法有两个参数：

- `viewType`：WebView 的 Id，用于区分不同的 WebView。
- `provider`：一个 `vscode.WebviewViewProvider` 对象，主要是实现了 `resolveWebviewView` 方法。

因此，你需要先实现一个 `WebviewViewProvider` ：

```ts
class WebviewSampleProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken) {
      webviewView.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WebView 示例</title>
      </head>
      <body>
          <h1>Hello WebView Provider</h1>
      </body>
      </html>
      `;
  }
}
```

然后，注册这个 Provider：

```ts
vscode.window.registerWebviewViewProvider('webviewSample', new WebviewSampleProvider());
```

接着，还需要去 Package.json 中配置 `contributes.viewsContainers`，添加一个视图容器：

```json
"contributes": {
  "viewsContainers": {
    "activitybar": [
      {
        "id": "webviewSidebar",
        "title": "WebView Sidebar",
        "icon": "webviewSample.svg" // 建议使用无色 svg 图标
      }
    ]
  }
}
```

`activitybar` 是 SideBar 的视图容器，这里创建了一个叫 `webviewSidebar` 的视图容器。接着，我们再去 `contributes.views` 中添加一个视图：

```json
"contributes": {
  "views": {
    "webviewSidebar": [
      {
        "id": "webviewSample", // 此处的 id 和 Webview 注册时填写的 viewType 一致
        "name": "WebView Sample",
        "type": "webview" // 视图类型为 webview
      }
    ]
  }
}
```

这样启动扩展，就可以在 SideBar 中看到一个 `webviewSample.svg` 的图标了，点击即可加载 `webviewSample` 的 Webview。如果是要在 Panel 中创建 WebView，只需要把 `activitybar` 改成 `panel` 即可。值得注意的是，视图容器的的类型是数组，也就是一个容器可以包含多个视图。在 Sidebar 中，多个视图会使用纵向排列，而在 Panel 中，多个视图会使用横向排列。多个视图的话，视图是可以折叠的，默认为展开，如果需要初始化时为折叠，则可以通过配置 `visibility` 为 `collapsed` 来折叠。

## 2. WebView 通信

WebView 和 VSCode 之间的通信，可以通过 `postMessage` 和 `onMessage` 方法来实现。WebView 可以通过 `postMessage` 向 VSCode 发送消息，VSCode 可以通过 `onMessage` 监听 WebView 发送的消息。

每个 WebView 都有一个 `acquireVsCodeApi` 方法，可以获取一个 `vscode` 对象，这个对象有一个 `postMessage` 方法，可以向 VSCode 发送消息。

```ts
const vscode = acquireVsCodeApi();

vscode.postMessage({ command: 'alert', text: 'Hello VSCode!' });
```

在 VSCode 中，可以通过 `webview` 对象的 `onDidReceiveMessage` 方法监听 WebView 发送的消息。`webview` 对象分别在 `WebviewPanel` 和 `WebviewView` 中取得。

```ts
webview.onDidReceiveMessage(message => {
    switch (message.command) {
        case 'alert':
            vscode.window.showInformationMessage(message.text);
            break;
    }
});
```

而在 vscode 的 extension Host 中，则可以通过 `webview` 对象的 `postMessage` 方法向 WebView 发送消息。

```ts
webview.postMessage({ command: 'alert', text: 'Hello WebView!' });
```

在 WebView 中，可以通过 `window.addEventListener` 方法监听 `message` 事件，来接收 VSCode 发送的消息。

```ts
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'alert':
            alert(message.text);
            break;
    }
});
```

这样，就可以实现 WebView 和 VSCode 之间的通信了。

此外，`vscode` 对象不仅有 `postMessage` 方法，还有 `getState` 和 `setState` 方法，可以用来保存 WebView 的状态。这样，就可以在 WebView 的生命周期中保存一些状态了。

## 3. WebView 生命周期

WebView 的生命周期主要有两个事件：`onDidDispose` 和 `onDidChangeViewState`。`onDidDispose` 会在 WebView 被销毁时触发，`onDidChangeViewState` 会在 WebView 的可见性发生变化时触发。

```ts
panel.onDidDispose(() => {
    // WebView 被销毁时触发
});

panel.onDidChangeViewState(() => {
    // WebView 的可见性发生变化时触发
});
```

在 `WebviewViewProvider` 中，也有类似的生命周期事件：

```ts
class WebviewSampleProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken) {
      webviewView.onDidDispose(() => {
          // WebView 被销毁时触发
      });

      webviewView.onDidChangeVisibility(() => {
          // WebView 的可见性发生变化时触发
      });
  }
}
```

这样，就可以在 WebView 的生命周期中做一些操作了。

如果希望 WebView 在隐藏时不被销毁，可以在创建 WebView 时设置 `retainContextWhenHidden` 为 `true`。Editor Webview 在 `createWebviewPanel` 时配置，而 SideBar / Panel 的 Webview 则是在 `vscode.window.registerWebviewViewProvider` 配置。

## 4. WebView 中的资源

WebView 中可以加载本地资源，但是需要通过 `localResourceRoots` 属性来指定本地资源的根目录。这样，WebView 才能加载本地资源。

```ts
const panel = vscode.window.createWebviewPanel(
    'webviewSample',
    'WebView 示例',
    vscode.ViewColumn.Beside,
    {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))]
    }
);
```

然后，可以通过 `webview.asWebviewUri` 方法来获取本地资源的 Uri。

```ts
const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'script.js')));
```

这样，就可以获得一个本地资源的 Uri 了。然后，可以在 WebView 中通过这个 Uri 来加载本地资源。

```ts
webviewView.webview.html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WebView 示例</title>
      <script src="${scriptUri}"></script>
  </head>
  <body>
      <h1>Hello WebView Provider</h1>
  </body>
  </html>
  `;
```

要注意的是，WebView 中加载的资源，需要遵循 CSP（Content Security Policy）规则。因此，需要在 WebView 的 `contentSecurityPolicy` 属性中设置 CSP 规则。

```ts
const panel = vscode.window.createWebviewPanel(
    'webviewSample',
    'WebView 示例',
    vscode.ViewColumn.Beside,
    {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath)],
        contentSecurityPolicy: 'default-src \'none\'; script-src vscode-resource: \'unsafe-inline\'; style-src vscode-resource: \'unsafe-inline\';'
    }
);
```

这样，就可以在 WebView 中加载本地资源了。

## 5. Web 前端框架支持与调试

前面说了那么多，都只是原生的 Web 技术。如果想要在 WebView 中使用 React，Vue 等前端框架，需要注意一些问题。

使用前端框架，我们并没有办法等做好页面，打包好，然后再与 VSCode 的 Host 代码联调，因此就需要通过某种方法来让 WebView 加载本地服务。

因此，我们可以引入一个中间层，这个中间层是一个静态网页，然后通过 iframe 的方式来加载本地服务。

```html
<!DOCTYPE html>
<html>
  <head>
    <base href="">
    <style>
      iframe {
          width: 100%;
          border: none;
          height: 99.5vh;
      }  
      body {
          overflow: hidden;
      }          
    </style>
  </head>
  <body style="padding: 0;">
    <iframe id="main" src="http://localhost:5173" 
      frameborder="0" 
      sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms allow-popups" 
      allow="clipboard-read; clipboard-write;"></iframe>
    <script src="js/main.js"></script>
  <body>
</html>
```

```js
// main.js
// 获取 iframe 的 Vite 本地服务页面的 window 对象
let main = document.getElementById('main').contentWindow;
const vscode = acquireVsCodeApi();

document.getElementById('main').onload = () => {
  // 待页面加载完成后，将 vscode 的默认样式转发给 iframe 内页面
  main.postMessage({ command: 'style', data: document.querySelector('html').getAttribute('style')}, '*');
};

// 消息通信转发
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
  case 'forward':
    {
      // 转发 iframe 的消息给扩展后端
      message.command = message.real;
      vscode.postMessage(message);
      break;
    }
  default:
    {
      // 转发扩展后端的消息给 iframe
      main.postMessage(message, '*');
      break;
    }
  }
});
```

这个中间层做了三件事：

1. 通过 iframe 加载本地服务。
2. 将 vscode 的默认样式转发给 iframe 内页面。
3. 将消息通信转发给 iframe 内页面，以及将 iframe 内页面的消息转发给扩展 Host。

而框架网页，则需要再全局加上一句：`window.vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : window.parent;`，这样就可以在框架中使用 `vscode` 对象了。

此外，还需要接收 `style` 消息，将 vscode 的默认样式应用到框架网页中。

```js
window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.command) {
    case 'style': {
      // 接受 iframe 父窗体转发的 VSCode html 注入的 style
      document.querySelector('html')!.setAttribute('style', message.data);
      break;
    }
  }
});
```
   
这样，调试时，我们可以先启动本地服务，然后再启动 VSCode 扩展，这样就可以在 WebView 中调试 React，Vue 等前端框架了。而打包时，只需要将打包输出目录配置为扩展的打包目录，然后在 `.vscodeignore` 中配置中间层的目录忽略打包即可。

因此，在返回 Webview 的 html 时，可以这样写：

```ts
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
```

这里用了一个 `nonce` 来解决 CSP 的脚本加载问题，具体可以看[这篇文章](https://content-security-policy.com/nonce/)。

这样，就可以在 WebView 中使用调试 React，Vue 等前端框架的网页了。

## 6. 最后

可能看完文章你还是云里雾里，不过没关系，这里准备了一个 `Vue3 + Element Plus` [样例工程](https://github.com/imlinhanchao/vsc-webview-template)，你可以参考这个工程来快速编写一个使用 WebView 的 VSCode 扩展。



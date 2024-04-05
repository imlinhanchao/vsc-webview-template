import { useEventListener } from '@/hooks/useEventListener';
import { clone } from '@/utils';
import { onUnmounted } from 'vue';

window.vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : window.parent;

export type MessageHandler = (data: any) => void;

/**
 * @description 消息通信 Hook
 */
export function useMessage() {
  const messageHandler: Record<string, MessageHandler[]> = {};
  useEventListener({
    el: window,
    name: 'message',
    listener: (e: any) => {
      const message = e.data;
      if (!messageHandler[message.command]) return;
      messageHandler[message.command].forEach((handler) => handler(message.data));
    }
  });
  /**
   * @description 添加 command 的监听
   * @param command 命令
   * @param handler 数据回调
   */
  function addListener(command, handler: MessageHandler) {
    if (!messageHandler[command]) {
      messageHandler[command] = [];
    }
    messageHandler[command].push(handler);
  }
  /**
   * @description 移除 command 的监听
   * @param command 命令
   * @param handler 数据回调
   */
  function removeListener(command, handler: MessageHandler) {
    if (!messageHandler[command]) return;
    const index = messageHandler[command].indexOf(handler);
    if (index > -1) {
      messageHandler[command].splice(index, 1);
    }
    if (messageHandler[command].length === 0) {
      delete messageHandler[command];
    }
  }
  /**
   * @description 发送 command 到 extension
   * @param command 命令
   * @param data 数据
   */
  function postMsg(command: string, data?: any) {
    const message: any = { command, data: clone(data) };
    message.real = command;
    // 开发模式，将 command 修改为 forward
    if (!window.acquireVsCodeApi) message.command = 'forward';
    window.vscode.postMessage(message, '*');
  }
  /**
   * @description 发送 command 到 extension 并等待返回值
   * @param command 命令
   * @param data 数据
   * @returns extension 的返回值
   */
  function invoke(command: string, data?: any): Promise<any> {
    return new Promise((resolve) => {
      const message: any = { command, data: clone(data) };
      message.real = command;
      if (!window.acquireVsCodeApi) message.command = 'forward';
      message.key = message.command + Math.ceil(Math.random() * 10000).toString();
      const handler = (rsp) => {
        resolve(rsp);
        removeListener(message.key, handler);
      };
      addListener(message.key, handler);
      window.vscode.postMessage(message, '*');
    });
  }

  onUnmounted(() => {
    for (const key in messageHandler) {
      delete messageHandler[key];
    }
  });
  return {
    invoke,
    postMsg,
    addListener,
    removeListener
  };
}

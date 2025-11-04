// lib/socketClient.js
import { io } from "socket.io-client";

let chatSocket = null;
let statusSocket = null;

export function getChatSocket() {
  if (!chatSocket) {
    chatSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/Chat`, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return chatSocket;
}

export function getStatusSocket() {
  if (!statusSocket) {
    statusSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/UserStatus`, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return statusSocket;
}

export function disconnectAllSockets() {
  if (chatSocket) chatSocket.disconnect();
  if (statusSocket) statusSocket.disconnect();
}

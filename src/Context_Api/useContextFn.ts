import { createContext } from "react";
import { Socket } from "socket.io-client";

type tContext = {
 
  peerConnection: RTCPeerConnection;
  socket: Socket;
};

export const ContextProvider = createContext<tContext | null>(null);

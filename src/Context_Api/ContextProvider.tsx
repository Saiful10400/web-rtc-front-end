import React, { PropsWithChildren, useMemo } from "react";
import { ContextProvider } from "./useContextFn";
import { io } from "socket.io-client";

const ContextWrapper: React.FC<PropsWithChildren> = (props) => {
  // const socket = useMemo(() => io("http://localhost:5000"), []);
  const socket = useMemo(() => io("https://web-rtc-back-end-1.onrender.com"), []);


  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  })












  //   ............................................................................................
  const value = {

    peerConnection,
    socket,

  };

  return (
    <ContextProvider.Provider value={value}>
      {props.children}
    </ContextProvider.Provider>
  );
};

export default ContextWrapper;

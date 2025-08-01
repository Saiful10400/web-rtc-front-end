import React, { createContext } from "react";
import { Socket } from "socket.io-client";

type tContext={
pear:object,
createOffer:()=>object,
createAnswer:(offer:RTCSessionDescriptionInit)=>object,
setAnswer:(ans:RTCSessionDescriptionInit)=>object,
sendStream:(ans:MediaStream)=>object,
socket:Socket,
remoteStream:MediaStream | null,
setCaller:React.Dispatch<React.SetStateAction<string>>,
setReceiver:React.Dispatch<React.SetStateAction<string>>,
}

export const ContextProvider=createContext<tContext | null>(null)
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { ContextProvider } from "./useContextFn";
import { io } from "socket.io-client";

const ContextWrapper: React.FC<PropsWithChildren> = (props) => {
  const socket = useMemo(() => io("http://localhost:5000"), []);
  const pear = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await pear.createOffer();
    console.log(offer, "created offer");
    await pear.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    await pear.setRemoteDescription(offer);
    const answer = await pear.createAnswer();
    await pear.setLocalDescription(answer);
    return answer;
  },[pear]);

  const setAnswer = async (ans: RTCSessionDescriptionInit) => {
    await pear.setRemoteDescription(ans);
  };

  const sendStream = async (streams: MediaStream) => {
    const tracks = streams.getTracks();
    for (const track of tracks) {
      pear.addTrack(track, streams);
    }
  };

  const [remoteStream, setRemoteStream] = useState<null | MediaStream>(null);

  const remoteStreamHandler = (e: RTCTrackEvent) => {
    const stream = e.streams;
    setRemoteStream(stream[0]);
  };

  useEffect(() => {
    pear.addEventListener("track", remoteStreamHandler);
 

    return () => {
      pear.removeEventListener("track", remoteStreamHandler);

    };
  }, [pear]);

  // hndle negotiation..............................
  const [caller, setCaller] = useState("");
  const [receiver, setReceiver] = useState("");

  //(A=>S)
  const negotiationHandle = useCallback(async() => {
    const offer = pear.localDescription;
    socket.emit("Incoming_call_send_negotiation", {
      sender: caller,
      receiver: receiver,
      offer,
    });
  },[caller,receiver,pear,socket])

  useEffect(() => {
    pear.addEventListener("negotiationneeded", negotiationHandle);

    return () => {
      pear.removeEventListener("negotiationneeded", negotiationHandle);
    };
  }, [pear, caller, receiver,negotiationHandle]);

  // call receive negotiation.(S=>B)
  useEffect(() => {
    socket.on("Incoming_call_receive_negotiation", async (incomingData) => {
      // after receiving call create a answer and send it also store it to your sdp
      const answer = await createAnswer(incomingData.offer);
      socket.emit("call_accepted_negotiation", {
        answer,
        sender: incomingData.sender.email,
        receiver: incomingData.receiver.email,
      });
    });
    return () => {
      socket.off("Incoming_call_receive_negotiation");
    };
  }, [pear,createAnswer,socket]);


// call accept negotiation (s=>A) final.   (normally stream sended form this.)
useEffect(()=>{
    socket.on("Receiver_call_received_negotiation", async(acceptedData) => {
console.log(acceptedData,"final fn offers")
        await pear.setLocalDescription(acceptedData.answer)
        console.log("negotiation done")
      
        // if(myStream){
        //     data.sendStream(myStream)
        //     console.log(acceptedData,"receiver call accepted.")
        // }

      });
return ()=>{
    socket.off("Receiver_call_received_negotiation");
}

},[pear,socket])



  //   ............................................................................................
  const value = {
    pear,
    createOffer,
    socket,
    createAnswer,
    setAnswer,
    sendStream,
    remoteStream,
    setCaller,
    setReceiver,
  };

  return (
    <ContextProvider.Provider value={value}>
      {props.children}
    </ContextProvider.Provider>
  );
};

export default ContextWrapper;

import { useContext, useEffect, useState } from "react";
import { ContextProvider } from "../../Context_Api/useContextFn";
import ReactPlayer from "react-player";
import { useSearchParams } from "react-router";

const OnlineUser = () => {

// get search params.
const [searchParams] = useSearchParams();
const myEmail = searchParams.get("email");





  const data = useContext(ContextProvider);
  const [activeUser, setActiveUser] = useState([]);
  data?.socket.on("active_user_list", (data) => {
    setActiveUser(data);
  });
  useEffect(() => {
    data?.socket.emit("get_active_user");
  }, [data]);

  // get user camera and voice feed.
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    const stream = async () => {
      const packet = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
    
      setMyStream(packet);
     
    };
    stream();
  }, []);

  const[myOffer,setMyOffer]=useState<object | null>(null)
  const generateMyOffer = async () => {
    const generatedOffer = await data?.createOffer();
    setMyOffer(generatedOffer as object)
  };

  useEffect(() => {
    generateMyOffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.createOffer]);




  // making a callhandle.
  const makeACallHandle=(email:string)=>{
    if(!myOffer) return
    data?.setCaller(myEmail as string)
    data?.setReceiver(email as string)
    data?.socket.emit("Incoming_call_send",{sender:myEmail,receiver:email,offer:myOffer});

  }



// receiver call accept handle.
  useEffect(()=>{
    data?.socket.on("Receiver_call_received", async(acceptedData) => {

        await data.setAnswer(acceptedData.answer)
      
        if(myStream){
            data.sendStream(myStream)
            console.log(acceptedData,"receiver call accepted.")
        }

      });
return ()=>{
    data?.socket.off("Receiver_call_received");
}

},[myStream])









// call receiving praspective.
type Tuser={name:string,email:string,id:string}
const [incomingCallOfferCrd,setIncomingCallCred]=useState< {offer:RTCSessionDescriptionInit,sender:Tuser,receiver:Tuser}|null>(null)

useEffect(()=>{
    data?.socket.on("Incoming_call_receive", async(incomingData) => {
    
// after receiving call create a answer and send it also store it to your sdp
setIncomingCallCred(incomingData)

      });
return ()=>{
    data?.socket.off("Incoming_call_receive");
}

},[])



// call receive handle.
const receiveCallHandle=async()=>{
    if(!incomingCallOfferCrd?.offer || !data) return
    const answer=await data.createAnswer(incomingCallOfferCrd.offer)
    data.socket.emit("call_accepted",{answer,sender:incomingCallOfferCrd.sender.email,receiver:incomingCallOfferCrd.receiver.email})
}





  return (
    <div className="flex flex-col lg:flex-row gap-2 items-start relative">

{/* call getting modal. */}

{
    incomingCallOfferCrd?<div className="bg-gray-700 rounded-md p-4 absolute top-2 right-6">
    <h1>You have receive a incoming call</h1>
    <h1 className="font-semibold">from {incomingCallOfferCrd.sender.name}</h1>
    <button onClick={receiveCallHandle} className="bg-black mt-3 text-white p-2 rounded-md" >Receive</button>
    </div>:""
}




      {/* your caemra feed */}
      <div className="lg:w-1/2 border flex justify-center items-center">
        <ReactPlayer
          url={myStream as MediaStream}
          playing
          height={500}
          width={500}
        />
        <ReactPlayer
          url={data?.remoteStream as MediaStream}
          playing
          height={500}
          width={500}
        />
      </div>
      <div className="lg:w-1/2 flex flex-col gap-2">
        {activeUser?.map((item:Tuser) => {
          return (
            <div
              className="flex py-1 w-max items-start gap-2 border rounded-md px-2"
              key={item.id}
            >
              <div>
                <h1 className="font-semibold">{item.name}</h1>{" "}
                <h1 className="font-thin text-xs">{item.email}</h1>
              </div>{" "}
              <button onClick={()=>makeACallHandle(item.email)} className="bg-gray-500 px-2 py-1 rounded-md">Call</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnlineUser;

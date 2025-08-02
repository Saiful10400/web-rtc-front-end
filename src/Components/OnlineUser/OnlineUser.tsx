import { useContext, useEffect, useState } from "react";
import { ContextProvider } from "../../Context_Api/useContextFn";
import ReactPlayer from "react-player";
import { useSearchParams } from "react-router";
 

// Type for user
type Tuser = { name: string; email: string; id: string };

const OnlineUser = () => {
  const [searchParams] = useSearchParams();
  const myEmail = searchParams.get("email");

  const data = useContext(ContextProvider);
  const [activeUser, setActiveUser] = useState<Tuser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
 

  // 🧠 Get user media stream
  useEffect(() => {
    const getMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    };
    getMedia();
  }, []);

  // 🧠 Emit own stream tracks
  useEffect(() => {
    if (!localStream || !data?.peerConnection) return;
    localStream.getTracks().forEach((track) =>
      data.peerConnection.addTrack(track, localStream)
    );
  }, [localStream, data]);

  // 🧠 Listen for active user list
  useEffect(() => {
    const handleActiveUsers = (users: Tuser[]) => {
      setActiveUser(users);
    };

    data?.socket.emit("get_active_user");
    data?.socket.on("active_user_list", handleActiveUsers);

    return () => {
      data?.socket.off("active_user_list", handleActiveUsers);
    };
  }, [data?.socket]);

  // 🧠 ICE Candidate Handling
  useEffect(() => {
    const pc = data?.peerConnection;
    if (!pc || !data?.socket) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        data.socket.emit("icecandidate", event.candidate);
      }
    };

    const handleCandidate = async (iceCandidate: RTCIceCandidateInit) => {
      await pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
    };

    data.socket.on("icecandidate", handleCandidate);
    return () => {
      data.socket.off("icecandidate", handleCandidate);
    };
  }, [data?.peerConnection, data?.socket]);

  // 🧠 Remote stream track
  useEffect(() => {
    const pc = data?.peerConnection;
    if (!pc) return;

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  }, [data?.peerConnection]);

  // 📞 Make a call
  const makeACallHandle = async (email: string) => {
    if (!data?.peerConnection || !myEmail) return;

    const offer = await data.peerConnection.createOffer();
    await data.peerConnection.setLocalDescription(offer);

    data.socket.emit("offer", {
      to: email,
      from: myEmail,
      offer: data.peerConnection.localDescription,
    });
  };

  // 📞 Receive offer and create answer
  useEffect(() => {
    const handleOffer = async (e: {
      offer: RTCSessionDescriptionInit;
      from: Tuser;
      to: Tuser;
    }) => {
      const pc = data?.peerConnection;
      if (!pc || !data?.socket) return;

      await pc.setRemoteDescription(new RTCSessionDescription(e.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      data.socket.emit("ans", {
        ...e,
        ans: pc.localDescription,
      });
    };

    data?.socket.on("offer-sv", handleOffer);
    return () => {
      data?.socket.off("offer-sv", handleOffer);
    };
  }, [data]);

  // 📞 Receive answer and complete handshake
  useEffect(() => {
    const handleAnswer = async (e: {
      ans: RTCSessionDescriptionInit;
    }) => {
      const pc = data?.peerConnection;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(e.ans));
    };

    data?.socket.on("ans-sv", handleAnswer);
    return () => {
      data?.socket.off("ans-sv", handleAnswer);
    };
  }, [data]);

 

 

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start relative">
    

      {/* Video Streams */}
      <div className="lg:w-1/2 border flex flex-col gap-2 justify-center items-center">
        {localStream && (
          <ReactPlayer url={localStream} playing muted height={300} width={400} />
        )}
        {remoteStream && (
          <ReactPlayer url={remoteStream} playing height={300} width={400} />
        )}
      </div>

      {/* User List */}
      <div className="lg:w-1/2 flex flex-col gap-2">
        {activeUser.map((user) => (
          <div
            key={user.id}
            className="flex py-1 w-max items-start gap-2 border rounded-md px-2"
          >
            <div>
              <h1 className="font-semibold">
                {user.name} {user.email === myEmail && "(You)"}
              </h1>
              <h2 className="font-thin text-xs">{user.email}</h2>
            </div>
            {user.email !== myEmail && (
              <button
                onClick={() => makeACallHandle(user.email)}
                className="bg-gray-500 px-2 py-1 rounded-md"
              >
                Call
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUser;

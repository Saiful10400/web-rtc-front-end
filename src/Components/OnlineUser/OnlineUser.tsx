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
    const handleAnswer = async (e: { ans: RTCSessionDescriptionInit }) => {
      const pc = data?.peerConnection;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(e.ans));
    };

    data?.socket.on("ans-sv", handleAnswer);
    return () => {
      data?.socket.off("ans-sv", handleAnswer);
    };
  }, [data]);

  // 📴 End Call and Redirect
  const handleEndCall = () => {
    // Stop media tracks
    localStream?.getTracks().forEach((track) => track.stop());
    // Optional: Close connection or socket here
    window.location.href = "/";
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Remote Video Fullscreen */}
      {remoteStream && (
        <ReactPlayer
          url={remoteStream}
          playing
          controls={false}
          muted={false}
          width="100%"
          height="100%"
          className="absolute top-0 left-0 z-0 object-cover"
        />
      )}

      {/* Local Video Small Floating */}
      {localStream && (
        <div className="absolute top-4 right-4 w-40 h-24 sm:w-48 sm:h-28 md:w-64 md:h-40 z-10 rounded-lg overflow-hidden border-2 border-white shadow-xl">
          <ReactPlayer
            url={localStream}
            playing
            muted
            width="100%"
            height="100%"
            className="object-cover"
          />
        </div>
      )}

      {/* End Call Button */}
      {remoteStream && (
        <button
          onClick={handleEndCall}
          className="absolute bottom-4 right-4 z-20 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg"
        >
          End Call
        </button>
      )}

      {/* Stylish Online User List (only show if not in call) */}
      {!remoteStream && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/80 backdrop-blur-sm p-5 rounded-xl max-w-sm shadow-2xl">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Online Users</h2>
          <div className="flex flex-col gap-3">
            {activeUser.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border border-gray-200 p-3 rounded-md bg-white hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {user.name} {user.email === myEmail && "(You)"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.email !== myEmail && (
                  <button
                    onClick={() => makeACallHandle(user.email)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-md hover:opacity-90 text-sm shadow-sm"
                  >
                    Call
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUser;

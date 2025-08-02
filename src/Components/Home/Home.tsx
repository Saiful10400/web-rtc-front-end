import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { ContextProvider } from "../../Context_Api/useContextFn";

// Define the shape of your context value (adjust as needed)
type ContextType = {
  socket: {
    emit: (event: string, data: string | { [key: string]: string }) => void;
    on: (event: string, callback: (res: {
      success: boolean;
      email: string;
    }) => void) => void;
    off: (event: string) => void;
  };
};

const Home: React.FC = () => {
  const data = useContext(ContextProvider) as ContextType | null;
  const navigate = useNavigate();

  const userJoinHandle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;

    const name = nameInput?.value?.trim();
    const email = emailInput?.value?.trim();

    if (name && email && data?.socket) {
      data.socket.emit("join_user", { name, email });
    }
  };

  useEffect(() => {
    if (!data?.socket) return;

    const handleJoinSuccess = (res: { success: boolean; email: string }) => {
      if (res?.success) {
        navigate(`/online-user?email=${res.email}`);
      }
    };

    data.socket.on("success_join", handleJoinSuccess);


    return () => {
      data.socket.off("success_join");
    };
  }, [data?.socket, navigate]);

  return (
    <div className="min-h-screen w-full bg-gray-900 flex justify-center items-center px-4">
      <form
        onSubmit={userJoinHandle}
        className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold text-center text-gray-100">Join Video Chat</h1>

        <input
          name="name"
          required
          type="text"
          placeholder="Your name"
          className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <input
          name="email"
          required
          type="email"
          placeholder="Your email"
          className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <button
          type="submit"
          className="w-full bg-gray-600 hover:bg-gray-700 text-gray-100 font-semibold py-2 rounded-md transition-colors"
        >
          Join
        </button>
      </form>
    </div>

  );
};

export default Home;

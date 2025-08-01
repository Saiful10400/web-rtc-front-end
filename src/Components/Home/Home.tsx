import React, { useContext, useEffect } from "react";
import { ContextProvider } from "../../Context_Api/useContextFn";
import { useNavigate } from "react-router";

const Home = () => {
const data=useContext(ContextProvider)

  const userJoinHandle=(e:React.FormEvent)=>{
    e.preventDefault()
    const form=e.target
    data?.socket.emit("join_user",{name:form.name.value,email:form.email.value})
  }
const move=useNavigate()
useEffect(()=>{
  data?.socket.on("success_join",(data)=>{
    if(data?.success){
      move(`/online-user?email=${data.email}`)
    }
  })
  return ()=>{
    data?.socket.off("success_join")
  }
},[data,move])



  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <form onSubmit={userJoinHandle} className="min-w-[300px] flex flex-col items-center gap-2">
        <input
        name="name" required
          type="text"
          placeholder="Your name"
          className="rounded-sm border border-white w-full py-1 pl-1 focus:outline-none text-black font-semibold"
        />
        <input name="email" required
          type="text"
          placeholder="Your email"
          className="rounded-sm border border-white w-full py-1 pl-1 focus:outline-none text-black font-semibold"
        />
        <button className="bg-white text-black w-max font-semibold px-2 py-1 rounded-sm text-lg">
          Join
        </button>
      </form>
    </div>
  );
};

export default Home;

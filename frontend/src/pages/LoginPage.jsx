import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/db.js";

const Login = () => {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ stop page refresh

    if (!employeeId || !password) {
      alert("Employee ID & Password required");
      return;
    }

    const user = await getUser(employeeId);

    if (!user) {
      alert("User not found");
      return;
    }

    if (user.password !== password) {
      alert("Invalid password");
      return;
    }

    localStorage.setItem(
      "authSession",
      JSON.stringify({
        employeeId: user.employeeId,
        role: user.role,
        loggedInAt: Date.now(),
      })
    );

    alert("Login successful!");
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-5">

      <div className="text-5xl flex items-center justify-center gap-3 mt-4 mb-5 w-full staatliches text-[#4361ee]">
        <img src="/public/logo/nirmaan2.png" className="w-10 h-10 scale-125" />
        <div>Nirmaan</div>
      </div>


      <div className="flex flex-col items-center gap-2 shadow-2xl shadow-gray-300 rounded-2xl w-[90%] h-full bg-[#4361ee] py-6 px-4">
        <div className="text-3xl text-white staatliches_ns">Login Into Your Nirmaan Account</div>

        <form onSubmit={handleLogin} className="flex flex-col items-start gap-3 mt-4 w-full text-white poppins">

          <div className="w-full">
            <div className="text-lg mb-2">
              Empolyee Id
            </div>
            <input
              name="employeeId"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full">
            <div className="text-lg mb-2">
              Password
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full flex items-center justify-center">
            <button otype="submit" className="mt-2 bg-white text-blue-500 px-4 py-1 text-lg rounded-lg">Login</button>
          </div>
        </form>
      </div>
    </div>


  );
};

export default Login;

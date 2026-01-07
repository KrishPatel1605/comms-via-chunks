import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUser } from "../utils/db.js";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    company: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async () => {
    if (!form.employeeId || !form.password) {
      alert("Employee ID & Password required");
      return;
    }

    // 🔹 Determine role from first 4 digits
    const rolePrefix = form.employeeId.substring(0, 4);
    let role = "";

    if (rolePrefix === "1000") role = "engineer";
    else if (rolePrefix === "2000") role = "projectManager";
    else {
      alert("Invalid Employee ID");
      return;
    }

    try {
      await addUser({ ...form, role });

      // 🔹 Save auth session
      localStorage.setItem(
        "authSession",
        JSON.stringify({
          employeeId: form.employeeId,
          role,
          loggedInAt: Date.now(),
        })
      );

      alert("Signup successful!");

      // 🔹 Navigate to home
      navigate("/");
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">

      <div className="text-5xl flex items-center justify-center gap-3 mt-4 mb-5 w-full staatliches text-[#4361ee]">
        <img src="/public/logo/nirmaan2.png" className="w-10 h-10 scale-125" />
        <div>Nirmaan</div>
      </div>

      <div className="flex flex-col items-center gap-2 shadow-2xl shadow-gray-300 rounded-2xl w-[90%] h-full bg-[#4361ee] py-6 px-4">
        <div className="text-3xl text-white staatliches_ns">Create An Account On Nirmaan</div>

        <div className="flex flex-col items-start gap-3 mt-4 w-full text-white poppins">

          <div className="w-full">
            <div className="text-lg mb-2">
              Empolyee Id
            </div>
            <input
              name="employeeId"
              placeholder="Employee ID"
              onChange={handleChange}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full">
            <div className="text-lg mb-2">
              Name
            </div>
            <input
              name="name"
              placeholder="Name"
              onChange={handleChange}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full">
            <div className="text-lg mb-2">
              Email
            </div>
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full">
            <div className="text-lg mb-2">
              Company Name
            </div>
            <input
              name="company"
              placeholder="Company Name"
              onChange={handleChange}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full">
            <div className="text-lg mb-2">
              Password
            </div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full bg-white text-blue-400 font-medium px-2 py-1.5 rounded-lg placeholder:text-blue-400"
            />
          </div>

          <div className="w-full flex items-center justify-center">
            <button onClick={handleSignup} className="mt-2 bg-white text-blue-500 px-4 py-1 text-lg rounded-lg">Signup</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

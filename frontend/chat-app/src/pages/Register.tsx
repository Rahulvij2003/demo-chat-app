import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

interface FormData {
  username: string;
  email: string;
  password: string;
}

const Register = () => {
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", form);
      setMessage(res.data.message);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Create Account ✨
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Sign up to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition duration-200"
          >
            Register
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

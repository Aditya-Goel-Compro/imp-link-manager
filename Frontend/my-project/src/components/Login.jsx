import { useState } from "react";

export default function Login({ onLogin }) {
  const [type, setType] = useState("office");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hardcoded passwords
  const PASS = {
    office: "office123",
    personal: "personal123",
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === PASS[type]) {
      onLogin(type);
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-80 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold text-center">Select Section</h2>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded-md text-gray-700"
        >
          <option value="office">Office</option>
          <option value="personal">Personal</option>
        </select>

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded-md"
        />

        {error && <p className="text-red-500 text-md">{error}</p>}

        <button
          type="submit"
          className="bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

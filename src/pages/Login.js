import { useState } from "react";

export default function Login() {
  const [key, setKey] = useState("");

  const submit = () => {
    localStorage.setItem("admin_key", key);
    window.location.href = "/dashboard";
  };

  return (
    <div>
      <h2>Playme Admin Login</h2>
      <input
        placeholder="Admin API Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <button onClick={submit}>Login</button>
    </div>
  );
}

import { useState } from "react";
import API from "../api/api";

export default function Proxy() {
  const [mode, setMode] = useState("direct");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [result, setResult] = useState(null);

  const save = async () => {
    const payload =
      mode === "socks5"
        ? { mode, socks: { host, port: Number(port), user, pass } }
        : { mode };

    const res = await API.post("/admin/proxy", payload);
    setResult(res.data);
  };

  return (
    <div>
      <h2>Proxy Control</h2>

      <select value={mode} onChange={e => setMode(e.target.value)}>
        <option value="direct">Direct (DPI)</option>
        <option value="socks5">SOCKS5</option>
      </select>

      {mode === "socks5" && (
        <>
          <input placeholder="Host" onChange={e => setHost(e.target.value)} />
          <input placeholder="Port" onChange={e => setPort(e.target.value)} />
          <input placeholder="User" onChange={e => setUser(e.target.value)} />
          <input placeholder="Pass" onChange={e => setPass(e.target.value)} />
        </>
      )}

      <button onClick={save}>Apply</button>

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

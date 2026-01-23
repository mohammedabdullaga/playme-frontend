import { useState } from "react";
import API from "../api/api";

export default function Tokens() {
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);

  const create = async () => {
    const res = await API.post(`/admin/tokens?days=${days}&count=${count}`);
    setTokens(res.data.tokens);
  };

  return (
    <div>
      <h2>Create Tokens</h2>
      <input type="number" value={days} onChange={e => setDays(e.target.value)} />
      <input type="number" value={count} onChange={e => setCount(e.target.value)} />
      <button onClick={create}>Generate</button>

      <ul>
        {tokens.map(t => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}

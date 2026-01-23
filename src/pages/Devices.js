import { useEffect, useState } from "react";
import API from "../api/api";

export default function Devices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    API.get("/admin/devices").then(res => setDevices(res.data));
  }, []);

  const deactivate = async (mac) => {
    await API.post(`/admin/devices/${mac}/deactivate`);
    setDevices(devices.map(d => d.mac_address === mac ? { ...d, active: false } : d));
  };

  return (
    <div>
      <h2>Devices</h2>
      <table>
        <thead>
          <tr>
            <th>MAC</th>
            <th>Email</th>
            <th>Active</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(d => (
            <tr key={d.mac_address}>
              <td>{d.mac_address}</td>
              <td>{d.email}</td>
              <td>{String(d.active)}</td>
              <td>
                {d.active && <button onClick={() => deactivate(d.mac_address)}>Deactivate</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="panel">
      <h2>Playme Admin Panel</h2>
      <p>Welcome to the Playme Admin Dashboard. Use the menu to manage device subscriptions, activation tokens, devices, and proxy configuration.</p>
      <div style={{ marginTop: '24px', padding: '16px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Quick Stats</h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#1e40af' }}>Navigate to Subscriptions to view active devices and users, or Activate Device to set up new subscriptions.</p>
      </div>
    </div>
  );
}

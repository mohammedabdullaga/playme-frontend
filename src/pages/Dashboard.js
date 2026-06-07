import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Playme Admin Panel</h2>
          <p className="mt-2 text-slate-600">Welcome to the dashboard. Use the sidebar to manage devices, tokens, subscriptions, and runtime settings.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-700">Online</span>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Active Sessions</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">128</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Devices</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">42</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Pending Activations</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">7</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-sky-50 p-6 ring-1 ring-sky-200">
        <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100" to="/subscriptions">View subscriptions</Link>
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100" to="/activate">Activate device</Link>
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100" to="/proxy">Edit proxy settings</Link>
        </div>
      </div>
    </div>
  );
}

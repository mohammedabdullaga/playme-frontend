import { useEffect, useState } from "react";
import { adminGetMessages, adminCreateMessage, adminUpdateMessage, adminDeleteMessage } from "../api/api";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setError(null);
      const res = await adminGetMessages();
      setMessages(res.data || []);
    } catch (e) {
      setError("Failed to load messages: " + (e.response?.data?.detail || e.message));
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEnabled(true);
    setEditId(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!title.trim() || !content.trim()) {
        setError("Title and content are required");
        return;
      }

      const payload = { title, content, enabled };

      if (editId) {
        await adminUpdateMessage(editId, payload);
        setSuccess("Message updated successfully");
      } else {
        await adminCreateMessage(payload);
        setSuccess("Message created successfully");
      }

      resetForm();
      await loadMessages();
    } catch (e) {
      setError("Operation failed: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleEdit = (msg) => {
    setEditId(msg.id);
    setTitle(msg.title);
    setContent(msg.content);
    setEnabled(msg.enabled);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this message?")) {
      try {
        setError(null);
        await adminDeleteMessage(id);
        setSuccess("Message deleted successfully");
        await loadMessages();
      } catch (e) {
        setError("Delete failed: " + (e.response?.data?.detail || e.message));
      }
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Messages Management</h2>
        <p className="text-sm text-slate-500">Create, edit, and publish system messages quickly.</p>
      </div>

      {error && <div className="alert alert-error mt-6">{error}</div>}
      {success && <div className="alert alert-success mt-6">{success}</div>}

      <div className="mt-8 messages-layout grid gap-8">
        <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Create / Edit Message</h3>
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Title</label>
              <input
                type="text"
                placeholder="Message title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Content</label>
              <textarea
                placeholder="Message content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="message-textarea w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 rounded border border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Enabled
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" onClick={handleSubmit}>
                {editId ? "Update" : "Create"} Message
              </button>
              {editId && (
                <button className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-300" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Messages ({messages.length})</h3>
          <div className="mt-6 space-y-4 messages-scroll overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <p className="text-slate-500">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <article key={msg.id} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{msg.title}</h4>
                      <span className={`badge ${msg.enabled ? "badge-paid" : "badge-trial"}`}>{msg.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary px-3 py-2 text-xs" onClick={() => handleEdit(msg)}>Edit</button>
                      <button className="btn-danger px-3 py-2 text-xs" onClick={() => handleDelete(msg.id)}>Delete</button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{msg.content}</p>
                  {msg.id && <p className="mt-4 text-xs text-slate-400">ID: {msg.id}</p>}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

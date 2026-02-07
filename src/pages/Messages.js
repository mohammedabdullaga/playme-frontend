import { useEffect, useState } from "react";
import API, { adminGetMessages, adminCreateMessage, adminUpdateMessage, adminDeleteMessage } from "../api/api";

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
    <div className="panel">
      <h2>Messages Management</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
        <div className="grid-col">
          <h3>Create / Edit Message</h3>
          <div className="form-section">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Message title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                placeholder="Message content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Enabled
              </label>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={handleSubmit}>
                {editId ? "Update" : "Create"} Message
              </button>
              {editId && (
                <button className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid-col">
          <h3>Messages ({messages.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto" }}>
            {messages.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{ padding: "12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>{msg.title}</h4>
                      <span className={`badge ${msg.enabled ? "badge-paid" : "badge-trial"}`}>
                        {msg.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn-primary" onClick={() => handleEdit(msg)} style={{ padding: "4px 10px", fontSize: "12px" }}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(msg.id)} style={{ padding: "4px 10px", fontSize: "12px" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: "0", fontSize: "13px", color: "#374151", lineHeight: 1.4 }}>{msg.content}</p>
                  {msg.id && <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>ID: {msg.id}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

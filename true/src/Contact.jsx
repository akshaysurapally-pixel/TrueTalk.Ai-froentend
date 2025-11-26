// src/Contact.jsx
import React, { useEffect, useState } from "react";

/**
 * Contact.jsx
 * Full React + Tailwind frontend connected to Django backend via fetch.
 *
 * API endpoints used (based on your backend):
 *  - GET /api/contacts/
 *  - POST /api/contacts/
 *  - DELETE /api/contacts/:id/
 *  - GET /api/shared-contact/
 *  - POST /api/shared-contact/share_contact/
 *  - POST /api/shared-contact/:id/accept_contact/
 *  - POST /api/shared-contact/:id/reject_contact/
 *  - GET /api/users/
 *
 * Notes:
 *  - This file expects Django session auth (login via /api/auth/login/ or admin)
 *  - Make sure `credentials: 'include'` and CSRF cookie exist.
 *  - If you prefer a proxy, set API_BASE = '/api' and configure your dev server proxy.
 */

const API_BASE = "http://localhost:8000/api"; // change to "/api" if using a frontend proxy

function getCsrfTokenFromCookie() {
  const name = "csrftoken=";
  const cookies = document.cookie.split(";");
  for (let c of cookies) {
    c = c.trim();
    if (c.startsWith(name)) {
      return decodeURIComponent(c.substring(name.length));
    }
  }
  return null;
}

export default function ContactSharingApp() {
  const [contacts, setContacts] = useState([]);
  const [sharedContacts, setSharedContacts] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("myContacts");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [newContact, setNewContact] = useState({ name: "", phone_number: "", email: "" });
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ show: false, message: "", type: "success" });

  // Helper: show notification
  const showNotification = (message, type = "success") => {
    setNotif({ show: true, message, type });
    setTimeout(() => setNotif({ show: false, message: "", type: "success" }), 3500);
  };

  // Helper: handle 403 (not authenticated)
  const handleForbidden = async (res) => {
    if (res.status === 403) {
      showNotification("You are not authenticated. Please login at /api/auth/login/ or /admin/.", "error");
      return true;
    }
    return false;
  };

  // Fetchers
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/contacts/`, { credentials: "include" });
      if (await handleForbidden(res)) return;
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showNotification("Error fetching contacts", "error");
    }
  };

  const fetchSharedContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/shared-contact/`, { credentials: "include" });
      if (await handleForbidden(res)) return;
      if (!res.ok) throw new Error("Failed to fetch shared contacts");
      const data = await res.json();
      setSharedContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showNotification("Error fetching shared contacts", "error");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/`, { credentials: "include" });
      if (await handleForbidden(res)) return;
      if (!res.ok) {
        // users endpoint might be private; silently continue
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContacts();
    fetchSharedContacts();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const csrf = getCsrfTokenFromCookie();
      const res = await fetch(`${API_BASE}/contacts/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
        },
        body: JSON.stringify(newContact),
      });
      if (await handleForbidden(res)) return;
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add contact");
      }
      showNotification("Contact added");
      setIsAddModalOpen(false);
      setNewContact({ name: "", phone_number: "", email: "" });
      await fetchContacts();
    } catch (err) {
      console.error(err);
      showNotification("Error adding contact", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    setLoading(true);
    try {
      const csrf = getCsrfTokenFromCookie();
      const res = await fetch(`${API_BASE}/contacts/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...(csrf ? { "X-CSRFToken": csrf } : {}) },
      });
      if (await handleForbidden(res)) return;
      if (!res.ok) throw new Error("Failed to delete contact");
      showNotification("Contact deleted");
      await fetchContacts();
    } catch (err) {
      console.error(err);
      showNotification("Error deleting contact", "error");
    } finally {
      setLoading(false);
    }
  };

  // Share contact
  const handleShareContact = async () => {
    if (!selectedContactId || !selectedUserId) {
      showNotification("Choose contact and user to share", "error");
      return;
    }
    setLoading(true);
    try {
      const contact = contacts.find((c) => c.id === Number(selectedContactId));
      if (!contact) return showNotification("Selected contact not found", "error");

      const payload = {
        receiver_id: Number(selectedUserId),
        contact_name: contact.name,
        contact_phone: contact.phone_number,
        contact_email: contact.email || "",
      };

      const csrf = getCsrfTokenFromCookie();
      const res = await fetch(`${API_BASE}/shared-contact/share_contact/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (await handleForbidden(res)) return;
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to share contact");
      }
      showNotification("Contact shared");
      setIsShareModalOpen(false);
      setSelectedContactId("");
      setSelectedUserId("");
      await fetchSharedContacts();
    } catch (err) {
      console.error(err);
      showNotification("Error sharing contact", "error");
    } finally {
      setLoading(false);
    }
  };

  // Accept shared contact
  const handleAcceptContact = async (id) => {
    setLoading(true);
    try {
      const csrf = getCsrfTokenFromCookie();
      const res = await fetch(`${API_BASE}/shared-contact/${id}/accept_contact/`, {
        method: "POST",
        credentials: "include",
        headers: { ...(csrf ? { "X-CSRFToken": csrf } : {}) },
      });
      if (await handleForbidden(res)) return;
      if (!res.ok) throw new Error("Failed to accept");
      showNotification("Contact accepted");
      await fetchSharedContacts();
      await fetchContacts();
    } catch (err) {
      console.error(err);
      showNotification("Error accepting", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reject shared contact
  const handleRejectContact = async (id) => {
    if (!window.confirm("Reject this shared contact?")) return;
    setLoading(true);
    try {
      const csrf = getCsrfTokenFromCookie();
      const res = await fetch(`${API_BASE}/shared-contact/${id}/reject_contact/`, {
        method: "POST",
        credentials: "include",
        headers: { ...(csrf ? { "X-CSRFToken": csrf } : {}) },
      });
      if (await handleForbidden(res)) return;
      if (!res.ok) throw new Error("Failed to reject");
      showNotification("Contact rejected");
      await fetchSharedContacts();
    } catch (err) {
      console.error(err);
      showNotification("Error rejecting", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredContacts = contacts.filter((c) =>
    [c.name, c.phone_number, c.email].some((f) => (f || "").toString().toLowerCase().includes(search.toLowerCase()))
  );

  const filteredShared = sharedContacts.filter((s) =>
    [s.contact_name, s.contact_phone, s.contact_email].some((f) => (f || "").toString().toLowerCase().includes(search.toLowerCase()))
  );

  // UI (Tailwind-based) — same structure as your previous UI
  return (
    <div className="min-h-screen bg-gray-100">
      {notif.show && (
        <div className={`fixed top-4 right-4 z-50 p-3 rounded shadow-md text-white ${notif.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {notif.message}
        </div>
      )}

      <header className="bg-green-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Contact Sharing</h1>
          <div className="flex space-x-3">
            <button onClick={() => setIsAddModalOpen(true)} className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-100">Add Contact</button>
            <button onClick={() => { setSelectedContactId(""); setSelectedUserId(""); setIsShareModalOpen(true); }} className="bg-green-700 px-4 py-2 rounded-md hover:bg-green-800">Share Contact</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="relative">
            <input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none" />
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Contacts */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Contacts</h2>
              <span className="text-sm text-gray-500">{contacts.length}</span>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No contacts found.</div>
            ) : (
              <ul className="divide-y">
                {filteredContacts.map((c) => (
                  <li key={c.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-gray-600">{c.phone_number}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => { setSelectedContactId(c.id); setIsShareModalOpen(true); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Share</button>
                      <button onClick={() => handleDeleteContact(c.id)} className="text-red-600 text-sm">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Shared with me */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Shared With Me</h2>
              <span className="text-sm text-gray-500">{sharedContacts.length}</span>
            </div>

            {filteredShared.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No shared contacts.</div>
            ) : (
              <ul className="divide-y">
                {filteredShared.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{s.contact_name}</div>
                        <div className="text-sm text-gray-600">{s.contact_phone}</div>
                        {s.contact_email && <div className="text-xs text-gray-400">{s.contact_email}</div>}
                        <div className="text-xs text-gray-400 mt-1">Shared by: {s.sender?.username || "Unknown"}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!s.is_accepted ? (
                          <>
                            <button onClick={() => handleAcceptContact(s.id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Accept</button>
                            <button onClick={() => handleRejectContact(s.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
                          </>
                        ) : (
                          <span className="text-green-700 text-sm font-semibold">Accepted</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-3">
              <input required value={newContact.name} onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="w-full p-2 border rounded" />
              <input required value={newContact.phone_number} onChange={(e) => setNewContact((s) => ({ ...s, phone_number: e.target.value }))} placeholder="Phone number" className="w-full p-2 border rounded" />
              <input value={newContact.email} onChange={(e) => setNewContact((s) => ({ ...s, email: e.target.value }))} placeholder="Email (optional)" className="w-full p-2 border rounded" />

              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? "Adding..." : "Add Contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Contact Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Share Contact</h3>

            <div className="space-y-3">
              <select value={selectedContactId} onChange={(e) => setSelectedContactId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Choose your contact</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone_number}</option>)}
              </select>

              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select recipient user</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>

              <div className="flex justify-end space-x-3 pt-3">
                <button onClick={() => { setIsShareModalOpen(false); setSelectedContactId(""); setSelectedUserId(""); }} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleShareContact} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "Sharing..." : "Share Contact"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

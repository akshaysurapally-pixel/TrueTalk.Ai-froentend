import React, { useState } from "react";

const ContactSharingApp = () => {
  // Dummy data (you can replace with API data later)
  const [contacts, setContacts] = useState([
    { id: 1, name: "Akshay", phone_number: "9999999999", email: "akshay@mail.com" },
    { id: 2, name: "Ravi", phone_number: "8888888888", email: "ravi@mail.com" },
  ]);

  const [sharedContacts, setSharedContacts] = useState([
    {
      id: 1,
      contact_name: "John",
      contact_phone: "7777777777",
      contact_email: "john@mail.com",
      sender: { username: "admin" },
      is_accepted: false,
    },
  ]);

  const [users] = useState([
    { id: 10, username: "mahesh" },
    { id: 12, username: "priya" },
  ]);

  const [activeTab, setActiveTab] = useState("myContacts");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal controls
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  // New contact form
  const [newContact, setNewContact] = useState({
    name: "",
    phone_number: "",
    email: "",
  });

  // Share form
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // Filter logic
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSharedContacts = sharedContacts.filter((c) =>
    c.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const addContact = (e) => {
    e.preventDefault();
    const newId = Date.now();
    setContacts([...contacts, { id: newId, ...newContact }]);
    setNewContact({ name: "", phone_number: "", email: "" });
    setIsAddContactModalOpen(false);
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const acceptShared = (id) => {
    const item = sharedContacts.find((c) => c.id === id);
    setContacts([
      ...contacts,
      {
        id: Date.now(),
        name: item.contact_name,
        phone_number: item.contact_phone,
        email: item.contact_email,
      },
    ]);

    setSharedContacts(sharedContacts.filter((c) => c.id !== id));
  };

  const rejectShared = (id) => {
    setSharedContacts(sharedContacts.filter((c) => c.id !== id));
  };

  const shareContact = () => {
    alert("This is frontend only. Backend coming later!");
    setIsShareModalOpen(false);
  };

  // UI Rendering
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 shadow">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Contact Sharing App</h1>

          <div className="space-x-3">
            <button
              onClick={() => setIsAddContactModalOpen(true)}
              className="bg-white text-green-600 px-4 py-2 rounded"
            >
              Add Contact
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-green-800 px-4 py-2 rounded"
            >
              Share Contact
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Search Box */}
        <div className="bg-white p-3 rounded shadow mb-4">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full border p-2 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded shadow mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("myContacts")}
              className={`flex-1 py-3 ${
                activeTab === "myContacts"
                  ? "border-b-2 border-green-600 text-green-600"
                  : "text-gray-500"
              }`}
            >
              My Contacts ({contacts.length})
            </button>

            <button
              onClick={() => setActiveTab("shared")}
              className={`flex-1 py-3 ${
                activeTab === "shared"
                  ? "border-b-2 border-green-600 text-green-600"
                  : "text-gray-500"
              }`}
            >
              Shared With Me ({sharedContacts.length})
            </button>
          </div>
        </div>

        {/* My Contacts */}
        {activeTab === "myContacts" && (
          <div className="bg-white rounded shadow divide-y">
            {filteredContacts.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{c.name}</h3>
                  <p className="text-gray-600">{c.phone_number}</p>
                  {c.email && <p className="text-gray-500 text-sm">{c.email}</p>}
                </div>

                <button
                  onClick={() => deleteContact(c.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <p className="p-6 text-center text-gray-500">No contacts found.</p>
            )}
          </div>
        )}

        {/* Shared Contacts */}
        {activeTab === "shared" && (
          <div className="bg-white rounded shadow divide-y">
            {filteredSharedContacts.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{c.contact_name}</h3>
                  <p className="text-gray-600">{c.contact_phone}</p>
                  {c.contact_email && (
                    <p className="text-gray-500 text-sm">{c.contact_email}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Shared by {c.sender.username}
                  </p>
                </div>

                {!c.is_accepted && (
                  <div className="space-x-2">
                    <button
                      onClick={() => acceptShared(c.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectShared(c.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredSharedContacts.length === 0 && (
              <p className="p-6 text-center text-gray-500">No shared contacts.</p>
            )}
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow w-80">
            <h2 className="text-xl mb-4">Add Contact</h2>

            <form onSubmit={addContact} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                className="w-full border p-2 rounded"
                required
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Phone Number"
                className="w-full border p-2 rounded"
                required
                value={newContact.phone_number}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone_number: e.target.value })
                }
              />

              <input
                type="email"
                placeholder="Email (optional)"
                className="w-full border p-2 rounded"
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
              />

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Contact Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow w-80">
            <h2 className="text-xl mb-4">Share Contact</h2>

            <select
              className="w-full border p-2 rounded mb-3"
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
            >
              <option value="">Select Contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="w-full border p-2 rounded mb-3"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setIsShareModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={shareContact}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSharingApp;

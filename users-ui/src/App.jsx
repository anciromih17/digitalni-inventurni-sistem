import React, { useEffect, useState } from "react";
import "./styles.css";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8010" : "/api-gateway";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || JSON.stringify(data) || "Request failed");
  }

  return data;
}

export default function App({ currentUser, authToken }) {
  const isAdmin = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [userLookupId, setUserLookupId] = useState("");
  const [roleForm, setRoleForm] = useState({ userId: "", role: "USER" });
  const [selected, setSelected] = useState(currentUser || null);
  const [feedback, setFeedback] = useState("Modul uporabnikov je pripravljen.");

  async function loadUsers() {
    const data = await request("/api/users", authToken);
    setUsers(data);
  }

  async function loadUserById(id) {
    const user = await request(`/api/users/${id}`, authToken);
    setSelected(user);
    setRoleForm({ userId: user.id, role: user.role || "USER" });
    setUserLookupId(user.id);
  }

  async function loadOwnProfile() {
    const user = await request("/api/users/me", authToken);
    setSelected(user);
    setRoleForm({ userId: user.id, role: user.role || "USER" });
    setUserLookupId(user.id);
  }

  async function updateRole(event) {
    event.preventDefault();
    const user = await request(`/api/users/${roleForm.userId}/role`, authToken, {
      method: "PUT",
      body: JSON.stringify({ role: roleForm.role }),
    });
    setSelected(user);
    setFeedback(`Vloga uporabnika ${user.username} je bila posodobljena na ${user.role}.`);
    await loadUsers();
  }

  async function deleteUser(id) {
    await request(`/api/users/${id}`, authToken, { method: "DELETE" });
    setFeedback(`Uporabnik ${id} je bil izbrisan.`);
    if (selected?.id === id) {
      setSelected(null);
    }
    await loadUsers();
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers().catch((error) => setFeedback(error.message));
    } else {
      loadOwnProfile().catch((error) => setFeedback(error.message));
    }
  }, [authToken, isAdmin]);

  useEffect(() => {
    if (currentUser) {
      setSelected(currentUser);
      setRoleForm({ userId: currentUser.id || "", role: currentUser.role || "USER" });
      setUserLookupId(currentUser.id || "");
    }
  }, [currentUser]);

  return (
    <section className="domain">
      <p className="feedback">{feedback}</p>

      <div className="domain-grid">
        <article className="panel">
          <h3>Moj profil in pregled</h3>
          <div className="form-grid compact">
            <label>
              User ID
              <input value={userLookupId} onChange={(event) => setUserLookupId(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="button" onClick={() => loadUserById(userLookupId).catch((error) => setFeedback(error.message))}>
                Naloži uporabnika
              </button>
              {!isAdmin ? (
                <button type="button" className="ghost-button" onClick={() => loadOwnProfile().catch((error) => setFeedback(error.message))}>
                  Moj profil
                </button>
              ) : null}
            </div>
          </div>
          <div className="lookup">
            <pre>{JSON.stringify(selected || currentUser, null, 2)}</pre>
          </div>
        </article>

        {isAdmin ? (
        <article className="panel">
          <h3>Spremeni vlogo</h3>
          <form className="form-grid compact" onSubmit={updateRole}>
            <label>
              User ID
              <input value={roleForm.userId} onChange={(event) => setRoleForm({ ...roleForm, userId: event.target.value })} />
            </label>
            <label>
              Nova vloga
              <select value={roleForm.role} onChange={(event) => setRoleForm({ ...roleForm, role: event.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <div className="button-row">
              <button type="submit">Posodobi vlogo</button>
            </div>
          </form>
        </article>
        ) : (
        <article className="panel">
          <h3>Dovoljenja uporabnika</h3>
          <p className="feedback">Kot USER lahko vidiš le svoj profil. Sprememba vlog in brisanje uporabnikov sta omejena na ADMIN.</p>
        </article>
        )}
      </div>

      <div className="domain-grid">
        <article className="panel">
          <h3>Izbran uporabnik</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </article>

        {isAdmin ? (
        <article className="panel">
          <h3>Seznam uporabnikov</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td className="actions">
                      <button type="button" onClick={() => loadUserById(user.id).catch((error) => setFeedback(error.message))}>
                        Detajli
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setRoleForm({ userId: user.id, role: user.role || "USER" });
                          setSelected(user);
                        }}
                      >
                        Uredi vlogo
                      </button>
                      <button type="button" className="danger-button" onClick={() => deleteUser(user.id).catch((error) => setFeedback(error.message))}>
                        Izbriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        ) : null}
      </div>
    </section>
  );
}

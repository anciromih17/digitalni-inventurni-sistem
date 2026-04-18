import React, { useEffect, useState } from "react";
import "./styles.css";

const API_BASE = "http://localhost:8010";

const emptyRegistration = {
  username: "",
  email: "",
  password: "",
  role: "USER",
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

export default function App() {
  const [users, setUsers] = useState([]);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [loginUsername, setLoginUsername] = useState("");
  const [userLookupId, setUserLookupId] = useState("");
  const [roleForm, setRoleForm] = useState({ userId: "", role: "USER" });
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("Modul uporabnikov je pripravljen.");

  async function loadUsers() {
    const data = await request("/api/users");
    setUsers(data);
  }

  async function registerUser(event) {
    event.preventDefault();
    const user = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(registration),
    });
    setFeedback(`Uporabnik ${user.username} je bil registriran.`);
    setRegistration(emptyRegistration);
    await loadUsers();
  }

  async function loginUser(event) {
    event.preventDefault();
    const result = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: loginUsername }),
    });
    setSelected(result.user);
    setFeedback(`Prijava uspešna za ${result.user.username}.`);
  }

  async function loadUserById(id) {
    const user = await request(`/api/users/${id}`);
    setSelected(user);
    setRoleForm({ userId: user.id, role: user.role || "USER" });
    setUserLookupId(user.id);
  }

  async function updateRole(event) {
    event.preventDefault();
    const user = await request(`/api/users/${roleForm.userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: roleForm.role }),
    });
    setSelected(user);
    setFeedback(`Vloga uporabnika ${user.username} je bila posodobljena na ${user.role}.`);
    await loadUsers();
  }

  async function deleteUser(id) {
    await request(`/api/users/${id}`, { method: "DELETE" });
    setFeedback(`Uporabnik ${id} je bil izbrisan.`);
    if (selected?.id === id) {
      setSelected(null);
    }
    await loadUsers();
  }

  useEffect(() => {
    loadUsers().catch((error) => setFeedback(error.message));
  }, []);

  return (
    <section className="domain">
      <header className="domain-header">
        <div>
          <h2>Uporabniki Micro Frontend</h2>
          <p>Prek `web-bff` testiraš registracijo, prijavo, seznam uporabnikov, podrobnosti, menjavo vlog in brisanje.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => loadUsers().catch((error) => setFeedback(error.message))}>
          Osveži seznam
        </button>
      </header>

      <p className="feedback">{feedback}</p>

      <div className="domain-grid">
        <article className="panel">
          <h3>Registracija</h3>
          <form className="form-grid" onSubmit={registerUser}>
            <label>
              Username
              <input required value={registration.username} onChange={(event) => setRegistration({ ...registration, username: event.target.value })} />
            </label>
            <label>
              Email
              <input required value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} />
            </label>
            <label>
              Password
              <input required type="password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} />
            </label>
            <label>
              Vloga
              <select value={registration.role} onChange={(event) => setRegistration({ ...registration, role: event.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <div className="button-row">
              <button type="submit">Registriraj</button>
              <button type="button" className="ghost-button" onClick={() => setRegistration(emptyRegistration)}>
                Ponastavi
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h3>Prijava in podrobnosti</h3>
          <form className="form-grid compact" onSubmit={loginUser}>
            <label>
              Username za login
              <input value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="submit">Prijavi</button>
            </div>
          </form>
          <div className="form-grid compact lookup">
            <label>
              User ID
              <input value={userLookupId} onChange={(event) => setUserLookupId(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="button" onClick={() => loadUserById(userLookupId).catch((error) => setFeedback(error.message))}>
                Naloži uporabnika
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="domain-grid">
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

        <article className="panel">
          <h3>Izbran uporabnik</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </article>
      </div>

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
    </section>
  );
}

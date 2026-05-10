import React, { Suspense, useEffect, useState } from "react";
import logo from "./assets/logo_LL.png";
import dashboardIcon from "./assets/icon-dashboard.svg";
import inventoryIcon from "./assets/icon-inventory.svg";
import reservationsIcon from "./assets/icon-reservations.svg";
import userIcon from "./assets/icon-user.svg";

const InventoryApp = React.lazy(() => import("inventory/App"));
const ReservationsApp = React.lazy(() => import("reservations/App"));
const UsersApp = React.lazy(() => import("users/App"));

const API_BASE = "http://localhost:8010";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, component: null },
  { id: "inventory", label: "Inventar", icon: inventoryIcon, component: InventoryApp },
  { id: "reservations", label: "Rezervacije", icon: reservationsIcon, component: ReservationsApp },
];

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
    throw new Error(data?.error || data?.message || data?.upstream?.detail || "Request failed");
  }

  return data;
}

function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const [loginUsername, setLoginUsername] = useState("");
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const result = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: loginUsername }),
      });

      onAuthenticated(result.user);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const user = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...registerForm, role: "USER" }),
      });

      setLoginUsername(user.username);
      setRegisterForm({ username: "", email: "", password: "" });
      setFeedback(`Uporabnik ${user.username} je bil uspešno ustvarjen. Nadaljuj s prijavo.`);
      onModeChange("login");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-copy">
          <img src={logo} alt="Logo" className="auth-logo" />
          <span className="auth-eyebrow">Digitalni inventurni sistem</span>
          <h1>Vstop v aplikacijo</h1>
          <p>
            Prijava in registracija sta zdaj ločeni od administrativnega modula za uporabnike.
            Po prijavi dostopaš do dashboarda, inventarja, rezervacij in uporabnikov.
          </p>
          <div className="auth-points">
            <div>Micro frontend shell z ločenimi domenskimi moduli</div>
            <div>Dostop do zaledja izključno prek `web-bff`</div>
            <div>Inventory, reservations in users funkcionalnosti na enem mestu</div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => onModeChange("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => onModeChange("register")}
            >
              Register
            </button>
          </div>

          <div className="auth-panel-body">
            {mode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-heading">
                  <h2>Prijava</h2>
                  <p>Prijavi se z uporabniškim imenom, ki obstaja v users servisu.</p>
                </div>

                <label>
                  Username
                  <input
                    required
                    value={loginUsername}
                    onChange={(event) => setLoginUsername(event.target.value)}
                    placeholder="npr. ana"
                  />
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Prijavljam ..." : "Prijava"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-heading">
                  <h2>Registracija</h2>
                  <p>Ustvari nov uporabniški račun. Privzeta vloga novega računa je `USER`.</p>
                </div>

                <label>
                  Username
                  <input
                    required
                    value={registerForm.username}
                    onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                    placeholder="npr. ana"
                  />
                </label>

                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                    placeholder="ana@test.si"
                  />
                </label>

                <label>
                  Password
                  <input
                    required
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                    placeholder="••••••••"
                  />
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Ustvarjam račun ..." : "Ustvari račun"}
                </button>
              </form>
            )}

            {feedback ? <div className="auth-feedback">{feedback}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    request("/api/dashboard")
      .then((payload) => {
        if (active) {
          setData(payload);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats || {};
  const latestReservation = data?.latestReservations?.[0];
  const highlightedItem = data?.highlightedItems?.[0];

  return (
    <section className="dashboard">
      <div className="dashboard-grid">
        <article className="dash-card inventory-summary">
          <div className="dash-card-title">Inventory Summary</div>
          <div className="metric success">
            <span>Total Items</span>
            <strong>{stats.totalItems ?? "-"}</strong>
          </div>
          <div className="metric danger">
            <span>Pending Reservations</span>
            <strong>{stats.pendingReservations ?? "-"}</strong>
          </div>
        </article>

        <article className="dash-card">
          <div className="dash-card-title">Current Item Status</div>
          <div className="soft-list-item">
            <strong>{highlightedItem?.name || "Ni izbrane opreme"}</strong>
            <span>{highlightedItem?.status || "Dodaj opremo v modulu Inventar"}</span>
          </div>
        </article>

        <article className="dash-card">
          <div className="dash-card-title">Latest Reservation</div>
          <div className="package-card">
            <strong>{latestReservation?.id || "-"}</strong>
            <span>{latestReservation?.reserved_by || "Ni rezervacij"}</span>
            <small>{latestReservation?.status || "Ustvari rezervacijo v modulu Rezervacije"}</small>
          </div>
        </article>
      </div>

      <article className="dash-card wide">
        <div className="dash-card-title">Reservation Schedule</div>
        <div className="schedule-grid">
          <div className="schedule-box">
            <strong>Today</strong>
            <span>{latestReservation ? `${latestReservation.reserved_by} ima aktivno rezervacijo.` : "Ni rezervacij za prikaz."}</span>
          </div>
          <div className="schedule-box">
            <strong>Next Reservation</strong>
            <span>{latestReservation ? `Item #${latestReservation.item_id}, ${latestReservation.start_date}` : "Ni prihajajočih rezervacij."}</span>
          </div>
          <div className="schedule-box">
            <strong>System Overview</strong>
            <span>{error || "Vsi moduli so pripravljeni za delo."}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!currentUser) {
    return (
      <div className="shell">
        <AuthScreen
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={(user) => {
            setCurrentUser(user);
            setActiveTab("dashboard");
          }}
        />
      </div>
    );
  }

  const active = activeTab === "users"
    ? { id: "users", label: "Uporabniki", component: UsersApp }
    : tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveComponent = active.component;

  return (
    <div className="shell">
      <section className="workspace">
        <aside className="sidebar">
          <div className="logo-wrap">
            <img src={logo} alt="Logo" />
          </div>
          <nav className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={tab.id === activeTab ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                type="button"
              >
                <img src={tab.icon} alt="" />
              </button>
            ))}
          </nav>
        </aside>

        <main className="content-frame">
          <header className="content-header">
            <div>
              <span className="user-kicker">Prijavljen uporabnik</span>
              <h1>{active.label}</h1>
            </div>
            <div className="top-actions">
              <div className="session-chip">
                <strong>{currentUser.username}</strong>
                <span>{currentUser.role}</span>
              </div>
              <button type="button" className="round-action user-action" title="Uporabniki" onClick={() => setActiveTab("users")}>
                <img src={userIcon} alt="Uporabniki" />
              </button>
              <button
                type="button"
                className="session-button"
                onClick={() => {
                  setCurrentUser(null);
                  setAuthMode("login");
                }}
              >
                Odjava
              </button>
            </div>
          </header>
          {activeTab === "dashboard" ? (
            <Dashboard />
          ) : (
            <Suspense fallback={<div className="loading-panel">Nalagam modul {active.label} ...</div>}>
              <ActiveComponent currentUser={currentUser} />
            </Suspense>
          )}
        </main>
      </section>
    </div>
  );
}

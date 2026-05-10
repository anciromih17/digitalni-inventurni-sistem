import React, { Suspense, useEffect, useState } from "react";
import logo from "./assets/logo_LL.png";
import dashboardIcon from "./assets/icon-dashboard.svg";
import historyIcon from "./assets/icon-history.svg";
import inventoryIcon from "./assets/icon-inventory.svg";
import logoutIcon from "./assets/icon-logout.svg";
import reservationsIcon from "./assets/icon-reservations.svg";
import userIcon from "./assets/icon-user.svg";

const InventoryApp = React.lazy(() => import("inventory/App"));
const ReservationsApp = React.lazy(() => import("reservations/App"));
const UsersApp = React.lazy(() => import("users/App"));

const API_BASE = "http://localhost:8010";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, component: null },
  { id: "history", label: "Zgodovina", icon: historyIcon, component: null },
  { id: "inventory", label: "Inventar", icon: inventoryIcon, component: InventoryApp },
  { id: "reservations", label: "Rezervacije", icon: reservationsIcon, component: ReservationsApp },
];

const headerCopy = {
  dashboard: {
    title: "Dashboard",
  },
  history: {
    title: "Zgodovina",
  },
  inventory: {
    title: "Inventar",
  },
  reservations: {
    title: "Rezervacije",
  },
  users: {
    title: "Uporabniki",
  },
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
    throw new Error(data?.error || data?.message || data?.upstream?.detail || "Request failed");
  }

  return data;
}

function getStoredSession() {
  try {
    const raw = window.localStorage.getItem("digitalni-inventurni-sistem-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  window.localStorage.setItem("digitalni-inventurni-sistem-session", JSON.stringify(session));
}

function clearStoredSession() {
  window.localStorage.removeItem("digitalni-inventurni-sistem-session");
}

function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      onAuthenticated(result);
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
      <div className={mode === "register" ? "auth-card register-mode" : "auth-card login-mode"}>
        <div className="auth-copy">
          <img src={logo} alt="Logo" className="auth-logo" />
          <span className="auth-eyebrow">Digitalni inventurni sistem</span>
        </div>

        <div className="auth-panel">
          <div className={mode === "register" ? "auth-tabs register" : "auth-tabs"}>
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

                <label>
                  Password
                  <input
                    required
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="••••••••"
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

function Dashboard({ authToken }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    request("/api/dashboard", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
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
  }, [authToken]);

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

function AuditHistory({ authToken }) {
  const [service, setService] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedKey, setExpandedKey] = useState(null);
  const [itemNames, setItemNames] = useState({});

  useEffect(() => {
    let active = true;

    request("/api/items", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((items) => {
        if (!active) {
          return;
        }

        const nextMap = Object.fromEntries((items || []).map((item) => [String(item.id), item.name]));
        setItemNames(nextMap);
      })
      .catch(() => {
        if (active) {
          setItemNames({});
        }
      });

    return () => {
      active = false;
    };
  }, [authToken]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const query = service === "all" ? "/api/audit-logs" : `/api/audit-logs?service=${service}`;

    request(query, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((payload) => {
        if (!active) {
          return;
        }

        setLogs(payload.logs || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [service, authToken]);

  function getDisplayName(log) {
    const details = log.details || {};
    const entityId = log.entity_id ?? log.entityId;
    const relatedItemId = details.item_id ?? details.itemId;
    const itemName = relatedItemId ? itemNames[String(relatedItemId)] : itemNames[String(entityId)];

    if (details.name) {
      return details.name;
    }

    if (itemName) {
      return itemName;
    }

    if (details.username) {
      return details.username;
    }

    if (details.reserved_by) {
      return details.reserved_by;
    }

    if (log.entity_type === "user") {
      return log.actor || (entityId ? `Uporabnik ${entityId}` : "Uporabnik");
    }

    if (log.entity_type === "reservation") {
      return log.actor || (entityId ? `Rezervacija ${entityId}` : "Rezervacija");
    }

    return entityId ? `${log.entity_type || "Entiteta"} ${entityId}` : (log.entity_type || "Zapis");
  }

  return (
    <section className="history-view">
      <div className="history-toolbar">
        <div className="history-actions">
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="all">Vse storitve</option>
            <option value="inventory">Inventar</option>
            <option value="reservations">Rezervacije</option>
            <option value="users">Uporabniki</option>
          </select>
        </div>
      </div>

      {error ? <div className="history-feedback error">{error}</div> : null}
      {!error && loading ? <div className="history-feedback">Nalagam audit zapise ...</div> : null}

      {!loading && !error ? (
        <div className="history-grid">
          {logs.length === 0 ? (
            <article className="history-card empty">
              <strong>Ni audit zapisov</strong>
              <span>Ko boš ustvarila ali spremenila podatke, se bodo prikazali tukaj.</span>
            </article>
          ) : (
            logs.map((log) => {
              const createdAt = log.created_at || log.createdAt;
              const details = log.details || {};
              const entityId = log.entity_id ?? log.entityId ?? "-";
              const cardKey = `${log.source || log.service_name}-${log.id}`;
              const expanded = expandedKey === cardKey;
              const displayName = getDisplayName(log);

              return (
                <article
                  key={cardKey}
                  className={expanded ? "history-card expanded" : "history-card"}
                >
                  <button
                    type="button"
                    className="history-toggle"
                    onClick={() => setExpandedKey(expanded ? null : cardKey)}
                  >
                    <div className="history-card-top">
                      <span className={`history-chip ${log.source || log.service_name}`}>
                        {log.source || log.service_name}
                      </span>
                      <time>{createdAt ? new Date(createdAt).toLocaleString("sl-SI") : "-"}</time>
                    </div>
                    <div className="history-card-main">
                      <strong>{log.action}</strong>
                      <span>{displayName}</span>
                    </div>                    
                  </button>

                  {expanded ? (
                    <>
                      <div className="history-meta">
                        <span>Entiteta: {log.entity_type}</span>
                        <span>{displayName}</span>
                        <span>Akter: {log.actor}</span>
                        <span>Interni ID: {entityId}</span>
                      </div>
                      <pre>{JSON.stringify(details, null, 2)}</pre>
                    </>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      ) : null}
    </section>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const storedSession = getStoredSession();
  const [currentUser, setCurrentUser] = useState(storedSession?.user || null);
  const [authToken, setAuthToken] = useState(storedSession?.token || "");
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!currentUser) {
    return (
      <div className="shell">
        <AuthScreen
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={(session) => {
            setCurrentUser(session.user);
            setAuthToken(session.token);
            storeSession(session);
            setActiveTab("dashboard");
          }}
        />
      </div>
    );
  }

  const visibleTabs = currentUser.role === "ADMIN"
    ? tabs
    : tabs.filter((tab) => tab.id !== "history");

  const safeActiveTab = visibleTabs.some((tab) => tab.id === activeTab) || activeTab === "users"
    ? activeTab
    : "dashboard";

  const active = safeActiveTab === "users"
    ? { id: "users", label: "Uporabniki", component: UsersApp }
    : visibleTabs.find((tab) => tab.id === safeActiveTab) || visibleTabs[0];
  const ActiveComponent = active.component;
  const currentHeader = headerCopy[active.id] || headerCopy.dashboard;

  return (
    <div className="shell">
      <section className="workspace">
        <aside className="sidebar">
          <div className="logo-wrap">
            <img src={logo} alt="Logo" />
          </div>
          <nav className="tab-bar">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={tab.id === safeActiveTab ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                type="button"
              >
                <img src={tab.icon} alt="" />
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="logout-button"
            title="Odjava"
            onClick={() => {
              clearStoredSession();
              setCurrentUser(null);
              setAuthToken("");
              setAuthMode("login");
            }}
          >
            <img src={logoutIcon} alt="Odjava" />
          </button>
        </aside>

        <main className="content-frame">
          <header className="content-header">
            <div>
              <span className="user-kicker">Digitalni inventurni sistem</span>
              <h1>{currentHeader.title}</h1>
              <p>{currentHeader.description}</p>
            </div>
            <div className="top-actions">
              <div className="session-chip">
                <strong>{currentUser.username}</strong>
                <span>{currentUser.role}</span>
              </div>
              <button type="button" className="round-action user-action" title="Uporabniki" onClick={() => setActiveTab("users")}>
                <img src={userIcon} alt="Uporabniki" />
              </button>
            </div>
          </header>
          {safeActiveTab === "dashboard" ? (
            <Dashboard authToken={authToken} />
          ) : safeActiveTab === "history" ? (
            <AuditHistory authToken={authToken} />
          ) : (
            <Suspense fallback={<div className="loading-panel">Nalagam modul {active.label} ...</div>}>
              <ActiveComponent currentUser={currentUser} authToken={authToken} />
            </Suspense>
          )}
        </main>
      </section>
    </div>
  );
}

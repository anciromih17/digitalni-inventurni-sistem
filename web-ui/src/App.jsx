import React, { Suspense, useEffect, useState } from "react";
import logo from "./assets/logo_LL.png";
import dashboardIcon from "./assets/icon-dashboard.svg";
import inventoryIcon from "./assets/icon-inventory.svg";
import reservationsIcon from "./assets/icon-reservations.svg";
import userIcon from "./assets/icon-user.svg";

const InventoryApp = React.lazy(() => import("inventory/App"));
const ReservationsApp = React.lazy(() => import("reservations/App"));
const UsersApp = React.lazy(() => import("users/App"));

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, component: null },
  { id: "inventory", label: "Inventar", icon: inventoryIcon, component: InventoryApp },
  { id: "reservations", label: "Rezervacije", icon: reservationsIcon, component: ReservationsApp },
];

function StatusCard({ title, url }) {
  const [state, setState] = useState({ loading: true, ok: false, message: "" });

  useEffect(() => {
    let active = true;

    fetch(url)
      .then(async (response) => {
        const data = await response.json();
        if (!active) {
          return;
        }

        setState({
          loading: false,
          ok: response.ok,
          message: JSON.stringify(data),
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          ok: false,
          message: error.message,
        });
      });

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className={`status-card ${state.ok ? "ok" : "fail"}`}>
      <div className="status-label">{title}</div>
      <div className="status-value">{state.loading ? "Preverjam ..." : state.ok ? "OK" : "Napaka"}</div>
      <code>{state.message}</code>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("http://localhost:8010/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!active) {
          return;
        }

        if (!response.ok) {
          throw new Error(payload?.error || "Dashboard request failed");
        }

        setData(payload);
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
            <strong>System Status</strong>
            <span>{error || "Vsi moduli so pripravljeni za delo."}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
              <h1>{active.label}</h1>
            </div>
            <div className="top-actions">
              <button type="button" className="round-action user-action" title="Uporabniki" onClick={() => setActiveTab("users")}>
                <img src={userIcon} alt="Uporabniki" />
              </button>
            </div>
          </header>
          <div className="status-strip">
            <StatusCard title="Web BFF" url="http://localhost:8010/health" />
            <StatusCard title="Mobile BFF" url="http://localhost:8011/health" />
          </div>
          {activeTab === "dashboard" ? (
            <Dashboard />
          ) : (
            <Suspense fallback={<div className="loading-panel">Nalagam modul {active.label} ...</div>}>
              <ActiveComponent />
            </Suspense>
          )}
        </main>
      </section>
    </div>
  );
}

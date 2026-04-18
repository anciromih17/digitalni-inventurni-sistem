import React, { Suspense, useEffect, useState } from "react";

const InventoryApp = React.lazy(() => import("inventory/App"));
const ReservationsApp = React.lazy(() => import("reservations/App"));
const UsersApp = React.lazy(() => import("users/App"));

const tabs = [
  { id: "inventory", label: "Inventar", component: InventoryApp },
  { id: "reservations", label: "Rezervacije", component: ReservationsApp },
  { id: "users", label: "Uporabniki", component: UsersApp },
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

export default function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveComponent = active.component;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Digitalni Inventurni Sistem</p>
          <h1>Nadzorna plošča</h1>
          <p className="hero-copy">
            Enotna spletna aplikacija po vzorcu Micro Frontends za delo z
            inventarjem, rezervacijami in uporabniki.
          </p>
        </div>
        <div className="status-grid">
          <StatusCard title="Web BFF" url="http://localhost:8010/health" />
          <StatusCard title="Mobile BFF" url="http://localhost:8011/health" />
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-title">Moduli</div>
          <nav className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={tab.id === activeTab ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            Aktivni modul:
            <strong> {active.label}</strong>
          </div>
        </aside>

        <main className="content-frame">
          <div className="content-header">
            <div>
              <div className="content-eyebrow">Aktivni pogled</div>
              <h2>{active.label}</h2>
            </div>
          </div>
          <Suspense fallback={<div className="loading-panel">Nalagam modul {active.label} ...</div>}>
            <ActiveComponent />
          </Suspense>
        </main>
      </section>
    </div>
  );
}

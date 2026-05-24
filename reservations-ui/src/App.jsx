import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8010" : "/api-gateway";

const emptyReservation = {
  id: "",
  item_id: "",
  reserved_by: "",
  start_date: "",
  end_date: "",
  quantity: 1,
  status: "PENDING",
};

const emptyBundle = {
  reserved_by: "",
  start_date: "",
  end_date: "",
  status: "PENDING",
};

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
  const [reservations, setReservations] = useState([]);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: "", reserved_by: "" });
  const [form, setForm] = useState(emptyReservation);
  const [bundleForm, setBundleForm] = useState(emptyBundle);
  const [selectedItems, setSelectedItems] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [selected, setSelected] = useState(null);
  const [returnForm, setReturnForm] = useState({ reservationId: "", quantity: "" });
  const [feedback, setFeedback] = useState("Modul rezervacij je pripravljen.");

  async function loadReservations(query = filters) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const path = params.toString()
      ? `/api/reservations/search?${params.toString()}`
      : "/api/reservations";

    const data = await request(path, authToken);
    setReservations(data);
  }

  async function loadItems() {
    const data = await request("/api/items", authToken);
    setItems(data);
  }

  async function loadReservationById(id) {
    const data = await request(`/api/reservations/${id}`, authToken);
    setSelected(data);
    setForm({
      id: data.id,
      item_id: data.item_id,
      reserved_by: data.reserved_by,
      start_date: data.start_date,
      end_date: data.end_date,
      quantity: data.quantity,
      status: data.status,
    });
    setReturnForm({ reservationId: String(data.id), quantity: "" });
  }

  function toggleItem(itemId) {
    setSelectedItems((previous) => {
      const next = { ...previous };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = 1;
      }
      return next;
    });
  }

  function setSelectedItemQuantity(itemId, quantity, maxQuantity) {
    setSelectedItems((previous) => {
      const next = { ...previous };
      const normalized = Math.max(0, Math.min(Number(quantity) || 0, maxQuantity));

      if (normalized <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = normalized;
      }

      return next;
    });
  }

  function toggleExpandedItem(itemId) {
    setExpandedItems((previous) => ({
      ...previous,
      [itemId]: !previous[itemId],
    }));
  }

  async function createReservationBundle(event) {
    event.preventDefault();

    const chosenEntries = Object.entries(selectedItems).filter(([, quantity]) => Number(quantity) > 0);
    if (chosenEntries.length === 0) {
      setFeedback("Najprej izberi vsaj en kos opreme za rezervacijo.");
      return;
    }

    const reservationOwner = currentUser?.role === "USER"
      ? currentUser.username
      : bundleForm.reserved_by;

    if (!reservationOwner) {
      setFeedback("Vnesi uporabnika za rezervacijo.");
      return;
    }

    const createdReservations = [];

    for (const [itemId, quantity] of chosenEntries) {
      const item = items.find((entry) => String(entry.id) === String(itemId));
      if (!item) {
        continue;
      }

      const payload = {
        item_id: Number(itemId),
        reserved_by: reservationOwner,
        start_date: bundleForm.start_date,
        end_date: bundleForm.end_date,
        quantity: Number(quantity),
        status: bundleForm.status,
      };

      const result = await request("/api/reservations", authToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      createdReservations.push(`${item.name} x${quantity} (rezervacija #${result.id})`);
    }

    setSelectedItems({});
    setBundleForm({
      reserved_by: currentUser?.role === "USER" ? currentUser.username || "" : "",
      start_date: "",
      end_date: "",
      status: "PENDING",
    });
    setFeedback(`Ustvarjene rezervacije: ${createdReservations.join(", ")}.`);
    await Promise.all([loadReservations(), loadItems()]);
  }

  async function onSubmit(event) {
    event.preventDefault();

    const payload = {
      item_id: Number(form.item_id),
      reserved_by: form.reserved_by,
      start_date: form.start_date,
      end_date: form.end_date,
      quantity: Number(form.quantity),
      status: form.status,
    };

    if (form.id) {
      await request(`/api/reservations/${form.id}`, authToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback(`Rezervacija #${form.id} je bila posodobljena.`);
      await loadReservationById(form.id);
    } else {
      setFeedback("Za posodobitev najprej izberi obstoječo rezervacijo iz seznama.");
    }

    await loadReservations();
  }

  async function deleteReservation(id) {
    await request(`/api/reservations/${id}`, authToken, { method: "DELETE" });
    setFeedback(`Rezervacija #${id} je bila izbrisana.`);
    if (String(form.id) === String(id)) {
      setForm(emptyReservation);
      setSelected(null);
    }
    await loadReservations();
  }

  async function returnReservation(id, quantity) {
    const payload = quantity ? { quantity: Number(quantity) } : {};
    const result = await request(`/api/reservations/${id}/return`, authToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setFeedback(
      `Vračilo uspešno: rezervacija #${result.reservation_id}, vrnjeno ${result.returned_quantity}, status ${result.status}.`
    );
    await loadReservations();
    await loadReservationById(id);
  }

  useEffect(() => {
    Promise.all([loadReservations(), loadItems()]).catch((error) => setFeedback(error.message));
  }, [authToken]);

  useEffect(() => {
    if (currentUser?.role === "USER") {
      setForm((previous) => ({ ...previous, reserved_by: currentUser.username || "" }));
      setFilters((previous) => ({ ...previous, reserved_by: currentUser.username || "" }));
      setBundleForm((previous) => ({ ...previous, reserved_by: currentUser.username || "" }));
    }
  }, [currentUser]);

  const groupedItems = useMemo(
    () =>
      items.reduce((groups, item) => {
        const key = item.category || "Ostalo";
        groups[key] = groups[key] || [];
        groups[key].push(item);
        return groups;
      }, {}),
    [items]
  );

  const totalSelectedQuantity = Object.values(selectedItems).reduce(
    (sum, quantity) => sum + Number(quantity || 0),
    0
  );

  return (
    <section className="domain">
      <p className="feedback">{feedback}</p>

      <div className="domain-grid">
        <article className="panel">
          <h3>Filtri</h3>
          <div className="form-grid compact">
            <label>
              Status
              <input value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} />
            </label>
            <label>
              Uporabnik
              <input
                value={filters.reserved_by}
                disabled={currentUser?.role === "USER"}
                onChange={(event) => setFilters({ ...filters, reserved_by: event.target.value })}
              />
            </label>
          </div>
          <div className="button-row">
            <button type="button" onClick={() => loadReservations(filters).catch((error) => setFeedback(error.message))}>
              Išči
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                const reset = {
                  status: "",
                  reserved_by: currentUser?.role === "USER" ? currentUser.username || "" : "",
                };
                setFilters(reset);
                loadReservations(reset).catch((error) => setFeedback(error.message));
              }}
            >
              Počisti
            </button>
          </div>
        </article>

        <article className="panel">
          <h3>Ustvari rezervacijo iz izbora opreme</h3>
          <form className="form-grid compact reservation-bundle-form" onSubmit={createReservationBundle}>
            <label>
              Rezerviral
              <input
                required
                disabled={currentUser?.role === "USER"}
                value={bundleForm.reserved_by}
                onChange={(event) => setBundleForm({ ...bundleForm, reserved_by: event.target.value })}
              />
            </label>
            <label>
              Začetek
              <input
                required
                value={bundleForm.start_date}
                onChange={(event) => setBundleForm({ ...bundleForm, start_date: event.target.value })}
              />
            </label>
            <label>
              Konec
              <input
                required
                value={bundleForm.end_date}
                onChange={(event) => setBundleForm({ ...bundleForm, end_date: event.target.value })}
              />
            </label>
            <label>
              Status
              <select value={bundleForm.status} onChange={(event) => setBundleForm({ ...bundleForm, status: event.target.value })}>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
            <div className="bundle-summary">
              <strong>Izbranih kosov: {totalSelectedQuantity}</strong>
              <span>Vsak izbran item se ustvari kot ločena rezervacija z istim časovnim oknom.</span>
            </div>
            <div className="button-row">
              <button type="submit">Ustvari rezervacijo</button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setSelectedItems({});
                  setBundleForm({
                    reserved_by: currentUser?.role === "USER" ? currentUser.username || "" : "",
                    start_date: "",
                    end_date: "",
                    status: "PENDING",
                  });
                }}
              >
                Počisti izbor
              </button>
            </div>
          </form>
        </article>
      </div>

      <article className="panel">
        <div className="panel-heading-row">
          <div>
            <h3>Izbor opreme za rezervacijo</h3>
            <p className="feedback subtle">
              Izberi konkretne iteme in količine. Na voljo so samo količine znotraj trenutnega `availability`.
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={() => loadItems().catch((error) => setFeedback(error.message))}>
            Osveži opremo
          </button>
        </div>

        <div className="reservation-groups">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="feedback">Ni razpoložljive opreme za prikaz.</div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} className="reservation-group">
                <div className="reservation-group-head">
                  <h4>{category}</h4>
                  <span>{categoryItems.length} artiklov</span>
                </div>
                <div className="reservation-item-grid">
                  {categoryItems.map((item) => {
                    const selectedQuantity = selectedItems[item.id] || 0;
                    const maxQuantity = Number(item.availableQuantity ?? item.available_quantity ?? 0);
                    const isSelected = selectedQuantity > 0;
                    const isExpanded = Boolean(expandedItems[item.id]);

                    return (
                      <article key={item.id} className={isSelected ? "reservation-item-card selected" : "reservation-item-card"}>
                        <button
                          type="button"
                          className="reservation-item-toggle"
                          onClick={() => toggleExpandedItem(item.id)}
                        >
                          <div className="reservation-item-top">
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.subcategory || item.item_type || item.location || "Inventarni artikel"}</span>
                            </div>
                            <div className="reservation-item-summary">
                              <span>{maxQuantity} na voljo</span>
                              <span className={isExpanded ? "reservation-caret open" : "reservation-caret"} aria-hidden="true">▾</span>
                            </div>
                          </div>
                        </button>

                        {isExpanded ? (
                          <>
                            <div className="reservation-item-meta">
                              <span>Status: {item.status}</span>
                              <span>Lokacija: {item.location || "-"}</span>
                              <span>Razpoložljivo: {maxQuantity}</span>
                            </div>

                            <div className="reservation-item-control-row">
                              <label className="item-toggle">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={maxQuantity <= 0}
                                  onChange={() => toggleItem(item.id)}
                                />
                                <span>{maxQuantity > 0 ? "Vključi v rezervacijo" : "Ni na voljo"}</span>
                              </label>

                              <div className="reservation-item-actions">
                                <button
                                  type="button"
                                  className="ghost-button"
                                  disabled={!isSelected}
                                  onClick={() => setSelectedItemQuantity(item.id, selectedQuantity - 1, maxQuantity)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxQuantity}
                                  disabled={!isSelected}
                                  value={selectedQuantity}
                                  onChange={(event) => setSelectedItemQuantity(item.id, event.target.value, maxQuantity)}
                                />
                                <button
                                  type="button"
                                  className="ghost-button"
                                  disabled={!isSelected || selectedQuantity >= maxQuantity}
                                  onClick={() => setSelectedItemQuantity(item.id, selectedQuantity + 1, maxQuantity)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </article>

      <div className="domain-grid">
        <article className="panel">
          <h3>Uredi izbrano rezervacijo</h3>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Reservation ID
              <input required type="number" min="1" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
            </label>
            <label>
              Item ID
              <input required type="number" min="1" value={form.item_id} onChange={(event) => setForm({ ...form, item_id: event.target.value })} />
            </label>
            <label>
              Rezerviral
              <input
                required
                disabled={currentUser?.role === "USER"}
                value={form.reserved_by}
                onChange={(event) => setForm({ ...form, reserved_by: event.target.value })}
              />
            </label>
            <label>
              Začetek
              <input required value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
            </label>
            <label>
              Konec
              <input required value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
            </label>
            <label>
              Količina
              <input required type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="PARTIALLY_RETURNED">PARTIALLY_RETURNED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </label>
            <div className="button-row">
              <button type="submit" disabled={!form.id}>Posodobi</button>
              <button type="button" className="ghost-button" onClick={() => setForm(emptyReservation)}>
                Počisti obrazec
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h3>Vračilo opreme</h3>
          <div className="form-grid compact">
            <label>
              Reservation ID
              <input
                value={returnForm.reservationId}
                onChange={(event) => setReturnForm({ ...returnForm, reservationId: event.target.value })}
              />
            </label>
            <label>
              Količina za delno vračilo
              <input
                type="number"
                min="1"
                value={returnForm.quantity}
                onChange={(event) => setReturnForm({ ...returnForm, quantity: event.target.value })}
              />
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              onClick={() =>
                returnReservation(returnForm.reservationId, returnForm.quantity).catch((error) =>
                  setFeedback(error.message)
                )
              }
            >
              Vrni po kosih
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                returnReservation(returnForm.reservationId).catch((error) => setFeedback(error.message))
              }
            >
              Vrni vse preostalo
            </button>
          </div>
        </article>
      </div>

      <article className="panel">
        <h3>Seznam rezervacij</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Uporabnik</th>
                <th>Status</th>
                <th>Količina</th>
                <th>Vrnjeno</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td>{reservation.item_id}</td>
                  <td>{reservation.reserved_by}</td>
                  <td>{reservation.status}</td>
                  <td>{reservation.quantity}</td>
                  <td>{reservation.returned_quantity ?? 0}</td>
                  <td className="actions">
                    <button type="button" onClick={() => loadReservationById(reservation.id).catch((error) => setFeedback(error.message))}>
                      Detajli
                    </button>
                    <button type="button" className="ghost-button" onClick={() => returnReservation(reservation.id).catch((error) => setFeedback(error.message))}>
                      Vrni vse
                    </button>
                    <button type="button" className="danger-button" onClick={() => deleteReservation(reservation.id).catch((error) => setFeedback(error.message))}>
                      Izbriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <h3>Izbrana rezervacija</h3>
        <pre>{JSON.stringify(selected, null, 2)}</pre>
      </article>
    </section>
  );
}

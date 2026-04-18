import React, { useEffect, useState } from "react";
import "./styles.css";

const API_BASE = "http://localhost:8010";

const emptyReservation = {
  id: "",
  item_id: "",
  reserved_by: "",
  start_date: "",
  end_date: "",
  quantity: 1,
  status: "PENDING",
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
  const [reservations, setReservations] = useState([]);
  const [filters, setFilters] = useState({ status: "", reserved_by: "" });
  const [form, setForm] = useState(emptyReservation);
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

    const data = await request(path);
    setReservations(data);
  }

  async function loadReservationById(id) {
    const data = await request(`/api/reservations/${id}`);
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
      await request(`/api/reservations/${form.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback(`Rezervacija #${form.id} je bila posodobljena.`);
    } else {
      await request("/api/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFeedback(`Rezervacija za uporabnika ${form.reserved_by} je bila ustvarjena.`);
    }

    setForm(emptyReservation);
    await loadReservations();
  }

  async function deleteReservation(id) {
    await request(`/api/reservations/${id}`, { method: "DELETE" });
    setFeedback(`Rezervacija #${id} je bila izbrisana.`);
    if (String(form.id) === String(id)) {
      setForm(emptyReservation);
      setSelected(null);
    }
    await loadReservations();
  }

  async function returnReservation(id, quantity) {
    const payload = quantity ? { quantity: Number(quantity) } : {};
    const result = await request(`/api/reservations/${id}/return`, {
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
    loadReservations().catch((error) => setFeedback(error.message));
  }, []);

  return (
    <section className="domain">
      <header className="domain-header">
        <div>
          <h2>Rezervacije Micro Frontend</h2>
          <p>Prek `web-bff` testiraš rezervacije, iskanje, posodabljanje, brisanje ter delno ali popolno vračanje opreme.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => loadReservations().catch((error) => setFeedback(error.message))}>
          Osveži seznam
        </button>
      </header>

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
                const reset = { status: "", reserved_by: "" };
                setFilters(reset);
                loadReservations(reset).catch((error) => setFeedback(error.message));
              }}
            >
              Počisti
            </button>
          </div>
        </article>

        <article className="panel">
          <h3>{form.id ? `Uredi rezervacijo #${form.id}` : "Ustvari rezervacijo"}</h3>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Item ID
              <input required type="number" min="1" value={form.item_id} onChange={(event) => setForm({ ...form, item_id: event.target.value })} />
            </label>
            <label>
              Rezerviral
              <input required value={form.reserved_by} onChange={(event) => setForm({ ...form, reserved_by: event.target.value })} />
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
              <button type="submit">{form.id ? "Posodobi" : "Ustvari"}</button>
              <button type="button" className="ghost-button" onClick={() => setForm(emptyReservation)}>
                Ponastavi
              </button>
            </div>
          </form>
        </article>
      </div>

      <div className="domain-grid">
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

        <article className="panel">
          <h3>Izbrana rezervacija</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
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
    </section>
  );
}

import React, { useEffect, useState } from "react";
import "./styles.css";

const API_BASE = "http://localhost:8010";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  category: "",
  subcategory: "",
  item_type: "",
  quantity: 1,
  available_quantity: 1,
  location: "",
  status: "AVAILABLE",
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
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ category: "", status: "", location: "" });
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [feedback, setFeedback] = useState("Modul inventar je pripravljen.");

  async function loadItems(query = filters) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const path = params.toString() ? `/api/items/search?${params.toString()}` : "/api/items";
    const data = await request(path);
    setItems(data);
  }

  async function loadItemById(id) {
    const data = await request(`/api/items/${id}`);
    setSelected(data);
    setAvailability(data.availability || null);
    setForm({
      id: data.id,
      name: data.name || "",
      description: data.description || "",
      category: data.category || "",
      subcategory: data.subcategory || "",
      item_type: data.item_type || "",
      quantity: data.quantity || 0,
      available_quantity: data.availableQuantity ?? data.available_quantity ?? 0,
      location: data.location || "",
      status: data.status || "AVAILABLE",
    });
  }

  async function loadAvailability(id) {
    const data = await request(`/api/items/${id}/availability`);
    setAvailability(data);
  }

  async function onSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      item_type: form.item_type,
      quantity: Number(form.quantity),
      available_quantity: Number(form.available_quantity),
      location: form.location,
      status: form.status,
    };

    if (form.id) {
      await request(`/api/items/${form.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback(`Oprema #${form.id} je bila posodobljena.`);
    } else {
      await request("/api/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFeedback(`Nova oprema ${form.name} je bila ustvarjena.`);
    }

    setForm(emptyForm);
    setSelected(null);
    setAvailability(null);
    await loadItems();
  }

  async function deleteItem(id) {
    await request(`/api/items/${id}`, { method: "DELETE" });
    setFeedback(`Oprema #${id} je bila izbrisana.`);
    if (String(form.id) === String(id)) {
      setForm(emptyForm);
      setSelected(null);
      setAvailability(null);
    }
    await loadItems();
  }

  useEffect(() => {
    loadItems().catch((error) => setFeedback(error.message));
  }, []);

  return (
    <section className="domain">
      <header className="domain-header">
        <div>
          <h2>Inventar Micro Frontend</h2>
          <p>Prek `web-bff` testiraš iskanje, ustvarjanje, pregled, posodobitev, brisanje in razpoložljivost opreme.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => loadItems().catch((error) => setFeedback(error.message))}>
          Osveži seznam
        </button>
      </header>

      <p className="feedback">{feedback}</p>

      <div className="domain-grid">
        <article className="panel">
          <h3>Filtri</h3>
          <div className="form-grid compact">
            <label>
              Kategorija
              <input
                value={filters.category}
                onChange={(event) => setFilters({ ...filters, category: event.target.value })}
              />
            </label>
            <label>
              Status
              <input
                value={filters.status}
                onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              />
            </label>
            <label>
              Lokacija
              <input
                value={filters.location}
                onChange={(event) => setFilters({ ...filters, location: event.target.value })}
              />
            </label>
          </div>
          <div className="button-row">
            <button type="button" onClick={() => loadItems(filters).catch((error) => setFeedback(error.message))}>
              Išči
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                const reset = { category: "", status: "", location: "" };
                setFilters(reset);
                loadItems(reset).catch((error) => setFeedback(error.message));
              }}
            >
              Počisti filtre
            </button>
          </div>
        </article>

        <article className="panel">
          <h3>{form.id ? `Uredi opremo #${form.id}` : "Dodaj opremo"}</h3>
          <form onSubmit={onSubmit} className="form-grid">
            <label>
              Naziv
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              Opis
              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              Kategorija
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </label>
            <label>
              Podkategorija
              <input value={form.subcategory} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} />
            </label>
            <label>
              Tip
              <input value={form.item_type} onChange={(event) => setForm({ ...form, item_type: event.target.value })} />
            </label>
            <label>
              Količina
              <input type="number" min="0" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            </label>
            <label>
              Razpoložljivo
              <input
                type="number"
                min="0"
                required
                value={form.available_quantity}
                onChange={(event) => setForm({ ...form, available_quantity: event.target.value })}
              />
            </label>
            <label>
              Lokacija
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="LOW_STOCK">LOW_STOCK</option>
                <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                <option value="RESERVED">RESERVED</option>
              </select>
            </label>
            <div className="button-row">
              <button type="submit">{form.id ? "Posodobi" : "Ustvari"}</button>
              <button type="button" className="ghost-button" onClick={() => setForm(emptyForm)}>
                Ponastavi
              </button>
            </div>
          </form>
        </article>
      </div>

      <div className="domain-grid">
        <article className="panel">
          <h3>Seznam opreme</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Naziv</th>
                  <th>Status</th>
                  <th>Lokacija</th>
                  <th>Razpoložljivo</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.status}</td>
                    <td>{item.location}</td>
                    <td>{item.availableQuantity}</td>
                    <td className="actions">
                      <button type="button" onClick={() => loadItemById(item.id).catch((error) => setFeedback(error.message))}>
                        Detajli
                      </button>
                      <button type="button" className="ghost-button" onClick={() => loadAvailability(item.id).catch((error) => setFeedback(error.message))}>
                        Availability
                      </button>
                      <button type="button" className="danger-button" onClick={() => deleteItem(item.id).catch((error) => setFeedback(error.message))}>
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
          <h3>Izbrana oprema</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <h4>Razpoložljivost</h4>
          <pre>{JSON.stringify(availability, null, 2)}</pre>
        </article>
      </div>
    </section>
  );
}

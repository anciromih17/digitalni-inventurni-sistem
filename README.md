# digitalni-inventurni-sistem
**Problem**

Namen inventurnega sistema je poenostavitev procesa popisa inventure, izboljšanja nadzora in pregleda nad opremo v skladišču kot tudi na terenu in namen povečanja organiziranost in učinkovitosti samega poslovanja podjetja. V številnih organizacijah se evidenca opreme še vedno vodi ročno (npr. v Excel tabelah). Zaradi česar organizacije pogosto nimajo natančnega pregleda nad:

- Količino in lokacijo opreme,
- kdo trenutno uporablja posamezen kos opreme,
- ali je oprema na voljo za izposojo,
- kdo je opremo prevzel ali vrnil,
- zgodovino uporabe opreme.

**Glavne funkcionalnosti:**

- enoten seznam opreme,
- registracija in prijava uporabnikov,
- upravljanje vlog in pravic dostopa,
- rezervacija in izposoja opreme,
- avtorizacija izposoje (admin),
- sledenje uporabi in vračilu opreme,
- koledarski prikaz rezervacij

**1\. Storitev - Uporabniki in dostop**

- registracija
- prijava, odjava
- upravljanje vlog, računov
- avtorizacija dostopa do funkcionalnosti

**Vloge:**

- **Admin**
  - Dostop do vseh seznamov, funkcionalnosti
  - upravlja uporabnike
  - potrjuje izposoje opreme
  - dodaja in ureja opremo
- **Uporabnik**
  - Lahko dostopa do seznama opreme
  - Lahko naredi rezervacijo ali zahtevo za izposojo

**2\. Storitev - Inventar opreme**

- seznam opreme
- kategorije, subkategorije
- lokacije opreme
- stanje (na voljo, rezervirano, izposojeno, za popravilo)
- pregled razpoložljivosti (koledar)

**3\. Storitev - Izposoja, rezervacija, sledljivost**

- rezervacije opreme
- zahteva za izposojo
- potrjevanje izposoje (admin)
- prevzem
- vračilo
- nosilec opreme
- kdo je izdal, kdo je vrnil
- zgodovina

**Komunikacija**

<img width="4638" height="3600" alt="Microservices Inventory-2026-03-09-184654" src="https://github.com/user-attachments/assets/9397d110-5218-4f89-839b-e99d2c57fbf2" />

**REST API**
- Med spletno aplikacijo in mikrostoritvami
- HTTP metode

**gRPC**
- Med mikrostoritvami (izposoja - inventar opreme)
- Uporabnik da zahtevo za izposojo - storitev izposoje preveri stanje, kliče storitev inventar

**Sporočilni posrednik**
- Storitev pošlje dogodek v broker, subscriber posluša.
- Npr. dogodki:
  - equipment_reserved
  - equipment_checked_out
  - equipment_returned
  - reservation_created
  - reservation_approved

**Docker porti:**
| Storitev    | Port  |
| ----------- | ----- |
| Inventar    | 8000  |
| Rezervacije | 8001  |
| Uporabniki  | 8002  |
| ActiveMQ    | 8161  |
| MongoDB     | 27017 |
| PostgreSQL  | 5432  |
| Web BFF     | 8010  |
| Mobile BFF  | 8011  |

**Arhitektura sistema:**
| Mikrostoritev | Tehnologija         | Baza       |
| ------------- | ------------------- | ---------- |
| Inventar      | Node.js + Express   | PostgreSQL |
| Rezervacije   | FastAPI + gRPC      | PostgreSQL |
| Uporabniki    | Spring Boot WebFlux | MongoDB    |
| Web BFF       | Node.js + Express   | /          |
| Mobile BFF    | FastAPI             | /          |

**ActiveMQ**
| Mikrostoritev | Event                 | Kdaj se sproži             | Queue              |
| ------------- | --------------------- | -------------------------- | ------------------ |
| Inventar      | ITEM_CREATED          | Ko ustvarimo novo opremo   | inventory.events   |
| Inventar      | ITEM_UPDATED          | Ko posodobimo opremo       | inventory.events   |
| Inventar      | ITEM_DELETED          | Ko izbrišemo opremo        | inventory.events   |
| Rezervacije   | RESERVATION_CREATED   | Ko ustvarimo rezervacijo   | reservation.events |
| Rezervacije   | RESERVATION_CONFIRMED | Ko potrdimo rezervacijo    | reservation.events |
| Rezervacije   | RESERVATION_CANCELLED | Ko prekličemo rezervacijo  | reservation.events |
| Uporabniki    | USER_REGISTERED       | Ko se uporabnik registrira | user.events        |
| Uporabniki    | USER_ROLE_CHANGED     | Ko se spremeni vloga       | user.events        |
| Uporabniki    | USER_DELETED          | Ko izbrišemo uporabnika    | user.events        |

## Naloga 5 - API Gateway / BFF

Za zahteve naloge sta dodana dva ločena prehoda, ki delujeta kot enotna vstopna točka za odjemalce:

- `web-bff` na portu `8010` za spletni odjemalec
- `mobile-bff` na portu `8011` za mobilni odjemalec

- oba prehoda sta implementirana v različnih tehnologijah
- oba prehoda izpostavljata drugačne endpoint-e
- odjemalec dostopa do sistema prek BFF in ne neposredno do mikrostoritev

### Web BFF endpointi

- `GET /api/dashboard`
- `GET /api/items`
- `GET /api/items/search`
- `GET /api/items/{id}`
- `GET /api/items/{id}/availability`
- `POST /api/items`
- `PUT /api/items/{id}`
- `DELETE /api/items/{id}`
- `GET /api/reservations`
- `GET /api/reservations/search`
- `GET /api/reservations/{id}`
- `POST /api/reservations`
- `POST /api/reservations/{id}/return`
- `PUT /api/reservations/{id}`
- `DELETE /api/reservations/{id}`
- `GET /api/users`
- `GET /api/users/{id}`
- `PUT /api/users/{id}/role`
- `DELETE /api/users/{id}`
- `POST /api/auth/register`
- `POST /api/auth/login`

Web BFF zdaj pokriva celoten HTTP nabor treh mikrostoritev:

- inventar: create, read all, read by id, search, update, delete, availability
- rezervacije: create, read all, read by id, search, update, delete, return items
- uporabniki: register, login, read all, read by id, update role, delete

### Mobile BFF endpointi

- `GET /mobile/home?username=...`
- `GET /mobile/catalog`
- `GET /mobile/catalog/search`
- `GET /mobile/catalog/{item_id}/availability`
- `GET /mobile/catalog/{item_id}`
- `POST /mobile/catalog`
- `PUT /mobile/catalog/{item_id}`
- `DELETE /mobile/catalog/{item_id}`
- `GET /mobile/my-reservations?username=...`
- `GET /mobile/reservations/{id}`
- `GET /mobile/reservations/search`
- `POST /mobile/reservations/{id}/return`
- `PUT /mobile/reservations/{id}`
- `DELETE /mobile/reservations/{id}`
- `POST /mobile/reserve`
- `POST /mobile/session/login`
- `POST /mobile/session/register`
- `GET /mobile/users/{id}`
- `PUT /mobile/users/{id}/role`
- `DELETE /mobile/users/{id}`

### Step-by-step zagon

1. Zaženi celoten sistem:

```bash
docker compose up --build
```

2. Preveri zdravje gatewayev:

```bash
GET http://localhost:8010/health
GET http://localhost:8011/health
```

3. Demonstriraj spletni BFF:

```bash
GET  http://localhost:8010/api/dashboard
GET  http://localhost:8010/api/items
GET  http://localhost:8010/api/items/search?category=Elektronika
POST http://localhost:8010/api/auth/login
POST http://localhost:8010/api/reservations
POST http://localhost:8010/api/reservations/1/return
GET  http://localhost:8010/api/reservations/search?reserved_by=ana
```

4. Demonstriraj mobilni BFF:

```bash
GET  http://localhost:8011/mobile/catalog
GET  http://localhost:8011/mobile/catalog/search?status=AVAILABLE
GET  http://localhost:8011/mobile/my-reservations?username=ana
POST http://localhost:8011/mobile/session/login
POST http://localhost:8011/mobile/reserve
POST http://localhost:8011/mobile/reservations/1/return
```

### Primeri Postman zahtevkov

`POST http://localhost:8010/api/auth/register`

```json
{
  "username": "ana",
  "email": "ana@example.com",
  "password": "geslo123",
  "role": "USER"
}
```

`POST http://localhost:8010/api/items`

```json
{
  "name": "Projektor Epson",
  "description": "Prenosni projektor",
  "category": "Elektronika",
  "subcategory": "Projektorji",
  "item_type": "DEVICE",
  "quantity": 5,
  "available_quantity": 5,
  "location": "Skladisce A",
  "status": "AVAILABLE"
}
```

`POST http://localhost:8010/api/reservations`

```json
{
  "item_id": 1,
  "reserved_by": "ana",
  "start_date": "2026-04-20",
  "end_date": "2026-04-22",
  "quantity": 1,
  "status": "PENDING"
}
```

`POST http://localhost:8011/mobile/session/login`

```json
{
  "username": "ana"
}
```

`POST http://localhost:8011/mobile/reserve`

```json
{
  "item_id": 1,
  "reserved_by": "ana",
  "start_date": "2026-04-20",
  "end_date": "2026-04-22",
  "quantity": 1,
  "status": "PENDING"
}
```

`POST http://localhost:8010/api/reservations/1/return`

Delno vračilo:

```json
{
  "quantity": 1
}
```

Vračilo vse preostale opreme:

```json
{}
```

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
- dodajanje kosov oprme,
- brisanje, posodabljanje seznamov
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
| Web UI Shell | 3000 |
| Inventory UI | 3001 |
| Reservations UI | 3002 |
| Users UI | 3003 |
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

## Naloga 6 - Micro Frontends

Za spletni odjemalec je arhitektura razdeljena na štiri ločene frontend komponente:

- `web-ui` - shell oziroma host aplikacija
- `inventory-ui` - micro frontend za inventar
- `reservations-ui` - micro frontend za rezervacije in vračanje opreme
- `users-ui` - micro frontend za uporabnike

Arhitekturni slog:

- `Webpack Module Federation`
- shell na `http://localhost:3000`
- remote moduli na `http://localhost:3001`, `3002`, `3003`

### Kaj omogoča spletni vmesnik

`inventory-ui`

- pregled vse opreme
- iskanje po kategoriji, statusu in lokaciji
- pregled podrobnosti
- pregled availability
- ustvarjanje nove opreme
- posodabljanje opreme
- brisanje opreme

`reservations-ui`

- pregled vseh rezervacij
- iskanje rezervacij
- pregled rezervacije po ID
- ustvarjanje rezervacije
- posodabljanje rezervacije
- brisanje rezervacije
- vračilo po kosih
- vračilo vsega preostalega

`users-ui`

- registracija
- prijava
- pregled vseh uporabnikov
- pregled uporabnika po ID
- sprememba vloge
- brisanje uporabnika

### Step-by-step zagon celotnega sistema

1. Zaženi vse storitve in micro frontende:

```bash
docker compose up --build
```

2. Odpri shell aplikacijo:

```text
http://localhost:3000
```

3. Shell bo naložil tri remote module:

- Inventar
- Rezervacije
- Uporabniki

4. V zavihku `Inventar` preizkusi:

- create item
- get items
- search items
- get item detail
- get item availability
- update item
- delete item

5. V zavihku `Rezervacije` preizkusi:

- create reservation
- list reservations
- search reservations
- get reservation detail
- update reservation
- return partial quantity
- return all remaining quantity
- delete reservation

6. V zavihku `Uporabniki` preizkusi:

- register
- login
- list users
- get user by id
- update role
- delete user

### GitHub Actions in DockerHub

Dodana sta dva nova workflowa:

- `.github/workflows/microfrontends-ci.yml`
  - zgradi vse štiri frontend aplikacije
- `.github/workflows/docker-publish.yml`
  - zgradi in objavi Docker slike vseh komponent na DockerHub

Predpogoj za objavo na DockerHub:

- v GitHub repozitoriju nastavi `DOCKERHUB_USERNAME`
- v GitHub repozitoriju nastavi `DOCKERHUB_TOKEN`

Workflow `docker-publish.yml` objavlja slike za:

- `inventory-service`
- `reservations-service`
- `users-service`
- `web-bff`
- `mobile-bff`
- `web-ui-shell`
- `inventory-ui`
- `reservations-ui`
- `users-ui`

## Naloga 7 - Vzorci MSA

Za dopolnitev sistema sta implementirana dva dodatna vzorca mikrostoritvene arhitekture:

- `Revizijsko beleženje`
- `Žeton za dostop (JWT)`

- inventurni sistem potrebuje sledljivost pomembnih sprememb,
- sistem vsebuje različne uporabniške vloge in občutljive operacije, zato potrebuje tudi avtorizacijo dostopa.

### 1. Revizijsko beleženje

**Kaj vzorec rešuje**

Revizijsko beleženje omogoča sledljivost poslovno pomembnih operacij v sistemu. Pri inventurnem sistemu je pomembno, da lahko za nazaj ugotovimo:

- kdo je ustvaril ali posodobil opremo,
- kdo je ustvaril, posodobil, izbrisal ali vrnil rezervacijo,
- kdo je registriral uporabnika,
- kdo je spremenil uporabniško vlogo,
- kdo je izbrisal uporabnika.

**Zakaj je ta vzorec smiseln**

Ta vzorec je smiseln, ker digitalni inventurni sistem upravlja podatke, ki imajo jasno zgodovino odgovornosti in uporabe. Z vidika domene je pomembno, da obstaja pregled nad spremembami opreme, rezervacij in uporabnikov.

**Kako je implementirano**

Audit zapis se ustvari ob poslovno pomembnih operacijah v vseh treh domenskih mikrostoritvah. Vsaka storitev ima svoj model oziroma tabelo/kolekcijo za audit zapise. `web-bff` nato te zapise agregira in jih izpostavi na enem mestu.

**Kje je implementirano**

`Inventar`

- `inventar/src/config/initDb.js`
- `inventar/src/repositories/auditRepository.js`
- `inventar/src/services/auditService.js`
- `inventar/src/services/itemService.js`
- `inventar/src/grpc/grpcServer.js`

`Rezervacije`

- `rezervacije/app/models/audit_log.py`
- `rezervacije/app/repositories/audit_repository.py`
- `rezervacije/app/services/audit_service.py`
- `rezervacije/app/services/reservation_service.py`
- `rezervacije/app/api/reservation_api.py`

`Uporabniki`

- `uporabniki/src/main/java/com/inventar/userservice/model/AuditLog.java`
- `uporabniki/src/main/java/com/inventar/userservice/repository/AuditLogRepository.java`
- `uporabniki/src/main/java/com/inventar/userservice/service/AuditLogService.java`
- `uporabniki/src/main/java/com/inventar/userservice/service/UserService.java`
- `uporabniki/src/main/java/com/inventar/userservice/controller/UserController.java`

`Agregacija in prikaz`

- `web-bff/src/app.js`
- `web-ui/src/App.jsx`

### 2. Žeton za dostop (JWT)

**Kaj vzorec rešuje**

JWT žeton za dostop omogoča, da sistem preveri, ali je uporabnik prijavljen in ali ima dovolj pravic za izvajanje posamezne operacije.

**Zakaj je ta vzorec smiseln**

Ta vzorec je smiseln, ker ima sistem vsaj dve vlogi:

- `USER`
- `ADMIN`

Uporabnika nimata enakih pravic, zato mora sistem razlikovati med navadnim uporabnikom in administratorjem.

V sistemu so pravila dostopa implementirana tako:

- `USER`
  - lahko pregleda inventar,
  - lahko ustvari rezervacijo,
  - lahko vidi svoje podatke,
  - lahko vidi svoje rezervacije.
- `ADMIN`
  - lahko dodaja, posodablja in briše opremo,
  - lahko spreminja role uporabnikov,
  - lahko briše uporabnike,
  - lahko vidi vse audit zapise.

**Kako je implementirano**

Po uspešni prijavi `web-bff` izda JWT žeton. Frontend shrani žeton in ga pošilja v `Authorization: Bearer ...` glavi pri naslednjih requestih. `web-bff` žeton preveri, iz njega prebere identiteto in vlogo uporabnika ter glede na vlogo dovoli ali zavrne posamezne operacije.

Tako je `web-bff` osrednja točka za avtorizacijo v sistemu.

**Kje je implementirano**

`JWT logika in preverjanje`

- `web-bff/src/auth.js`
- `web-bff/src/app.js`

`Prijava uporabnika`

- `uporabniki/src/main/java/com/inventar/userservice/controller/UserController.java`
- `uporabniki/src/main/java/com/inventar/userservice/service/UserService.java`
- `uporabniki/src/test/java/com/inventar/userservice/UserControllerTest.java`

`Shranjevanje žetona in pošiljanje iz frontenda`

- `web-ui/src/App.jsx`
- `inventory-ui/src/App.jsx`
- `reservations-ui/src/App.jsx`
- `users-ui/src/App.jsx`

### Povzetek razlogov za izbiro vzorcev

Vzorec `Revizijsko beleženje` je bil izbran zaradi sledljivosti in preglednosti sprememb v inventurnem sistemu.

Vzorec `Žeton za dostop (JWT)` je bil izbran zaradi potrebe po varnem dostopu in avtorizaciji glede na uporabniške vloge.

Skupaj ta dva vzorca pokrijeta:

- `sledljivost poslovnih operacij`,
- `varnost in nadzor dostopa`,
- `realističen scenarij uporabe mikrostoritvenega sistema v praksi`.

## Naloga 8 - OpenShift

Za uvedbo sistema na `Red Hat OpenShift Developer Sandbox` je bil uporabljen vizualni pristop iz navodil in PDF-ja, torej ročna uvedba komponent prek `Container images` v OpenShift GUI.

### Kaj je bilo uvedeno v OpenShift

Ustvarjene so bile naslednje komponente:

`Podatkovni in infrastrukturni sloj`

- `inventory-db`
- `reservations-db`
- `users-db`
- `activemq`

`Domenske mikrostoritve`

- `inventory-service`
- `reservations-service`
- `users-service`

`Prehodi / gateway sloj`

- `web-bff`
- `mobile-bff`

`Frontend micro frontend sloj`

- `inventory-ui`
- `reservations-ui`
- `users-ui`
- `web-ui`

Za vsako komponento so bili nastavljeni:

- ustrezen Docker image iz DockerHub,
- `Deployment`,
- `Service`,
- pri zunanje dostopnih komponentah tudi `Route`,
- `readiness`, `liveness` in `startup` health checki,
- environment variable za medsebojno komunikacijo.

### Kaj je bilo treba popraviti, da je sistem deloval v OpenShiftu

#### 1. Frontendi niso smeli ostati vezani na `localhost`

Lokalna varianta je uporabljala `localhost` naslove za:

- `web-bff`,
- remote micro frontend module,
- API klice.

To v OpenShift okolju ne deluje, ker komponente tečejo v ločenih podih in se povezujejo prek internih `Service` imen ter prek proxya.

Zato so bile spremenjene datoteke:

- `web-ui/webpack.config.js`
- `inventory-ui/webpack.config.js`
- `reservations-ui/webpack.config.js`
- `users-ui/webpack.config.js`

#### 2. Frontendi so morali v produkciji uporabljati relativne poti

V vseh frontendih je bil API base nastavljen tako, da:

- v development načinu uporablja `http://localhost:8010`
- v OpenShift/production načinu uporablja `/api-gateway`

Spremenjene datoteke:

- `web-ui/src/App.jsx`
- `inventory-ui/src/App.jsx`
- `reservations-ui/src/App.jsx`
- `users-ui/src/App.jsx`

#### 3. Nginx slike za UI so morale biti OpenShift-safe

Navaden nginx image je v OpenShift sandboxu padal zaradi `Permission denied` napak pri pisanju v `/var/cache/nginx/...`.

Zato je bil zamenjan image v Dockerfile-jih:

- iz klasičnega nginx image-a
- v `nginxinc/nginx-unprivileged:1.27-alpine`

Poleg tega vsi UI moduli v OpenShiftu poslušajo na portu `8080`.

Spremenjene datoteke:

- `web-ui/Dockerfile`
- `inventory-ui/Dockerfile`
- `reservations-ui/Dockerfile`
- `users-ui/Dockerfile`

#### 4. `web-ui` je moral postati shell proxy za API in remote module

V OpenShiftu `web-ui` deluje kot glavna javna vstopna točka za frontend.

Prek `nginx.conf` proxyja:

- `/api-gateway/` -> `web-bff:8010`
- `/inventory-remote/` -> `inventory-ui:8080`
- `/reservations-remote/` -> `reservations-ui:8080`
- `/users-remote/` -> `users-ui:8080`

Spremenjene datoteke:

- `web-ui/nginx.conf`
- `inventory-ui/nginx.conf`
- `reservations-ui/nginx.conf`
- `users-ui/nginx.conf`

#### 5. Popravek `web-ui` proxya za `remoteEntry.js`

Pri prvem OpenShift zagonu je shell ob kliku na zavihek vračal:

- `404 Not Found`
- `ScriptExternalLoadError`

Razlog je bil v `web-ui/nginx.conf`, kjer je splošno pravilo:

```nginx
location ~* \.(js|css|html|json)$
```

prehitelo bolj specifične poti, kot je `/inventory-remote/remoteEntry.js`.

Zato so bile lokacije popravljene v:

- `location ^~ /api-gateway/`
- `location ^~ /inventory-remote/`
- `location ^~ /reservations-remote/`
- `location ^~ /users-remote/`

To je omogočilo pravilno nalaganje Module Federation remote datotek.

#### 6. `reservations-service` je potreboval dva popravka

Najprej je padal zaradi krožnega importa v gRPC paketu.

Popravljena datoteka:

- `rezervacije/app/grpc/__init__.py`

Nato pa je Docker imageu manjkalo:

- `inventory_pb2.py`
- `inventory_pb2_grpc.py`

ker ju je ignoriral `.gitignore`.

Zato je bil popravljen:

- `.gitignore`

in v repo sta bili vključeni še datoteki:

- `rezervacije/app/grpc/inventory_pb2.py`
- `rezervacije/app/grpc/inventory_pb2_grpc.py`

#### 7. `users-service` in bootstrap admin uporabnika

Ob sveži OpenShift postavitvi sistem ni imel nobenih podatkov, zato se je bilo treba registrirati znova.

Pri registraciji pa se v kodi vedno nastavi:

```java
user.setRole(Role.USER);
```

v datoteki:

- `uporabniki/src/main/java/com/inventar/userservice/service/UserService.java`

Zato je bilo treba v Mongo bazi ročno enega uporabnika povišati v `ADMIN`, da je bilo mogoče uporabljati administratorske funkcionalnosti.

### Kako se komponente v OpenShiftu povezujejo med sabo

Podi niso ročno povezani v Topology pogledu. Topology prikaz je samo vizualizacija.

Prava komunikacija med komponentami poteka prek:

- `Service` imen,
- internega OpenShift / Kubernetes DNS,
- `Route` za zunanji dostop,
- `nginx` proxya v `web-ui`,
- environment variable v deploymentih.

Primeri:

- `inventory-service` dostopa do baze prek `inventory-db`
- `reservations-service` dostopa do baze prek `reservations-db`
- `users-service` dostopa do Mongo baze prek `users-db`
- `reservations-service` kliče gRPC prek `inventory-service:50051`
- `web-bff` kliče backend storitve prek:
  - `http://inventory-service:8000`
  - `http://reservations-service:8001`
  - `http://users-service:8002`
- `mobile-bff` uporablja enak princip
- `web-ui` shell kliče:
  - backend prek `/api-gateway/`
  - remote UI module prek `/inventory-remote/`, `/reservations-remote/`, `/users-remote/`

Torej:

- podi se ne povezujejo s črtami v GUI,
- povezujejo se prek `Service` objektov in internega DNS-a.

### Kaj je bilo spremenjeno v `webpack.config.js`

OpenShift del je zahteval spremembe v vseh štirih webpack konfiguracijah frontendov:

- `web-ui/webpack.config.js`
- `inventory-ui/webpack.config.js`
- `reservations-ui/webpack.config.js`
- `users-ui/webpack.config.js`

#### Sprememba 1: ločevanje development in production okolja

Dodan je bil:

```js
const isDevServer = process.argv.includes("serve");
```

Namen:

- če teče `webpack serve`, uporabljamo lokalne `localhost` URL-je
- če delamo produkcijski build za OpenShift, uporabimo `auto` oziroma relativne poti

#### Sprememba 2: `publicPath`

Pri remote aplikacijah je bilo nastavljeno:

```js
output: {
  publicPath: isDevServer ? "http://localhost:3001/" : "auto",
}
```

oziroma ustrezno za `3002` in `3003`.

Namen:

- lokalno se chunki nalagajo z `localhost`
- v OpenShiftu pa webpack sam izračuna pravo osnovno pot

Pri shellu (`web-ui`) je bilo enako:

```js
output: {
  publicPath: isDevServer ? "http://localhost:3000/" : "auto",
}
```

#### Sprememba 3: remotes v shell aplikaciji

V `web-ui/webpack.config.js` so bili remotes spremenjeni tako, da:

lokalno ostanejo:

```js
inventory@http://localhost:3001/remoteEntry.js
reservations@http://localhost:3002/remoteEntry.js
users@http://localhost:3003/remoteEntry.js
```

v OpenShift produkciji pa postanejo:

```js
inventory@/inventory-remote/remoteEntry.js
reservations@/reservations-remote/remoteEntry.js
users@/users-remote/remoteEntry.js
```

To je bil ključen del, da je shell lahko nalagal remote module prek `web-ui` nginx proxya.

### Kaj so `remoteEntry.js` datoteke in čemu služijo

`remoteEntry.js` je osrednja datoteka, ki jo ustvari `Webpack Module Federation` za vsak remote micro frontend.

Pri tebi jo ustvarijo:

- `inventory-ui`
- `reservations-ui`
- `users-ui`

Njena vloga je:

- da shell aplikaciji pove, katere komponente remote modul izpostavlja,
- da omogoči dinamično nalaganje modula,
- da vsebuje Module Federation runtime metapodatke.

Pri tebi remote moduli izpostavljajo:

```js
exposes: {
  "./App": "./src/App.jsx",
}
```

To pomeni:

- shell naloži `remoteEntry.js`
- iz njega dobi dostop do `./App`
- nato v `web-ui/src/App.jsx` preko `React.lazy(() => import("inventory/App"))` ali podobno naloži konkreten modul

Če `remoteEntry.js` ne obstaja ali vrača `404`, shell ne more naložiti zavihka in uporabnik vidi:

- črno stran,
- `ScriptExternalLoadError`,
- ali `Failed to load resource: 404`

### Kaj je bilo spremenjeno v `App.jsx` datotekah

#### 1. `web-ui/src/App.jsx`

Spremembe:

- `API_BASE` je bil prilagojen, da v produkciji uporablja `/api-gateway`
- shell zdaj dela v OpenShiftu prek proxya namesto direktnih `localhost` klicev
- shell uporablja Module Federation remote module imena:
  - `inventory/App`
  - `reservations/App`
  - `users/App`
- po prijavi shrani JWT sejo v `localStorage`
- upravlja `dashboard`, `history`, `inventory`, `reservations`, `users` poglede

Namen:

- da je shell enotna vstopna točka v OpenShiftu
- da kliče backend prek `web-bff`
- da nalaga remote module prek nginx proxya

#### 2. `inventory-ui/src/App.jsx`

Spremembe:

- `API_BASE` je bil prilagojen z `localhost -> /api-gateway`
- vsi requesti zdaj gredo prek `web-bff`
- upoštevana je uporabniška vloga:
  - `ADMIN` lahko dodaja, ureja, briše
  - `USER` lahko samo pregleduje

Namen:

- da inventory module deluje tako lokalno kot v OpenShiftu
- da ne kliče več direktno lokalnega BFF-ja

#### 3. `reservations-ui/src/App.jsx`

Spremembe:

- `API_BASE` je bil prilagojen na `/api-gateway`
- UI uporablja paketno izbiro opreme za rezervacijo
- upošteva JWT in uporabniško vlogo
- omogoča ustvarjanje, posodabljanje in vračilo rezervacij

Namen:

- da tudi reservations remote deluje z `web-bff` v OpenShiftu

#### 4. `users-ui/src/App.jsx`

Spremembe:

- `API_BASE` je bil prilagojen na `/api-gateway`
- UI je bil poenostavljen, da v OpenShiftu uporablja obstoječo sejo in token
- za `USER` prikazuje samo lasten profil
- za `ADMIN` omogoča:
  - seznam vseh uporabnikov
  - spremembo vloge
  - brisanje uporabnikov

Namen:

- da users module ne dela več kot testna login stran,
- ampak kot pravi uporabniški administracijski modul.

### Povzetek OpenShift dela

Za uspešno uvedbo v OpenShift je bilo treba:

- prilagoditi nginx slike in porte,
- odstraniti odvisnost od `localhost`,
- uvesti `web-ui` proxy do API-ja in remote modulov,
- popraviti Module Federation poti,
- popraviti `reservations-service` gRPC import in generated datoteke,
- ročno bootstrapati admin uporabnika v Mongo bazi,
- uporabiti pravilne `sha-...` Docker tage, da se izogne cache težavam.

S tem je sistem postal delujoč tudi v OpenShift clusterju in ne samo v lokalnem Docker okolju.

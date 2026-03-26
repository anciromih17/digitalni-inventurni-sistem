Ta mikrostoritev je implementirana z uporabo Spring Boot WebFlux, kar pomeni, da uporablja reaktiven slog programiranja (Mono, Flux) in neblokirajoče operacije.

Mikrostoritev komunicira z drugimi mikrostoritvami preko:
- REST API
- Message Broker (ActiveMQ)


**Funkcionalnosti mikrostoritve**
**Mikrostoritev implementira naslednje funkcionalnosti:*
    - Upravljanje uporabnikov
    - Registracija uporabnika
    - Prijava uporabnika
    - Pridobivanje vseh uporabnikov
    - Pridobivanje posameznega uporabnika
    - Spreminjanje vloge uporabnika
    - Brisanje uporabnika
**Vloge uporabnikov*
ADMIN
- upravlja uporabnike
- spreminja vloge
- potrjuje rezervacije
- dodaja in ureja opremo
USER
- lahko vidi opremo
- lahko ustvari rezervacijo

**Reaktiven slog programiranja**
Mikrostoritev uporablja Spring WebFlux, ki temelji na reaktivnem programiranju.
Namesto klasičnih tipov uporablja:
Mono<T> – predstavlja en rezultat
Flux<T> – predstavlja več rezultatov

Reaktivno programiranje je implementirano z uporabo Spring WebFlux in Project Reactor. Namesto klasičnih objektov metode vračajo Mono in Flux, ki predstavljata asinhrone tokove podatkov. Operacije nad MongoDB se izvajajo preko ReactiveMongoRepository, kar omogoča neblokirajoče operacije in boljšo skalabilnost sistema.

| Tehnologija         | Namen                |
| ------------------- | -------------------- |
| Spring Boot WebFlux | REST API             |
| MongoDB             | podatkovna baza      |
| ActiveMQ            | sporočilni posrednik |
| Docker              | kontejnerizacija     |
| GitHub Actions      | CI                   |
| Swagger / OpenAPI   | dokumentacija API    |
| JUnit               | testiranje           |

**ENDPOINTS:**
| Method | Endpoint             | Opis               |
| ------ | -------------------- | ------------------ |
| POST   | /api/users/register  | registracija       |
| POST   | /api/users/login     | prijava            |
| GET    | /api/users           | vsi uporabniki     |
| GET    | /api/users/{id}      | uporabnik po id    |
| PUT    | /api/users/{id}/role | spremeni vlogo     |
| DELETE | /api/users/{id}      | izbriši uporabnika |

**Testiranje**
Za mikrostoritev so napisani Unit testi za REST endpoint-e.
Testirani endpointi:
    - register user
    - login user
    - get all users
    - get user by id
    - update user role
    - delete user
Testiranje je implementirano z:
    - JUnit
    - Spring WebFlux Test
    - Mockito



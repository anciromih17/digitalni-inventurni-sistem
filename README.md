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

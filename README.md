# PGD Majšperk Breg - Spletna stran

Uradna spletna stran Prostovoljnega gasilskega društva Majšperk Breg.

## Pregled projekta

Spletna stran je zasnovana kot moderna, odzivna platforma za obveščanje občanov, predstavitev voznega parka, vodenje javnega koledarja in galerije dogodkov. Vključuje tudi interaktivne elemente, kot je gasilski kviz.

### Tehnologije
- **Frontend:** HTML5, CSS3 (z dark mode podporo), JavaScript (Vanilla)
- **Backend:** PHP 8.2 (REST API)
- **Baza podatkov:** SQLite 3
- **Kviz:** Vite, JavaScript

## Navodila za namestitev

### Lokalni PHP strežnik
1. Zagotovite, da imate nameščen PHP 8.2+ z razširitvama `pdo_sqlite` in `gd`.
2. Mapo `public/` nastavite kot korensko mapo vašega spletnega strežnika (DocumentRoot).
3. Prepričajte se, da ima PHP pravice za pisanje v mapi `data/` in `api/uploads/`.

### Docker (priporočeno)
1. Namestite Docker in Docker Compose.
2. V korenski mapi projekta zaženite:
   ```bash
   docker-compose up -d
   ```
3. Spletna stran bo na voljo na `http://localhost:8080`.

## Admin dostop
Nadzorna plošča se nahaja na `/admin/`.

- **Uporabniško ime:** `admin@pgd.local`
- **Geslo:** `changeme123`

*Opomba: Geslo nemudoma spremenite po prvi prijavi.*

## TODO / Preveriti s PGD

Naslednji podatki so trenutno vstavljeni kot placeholderji ali so nepreverjeni in jih mora PGD Majšperk Breg potrditi:

- [ ] **Vozila:** Preveriti točne tehnične podatke (kapaciteta vode, posadka) za GVC-1 in GVM-1.
- [ ] **Vodstvo:** Dodati manjkajoča imena za podpredsednika in podpoveljnika.
- [ ] **Donacije:** Vstaviti pravilen TRR številko društva v `public/index.html`.
- [ ] **Logotip:** Zamenjati placeholder logotip s pravim logotipom PGD Majšperk Breg.
- [ ] **Slike:** Zamenjati `picsum.photos` slike z dejanskimi fotografijami društva, vozil in dogodkov.
- [ ] **Vsebina:** Pregledati in potrditi besedila v sekciji "O nas" in "Zgodovina".
- [ ] **Kontakt:** Potrditi, če je telefonska številka 041 366 247 pravilna za javne objave.

## Čiščenje in vzdrževanje
- Slike se nalagajo v `api/uploads/`.
- Baza podatkov se nahaja v `data/pgd.db`.

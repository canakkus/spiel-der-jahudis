# 🎲 Spiel der Jahudis (Game of Jahudis)

Ein interaktives Multiplayer-Brettspiel, inspiriert von *The Game of Life 2* auf Amazon Luna – spielbar im lokalen Netzwerk oder Browser mit separatem Host-/TV-Screen und Smartphone-Controllern.

## 🚀 Features

- **5 Thematische Biome (Spiel des Lebens World):**
  - 🎓 **Campus & Uni:** Akademischer Park, Vorlesungssaal mit Säulen, Bibliotheksturm und Weggabelung (Studium vs. Direkteinstieg).
  - 🏙️ **Metropolis Downtown:** Moderne Wolkenkratzer mit Glasfronten, Skyline-Boulevard, Hochzeit & Penthouse.
  - 🏡 **Suburbia & Family:** Gemütliche Familienvillen mit Gärten, Zäunen, Kindern & Investment-Stop.
  - 🎰 **Casino & Krypto Dunes:** Neon-Strip, goldene Pyramide, rotierende 3D-Bitcoin-Skulptur und High-Risk-Weg.
  - 🏝️ **Retirement Paradise Beach:** Tropischer Palmenstrand, türkisfarbene Bucht, Luxus-Superyacht und goldenes Siegestor.
- **Natürlicher Landschaftspfad:** Kein Schlangen-Zickzack mehr, sondern eine majestätisch geschwungene Panoramastraße mit Bordsteinen, weißen Fahrbahnmarkierungen und gelben Mittellinien.
- **Interaktives Touch-Swipe Glücksrad (Handy & TV):** Physikalisches Drehrad mit Schwung-Berechnung – je stärker der Spieler am Smartphone swipet, desto schneller und länger dreht sich das Rad auf dem Handy und als 3D-Centerpiece auf dem TV!
- **3D-Physikalisches Glücksrad (Hasbro-Stil):** Das klassische bunte Drehrad sitzt als echtes 3D-Monument mitten auf dem Spielbrett und dreht sich synchron mit.
- **Cinematische 45°-Verfolgerkamera:** Sanft gleitende Kran-Perspektive hinter dem bunten Cabriolet mit Neigung in den Kurven.

## 🛠️ Installation & Start

1. **Repository klonen & Dependencies installieren:**
   ```bash
   git clone https://github.com/canakkus/spiel-der-jahudis.git
   cd spiel-der-jahudis
   npm install
   ```

2. **Server starten:**
   ```bash
   npm start
   ```

3. **Öffnen:**
   - **Host Screen (am TV / PC):** `http://localhost:42069/host.html`
   - **Handy-Controller:** Den angezeigten QR-Code auf dem Host-Screen mit dem Smartphone scannen oder `http://<DEINE-IP>:42069` aufrufen.

## ⚡ Performance & Grafik-Update (Vogelperspektive)
- **Zero Z-Fighting & Shadow Acne:** Open-ended Terrain-Zylinder, kalibrierte Shadow Biases (`0.0001`) und optimierte Depth Buffer Precision (Near 1.0, Far 1000).
- **Sichtbare Straßenführung:** Asphalt-Fahrbahn, Markierungen und Kreis-Pedestale sauber über Gras-Terrain geschichtet.
- **Freie Sicht & Clean Board:** Entfernung blockierender Monolithen zu Gunsten stilvoller GLB-Modelle und optimierter Tiefen-Sortierung für Tile-Badges.


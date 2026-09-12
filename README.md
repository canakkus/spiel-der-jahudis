# 🎲 Spiel der Jahudis (Game of Jahudis)

Ein interaktives Multiplayer-Brettspiel, inspiriert von *The Game of Life 2* auf Amazon Luna – spielbar im lokalen Netzwerk oder Browser mit separatem Host-/TV-Screen und Smartphone-Controllern.

## 🚀 Features

- **Host-Screen (TV / Desktop):** Zentrale 3D-Brettspiel-Ansicht mit Three.js, Rundenübersicht, QR-Code zum Beitreten und Soundeffekten.
- **Mobile Controller (Smartphone):** Jeder Mitspieler steuert seinen Charakter direkt über den Browser seines Handys (Charakterauswahl, Würfeln, Entscheidungen, Stats).
- **Socket.IO Realtime Sync:** Blitzschnelle Echtzeit-Kommunikation zwischen Host und allen Controllern.
- **Charaktere:** Verschiedene spielbare Jahudi-Archetypen (Business Jahudi, Party Jahudi, Krypto Jahudi, Student Jahudi, Fitness Jahudi, Künstler Jahudi).

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
   - **Host Screen (am TV / PC):** `http://localhost:3000/host.html`
   - **Handy-Controller:** Den angezeigten QR-Code auf dem Host-Screen mit dem Smartphone scannen oder `http://<DEINE-IP>:3000` aufrufen.

# Spiel der Jahudis - Agentic Documentation

This file serves as the definitive architecture and context guide for any autonomous agent or LLM working on **"Spiel der Jahudis"**.

## 🏗 Architecture Overview
This is a multiplayer web game structured around a **Host-Screen (TV/PC)** and **Smartphone-Controllers (Clients)**.
- **Backend:** Node.js + Express + Socket.IO (`server.js`). Handles all state transitions, financial logic, loops, and inventory.
- **Frontend (Host):** Three.js (`board3D.js`), displaying the physical 3D board, the Game of Life-like landscape, models, the 3D spinning wheel, and car tokens.
- **Frontend (Controller):** HTML/JS (`controller.js`, `index.html`) acting as a joypad. Includes interactive swipe-to-spin mechanics, minigames (Casino), inventory (Cosmetics/Skins), and decision buttons.

## 🛠 Feature Phases Implemented

### Phase 2 & 3: 3D Asset Pipeline, Cases & Jahudi Coins
- **Jahudi Coins & Cases:** We have a secondary currency (`jahudiCoins`) for cosmetics, strictly without gameplay advantages.
- **Loot Boxes:** Managed strictly server-side (to prevent client-side spoofing).
- **Inventory System:** `board3D.js` dynamically loads `.glb` outfits/skins based on player selections.

### Phase 4: Life Stats & Job System
- **Stats:** Family Stat was completely removed. Relevant stats are Happiness, Knowledge, and Investments.
- **Dynamic Salaries:** Base salaries are gone. Entering a job calculates salary dynamically based on the player's `Knowledge` stat.
- **Hard Salary Cap:** Server strictly enforces a maximum salary of **300.000 €** on all career advancements and paydays.
- **Job Reroll:** Players can gamble ±50k to reroll their jobs directly from the mobile controller.

### Phase 5: Investments & Casino
- **Investments:** Separated from standard cash. Handled completely via server-side events.
- **Casino Minigames (Blackjack, Chicken):**
  - Managed by `src/minigames/MiniGameManager.js` to decouple gambling logic from core `GameState.js`.
  - UI bets are fixed percentages (`1%`, `10%`, `30%`, `100%`). The client only sends the percentage; the server calculates the actual cash amount.
  - **No Softlocks (The Loan System):** If a player drops below $0, the system automatically injects 50k loans until they are solvent again. These loans are saved under the hood and deducted rigorously from the final score, allowing players to go massively into the negative.

## 🗂 File Structure
- `server.js`: The central Socket.IO hub. Always validate financial transactions (salary, casino) here.
- `src/game/GameState.js`: Core lobby and turn management.
- `src/minigames/MiniGameManager.js`: Handlers for all Casino/Minigame actions (Chicken, Blackjack).
- `public/js/board3D.js`: Three.js Host rendering.
- `public/js/controller.js`: Mobile client logic.
- `public/index.html`: Mobile client UI.
- `src/data/*.json`: Static data (Careers, Decisions, Cases, Cosmetics, Characters).

## 🚀 Future Development (Next Steps)
When continuing development, ensure:
1. **Maker-Checker-Fixer Workflow:** Keep iterative validation for complex game loops.
2. **Server Authority:** Never trust the client with raw monetary values (e.g. Casino bets only send percentages).
3. **No Overbuilding:** Stay within the bounds of the current Phase context unless explicitly told otherwise.

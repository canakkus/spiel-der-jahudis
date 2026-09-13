# 🎲 Spiel der Jahudis - AI Agent Context & Architecture

This document serves as the **Single Source of Truth** for any autonomous AI Agent or LLM working on **"Spiel der Jahudis"**. Always read this file before modifying the codebase to understand the architecture, game loop, and current state.

## 🏗 System Architecture

This is a **Multi-Screen Local/Web Multiplayer Game** powered by **Node.js, Express, Socket.IO, and Three.js**.
There are two main entry points for the client:
1. **Host-Screen (TV/PC/Tablet) - `host.html` & `board3D.js`**
   - Renders the 3D game board, character models (`.glb`), the spinning wheel, and handles animations.
   - Strictly a **visual representation**. It does NOT make game logic decisions.
2. **Smartphone-Controllers - `index.html` & `controller.js`**
   - The UI for players to spin the wheel, make decisions, access the shop (Cosmetics), and play Casino Minigames.
   - Interacts heavily with `server.js` via WebSocket events.

## 🛠 Backend & Game Logic (`server.js` & `src/`)

**Golden Rule:** The server is the absolute source of truth. The client must never send raw monetary amounts to adjust balances.

### Core Modules:
- `server.js`: Web server setup, Socket.IO event mapping, global state persistence.
- `src/game/GameState.js`: Turn management, board positions, player loop.
- `src/minigames/MiniGameManager.js`: Handles all Casino Minigames (Blackjack, Chicken) independent of `GameState` to prevent state pollution.

## 🎯 Completed Feature Phases

### Phase 1: Core Board & Multiplayer
- Board generation, 5 distinct biomes (Campus, Metropolis, Suburbia, Casino, Beach).
- Physical 3D Swipe-Wheel synchronizing between Mobile and Host.
- 45° dynamic chase camera.

### Phase 2 & 3: 3D Assets, Cases & Jahudi Coins
- **Jahudi Coins:** Secondary currency earned in-game, strictly used for cosmetics (no pay-to-win).
- **Cases:** Players buy cases. Server randomly assigns a drop tier (Common, Rare, Epic, Legendary).
- **Inventory:** Dynamic loading of `.glb` models based on equipped items.

### Phase 4: Life Stats & Job System
- **Stats Used:** Happiness, Knowledge, Investments. (Family Stat has been **completely removed**).
- **Dynamic Salaries:** Salary depends purely on the `Knowledge` stat. No static base salaries!
- **Hard Salary Cap:** A strict maximum of **300.000 €** is enforced by the server on any payday or job change.
- **Job Reroll:** Players can spend 50k to reroll their job randomly.

### Phase 5: Investments & Casino
- **Investments:** Assets (Crypto, Real Estate, Stocks) are decoupled from cash.
- **Casino Minigames (Blackjack, Chicken):**
  - Uses fixed percentage buttons (`1%`, `10%`, `30%`, `100%`) in the UI. Client sends the percentage string, server calculates the dollar amount.
  - **Loan System (Anti-Softlock):** If a player drops below $0 (e.g. going all-in and losing), the server automatically grants 50k loans until solvent again. These loans accumulate as debt and are subtracted from the final score.

## 🚀 AI Agent Directives (How to work here)

1. **Maker-Checker-Fixer:** Always follow this pattern for complex features. Build, test the edge cases, fix before finalizing.
2. **File Modularity:** Keep `server.js` clean. Use `src/minigames/` or `src/game/` for encapsulated logic.
3. **No Unprompted Feature Creep:** Only build what Can explicitly asks for.
4. **Follow the Tone:** Use a casual, direct, 'denglisch' tone when communicating with Can, as defined in `GEMINI.md`.


// Board Data & Path Graph for "Spiel der Jahudis"

const BOARD_NODES = [
  // 0: Start
  { id: 0, x: 8, y: 50, type: 'start', title: 'START', icon: '🏁', color: '#10b981', next: [1], description: 'Willkommen ins Leben! Starte deine Reise.' },

  // 1: Zahltag / Erstes Gehalt
  { id: 1, x: 16, y: 50, type: 'payday', title: 'ZAHLTAG', icon: '💰', color: '#22c55e', next: [2], effect: { money: 20000 }, description: 'Erstes Gehalt erhalten: +20.000 €' },

  // 2: Verzweigung: Karriere vs. Studium
  { id: 2, x: 24, y: 50, type: 'branch', title: 'WEGWAHL', icon: '🔀', color: '#eab308', next: [3, 8], description: 'Oben: Schnelle Karriere | Unten: Akademischer Weg' },

  // Pfad A (Schnelle Karriere oben)
  { id: 3, x: 32, y: 32, type: 'action', title: 'AKTION', icon: '⚡', color: '#ec4899', next: [4], description: 'Erster großer Deal abgeschlossen!' },
  { id: 4, x: 40, y: 24, type: 'payday', title: 'ZAHLTAG', icon: '💰', color: '#22c55e', next: [5], effect: { money: 25000 }, description: 'Gehaltseingang: +25.000 €' },
  { id: 5, x: 48, y: 24, type: 'happiness', title: 'GLÜCK', icon: '❤️', color: '#f43f5e', next: [6], effect: { happiness: 25 }, description: 'Spontaner Wochenend-Trip: +25 Glück' },
  { id: 6, x: 56, y: 30, type: 'action', title: 'AKTION', icon: '⚡', color: '#ec4899', next: [7], description: 'Große Firmenfeier gecrasht!' },
  { id: 7, x: 62, y: 42, type: 'action', title: 'AKTION', icon: '⚡', color: '#ec4899', next: [13], description: 'Immobilien-Investition getätigt!' },

  // Pfad B (Akademischer Weg / Studium unten)
  { id: 8, x: 32, y: 68, type: 'knowledge', title: 'STUDIUM', icon: '🎓', color: '#3b82f6', next: [9], effect: { knowledge: 30 }, description: 'Bachelor mit Auszeichnung: +30 Wissen' },
  { id: 9, x: 40, y: 76, type: 'action', title: 'AKTION', icon: '⚡', color: '#ec4899', next: [10], description: 'Wissenschaftspreis gewonnen!' },
  { id: 10, x: 48, y: 76, type: 'knowledge', title: 'MASTER', icon: '🧠', color: '#3b82f6', next: [11], effect: { knowledge: 40 }, description: 'Master-Thesis publiziert: +40 Wissen' },
  { id: 11, x: 56, y: 70, type: 'payday', title: 'ZAHLTAG+', icon: '💰', color: '#22c55e', next: [12], effect: { money: 40000 }, description: 'Einstiegsgehalt Akademiker: +40.000 €' },
  { id: 12, x: 62, y: 58, type: 'happiness', title: 'GLÜCK', icon: '❤️', color: '#f43f5e', next: [13], effect: { happiness: 20 }, description: 'Studi-Party Legende geworden: +20 Glück' },

  // 13: Wiedervereinigung & Großer Zahltag
  { id: 13, x: 68, y: 50, type: 'payday', title: 'SUPER ZAHLTAG', icon: '💎', color: '#10b981', next: [14], effect: { money: 50000 }, description: 'Mid-Life Bonus: +50.000 €' },

  // 14: Luxury & Lifestyle Trail
  { id: 14, x: 76, y: 44, type: 'action', title: 'AKTION', icon: '⚡', color: '#ec4899', next: [15], description: 'Großes Luxus-Ereignis!' },
  { id: 15, x: 84, y: 52, type: 'happiness', title: 'TRAUMLEBEN', icon: '✨', color: '#a855f7', next: [16], effect: { happiness: 35, knowledge: 15 }, description: 'Weltreise erster Klasse: +35 Glück, +15 Wissen' },

  // 16: Ziel / Ruhestand
  { id: 16, x: 92, y: 50, type: 'finish', title: 'RUHESTAND', icon: '🏝️', color: '#f59e0b', next: [], effect: { money: 100000, happiness: 50 }, description: 'Luxusresort erreicht! Herzlichen Glückwunsch zum Lebenswerk.' }
];

// Tailored Action Cards Deck (Life 2 Style)
const ACTION_CARDS = [
  {
    title: 'WOLKENKRATZER KAUF',
    icon: '🏙️',
    headline: 'Du kaufst einen luxuriösen Penthouse-Tower!',
    desc: 'Beste Aussicht über die Metropole und Prestige pur.',
    effect: { money: 80000, happiness: 30, knowledge: 10 }
  },
  {
    title: 'STARTUP BÖRSENGANG',
    icon: '📈',
    headline: 'Dein Tech-Startup geht an die Börse!',
    desc: 'Die Aktienkurse explodieren durch die Decke!',
    effect: { money: 120000, happiness: 25, knowledge: 25 }
  },
  {
    title: 'KRYPTO MOON',
    icon: '🚀',
    headline: 'Dein Krypto-Portfolio hat sich verzehnfacht!',
    desc: 'Diamond Hands haben sich ausgezahlt!',
    effect: { money: 90000, happiness: 20 }
  },
  {
    title: 'BESTSELLER-BUCH',
    icon: '📚',
    headline: 'Du schreibst ein virales Bestseller-Buch!',
    desc: 'Autogrammstunden, Talkshows und weltweite Berühmtheit.',
    effect: { money: 45000, knowledge: 40, happiness: 20 }
  },
  {
    title: 'LUXUS SPORTWAGEN',
    icon: '🏎️',
    headline: 'Du kaufst dir einen maßgeschneiderten Supersportwagen!',
    desc: 'V12 Sound und neidische Blicke an jeder Ampel.',
    effect: { money: -30000, happiness: 45 }
  },
  {
    title: 'STEUERN PRÜFUNG',
    icon: '📑',
    headline: 'Das Finanzamt fordert eine Nachzahlung!',
    desc: 'Ein kleiner Rechenfehler kostet leider ordentlich.',
    effect: { money: -25000, knowledge: 15 }
  },
  {
    title: 'TRAUMHOCHZEIT & VIP PARTY',
    icon: '💍',
    headline: 'Du veranstaltest die Party des Jahrhunderts!',
    desc: 'Champagner-Pyramiden und 500 geladene Gäste.',
    effect: { money: -20000, happiness: 50 }
  },
  {
    title: 'PATENT ERFUNDEN',
    icon: '💡',
    headline: 'Du meldest ein bahnbrechendes Patent an!',
    desc: 'Globale Lizenzgebühren fließen automatisch auf dein Konto.',
    effect: { money: 75000, knowledge: 35 }
  }
];

if (typeof module !== 'undefined') {
  module.exports = { BOARD_NODES, ACTION_CARDS };
}

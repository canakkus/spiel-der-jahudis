// =============================================================
// SPIEL DER JAHUDIS – Spacious Life Board v3.0
// Fully Untangled Coordinates | Open Center Plaza for 3D Wheel
// =============================================================

const BOARD_NODES = [
  {
    "id": 0,
    "x": 10,
    "y": 26,
    "biome": "campus",
    "type": "start",
    "title": "START",
    "icon": "🏁",
    "color": "#10b981",
    "next": [
      1
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Willkommen im Spiel des Lebens! Das Abenteuer beginnt."
  },
  {
    "id": 1,
    "x": 12.1,
    "y": 21.8,
    "biome": "campus",
    "type": "normal",
    "title": "SCHULTAG",
    "icon": "📓",
    "color": "#334155",
    "next": [
      2
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Montag Morgen, 8 Uhr. Der Lehrer schaut schon komisch."
  },
  {
    "id": 2,
    "x": 14.7,
    "y": 18,
    "biome": "campus",
    "type": "knowledge",
    "title": "LERNSTUNDE",
    "icon": "📚",
    "color": "#06b6d4",
    "next": [
      3
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du lernst was – tatsächlich. +Wissen."
  },
  {
    "id": 3,
    "x": 17.7,
    "y": 14.4,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      4
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Überraschung! Das Leben passiert einfach."
  },
  {
    "id": 4,
    "x": 21.7,
    "y": 11.9,
    "biome": "campus",
    "type": "normal",
    "title": "PAUSE",
    "icon": "☕",
    "color": "#334155",
    "next": [
      5
    ],
    "isStop": false,
    "decisionId": null,
    "description": "10-Minuten-Pause. Dein Lieblingsessen ist ausverkauft."
  },
  {
    "id": 5,
    "x": 25.8,
    "y": 9.8,
    "biome": "campus",
    "type": "knowledge",
    "title": "ABSCHLUSS",
    "icon": "🎓",
    "color": "#06b6d4",
    "next": [
      6
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du hast die Schule geschafft! Matura/Abitur in der Tasche."
  },
  {
    "id": 6,
    "x": 30.4,
    "y": 8.9,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      7
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Schulabschluss-Party. Was ist heute Nacht noch alles passiert?"
  },
  {
    "id": 7,
    "x": 35,
    "y": 8,
    "biome": "campus",
    "type": "branch",
    "title": "WEGWAHL",
    "icon": "🎯",
    "color": "#eab308",
    "next": [
      8,
      30
    ],
    "isStop": true,
    "decisionId": "career_choice",
    "description": "STOP! Entscheide: Studium oder direkt ins Berufsleben?"
  },
  {
    "id": 8,
    "x": 40,
    "y": 7,
    "biome": "campus",
    "type": "knowledge",
    "title": "ERSTSEMESTER",
    "icon": "🎓",
    "color": "#3b82f6",
    "next": [
      9
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Erstes Semester. ECTS-Punkte sammeln, Freibier trinken."
  },
  {
    "id": 9,
    "x": 44.8,
    "y": 6.4,
    "biome": "campus",
    "type": "normal",
    "title": "VORLESUNG",
    "icon": "•",
    "color": "#334155",
    "next": [
      10
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Vorlesung um 8 Uhr. Du schläfst halb ein."
  },
  {
    "id": 10,
    "x": 49.6,
    "y": 5.9,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      11
    ],
    "isStop": false,
    "decisionId": null,
    "description": "WG-Chaos! Jemand hat dein Essen aus dem Kühlschrank gestohlen."
  },
  {
    "id": 11,
    "x": 54.5,
    "y": 5.6,
    "biome": "campus",
    "type": "knowledge",
    "title": "SEMINAR",
    "icon": "📖",
    "color": "#06b6d4",
    "next": [
      12
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Seminar bestanden. Prof war überraschend nett."
  },
  {
    "id": 12,
    "x": 59.3,
    "y": 5.6,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      13
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Werkstudenten-Gehalt! Warm duschen ist wieder möglich."
  },
  {
    "id": 13,
    "x": 64.1,
    "y": 5.9,
    "biome": "campus",
    "type": "normal",
    "title": "PRÜFUNG",
    "icon": "📝",
    "color": "#334155",
    "next": [
      14
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Klausur. 5 Energy Drinks und 0 Stunden Schlaf. Du weißt schon."
  },
  {
    "id": 14,
    "x": 68.9,
    "y": 6.5,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      15
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Studentenparty! Du verfeierst den Abend."
  },
  {
    "id": 15,
    "x": 73.7,
    "y": 7.3,
    "biome": "campus",
    "type": "knowledge",
    "title": "BACHELOR",
    "icon": "🧠",
    "color": "#06b6d4",
    "next": [
      16
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Bachelor fast fertig. Nur noch die Thesis..."
  },
  {
    "id": 16,
    "x": 78.4,
    "y": 8.6,
    "biome": "campus",
    "type": "action",
    "title": "THESIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      17
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Bachelor-Thesis Abgabe! Nächte durchgearbeitet."
  },
  {
    "id": 17,
    "x": 83,
    "y": 10,
    "biome": "campus",
    "type": "branch",
    "title": "MASTER?",
    "icon": "🏅",
    "color": "#3b82f6",
    "next": [
      18,
      25
    ],
    "isStop": true,
    "decisionId": "master_choice",
    "description": "STOP! Master machen oder direkt jobben? Deine Entscheidung!"
  },
  {
    "id": 18,
    "x": 87,
    "y": 13,
    "biome": "campus",
    "type": "knowledge",
    "title": "MASTER",
    "icon": "🔬",
    "color": "#06b6d4",
    "next": [
      19
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Master-Studium. Noch mehr Kaffee, noch mehr Wissen."
  },
  {
    "id": 19,
    "x": 90.1,
    "y": 16.1,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      20
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Konferenz in Wien. Du netzwerkst wie ein Profi."
  },
  {
    "id": 20,
    "x": 92.1,
    "y": 19.8,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      21
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Forschungsstipendium kassiert!"
  },
  {
    "id": 21,
    "x": 93,
    "y": 24,
    "biome": "campus",
    "type": "knowledge",
    "title": "DISSERTATION",
    "icon": "📜",
    "color": "#06b6d4",
    "next": [
      22
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Doktorarbeit? Du überlegst... Nein. Master reicht."
  },
  {
    "id": 22,
    "x": 92.3,
    "y": 28.2,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      23
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Abschlussfeier! Doktorhut fliegt durchs Bild."
  },
  {
    "id": 23,
    "x": 90.1,
    "y": 31.9,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      24
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Letzter Uni-Zahltag. Jetzt kommt die echte Welt."
  },
  {
    "id": 24,
    "x": 87,
    "y": 35,
    "biome": "campus",
    "type": "career",
    "title": "MASTER-ABSCHLUSS",
    "icon": "🏅",
    "color": "#3b82f6",
    "next": [
      50
    ],
    "isStop": true,
    "decisionId": "job_offer",
    "description": "STOP! Master geschafft! Welchen Job-Pfad wählst du?"
  },
  {
    "id": 25,
    "x": 83,
    "y": 15,
    "biome": "campus",
    "type": "career",
    "title": "BERUFSSTART",
    "icon": "💼",
    "color": "#3b82f6",
    "next": [
      26
    ],
    "isStop": true,
    "decisionId": "job_offer",
    "description": "STOP! Direkt in die Karriere eingestiegen!"
  },
  {
    "id": 26,
    "x": 83,
    "y": 19.8,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      27
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Erster Gehaltszettel. Weniger als erwartet, aber es reicht."
  },
  {
    "id": 27,
    "x": 83,
    "y": 24.6,
    "biome": "campus",
    "type": "normal",
    "title": "ONBOARDING",
    "icon": "•",
    "color": "#334155",
    "next": [
      28
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Onboarding-Woche. 50 Tools, die du nie wieder benutzt."
  },
  {
    "id": 28,
    "x": 82.1,
    "y": 29.3,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      29
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Firmenevent. Dein Chef macht schlechte Witze. Du lachst."
  },
  {
    "id": 29,
    "x": 83,
    "y": 34,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      50
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Gehaltserhöhung nach Probezeit!"
  },
  {
    "id": 30,
    "x": 33,
    "y": 13,
    "biome": "campus",
    "type": "career",
    "title": "LEHRE",
    "icon": "🔧",
    "color": "#3b82f6",
    "next": [
      31
    ],
    "isStop": true,
    "decisionId": "job_offer",
    "description": "STOP! Lehrstelle gefunden! Welcher Betrieb?"
  },
  {
    "id": 31,
    "x": 29.8,
    "y": 16.2,
    "biome": "campus",
    "type": "normal",
    "title": "AUSBILDUNG",
    "icon": "•",
    "color": "#334155",
    "next": [
      32
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Ausbildung läuft. Chef meckert, aber du lernst."
  },
  {
    "id": 32,
    "x": 26.8,
    "y": 19.5,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      33
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Lehrlingsgeld auf dem Konto. Klein, aber meins."
  },
  {
    "id": 33,
    "x": 24,
    "y": 23.1,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      34
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Lehrabschlussprüfung! Du bestehst – knapp, aber reicht."
  },
  {
    "id": 34,
    "x": 24,
    "y": 27.6,
    "biome": "campus",
    "type": "knowledge",
    "title": "FACHKURS",
    "icon": "📚",
    "color": "#06b6d4",
    "next": [
      35
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Weiterbildungskurs. Zertifikat hängt jetzt am Kühlschrank."
  },
  {
    "id": 35,
    "x": 26.1,
    "y": 31.6,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      36
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Gesellengehalt. Jetzt verdienst du richtig."
  },
  {
    "id": 36,
    "x": 29.8,
    "y": 33.5,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      37
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Kollegen-Drama in der Firma. Du hältst dich raus."
  },
  {
    "id": 37,
    "x": 34.3,
    "y": 33.8,
    "biome": "campus",
    "type": "normal",
    "title": "BEFÖRDERUNG",
    "icon": "📈",
    "color": "#334155",
    "next": [
      38
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Vorschlag zur Beförderung! Dein Chef mag dich doch."
  },
  {
    "id": 38,
    "x": 38.8,
    "y": 33.2,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      39
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Gehaltserhöhung nach Beförderung!"
  },
  {
    "id": 39,
    "x": 43,
    "y": 31.7,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      40
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Betriebsausflug. Du gewinnst das Bowling-Turnier."
  },
  {
    "id": 40,
    "x": 47.2,
    "y": 29.9,
    "biome": "campus",
    "type": "career",
    "title": "KARRIERE-START",
    "icon": "🚀",
    "color": "#3b82f6",
    "next": [
      41
    ],
    "isStop": true,
    "decisionId": "job_offer",
    "description": "STOP! Du hast dich etabliert. Welchen nächsten Karriereschritt machst du?"
  },
  {
    "id": 41,
    "x": 51.1,
    "y": 27.7,
    "biome": "campus",
    "type": "normal",
    "title": "AUFSTIEG",
    "icon": "•",
    "color": "#334155",
    "next": [
      42
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Neue Verantwortung übernommen. Mehr Stress, mehr Status."
  },
  {
    "id": 42,
    "x": 55.1,
    "y": 25.5,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      43
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Teamleiter-Gehalt eingegangen."
  },
  {
    "id": 43,
    "x": 59.2,
    "y": 23.8,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      44
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Projekt erfolgreich abgeschlossen. Ruhm und Anerkennung."
  },
  {
    "id": 44,
    "x": 63.5,
    "y": 22.2,
    "biome": "campus",
    "type": "normal",
    "title": "NETWORKING",
    "icon": "•",
    "color": "#334155",
    "next": [
      45
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Business-Lunch mit Kontakten. LinkedIn boomt."
  },
  {
    "id": 45,
    "x": 67.8,
    "y": 21.2,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      46
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Quartalsprämie erhalten!"
  },
  {
    "id": 46,
    "x": 72.2,
    "y": 22.2,
    "biome": "campus",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      47
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Spontaner Jobwechsel-Anruf. Besseres Angebot!"
  },
  {
    "id": 47,
    "x": 75.2,
    "y": 25.5,
    "biome": "campus",
    "type": "normal",
    "title": "JOB-WECHSEL",
    "icon": "•",
    "color": "#334155",
    "next": [
      48
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Neuer Job, neues Glück. Onboarding zum zweiten Mal."
  },
  {
    "id": 48,
    "x": 77.1,
    "y": 29.6,
    "biome": "campus",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      49
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Neues Gehalt – deutlich besser!"
  },
  {
    "id": 49,
    "x": 78,
    "y": 34,
    "biome": "campus",
    "type": "knowledge",
    "title": "WEITERBILDUNG",
    "icon": "📚",
    "color": "#06b6d4",
    "next": [
      50
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Zertifizierung abgeschlossen. Du bist jetzt offiziell Experte."
  },
  {
    "id": 50,
    "x": 83,
    "y": 39,
    "biome": "city",
    "type": "payday",
    "title": "STADTLEBEN",
    "icon": "🏙️",
    "color": "#22c55e",
    "next": [
      51
    ],
    "isStop": false,
    "decisionId": null,
    "description": "In der Metropole angekommen. Skyline, Stress und Cappuccino."
  },
  {
    "id": 51,
    "x": 84.7,
    "y": 40.7,
    "biome": "city",
    "type": "normal",
    "title": "BÜRO-ALLTAG",
    "icon": "•",
    "color": "#334155",
    "next": [
      52
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Open-Space Office. Jemand heizt immer Fisch auf."
  },
  {
    "id": 52,
    "x": 86.5,
    "y": 42.5,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      53
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Großstadt-Gehalt eingegangen. Miete frisst die Hälfte."
  },
  {
    "id": 53,
    "x": 88.1,
    "y": 44.4,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      54
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Business-Lunch mit dem CEO. Nervöses Schwitzen."
  },
  {
    "id": 54,
    "x": 89.6,
    "y": 46.3,
    "biome": "city",
    "type": "normal",
    "title": "STARTUP-IDEE",
    "icon": "💡",
    "color": "#334155",
    "next": [
      55
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du hast eine Geschäftsidee. Alle sagen sie ist genial."
  },
  {
    "id": 55,
    "x": 91.1,
    "y": 48.2,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      56
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Bonus bekommen! Urlaub buchen sofort."
  },
  {
    "id": 56,
    "x": 92.2,
    "y": 50.5,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      57
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Projekt-Präsentation vor Investoren. Du überzeugst."
  },
  {
    "id": 57,
    "x": 93.3,
    "y": 52.7,
    "biome": "city",
    "type": "normal",
    "title": "BEFÖRDERUNG",
    "icon": "📈",
    "color": "#334155",
    "next": [
      58
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Abteilungsleiter! Mehr Verantwortung, eigenes Büro."
  },
  {
    "id": 58,
    "x": 94,
    "y": 55,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      59
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Führungskraft-Gehalt. Erstmals fünfstellig netto!"
  },
  {
    "id": 59,
    "x": 94,
    "y": 57.4,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      60
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Team-Dinner auf Firmenkosten. Gutes Steak, gute Laune."
  },
  {
    "id": 60,
    "x": 94,
    "y": 59.9,
    "biome": "city",
    "type": "career",
    "title": "KARRIERE",
    "icon": "🏅",
    "color": "#3b82f6",
    "next": [
      61
    ],
    "isStop": true,
    "decisionId": "career_advance",
    "description": "STOP! Du stehst vor einer Weggabelung in deiner Karriere."
  },
  {
    "id": 61,
    "x": 93.6,
    "y": 62.3,
    "biome": "city",
    "type": "normal",
    "title": "DIREKTOR",
    "icon": "•",
    "color": "#334155",
    "next": [
      62
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Als Direktor übernimmst du mehr Verantwortung."
  },
  {
    "id": 62,
    "x": 93.2,
    "y": 64.8,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      63
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Direktor-Gehalt! Bonusstruktur sieht gut aus."
  },
  {
    "id": 63,
    "x": 92.5,
    "y": 67.1,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      64
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Firmenübernahme! Du überlebst als einer der Wenigen."
  },
  {
    "id": 64,
    "x": 91.3,
    "y": 69.3,
    "biome": "city",
    "type": "normal",
    "title": "GESCHÄFTSREISE",
    "icon": "✈️",
    "color": "#334155",
    "next": [
      65
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Business Class nach Tokyo. LinkedIn-Post fertig?"
  },
  {
    "id": 65,
    "x": 90.2,
    "y": 71.5,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      66
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Vierteljährlicher Bonus eingegangen."
  },
  {
    "id": 66,
    "x": 88.5,
    "y": 73.2,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      67
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Branchenpreis gewonnen! Du bist offiziell bekannt."
  },
  {
    "id": 67,
    "x": 86.6,
    "y": 74.7,
    "biome": "city",
    "type": "normal",
    "title": "EIGENSTÄNDIG",
    "icon": "•",
    "color": "#334155",
    "next": [
      68
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Selbstständigkeit lockt. Soll ich? Ich machs."
  },
  {
    "id": 68,
    "x": 84.6,
    "y": 76.2,
    "biome": "city",
    "type": "career",
    "title": "AUTO-KAUF",
    "icon": "🚗",
    "color": "#f59e0b",
    "next": [
      69
    ],
    "isStop": true,
    "decisionId": "car_purchase",
    "description": "STOP! Du kannst dir jetzt ein Auto leisten. Welches?"
  },
  {
    "id": 69,
    "x": 82.3,
    "y": 77.1,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      70
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Mit Auto fährt man zur Arbeit und spart Nerven."
  },
  {
    "id": 70,
    "x": 80,
    "y": 78,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      80
    ],
    "isStop": false,
    "decisionId": null,
    "description": "City Life: Stadtmarathon, Rooftop-Bar, Sushi-Lunch."
  },
  {
    "id": 80,
    "x": 75,
    "y": 80,
    "biome": "city",
    "type": "action",
    "title": "KENNENLERNEN",
    "icon": "💘",
    "color": "#f43f5e",
    "next": [
      81
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du lernst jemanden kennen. App-Date, Kaffee, Nervosität."
  },
  {
    "id": 81,
    "x": 71.4,
    "y": 80.7,
    "biome": "city",
    "type": "normal",
    "title": "DATES",
    "icon": "🍽️",
    "color": "#334155",
    "next": [
      82
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Erste Dates. Restaurants, Kino, spätabendliche Spaziergänge."
  },
  {
    "id": 82,
    "x": 67.8,
    "y": 81.4,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      83
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Beziehungs-Drama! Oder Friede? Das Würfelschicksal entscheidet."
  },
  {
    "id": 83,
    "x": 64.2,
    "y": 82,
    "biome": "city",
    "type": "action",
    "title": "ZUSAMMENZIEHEN",
    "icon": "🏠",
    "color": "#f43f5e",
    "next": [
      84
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Ihr zieht zusammen. Erste WG zu zweit."
  },
  {
    "id": 84,
    "x": 60.6,
    "y": 82,
    "biome": "city",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      85
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Doppeltes Haushaltseinkommen! Traumwohnung wird möglich."
  },
  {
    "id": 85,
    "x": 57,
    "y": 81.4,
    "biome": "city",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      86
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Gemeinsamer Urlaub. Mallorca, Streit, Versöhnung."
  },
  {
    "id": 86,
    "x": 53.4,
    "y": 80.7,
    "biome": "city",
    "type": "action",
    "title": "HEIRAT",
    "icon": "💍",
    "color": "#f43f5e",
    "next": [
      87
    ],
    "isStop": true,
    "decisionId": "marriage",
    "description": "STOP! Liebesantrag! Traumhochzeit oder kleines Standesamt?"
  },
  {
    "id": 87,
    "x": 49.8,
    "y": 79.9,
    "biome": "suburbia",
    "type": "normal",
    "title": "FLITTERWOCHEN",
    "icon": "🥂",
    "color": "#334155",
    "next": [
      88
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Honeymoon! Malediven oder Österreich je nach Budget."
  },
  {
    "id": 88,
    "x": 46.4,
    "y": 78.6,
    "biome": "suburbia",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      89
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Brautpaar-Steuerklasse. Überraschend mehr Netto!"
  },
  {
    "id": 89,
    "x": 43.1,
    "y": 76.9,
    "biome": "suburbia",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      90
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Erste Ehestreitigkeit. Es geht um Spülmaschinen-Einräumen."
  },
  {
    "id": 90,
    "x": 40,
    "y": 75,
    "biome": "suburbia",
    "type": "normal",
    "title": "GEMEINSAM",
    "icon": "•",
    "color": "#334155",
    "next": [
      91
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Gemeinsames Konto eröffnet. Vertrauen ist alles."
  },
  {
    "id": 91,
    "x": 36,
    "y": 73,
    "biome": "suburbia",
    "type": "house",
    "title": "HAUSKAUF",
    "icon": "🏡",
    "color": "#a855f7",
    "next": [
      92
    ],
    "isStop": true,
    "decisionId": "house_purchase",
    "description": "STOP! Immobilien-Entscheidung! Kaufen oder weiter mieten?"
  },
  {
    "id": 92,
    "x": 33.5,
    "y": 71.1,
    "biome": "suburbia",
    "type": "normal",
    "title": "EINZUG",
    "icon": "📦",
    "color": "#334155",
    "next": [
      93
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Einzug ins neue Eigenheim. 50 Kisten, 1 Parkverbot."
  },
  {
    "id": 93,
    "x": 31,
    "y": 69.2,
    "biome": "suburbia",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      94
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Nachbar begrüßt euch mit Beschwerden. Klassiker."
  },
  {
    "id": 94,
    "x": 28.4,
    "y": 67.3,
    "biome": "suburbia",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      95
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Wohnkredittilgung läuft. Investition zahlt sich aus."
  },
  {
    "id": 95,
    "x": 25.9,
    "y": 65.4,
    "biome": "suburbia",
    "type": "action",
    "title": "KINDER",
    "icon": "👶",
    "color": "#f43f5e",
    "next": [
      96
    ],
    "isStop": true,
    "decisionId": "have_children",
    "description": "STOP! Nachwuchs? Das Leben verändert sich komplett!"
  },
  {
    "id": 96,
    "x": 23.3,
    "y": 63.7,
    "biome": "suburbia",
    "type": "normal",
    "title": "WINDELN & CO.",
    "icon": "🍼",
    "color": "#334155",
    "next": [
      97
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Babyalltag. Schlafentzug auf Profi-Niveau."
  },
  {
    "id": 97,
    "x": 20.5,
    "y": 62.2,
    "biome": "suburbia",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      98
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Kind sagt erstes Wort: \"Mama/Papa\". Herz schmilzt."
  },
  {
    "id": 98,
    "x": 17.4,
    "y": 62,
    "biome": "suburbia",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      99
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Kindergeldbonus aktiviert. Auch Kinder-Steuerabzug!"
  },
  {
    "id": 99,
    "x": 14.5,
    "y": 63,
    "biome": "suburbia",
    "type": "normal",
    "title": "SCHULE",
    "icon": "🏫",
    "color": "#334155",
    "next": [
      100
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Kind kommt in die Schule. Elternabende inklusive."
  },
  {
    "id": 100,
    "x": 12.4,
    "y": 65.2,
    "biome": "suburbia",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      101
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Kind-Ereignis! Was hat der Nachwuchs jetzt wieder angestellt?"
  },
  {
    "id": 101,
    "x": 11,
    "y": 68,
    "biome": "casino",
    "type": "action",
    "title": "INVESTMENT",
    "icon": "📊",
    "color": "#eab308",
    "next": [
      102
    ],
    "isStop": true,
    "decisionId": "investment",
    "description": "STOP! Ersparnisse anlegen – wohin investierst du dein Geld?"
  },
  {
    "id": 102,
    "x": 11,
    "y": 72,
    "biome": "casino",
    "type": "branch",
    "title": "SCHICKSALSWAHL",
    "icon": "⚖️",
    "color": "#eab308",
    "next": [
      103,
      115
    ],
    "isStop": true,
    "decisionId": "risk_choice",
    "description": "STOP! Sicherer Sparbuch-Pfad oder voller Risiko ins Casino?"
  },
  {
    "id": 103,
    "x": 14,
    "y": 74,
    "biome": "casino",
    "type": "normal",
    "title": "SPARBUCH",
    "icon": "🏦",
    "color": "#334155",
    "next": [
      104
    ],
    "isStop": false,
    "decisionId": null,
    "description": "0.5% Zinsen. Sicher ist sicher."
  },
  {
    "id": 104,
    "x": 16.4,
    "y": 75.6,
    "biome": "casino",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      105
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Regelmäßiges Gehalt. Vorhersehbar. Beruhigend."
  },
  {
    "id": 105,
    "x": 19,
    "y": 76.5,
    "biome": "casino",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      106
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Bausparvertrag wird zuteilungsreif!"
  },
  {
    "id": 106,
    "x": 21.8,
    "y": 77.3,
    "biome": "casino",
    "type": "normal",
    "title": "DEPOT",
    "icon": "📈",
    "color": "#334155",
    "next": [
      107
    ],
    "isStop": false,
    "decisionId": null,
    "description": "ETF-Portfolio wächst langsam aber stetig."
  },
  {
    "id": 107,
    "x": 24.4,
    "y": 78.4,
    "biome": "casino",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      108
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Dividenden! Das Geld arbeitet für dich."
  },
  {
    "id": 108,
    "x": 26,
    "y": 80.6,
    "biome": "casino",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      109
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Zinserhöhung! Festgeld-Rendite verdoppelt sich."
  },
  {
    "id": 109,
    "x": 25,
    "y": 83,
    "biome": "casino",
    "type": "normal",
    "title": "VERMÖGEN",
    "icon": "💎",
    "color": "#334155",
    "next": [
      110
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Solides Vermögen aufgebaut. Keine Abenteuer nötig."
  },
  {
    "id": 110,
    "x": 22.6,
    "y": 84.5,
    "biome": "casino",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      111
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Letzter sicherer Zahltag vor der Rente."
  },
  {
    "id": 111,
    "x": 19.9,
    "y": 85,
    "biome": "casino",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      112
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Finanzkrise! Dein diversifiziertes Portfolio übersteht es."
  },
  {
    "id": 112,
    "x": 17.1,
    "y": 84.6,
    "biome": "casino",
    "type": "career",
    "title": "FRÜHRENTNER",
    "icon": "🏖️",
    "color": "#3b82f6",
    "next": [
      113
    ],
    "isStop": false,
    "decisionId": null,
    "description": "FIRE – Financial Independence! Du könntest jetzt aufhören."
  },
  {
    "id": 113,
    "x": 14.6,
    "y": 83.3,
    "biome": "casino",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      114
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Letzter Zahltag auf dem sicheren Pfad."
  },
  {
    "id": 114,
    "x": 13,
    "y": 85,
    "biome": "casino",
    "type": "action",
    "title": "EREIGNIS",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      120
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Ruhe vor dem Sturm. Alles gut."
  },
  {
    "id": 115,
    "x": 9,
    "y": 75,
    "biome": "casino",
    "type": "action",
    "title": "CASINO-NACHT",
    "icon": "🎰",
    "color": "#ec4899",
    "next": [
      116
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Der Neon-Strip lockt! All-In oder kleines Spiel?"
  },
  {
    "id": 116,
    "x": 7.4,
    "y": 78.2,
    "biome": "casino",
    "type": "action",
    "title": "ALL-IN",
    "icon": "🎲",
    "color": "#ec4899",
    "next": [
      117
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du setzt alles auf eine Karte. Das Herz klopft."
  },
  {
    "id": 117,
    "x": 7,
    "y": 81.8,
    "biome": "casino",
    "type": "action",
    "title": "KRYPTO 🚀",
    "icon": "🚀",
    "color": "#f59e0b",
    "next": [
      118
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Bitcoin x10! Dein Portfolio explodiert!"
  },
  {
    "id": 118,
    "x": 7.8,
    "y": 85.3,
    "biome": "casino",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      119
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Casino-Auszahlung in Bar abgeholt!"
  },
  {
    "id": 119,
    "x": 10,
    "y": 88,
    "biome": "casino",
    "type": "action",
    "title": "LETZTER PUMP",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      120
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Achterbahnfahrt der Emotionen. Du verlässt das Casino."
  },
  {
    "id": 120,
    "x": 13,
    "y": 90,
    "biome": "beach",
    "type": "payday",
    "title": "PENSION",
    "icon": "💎",
    "color": "#22c55e",
    "next": [
      121
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Wege vereint! Pension oder Krypto-Exit – wer hat mehr?"
  },
  {
    "id": 121,
    "x": 20.3,
    "y": 91,
    "biome": "beach",
    "type": "action",
    "title": "LETZTER DEAL",
    "icon": "⚡",
    "color": "#ec4899",
    "next": [
      122
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Dein letzter großer finanzieller Coup."
  },
  {
    "id": 122,
    "x": 27.6,
    "y": 92.1,
    "biome": "beach",
    "type": "normal",
    "title": "MEMOIREN",
    "icon": "📖",
    "color": "#334155",
    "next": [
      123
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Du schreibst deine Memoiren. Bestseller natürlich."
  },
  {
    "id": 123,
    "x": 34.9,
    "y": 93,
    "biome": "beach",
    "type": "payday",
    "title": "ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      124
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Pensionskasse schüttet aus. Langfristige Investitionen zahlen sich aus."
  },
  {
    "id": 124,
    "x": 42.3,
    "y": 93.8,
    "biome": "beach",
    "type": "action",
    "title": "VERMÄCHTNIS",
    "icon": "🏆",
    "color": "#f59e0b",
    "next": [
      125
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Deine Stiftung wird gegründet. Dein Name bleibt."
  },
  {
    "id": 125,
    "x": 49.6,
    "y": 94,
    "biome": "beach",
    "type": "normal",
    "title": "WELTREISE",
    "icon": "🌍",
    "color": "#334155",
    "next": [
      126
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Endlich Zeit für die Weltreise. Erster Stopp: Japan."
  },
  {
    "id": 126,
    "x": 57,
    "y": 93.6,
    "biome": "beach",
    "type": "career",
    "title": "GOLDEN HANDSHAKE",
    "icon": "🤝",
    "color": "#3b82f6",
    "next": [
      127
    ],
    "isStop": true,
    "decisionId": "car_upgrade",
    "description": "STOP! Goldener Handschlag! Luxus-Abschluss & Premium-Auto."
  },
  {
    "id": 127,
    "x": 64.3,
    "y": 92.4,
    "biome": "beach",
    "type": "payday",
    "title": "LETZTER ZAHLTAG",
    "icon": "💰",
    "color": "#22c55e",
    "next": [
      128
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Letzter regulärer Zahltag. Ab jetzt zählt nur das Vermögen."
  },
  {
    "id": 128,
    "x": 71.3,
    "y": 90.4,
    "biome": "beach",
    "type": "action",
    "title": "LETZTE SONNE",
    "icon": "🍹",
    "color": "#ec4899",
    "next": [
      129
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Cocktail an der Strandbar. Du hast es dir verdient."
  },
  {
    "id": 129,
    "x": 78,
    "y": 87.3,
    "biome": "beach",
    "type": "normal",
    "title": "ENKELN SPIELEN",
    "icon": "👴",
    "color": "#334155",
    "next": [
      130
    ],
    "isStop": false,
    "decisionId": null,
    "description": "Enkel spielen im Garten. Das Beste was passieren konnte."
  },
  {
    "id": 130,
    "x": 84,
    "y": 83,
    "biome": "beach",
    "type": "finish",
    "title": "RUHESTAND",
    "icon": "🏝️",
    "color": "#f59e0b",
    "next": [],
    "isStop": true,
    "decisionId": null,
    "description": "ZIEL! Willkommen im ewigen Urlaub! Endabrechnung startet."
  }
];

const ACTION_CARDS = [
  {
    "title": "RUG PULL!",
    "icon": "💀",
    "headline": "Dein Lieblingscoin ist weg!",
    "desc": "Developer-Wallet leer. Discord gelöscht. Das Geld ist weg.",
    "effect": {
      "money": -80000,
      "happiness": -30
    }
  },
  {
    "title": "BITCOIN MOON 🚀",
    "icon": "🚀",
    "headline": "Dein Portfolio x10!",
    "desc": "Diamond Hands haben sich ausgezahlt. HODL forever.",
    "effect": {
      "money": 150000,
      "happiness": 50
    }
  },
  {
    "title": "SEC ERMITTLUNG",
    "icon": "⚖️",
    "headline": "Die SEC klopft an!",
    "desc": "Wegen deiner suspekten Trades ermittelt die US-Börsenaufsicht.",
    "effect": {
      "money": -60000,
      "happiness": -40
    }
  },
  {
    "title": "STEUEROASE",
    "icon": "🏝️",
    "headline": "Offshore-Konto aktiviert!",
    "desc": "Dein Steuerberater hat Cayman Islands entdeckt. Und du zahlst weniger.",
    "effect": {
      "money": 90000,
      "happiness": 20
    }
  },
  {
    "title": "MARGIN CALL!",
    "icon": "📉",
    "headline": "Zu viel gehebelt!",
    "desc": "Der Broker ruft an. Kein schöner Anruf. Verluste realisiert.",
    "effect": {
      "money": -100000,
      "happiness": -50
    }
  },
  {
    "title": "INSIDER TIP 🤫",
    "icon": "💡",
    "headline": "Heißer Tipp aus Goldman!",
    "desc": "Nicht legal. Aber sehr profitabel. Prost.",
    "effect": {
      "money": 70000,
      "happiness": 30
    }
  },
  {
    "title": "NFT FÜR MILLIONEN!",
    "icon": "🖼️",
    "headline": "JPEG verkauft!",
    "desc": "Dein Monkey JPEG wurde für 3 Mio versteigert. Der Käufer versteht es selbst nicht.",
    "effect": {
      "money": 200000,
      "happiness": 60
    }
  },
  {
    "title": "MARKT CRASH 📉",
    "icon": "💥",
    "headline": "Alles fällt!",
    "desc": "Die Fed erhöht Zinsen. Portfolio minus 40%. Du weinst.",
    "effect": {
      "money": -120000,
      "happiness": -40
    }
  },
  {
    "title": "ISLAND EINLADUNG ✈️",
    "icon": "✈️",
    "headline": "Diskrete Einladung!",
    "desc": "Privatinsel. Kein Namen nennen. Gutes Networking.",
    "effect": {
      "money": 50000,
      "happiness": 40
    }
  },
  {
    "title": "IPO JACKPOT!",
    "icon": "📈",
    "headline": "Börsenlisting erfolgreich!",
    "desc": "Dein Startup geht an die Börse. +300% erster Tag. Du bist Millionär. Auf dem Papier.",
    "effect": {
      "money": 300000,
      "happiness": 80
    }
  },
  {
    "title": "DEFI HACK 💀",
    "icon": "🔓",
    "headline": "Protocol gehackt!",
    "desc": "Deine Liquidity ist weg. Smart Contracts sind manchmal nicht so smart.",
    "effect": {
      "money": -90000,
      "happiness": -35
    }
  },
  {
    "title": "ERBSCHAFT! 👴",
    "icon": "💌",
    "headline": "Überraschende Erbschaft!",
    "desc": "Ein reicher Onkel den du kaum kennst hat dich zum Erben gemacht.",
    "effect": {
      "money": 180000,
      "happiness": 25
    }
  },
  {
    "title": "STEUERNACHZAHLUNG",
    "icon": "📑",
    "headline": "Finanzamt meldet sich!",
    "desc": "5 Jahre Steuererklärung nicht gemacht. Mit Zinsen.",
    "effect": {
      "money": -75000,
      "happiness": -20
    }
  },
  {
    "title": "VIRAL POST! 🔥",
    "icon": "📱",
    "headline": "LinkedIn viral!",
    "desc": "Dein Hustle-Post geht viral. Sponsorenanfragen kommen rein.",
    "effect": {
      "money": 40000,
      "happiness": 35
    }
  },
  {
    "title": "ENTLASSEN! 😱",
    "icon": "🗑️",
    "headline": "Restrukturierung!",
    "desc": "HR nennt es Optimierung. Du nennst es Schock. Abfindung immerhin okay.",
    "effect": {
      "money": -50000,
      "happiness": -60
    }
  },
  {
    "title": "BONUS-RUNDE! 🎉",
    "icon": "🎉",
    "headline": "Sonderbonus!",
    "desc": "Das Unternehmen läuft super. Alle kriegen Bonus. Du auch.",
    "effect": {
      "money": 35000,
      "happiness": 45
    }
  },
  {
    "title": "JOBWECHSEL 💼",
    "icon": "💼",
    "headline": "Neues Angebot!",
    "desc": "Headhunter hat angerufen. 30% mehr Gehalt. Du unterschreibst sofort.",
    "effect": {
      "money": 0,
      "salary": 15000,
      "happiness": 30
    }
  },
  {
    "title": "KRANKHEIT 🤒",
    "icon": "🤒",
    "headline": "Arztbesuch nötig!",
    "desc": "Krankenstand 2 Wochen. Krankenversicherung zahlt zum Glück.",
    "effect": {
      "money": -8000,
      "happiness": -25
    }
  }
];

if (typeof module !== 'undefined') {
  module.exports = { BOARD_NODES, ACTION_CARDS };
}

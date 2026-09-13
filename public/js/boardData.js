// =============================================================
// SPIEL DER JAHUDIS – Full Game Board (80 nodes, real GOL rules)
// =============================================================

const BOARD_NODES = [
  // ── BIOME 1: Campus & Uni (North-West: Education Valley) ───────────
  { id:0,  x:10, y:22, biome:'campus', type:'start',     title:'START',          icon:'🏁', color:'#10b981', next:[1],    isStop:false, decisionId:null,           description:'Willkommen im Spiel des Lebens – Satire Edition!' },
  { id:1,  x:15, y:22, biome:'campus', type:'normal',    title:'CAMPUS',         icon:'🏫', color:'#334155', next:[2],    isStop:false, decisionId:null,           description:'Orientierungswoche. Freibier überall.' },
  { id:2,  x:20, y:22, biome:'campus', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[3],    isStop:false, decisionId:null,           description:'Erstes Taschengeld / Stipendium!' },
  { id:3,  x:25, y:23, biome:'campus', type:'normal',    title:'BIBLIOTHEK',     icon:'📖', color:'#334155', next:[4],    isStop:false, decisionId:null,           description:'Klausurenphase. Kaffee-Konsum auf Rekordniveau.' },
  { id:4,  x:29, y:24, biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[5],    isStop:false, decisionId:null,           description:'Zufälliges Ereignis! Was passiert jetzt?' },
  { id:5,  x:33, y:23, biome:'campus', type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[6],    isStop:false, decisionId:null,           description:'Weiterbildung! +Wissen.' },
  { id:6,  x:37, y:22, biome:'campus', type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[7],    isStop:false, decisionId:null,           description:'Überteuerter Hafer-Cappuccino an der Uni.' },
  { id:7,  x:41, y:21, biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[8],    isStop:false, decisionId:null,           description:'Ereignis! Das Leben passiert.' },
  // FIRST MAJOR STOP: Career / Education branch
  { id:8,  x:45, y:20, biome:'campus', type:'branch',    title:'WEGWAHL',        icon:'🎯', color:'#eab308', next:[9,20], isStop:true,  decisionId:'career_choice', description:'STOP! Entscheide: Studium oder Direkteinstieg?' },

  // ── Path A: Studium (Campus Quad North Loop, nodes 9-16) ─────────────
  { id:9,  x:47, y:15, biome:'campus', type:'knowledge', title:'STUDIUM',        icon:'🎓', color:'#3b82f6', next:[10],   isStop:false, decisionId:null,           description:'Erstes Semester. Alles ist möglich.' },
  { id:10, x:50, y:11, biome:'campus', type:'normal',    title:'SEMINAR',        icon:'•',  color:'#334155', next:[11],   isStop:false, decisionId:null,           description:'Seminar über Blockchain & Steuerrecht.' },
  { id:11, x:55, y:8,  biome:'campus', type:'knowledge', title:'MASTER',         icon:'🧠', color:'#06b6d4', next:[12],   isStop:false, decisionId:'education',    description:'Master-Entscheidung!' },
  { id:12, x:60, y:8,  biome:'campus', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[13],   isStop:false, decisionId:null,           description:'Werkstudenten-Gehalt kommt rein.' },
  { id:13, x:65, y:9,  biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[14],   isStop:false, decisionId:null,           description:'Uni-Ereignis!' },
  { id:14, x:69, y:12, biome:'campus', type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[15],   isStop:false, decisionId:null,           description:'Fachliteratur verschlungen. +Wissen.' },
  { id:15, x:72, y:16, biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[16],   isStop:false, decisionId:null,           description:'WG-Party Schaden – Kaution futsch.' },
  { id:16, x:74, y:20, biome:'campus', type:'career',    title:'ABSCHLUSS',      icon:'🏅', color:'#3b82f6', next:[27],   isStop:true,  decisionId:'job_offer',    description:'STOP! Abschluss geschafft! Welchen Job wählst du?' },

  // ── Path B: Direkteinstieg (Corporate Shortcut, nodes 20-26) ─────────
  { id:20, x:49, y:25, biome:'campus', type:'career',    title:'ERSTER JOB',     icon:'💼', color:'#3b82f6', next:[21],   isStop:true,  decisionId:'job_offer',    description:'STOP! Direkter Jobeinstieg – wähle deinen Pfad!' },
  { id:21, x:53, y:27, biome:'campus', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[22],   isStop:false, decisionId:null,           description:'Erster echter Lohn auf dem Konto.' },
  { id:22, x:58, y:28, biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[23],   isStop:false, decisionId:null,           description:'Büro-Drama an der Kaffeemaschine.' },
  { id:23, x:63, y:28, biome:'campus', type:'normal',    title:'OVERTIME',       icon:'•',  color:'#334155', next:[24],   isStop:false, decisionId:null,           description:'Überstunden mit lauwarmer Pizza.' },
  { id:24, x:67, y:27, biome:'campus', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[25],   isStop:false, decisionId:null,           description:'Spontane Firmenfeier!' },
  { id:25, x:70, y:25, biome:'campus', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[26],   isStop:false, decisionId:null,           description:'Gehaltserhöhung nach Probezeit!' },
  { id:26, x:73, y:23, biome:'campus', type:'normal',    title:'AUFSTIEG',       icon:'•',  color:'#334155', next:[27],   isStop:false, decisionId:null,           description:'Auf dem Weg in die Metropole.' },

  // ── BIOME 2: Downtown Metropolis (North-East: Skyscraper Boulevard) ──
  { id:27, x:77, y:22, biome:'city',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[28],   isStop:false, decisionId:null,           description:'Großstadt-Gehalt! Warm duschen ist wieder drin.' },
  { id:28, x:81, y:21, biome:'city',   type:'normal',    title:'PENTHOUSE',      icon:'🏙️', color:'#334155', next:[29],   isStop:false, decisionId:null,           description:'Blick über die Skyline von Downtown.' },
  { id:29, x:85, y:22, biome:'city',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[30],   isStop:false, decisionId:null,           description:'Business-Lunch mit Investoren.' },
  { id:30, x:89, y:25, biome:'city',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[31],   isStop:false, decisionId:null,           description:'Bonus eingetrudelt.' },
  { id:31, x:92, y:29, biome:'city',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[32],   isStop:false, decisionId:null,           description:'Zufälliges Schicksal im City-Trubel.' },
  // STOP: Marriage
  { id:32, x:93, y:34, biome:'city',   type:'family',    title:'HEIRAT',         icon:'💍', color:'#f43f5e', next:[33],   isStop:true,  decisionId:'marriage',     description:'STOP! Liebst du jemanden? Traumhochzeit in der City!' },
  { id:33, x:93, y:40, biome:'city',   type:'normal',    title:'FLITTERWOCHEN',  icon:'🥂', color:'#334155', next:[34],   isStop:false, decisionId:null,           description:'Luxusurlaub und Honeymoon.' },
  { id:34, x:91, y:46, biome:'city',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[35],   isStop:false, decisionId:null,           description:'Ehe-Ereignis!' },
  { id:35, x:88, y:51, biome:'city',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[36],   isStop:false, decisionId:null,           description:'Doppeltes Haushaltseinkommen!' },
  // STOP: House purchase
  { id:36, x:83, y:55, biome:'city',   type:'house',     title:'HAUSKAUF',       icon:'🏠', color:'#a855f7', next:[37],   isStop:true,  decisionId:'house_purchase', description:'STOP! Ab in die Vorstadt – welche Immobilie nimmst du?' },

  // ── BIOME 3: Suburbia & Family (East to Center: Green Hills) ──────────
  { id:37, x:78, y:58, biome:'suburbia', type:'normal',    title:'EINZUG',         icon:'🏡', color:'#334155', next:[38],   isStop:false, decisionId:null,           description:'Gartenparty mit den neuen Nachbarn.' },
  { id:38, x:73, y:61, biome:'suburbia', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[39],   isStop:false, decisionId:null,           description:'Hecke schneiden oder Rasenmäher kaputt.' },
  { id:39, x:68, y:63, biome:'suburbia', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[40],   isStop:false, decisionId:null,           description:'Solides Vorstadt-Einkommen.' },
  // STOP: Children
  { id:40, x:63, y:64, biome:'suburbia', type:'family',    title:'KINDER',         icon:'👶', color:'#f43f5e', next:[41],   isStop:true,  decisionId:'have_children', description:'STOP! Die große Frage: Kinder auf die Rückbank?' },
  { id:41, x:58, y:64, biome:'suburbia', type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[42],   isStop:false, decisionId:null,           description:'Familienalltag & Spielplatz-Chaos.' },
  { id:42, x:53, y:63, biome:'suburbia', type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[43],   isStop:false, decisionId:null,           description:'Weiterbildung am Wochenende.' },
  // STOP: Investment decision
  { id:43, x:48, y:61, biome:'suburbia', type:'action',    title:'INVESTMENT',     icon:'📊', color:'#eab308', next:[44],   isStop:true,  decisionId:'investment',   description:'STOP! Ersparnisse anlegen – wohin investierst du?' },
  { id:44, x:43, y:60, biome:'suburbia', type:'career',    title:'KARRIERE',       icon:'🏅', color:'#3b82f6', next:[45],   isStop:false, decisionId:null,           description:'Beförderung in der Vorstadt-Filiale.' },
  { id:45, x:38, y:60, biome:'suburbia', type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[46],   isStop:false, decisionId:null,           description:'Zahltag mit Vorstands-Bonus!' },

  // ── SECOND BRANCH: Safe Avenue vs. Casino Dunes (Center-South) ─────────
  { id:46, x:33, y:61, biome:'suburbia', type:'branch',    title:'SCHICKSALSWAHL', icon:'⚖️', color:'#eab308', next:[47,60], isStop:true,  decisionId:'risk_choice', description:'STOP! Große Lebenswahl: Sicherer Weg oder Casino-Risiko?' },

  // Path A: Sicherer Boulevard (North / Inner Arc, nodes 47-54)
  { id:47, x:29, y:57, biome:'casino',   type:'normal',    title:'SICHER',         icon:'🛡️', color:'#334155', next:[48],   isStop:false, decisionId:null,           description:'Solider Staatsanleihen-Pfad.' },
  { id:48, x:25, y:55, biome:'casino',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[49],   isStop:false, decisionId:null,           description:'Geregeltes Gehalt ohne Herzinfarkt.' },
  { id:49, x:21, y:55, biome:'casino',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[50],   isStop:false, decisionId:null,           description:'Bausparvertrag wird zuteilungsreif.' },
  { id:50, x:17, y:57, biome:'casino',   type:'career',    title:'DIREKTOR',       icon:'📈', color:'#3b82f6', next:[51],   isStop:false, decisionId:null,           description:'Beförderung zum Abteilungsleiter.' },
  { id:51, x:14, y:61, biome:'casino',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[52],   isStop:false, decisionId:null,           description:'Pünktlicher Gehaltseingang.' },
  { id:52, x:13, y:66, biome:'casino',   type:'normal',    title:'SPARBUCH',       icon:'🏦', color:'#334155', next:[53],   isStop:false, decisionId:null,           description:'0.5% Zinsen – besser als nichts.' },
  { id:53, x:14, y:72, biome:'casino',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[54],   isStop:false, decisionId:null,           description:'Ruhiges Lebensereignis.' },
  { id:54, x:17, y:77, biome:'casino',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[68],   isStop:false, decisionId:null,           description:'Vorletzter sicherer Zahltag.' },

  // Path B: Risiko & Krypto-Strip (South / Outer Neon Arc, nodes 60-67)
  { id:60, x:31, y:67, biome:'casino',   type:'action',    title:'CASINO DOME',    icon:'🎰', color:'#ec4899', next:[61],   isStop:false, decisionId:null,           description:'Der Neon-Strip lockt mit Reichtum oder Ruin!' },
  { id:61, x:29, y:73, biome:'casino',   type:'action',    title:'ALL IN',         icon:'🎲', color:'#ec4899', next:[62],   isStop:false, decisionId:null,           description:'Alles auf Rot gesetzt.' },
  { id:62, x:26, y:78, biome:'casino',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[63],   isStop:false, decisionId:null,           description:'Fetter Casinogewinn abgeholt!' },
  { id:63, x:22, y:82, biome:'casino',   type:'action',    title:'KRYPTO TO MOON', icon:'🚀', color:'#f59e0b', next:[64],   isStop:false, decisionId:null,           description:'Dein Hebel-Trade geht durch die Decke!' },
  { id:64, x:17, y:84, biome:'casino',   type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[65],   isStop:false, decisionId:null,           description:'Achterbahnfahrt an den Märkten.' },
  { id:65, x:12, y:83, biome:'casino',   type:'career',    title:'WHALE',          icon:'🐋', color:'#3b82f6', next:[66],   isStop:false, decisionId:null,           description:'Vom Tellerwäscher zum Krypto-Wal.' },
  { id:66, x:10, y:78, biome:'casino',   type:'action',    title:'LETZTER PUMP',   icon:'⚡', color:'#ec4899', next:[67],   isStop:false, decisionId:null,           description:'Letzter Adrenalin-Kick vor dem Exit.' },
  { id:67, x:13, y:81, biome:'casino',   type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[68],   isStop:false, decisionId:null,           description:'Krypto-Auszahlung in bar.' },

  // ── BIOME 5: Retirement Paradise Beach (South Coast to Marina) ────────
  { id:68, x:22, y:82, biome:'beach',    type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[69],   isStop:false, decisionId:null,           description:'Wege vereint! Wer hat mehr Vermögen angehäuft?' },
  { id:69, x:29, y:84, biome:'beach',    type:'action',    title:'LETZTER DEAL',   icon:'⚡', color:'#ec4899', next:[70],   isStop:false, decisionId:null,           description:'Dein letzter großer Coup.' },
  { id:70, x:36, y:86, biome:'beach',    type:'career',    title:'KARRIERE-ENDE',  icon:'🏅', color:'#3b82f6', next:[71],   isStop:true,  decisionId:'car_upgrade',  description:'STOP! Goldener Handschlag & Luxus-Schlitten!' },
  { id:71, x:44, y:87, biome:'beach',    type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[72],   isStop:false, decisionId:null,           description:'Pensionskasse schüttet aus.' },
  { id:72, x:52, y:87, biome:'beach',    type:'action',    title:'MEMOIREN',       icon:'⚡', color:'#ec4899', next:[73],   isStop:false, decisionId:null,           description:'Du schreibst deine Autobiographie.' },
  { id:73, x:60, y:86, biome:'beach',    type:'action',    title:'VERMÄCHTNIS',    icon:'🏆', color:'#f59e0b', next:[74],   isStop:false, decisionId:null,           description:'Deine Stiftung wird gegründet.' },
  { id:74, x:68, y:84, biome:'beach',    type:'payday',    title:'LETZTER ZAHLTAG',icon:'💎', color:'#22c55e', next:[75],   isStop:false, decisionId:null,           description:'Letzter Zahltag! Alle Schätze einsammeln.' },
  { id:75, x:75, y:81, biome:'beach',    type:'action',    title:'LETZTE SONNE',   icon:'🍹', color:'#ec4899', next:[76],   isStop:false, decisionId:null,           description:'Cocktail an der Strandbar mit Blick auf die Yacht.' },
  { id:76, x:82, y:78, biome:'beach',    type:'finish',    title:'RUHESTAND',      icon:'🏝️', color:'#f59e0b', next:[],     isStop:true,  decisionId:null,           description:'ZIEL! Willkommen im ewigen Urlaub! Endabrechnung startet.' }
];

// ─── Action Cards (shown on ACTION tiles) ───────────────────
const ACTION_CARDS = [
  { title:'RUG PULL!', icon:'💀', headline:'Dein Lieblingscoin ist weg!', desc:'Developer-Wallet leer. Discord gelöscht. Das Geld ist weg.', effect:{ money:-80000, happiness:-30 } },
  { title:'BITCOIN MOON 🚀', icon:'🚀', headline:'Dein Portfolio x10!', desc:'Diamond Hands haben sich ausgezahlt. HODL forever.', effect:{ money:150000, happiness:50 } },
  { title:'SEC ERMITTLUNG', icon:'⚖️', headline:'Die SEC klopft an!', desc:'Wegen deiner suspekten Trades ermittelt die US-Börsenaufsicht.', effect:{ money:-60000, happiness:-40 } },
  { title:'STEUEROASE GEFUNDEN', icon:'🏝️', headline:'Offshore-Konto aktiviert!', desc:'Dein Steuerberater hat Cayman Islands entdeckt. Und du zahlst weniger.', effect:{ money:90000, happiness:20 } },
  { title:'MARGIN CALL!', icon:'📉', headline:'Zu viel gehebelt!', desc:'Der Broker ruft an. Kein schöner Anruf. Verluste realisiert.', effect:{ money:-100000, happiness:-50 } },
  { title:'INSIDER TIP 🤫', icon:'💡', headline:'Heißer Tipp aus Goldman!', desc:'Nicht legal. Aber sehr profitabel. Prost.', effect:{ money:70000, happiness:30 } },
  { title:'NFT FÜR MILLIONEN!', icon:'🖼️', headline:'JPEG verkauft!', desc:'Dein Monkey JPEG wurde für 3 Mio versteigert. Der Käufer versteht es selbst nicht.', effect:{ money:200000, happiness:60 } },
  { title:'MARKT CRASH 📉', icon:'💥', headline:'Alles fällt!', desc:'Die Fed erhöht Zinsen. Portfolio minus 40%. Du weinst.', effect:{ money:-120000, happiness:-40 } },
  { title:'ISLAND EINLADUNG ✈️', icon:'✈️', headline:'Diskrete Einladung!', desc:'Privatinsel. Kein Namen nennen. Gutes Networking.', effect:{ money:50000, happiness:40 } },
  { title:'IPO JACKPOT!', icon:'📈', headline:'Börsenlisting erfolgreich!', desc:'Dein Startup geht an die Börse. +300% erster Tag. Du bist Millionär. Auf dem Papier.', effect:{ money:300000, happiness:80 } },
  { title:'DEFI HACK 💀', icon:'🔓', headline:'Protocol gehackt!', desc:'Deine Liquidity ist weg. Smart Contracts sind manchmal nicht so smart.', effect:{ money:-90000, happiness:-35 } },
  { title:'ERBSCHAFT! 👴', icon:'💌', headline:'Überraschende Erbschaft!', desc:'Ein reicher Onkel den du kaum kennst hat dich zum Erben gemacht. Sehr nett.', effect:{ money:180000, happiness:25 } },
  { title:'STEUERNACHZAHLUNG', icon:'📑', headline:'Finanzamt meldet sich!', desc:'5 Jahre Steuererklärung nicht gemacht. Mit Zinsen und Säumnisgebühren.', effect:{ money:-75000, happiness:-20 } },
  { title:'VIRAL POST! 🔥', icon:'📱', headline:'LinkedIn viral!', desc:'Dein Hustle-Post geht viral. Sponsorenanfragen kommen rein.', effect:{ money:40000, happiness:35 } },
  { title:'ENTLASSEN! 😱', icon:'🗑️', headline:'Restrukturierung!', desc:'HR nennt es Optimierung. Du nennst es Schock. Abfindung immerhin okay.', effect:{ money:-50000, happiness:-60 } }
];

if (typeof module !== 'undefined') {
  module.exports = { BOARD_NODES, ACTION_CARDS };
}

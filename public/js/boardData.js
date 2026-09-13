// =============================================================
// SPIEL DER JAHUDIS – Full Game Board (80 nodes, real GOL rules)
// =============================================================

const BOARD_NODES = [
  // ── ROW 1: Left → Right (Y=10) ── Start & early career path
  { id:0,  x:5,  y:10, type:'start',     title:'START',          icon:'🏁', color:'#10b981', next:[1],    isStop:false, decisionId:null,           description:'Willkommen im Spiel des Lebens – Satire Edition!' },
  { id:1,  x:15, y:10, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[2],    isStop:false, decisionId:null,           description:'Nichts passiert. Schade.' },
  { id:2,  x:25, y:10, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[3],    isStop:false, decisionId:null,           description:'Gehaltseingang! Dein Konto freut sich.' },
  { id:3,  x:35, y:10, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[4],    isStop:false, decisionId:null,           description:'Du scrollst LinkedIn sinnlos durch.' },
  { id:4,  x:45, y:10, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[5],    isStop:false, decisionId:null,           description:'Zufälliges Ereignis! Was passiert jetzt?' },
  { id:5,  x:55, y:10, type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[6],    isStop:false, decisionId:null,           description:'Weiterbildung! +Wissen.' },
  { id:6,  x:65, y:10, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[7],    isStop:false, decisionId:null,           description:'Du kaufst dir einen überteuertem Kaffee.' },
  { id:7,  x:75, y:10, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[8],    isStop:false, decisionId:null,           description:'Ereignis! Das Leben passiert.' },
  // FIRST MAJOR STOP: Career/Education branch
  { id:8,  x:87, y:10, type:'branch',    title:'WEGWAHL',        icon:'🎯', color:'#eab308', next:[9,20], isStop:true,  decisionId:'career_choice', description:'STOP! Entscheide: Studium oder Direkteinstieg?' },

  // ── ROW 2: Right → Left (Y=26) ── Path A: Studium (upper, nodes 9-19)
  { id:9,  x:87, y:26, type:'knowledge', title:'STUDIUM',        icon:'🎓', color:'#3b82f6', next:[10],   isStop:false, decisionId:null,           description:'Erstes Semester. Alles ist möglich.' },
  { id:10, x:77, y:26, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[11],   isStop:false, decisionId:null,           description:'Prüfungsphase. Du überlebst.' },
  { id:11, x:67, y:26, type:'knowledge', title:'MASTER',         icon:'🧠', color:'#06b6d4', next:[12],   isStop:false, decisionId:'education',    description:'Master-Entscheidung!' },
  { id:12, x:57, y:26, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[13],   isStop:false, decisionId:null,           description:'Bafög oder Nebenjob – Geld kommt rein.' },
  { id:13, x:47, y:26, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[14],   isStop:false, decisionId:null,           description:'Uni-Ereignis!' },
  { id:14, x:37, y:26, type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[15],   isStop:false, decisionId:null,           description:'Seminar über Blockchain-Recht. Sehr relevant.' },
  { id:15, x:27, y:26, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[16],   isStop:false, decisionId:null,           description:'Uni-Party Schaden – 200€ weg.' },
  { id:16, x:17, y:26, type:'career',    title:'ABSCHLUSS',      icon:'🏅', color:'#3b82f6', next:[27],   isStop:true,  decisionId:'job_offer',    description:'STOP! Abschluss! Welchen Job nimmst du an?' },

  // ── Path B: Direkteinstieg (lower, nodes 20-26, then reconnect at 27)
  { id:20, x:87, y:18, type:'career',    title:'ERSTER JOB',     icon:'💼', color:'#3b82f6', next:[21],   isStop:true,  decisionId:'job_offer',    description:'STOP! Direkter Jobeinstieg – was nimmst du?' },
  { id:21, x:77, y:18, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[22],   isStop:false, decisionId:null,           description:'Erster Lohn! Klein aber dein.' },
  { id:22, x:67, y:18, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[23],   isStop:false, decisionId:null,           description:'Büro-Drama.' },
  { id:23, x:57, y:18, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[24],   isStop:false, decisionId:null,           description:'Meeting über das Meeting.' },
  { id:24, x:47, y:18, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[25],   isStop:false, decisionId:null,           description:'Zufälles Ereignis.' },
  { id:25, x:37, y:18, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[26],   isStop:false, decisionId:null,           description:'Gehaltserhöhung!' },
  { id:26, x:27, y:18, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[27],   isStop:false, decisionId:null,           description:'Weiter auf dem Karriere-Weg.' },

  // ── REUNIFICATION NODE (both paths merge) ──
  { id:27, x:8,  y:26, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[28],   isStop:false, decisionId:null,           description:'Erstes richtiges Gehalt. Warm duschen ist wieder möglich.' },

  // ── ROW 3: Left → Right (Y=42) ── Mid-life, Family, House
  { id:28, x:8,  y:42, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[29],   isStop:false, decisionId:null,           description:'Montag, 8:00 Uhr. Kaffee trinken.' },
  { id:29, x:18, y:42, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[30],   isStop:false, decisionId:null,           description:'Ereignis!' },
  { id:30, x:28, y:42, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[31],   isStop:false, decisionId:null,           description:'Gehaltseingang.' },
  { id:31, x:38, y:42, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[32],   isStop:false, decisionId:null,           description:'Zufälliges Schicksal!' },
  // STOP: Marriage
  { id:32, x:48, y:42, type:'family',    title:'HEIRAT',         icon:'💍', color:'#f43f5e', next:[33],   isStop:true,  decisionId:'marriage',     description:'STOP! Liebst du jemanden? Jetzt oder nie!' },
  { id:33, x:58, y:42, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[34],   isStop:false, decisionId:null,           description:'Frisch verheiratet. Wohnung zu klein.' },
  { id:34, x:68, y:42, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[35],   isStop:false, decisionId:null,           description:'Ehe-Ereignis.' },
  { id:35, x:78, y:42, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[36],   isStop:false, decisionId:null,           description:'Doppeltes Einkommen? Das klappt nie.' },
  // STOP: House purchase
  { id:36, x:88, y:42, type:'house',     title:'HAUSKAUF',       icon:'🏠', color:'#a855f7', next:[37],   isStop:true,  decisionId:'house_purchase', description:'STOP! Zeit für eine Immobilie. Was kannst du dir leisten?' },

  // ── ROW 4: Right → Left (Y=58) ── Investment, Family, Mid-crisis
  { id:37, x:88, y:58, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[38],   isStop:false, decisionId:null,           description:'Einzug in die neue Bude.' },
  { id:38, x:78, y:58, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[39],   isStop:false, decisionId:null,           description:'Zufälliges Schicksal!' },
  { id:39, x:68, y:58, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[40],   isStop:false, decisionId:null,           description:'Gehaltseingang.' },
  // STOP: Children
  { id:40, x:58, y:58, type:'family',    title:'KINDER',         icon:'👶', color:'#f43f5e', next:[41],   isStop:true,  decisionId:'have_children', description:'STOP! Die große Frage: Kinder?' },
  { id:41, x:48, y:58, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[42],   isStop:false, decisionId:null,           description:'Familienalltag-Chaos.' },
  { id:42, x:38, y:58, type:'knowledge', title:'BILDUNG',        icon:'📚', color:'#06b6d4', next:[43],   isStop:false, decisionId:null,           description:'Weiterbildung. Weil du es kannst.' },
  // STOP: Investment decision
  { id:43, x:28, y:58, type:'action',    title:'INVESTMENT',     icon:'📊', color:'#eab308', next:[44],   isStop:true,  decisionId:'investment',   description:'STOP! Du hast Ersparnisse. Wohin investierst du?' },
  { id:44, x:18, y:58, type:'career',    title:'KARRIERE',       icon:'🏅', color:'#3b82f6', next:[45],   isStop:false, decisionId:null,           description:'Beförderung möglich!' },
  { id:45, x:8,  y:58, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[46],   isStop:false, decisionId:null,           description:'Gehaltseingang – mit Bonus!' },

  // ── SECOND BRANCH: Safe vs. Risk (Y=64)
  { id:46, x:8,  y:66, type:'branch',    title:'SCHICKSALSWAHL', icon:'⚖️', color:'#eab308', next:[47,60], isStop:true,  decisionId:'career_choice', description:'STOP! Zweite große Wahl: Sicherer Weg oder Risiko?' },

  // Path A: Sicher (nodes 47-59)
  { id:47, x:18, y:66, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[48],   isStop:false, decisionId:null,           description:'Sicherer Pfad. Predictable.' },
  { id:48, x:28, y:66, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[49],   isStop:false, decisionId:null,           description:'Regelmäßiges Gehalt. Schön.' },
  { id:49, x:38, y:66, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[50],   isStop:false, decisionId:null,           description:'Ereignis.' },
  { id:50, x:48, y:66, type:'career',    title:'BEFÖRDERUNG',    icon:'📈', color:'#3b82f6', next:[51],   isStop:false, decisionId:null,           description:'Karriere-Sprung!' },
  { id:51, x:58, y:66, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[52],   isStop:false, decisionId:null,           description:'Gehaltseingang.' },
  { id:52, x:68, y:66, type:'normal',    title:'NORMAL',         icon:'•',  color:'#334155', next:[53],   isStop:false, decisionId:null,           description:'Normal.' },
  { id:53, x:78, y:66, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[54],   isStop:false, decisionId:null,           description:'Ereignis!' },
  { id:54, x:88, y:66, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[68],   isStop:false, decisionId:null,           description:'Gehaltseingang.' },

  // Path B: Risiko (nodes 60-67)
  { id:60, x:18, y:74, type:'action',    title:'RISIKO',         icon:'🎲', color:'#ec4899', next:[61],   isStop:false, decisionId:null,           description:'Riskanter Pfad! Crypto und Startups.' },
  { id:61, x:28, y:74, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[62],   isStop:false, decisionId:null,           description:'Zufälles Schicksal! Kann gut oder schlecht sein.' },
  { id:62, x:38, y:74, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[63],   isStop:false, decisionId:null,           description:'Wenn es klappt: Viel Geld.' },
  { id:63, x:48, y:74, type:'action',    title:'KRYPTO',         icon:'🚀', color:'#f59e0b', next:[64],   isStop:false, decisionId:null,           description:'Crypto-Event!' },
  { id:64, x:58, y:74, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[65],   isStop:false, decisionId:null,           description:'Alles oder nichts.' },
  { id:65, x:68, y:74, type:'career',    title:'KARRIERE',       icon:'🏅', color:'#3b82f6', next:[66],   isStop:false, decisionId:null,           description:'Karriere-Schub!' },
  { id:66, x:78, y:74, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[67],   isStop:false, decisionId:null,           description:'Letztes Risiko.' },
  { id:67, x:88, y:74, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[68],   isStop:false, decisionId:null,           description:'Gehaltseingang – hoffentlich.' },

  // ── REUNIFICATION ──
  { id:68, x:88, y:82, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[69],   isStop:false, decisionId:null,           description:'Beide Wege führen hier her. Wer hat mehr?' },

  // ── ROW 5: Right → Left (Y=90) ── Endgame, Retirement
  { id:69, x:78, y:90, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[70],   isStop:false, decisionId:null,           description:'Letztes großes Ereignis!' },
  { id:70, x:68, y:90, type:'career',    title:'KARRIERE-ENDE',  icon:'🏅', color:'#3b82f6', next:[71],   isStop:true,  decisionId:'car_upgrade',  description:'STOP! Letzter Karriere-Schritt. Gönn dir was!' },
  { id:71, x:58, y:90, type:'payday',    title:'ZAHLTAG',        icon:'💰', color:'#22c55e', next:[72],   isStop:false, decisionId:null,           description:'Vorletzter Zahltag. Genieß ihn.' },
  { id:72, x:48, y:90, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[73],   isStop:false, decisionId:null,           description:'Vorletztes Ereignis.' },
  { id:73, x:38, y:90, type:'action',    title:'VERMÄCHTNIS',    icon:'🏆', color:'#f59e0b', next:[74],   isStop:false, decisionId:null,           description:'Dein Lebenswerk nimmt Form an.' },
  { id:74, x:28, y:90, type:'payday',    title:'LETZTER ZAHLTAG',icon:'💎', color:'#22c55e', next:[75],   isStop:false, decisionId:null,           description:'Letzter Zahltag! Alles einsammeln.' },
  { id:75, x:18, y:90, type:'action',    title:'EREIGNIS',       icon:'⚡', color:'#ec4899', next:[76],   isStop:false, decisionId:null,           description:'Letztes Ereignis vor dem Ruhestand.' },
  { id:76, x:8,  y:90, type:'finish',    title:'RUHESTAND',      icon:'🏝️', color:'#f59e0b', next:[],     isStop:true,  decisionId:null,           description:'ZIEL! Du bist im Ruhestand! Endabrechnung startet.' }
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

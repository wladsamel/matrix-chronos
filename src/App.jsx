import { useState, useEffect, useRef } from 'react'
import { chatWithOracle } from './gemini'
import './App.css'
import copaLogo from './assets/copa2026.png'
import championsLogo from './assets/champions.png'

// ══════════════════════════════════════════
// FLAG & TEAM LOGO HELPERS
// ══════════════════════════════════════════
const FLAG_CODES = {
  'Brasil': 'br', 'México': 'mx', 'EUA': 'us', 'Argentina': 'ar', 'Japão': 'jp',
  'França': 'fr', 'Coreia do Sul': 'kr', 'Alemanha': 'de', 'Marrocos': 'ma',
  'Nigéria': 'ng', 'Canadá': 'ca', 'Equador': 'ec', 'Portugal': 'pt',
  'Espanha': 'es', 'Inglaterra': 'gb-eng', 'Itália': 'it', 'Holanda': 'nl',
  'Bélgica': 'be', 'Colômbia': 'co', 'Uruguai': 'uy', 'Croácia': 'hr',
}

const CLUB_LOGOS = {
  'Real Madrid': 86, 'Man City': 65, 'Bayern': 5, 'PSG': 524,
  'Inter': 108, 'Barcelona': 81, 'Arsenal': 57, 'Liverpool': 64,
  'Dortmund': 4, 'Borussia Dortmund': 4, 'Atlético': 78, 'Juventus': 109,
  'Benfica': 1903, 'Man United': 102,
  'Napoli': 113, 'Milan': 98, 'Porto': 503, 'Leipzig': 721,
  'Atalanta': 102, 'Bayer Leverkusen': 3, 'Newcastle': 62, 'Galatasaray': 610,
  'Club Brugge': 688, 'Olympiacos': 654, 'Monaco': 548, 'Bodo/Glimt': 944, 'Qarabag': 5316,
  'Al-Nassr': 113, 'Inter Miami': 109,
}

const CLUB_COLORS = {
  'Real Madrid': '#FEBE10', 'Man City': '#6CABDD', 'Bayern': '#DC052D', 'PSG': '#004170',
  'Inter': '#010E80', 'Barcelona': '#A50044', 'Arsenal': '#EF0107', 'Liverpool': '#C8102E',
  'Dortmund': '#FDE100', 'Atlético': '#CB3524', 'Juventus': '#000', 'Benfica': '#FF0000',
  'Napoli': '#12A0D7', 'Milan': '#FB090B', 'Porto': '#003893', 'Leipzig': '#DD0741',
  'Atalanta': '#003090', 'Bayer Leverkusen': '#E32221', 'Newcastle': '#241F20', 'Galatasaray': '#A90432',
}

function TeamFlag({ team, size = 20 }) {
  const code = FLAG_CODES[team]
  if (code) {
    return <img src={`https://flagcdn.com/w80/${code}.png`} alt={team} className="team-flag-img" style={{ width: size, height: Math.round(size * 0.7), objectFit: 'cover', borderRadius: 3 }} />
  }
  const logoId = CLUB_LOGOS[team]
  if (logoId) {
    return (
      <img
        src={`https://crests.football-data.org/${logoId}.png`} alt={team}
        className={`club-logo-img ${team === 'Juventus' ? 'logo-light' : ''}`}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'inline-flex') }}
      />
    )
  }
  return <span style={{ fontSize: size * 0.7 }}>⚽</span>
}

// ══════════════════════════════════════════
// DATA: Feriados Brasileiros 2026
// ══════════════════════════════════════════
const HOLIDAYS_2026 = [
  { month: 1, day: 1, name: 'Ano Novo' },
  { month: 2, day: 16, name: 'Carnaval' },
  { month: 2, day: 17, name: 'Carnaval' },
  { month: 4, day: 3, name: 'Sexta-feira Santa' },
  { month: 4, day: 5, name: 'Páscoa' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalhador' },
  { month: 5, day: 10, name: 'Dia das Mães' },
  { month: 6, day: 4, name: 'Corpus Christi' },
  { month: 6, day: 24, name: 'São João' },
  { month: 8, day: 9, name: 'Dia dos Pais' },
  { month: 9, day: 7, name: 'Independência' },
  { month: 10, day: 12, name: 'N. Sra. Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 12, day: 25, name: 'Natal' },
  { month: 12, day: 31, name: 'Réveillon' },
]

// ══════════════════════════════════════════
// DATA: Jogos Copa 2026 + Champions
// ══════════════════════════════════════════
const MATCHES = [
  // ── Copa do Mundo 2026 ──
  { date: '2026-06-11', tournament: 'copa', phase: 'Abertura', home: 'México', away: 'EUA', time: '18:00', highlight: true },
  { date: '2026-06-12', tournament: 'copa', phase: 'Grupo A', home: 'Brasil', away: 'Nigéria', time: '16:00', highlight: true },
  { date: '2026-06-13', tournament: 'copa', phase: 'Grupo B', home: 'Argentina', away: 'Japão', time: '13:00', highlight: true },
  { date: '2026-06-13', tournament: 'copa', phase: 'Grupo C', home: 'França', away: 'Coreia do Sul', time: '19:00', highlight: false },
  { date: '2026-06-14', tournament: 'copa', phase: 'Grupo D', home: 'Alemanha', away: 'Marrocos', time: '16:00', highlight: false },
  { date: '2026-06-15', tournament: 'copa', phase: 'Grupo E', home: 'Inglaterra', away: 'Espanha', time: '19:00', highlight: true },
  { date: '2026-06-17', tournament: 'copa', phase: 'Grupo A', home: 'Brasil', away: 'Canadá', time: '16:00', highlight: true },
  { date: '2026-06-20', tournament: 'copa', phase: 'Grupo A', home: 'Brasil', away: 'Equador', time: '19:00', highlight: true },
  { date: '2026-06-22', tournament: 'copa', phase: 'Grupo B', home: 'Argentina', away: 'Portugal', time: '16:00', highlight: true },
  { date: '2026-06-28', tournament: 'copa', phase: 'Oitavas', home: '1ºA', away: '2ºC', time: '16:00', highlight: false },
  { date: '2026-06-29', tournament: 'copa', phase: 'Oitavas', home: '1ºB', away: '2ºD', time: '16:00', highlight: false },
  { date: '2026-07-04', tournament: 'copa', phase: 'Quartas', home: 'QF1', away: 'QF2', time: '16:00', highlight: false },
  { date: '2026-07-05', tournament: 'copa', phase: 'Quartas', home: 'QF3', away: 'QF4', time: '16:00', highlight: false },
  { date: '2026-07-08', tournament: 'copa', phase: 'Semifinal', home: 'SF1', away: 'SF2', time: '16:00', highlight: true },
  { date: '2026-07-09', tournament: 'copa', phase: 'Semifinal', home: 'SF3', away: 'SF4', time: '16:00', highlight: true },
  { date: '2026-07-19', tournament: 'copa', phase: '🏆 FINAL', home: 'Finalista 1', away: 'Finalista 2', time: '16:00', highlight: true },
  // ── Champions League 2025/26 ──
  // Play-offs (ida)
  { date: '2026-02-17', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Benfica', away: 'Real Madrid', time: '16:00', highlight: true, stadium: 'Estádio da Luz', score: '0-1' },
  { date: '2026-02-17', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Monaco', away: 'PSG', time: '16:00', highlight: true, stadium: 'Stade Louis II', score: '2-3' },
  { date: '2026-02-17', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Olympiacos', away: 'Bayer Leverkusen', time: '16:00', highlight: false, stadium: 'Karaiskakis Stadium', score: '0-2' },
  { date: '2026-02-17', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Newcastle', away: 'Qarabag', time: '16:00', highlight: false, stadium: 'St. James\' Park', score: '6-1' },
  { date: '2026-02-18', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Borussia Dortmund', away: 'Atalanta', time: '16:00', highlight: true, stadium: 'Signal Iduna Park', score: '2-0' },
  { date: '2026-02-18', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Juventus', away: 'Galatasaray', time: '16:00', highlight: true, stadium: 'Allianz Stadium', score: '2-5' },
  { date: '2026-02-18', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Club Brugge', away: 'Atlético', time: '16:00', highlight: false, stadium: 'Jan Breydel Stadium', score: '3-3' },
  { date: '2026-02-18', tournament: 'champions', phase: 'Play-offs (ida)', home: 'Bodo/Glimt', away: 'Inter', time: '16:00', highlight: false, stadium: 'Aspmyra Stadion', score: '3-1' },
  // Play-offs (volta)
  { date: '2026-02-24', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Real Madrid', away: 'Benfica', time: '16:00', highlight: true, stadium: 'Santiago Bernabéu', score: '2-1', aggregate: '3-1' },
  { date: '2026-02-24', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Bayer Leverkusen', away: 'Olympiacos', time: '16:00', highlight: false, stadium: 'BayArena', score: '0-0', aggregate: '2-0' },
  { date: '2026-02-24', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Inter', away: 'Bodo/Glimt', time: '16:00', highlight: false, stadium: 'San Siro', score: '1-2', aggregate: '2-5' },
  { date: '2026-02-24', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Atlético', away: 'Club Brugge', time: '16:00', highlight: false, stadium: 'Cívitas Metropolitano', score: '4-1', aggregate: '7-4' },
  { date: '2026-02-25', tournament: 'champions', phase: 'Play-offs (volta)', home: 'PSG', away: 'Monaco', time: '16:00', highlight: true, stadium: 'Parc des Princes', score: '2-2', aggregate: '5-4' },
  { date: '2026-02-25', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Atalanta', away: 'Borussia Dortmund', time: '16:00', highlight: true, stadium: 'Gewiss Stadium', score: '4-1', aggregate: '4-3' },
  { date: '2026-02-25', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Galatasaray', away: 'Juventus', time: '16:00', highlight: true, stadium: 'Rams Park', score: '2-3 (aet)', aggregate: '7-5' },
  { date: '2026-02-25', tournament: 'champions', phase: 'Play-offs (volta)', home: 'Newcastle', away: 'Qarabag', time: '16:00', highlight: false, stadium: 'St. James\' Park', score: '3-2', aggregate: '9-3' },
  // Oitavas de Final (Agenda prevista)
  { date: '2026-03-10', tournament: 'champions', phase: 'Oitavas (ida)', home: 'Real Madrid', away: 'Man City', time: '16:00', highlight: true, stadium: 'Santiago Bernabéu' },
  { date: '2026-03-10', tournament: 'champions', phase: 'Oitavas (ida)', home: 'Bayer Leverkusen', away: 'Arsenal', time: '16:00', highlight: true, stadium: 'BayArena' },
  { date: '2026-03-11', tournament: 'champions', phase: 'Oitavas (ida)', home: 'Atalanta', away: 'Barcelona', time: '16:00', highlight: true, stadium: 'Gewiss Stadium' },
  { date: '2026-03-11', tournament: 'champions', phase: 'Oitavas (ida)', home: 'Galatasaray', away: 'Liverpool', time: '16:00', highlight: true, stadium: 'Rams Park' },
  { date: '2026-03-17', tournament: 'champions', phase: 'Oitavas (volta)', home: 'Man City', away: 'Real Madrid', time: '16:00', highlight: true, stadium: 'Etihad Stadium' },
  { date: '2026-03-17', tournament: 'champions', phase: 'Oitavas (volta)', home: 'Arsenal', away: 'Bayer Leverkusen', time: '16:00', highlight: true, stadium: 'Emirates Stadium' },
  { date: '2026-03-18', tournament: 'champions', phase: 'Oitavas (volta)', home: 'Barcelona', away: 'Atalanta', time: '16:00', highlight: true, stadium: 'Camp Nou' },
  { date: '2026-03-18', tournament: 'champions', phase: 'Oitavas (volta)', home: 'Liverpool', away: 'Galatasaray', time: '16:00', highlight: true, stadium: 'Anfield' },
  // Quartas de Final
  { date: '2026-04-07', tournament: 'champions', phase: 'Quartas (ida)', home: 'QF1', away: 'QF2', time: '16:00', highlight: true },
  { date: '2026-04-08', tournament: 'champions', phase: 'Quartas (ida)', home: 'QF3', away: 'QF4', time: '16:00', highlight: true },
  { date: '2026-04-14', tournament: 'champions', phase: 'Quartas (volta)', home: 'QF2', away: 'QF1', time: '16:00', highlight: true },
  { date: '2026-04-15', tournament: 'champions', phase: 'Quartas (volta)', home: 'QF4', away: 'QF3', time: '16:00', highlight: true },
  // Semifinais
  { date: '2026-04-28', tournament: 'champions', phase: 'Semi (ida)', home: 'SF1', away: 'SF2', time: '16:00', highlight: true },
  { date: '2026-04-29', tournament: 'champions', phase: 'Semi (ida)', home: 'SF3', away: 'SF4', time: '16:00', highlight: true },
  { date: '2026-05-05', tournament: 'champions', phase: 'Semi (volta)', home: 'SF2', away: 'SF1', time: '16:00', highlight: true },
  { date: '2026-05-06', tournament: 'champions', phase: 'Semi (volta)', home: 'SF4', away: 'SF3', time: '16:00', highlight: true },
  // Final
  { date: '2026-05-30', tournament: 'champions', phase: '🏆 FINAL', home: 'Finalista 1', away: 'Finalista 2', time: '16:00', highlight: true, stadium: 'Puskás Aréna, Budapeste' },
]

// ══════════════════════════════════════════
// DATA: Grandes Eventos
// ══════════════════════════════════════════
const ALL_EVENTS = [
  {
    id: 'copa2026', name: 'Copa do Mundo FIFA 2026', date: '2026-06-11', endDate: '2026-07-19', logo: 'copa', category: 'Esporte', borderColor: '#FDD835',
    description: 'A Copa do Mundo FIFA 2026 será realizada nos EUA, México e Canadá com 48 seleções.',
    details: ['Sedes: 16 cidades em 3 países', 'Formato: 48 seleções em 12 grupos', 'Final: MetLife Stadium, Nova Jersey', 'Brasil classificado como participante']
  },
  {
    id: 'champions2026', name: 'Champions League 2025/26', date: '2026-02-17', endDate: '2026-05-30', logo: 'champions', category: 'Esporte', borderColor: '#3B6FAE',
    description: 'A UEFA Champions League 2025/26 — fase eliminatória completa até a final em Budapeste.',
    details: ['Final: Puskás Aréna, Budapeste', 'Oitavas: Fev–Mar 2026', 'Quartas: Abr 2026', 'Semis: Abr–Mai 2026', 'Final: 30/Mai/2026']
  },
  {
    id: 'festajunina', name: 'Festa Junina', date: '2026-06-13', endDate: '2026-06-29', logo: null, emoji: '🎆', category: 'Cultura', borderColor: null,
    description: 'As festas juninas celebram Santo Antônio, São João e São Pedro.',
    details: ['Santo Antônio: 13/jun', 'São João: 24/jun', 'São Pedro: 29/jun', 'Tradição forte no Nordeste']
  },
  {
    id: 'natal2026', name: 'Natal 2026', date: '2026-12-25', logo: null, emoji: '🎄', category: 'Feriado', borderColor: null,
    description: 'Celebração do Natal com família e confraternização.',
    details: ['Feriado nacional', 'Véspera: 24/dez', 'Troca de presentes']
  },
  {
    id: 'carnaval2026', name: 'Carnaval 2026', date: '2026-02-14', endDate: '2026-02-17', logo: null, emoji: '🎭', category: 'Cultura', borderColor: null,
    description: 'O maior festival popular do Brasil.',
    details: ['Sábado: 14/02', 'Terça-feira: 17/02', 'Sapucaí (RJ) e Anhembi (SP)']
  },
  {
    id: 'blackfriday2026', name: 'Black Friday 2026', date: '2026-11-27', logo: null, emoji: '🛒', category: 'Comercial', borderColor: null,
    description: 'Maior evento de compras do ano com grandes descontos.',
    details: ['Última sexta de novembro', 'Descontos em eletrônicos e moda', 'Compare preços antes!']
  },
  {
    id: 'reveillon2027', name: 'Réveillon 2027', date: '2026-12-31', logo: null, emoji: '🎇', category: 'Feriado', borderColor: null,
    description: 'Virada do ano com fogos e festas em todo Brasil.',
    details: ['Copacabana, RJ', 'Tradição de vestir branco', 'Fogos à meia-noite']
  },
  {
    id: 'olimpiadas2028', name: 'Olimpíadas 2028', date: '2028-07-14', endDate: '2028-07-30', logo: null, emoji: '🏅', category: 'Esporte', borderColor: null,
    description: 'Jogos Olímpicos de 2028 em Los Angeles, EUA.',
    details: ['Los Angeles, Califórnia', '28 esportes', '2 semanas de evento']
  },
]

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y, m) {
  let day = new Date(y, m, 1).getDay();
  return day === 0 ? 6 : day - 1; // Ajusta para Segunda=0, Domingo=6
}
function daysUntil(ds) { const n = new Date(); n.setHours(0, 0, 0, 0); return Math.ceil((new Date(ds + 'T00:00:00') - n) / 864e5) }
function getHolidayForDay(m, d) { return HOLIDAYS_2026.find(h => h.month === m + 1 && h.day === d) }
function pad(n) { return String(n).padStart(2, '0') }
function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function getMatchesForDate(dk) { return MATCHES.filter(m => m.date === dk) }
function getMatchesForTournament(tournament) { return MATCHES.filter(m => m.tournament === tournament) }
function getEventsForDay(y, m, d, events) {
  const c = new Date(y, m, d); c.setHours(0, 0, 0, 0)
  return events.filter(e => {
    const s = new Date(e.date + 'T00:00:00'), end = e.endDate ? new Date(e.endDate + 'T00:00:00') : s

    // Recurrence logic
    if (e.recurrence === 'weekly') {
      return c.getDay() === s.getDay() && c >= s
    }
    if (e.recurrence === 'monthly') {
      return c.getDate() === s.getDate() && c >= s
    }

    return c >= s && c <= end
  })
}

function EventLogo({ event, size = 28 }) {
  if (event.customLogo) return <img src={event.customLogo} alt={event.name} style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }} />
  if (event.logo === 'copa') return <img src={copaLogo} alt="Copa 2026" style={{ width: size, height: size, objectFit: 'contain' }} />
  if (event.logo === 'champions') return <img src={championsLogo} alt="Champions" style={{ width: size, height: size, objectFit: 'contain' }} />
  return <span style={{ fontSize: size * 0.8 }}>{event.emoji || '📅'}</span>
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
function App() {
  const today = new Date()
  const [page, setPage] = useState('overview')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(['copa2026', 'natal2026', 'champions2026'])
  const [isThinking, setIsThinking] = useState(false)

  // ── DATA PERSISTENCE & DERIVATION ──
  const [eventOverrides, setEventOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_eventOverrides') || '{}') } catch { return {} }
  })
  const [customEvents, setCustomEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_customEvents') || '[]') } catch { return [] }
  })

  // Derivação de Eventos (Deve vir antes do uso em outros componentes/states se possível)
  const mergedEvents = [...ALL_EVENTS, ...customEvents].map(ev => {
    const ov = eventOverrides[ev.id] || {}
    return { ...ev, ...ov }
  })

  const [tasks, setTasks] = useState(() => {
    try {
      const s = localStorage.getItem('mc_tasks')
      if (s) return JSON.parse(s)
      return [
        { id: 1, title: 'Reunião Comunidade Matrix', time: '14:00', type: 'work', done: false, note: '', date: null },
        { id: 2, title: 'Análise de Métodos CPA', time: '16:30', type: 'matrix', done: false, note: 'Verificar relatório mensal', date: dateKey(today.getFullYear(), today.getMonth(), today.getDate()) },
      ]
    } catch { return [] }
  })
  const [showAddTask, setShowAddTask] = useState(false)
  const [showPastTasks, setShowPastTasks] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', time: '', type: 'work', note: '', date: '', endDate: '' })
  const [editingNote, setEditingNote] = useState(null)
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(() => {
    try {
      const s = localStorage.getItem('mc_oracle_chat')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const chatEndRef = useRef(null)

  // ── VOICE STATE ──
  const [isListening, setIsListening] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('mc_voice_enabled') === 'true' } catch { return false }
  })
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
    try { return localStorage.getItem('mc_selected_voice') || 'female-pt' } catch { return 'female-pt' }
  })
  // Which TTS engine is currently active: 'native' | 'hf' | 'gemini' | 'none'
  const [voiceTier, setVoiceTier] = useState('none')

  useEffect(() => { localStorage.setItem('mc_oracle_chat', JSON.stringify(messages)) }, [messages])
  useEffect(() => { localStorage.setItem('mc_voice_enabled', isVoiceEnabled) }, [isVoiceEnabled])
  useEffect(() => { if (selectedVoiceURI) localStorage.setItem('mc_selected_voice', selectedVoiceURI) }, [selectedVoiceURI])


  // ── COLOR CATEGORIES ──
  const defaultCats = [
    { id: 1, name: 'Trabalho', color: '#E53935' },
    { id: 2, name: 'Descanso', color: '#1E88E5' },
    { id: 3, name: 'Contas', color: '#FDD835' },
    { id: 4, name: 'Estudo', color: '#43A047' },
    { id: 5, name: 'Pessoal', color: '#AB47BC' },
  ]
  const [colorCategories, setColorCategories] = useState(() => {
    try { const s = localStorage.getItem('mc_colorCats'); return s ? JSON.parse(s) : defaultCats } catch { return defaultCats }
  })
  const [dayColors, setDayColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_dayColors') || '{}') } catch { return {} }
  })
  const [showColorManager, setShowColorManager] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#E53935')

  // ── SETTINGS FORM STATE ──
  const [newEv, setNewEv] = useState({ name: '', date: '', endDate: '', logo: '', emoji: '📅', category: 'Pessoal', borderColor: null, recurrence: 'none' })
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [editingCustomId, setEditingCustomId] = useState(null)
  const [showAddEventInModal, setShowAddEventInModal] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null) // { id, title, type: 'task' | 'match', ... }
  const [dismissedAlarms, setDismissedAlarms] = useState([])
  const [snoozedAlarms, setSnoozedAlarms] = useState({}) // { id: snoozeUntilTimestamp }
  const [eventBorderColor, setEventBorderColor] = useState(() => {
    return localStorage.getItem('mc_eventBorderColor') || '#C41E3A'
  })
  const [customAlarmAudio, setCustomAlarmAudio] = useState(() => {
    return localStorage.getItem('mc_customAlarmAudio') || null
  })
  const alarmAudioRef = useRef(null)

  function TournamentBadge({ tournament, size = 20 }) {
    const ev = mergedEvents.find(e => e.logo === tournament || e.id.startsWith(tournament))
    if (ev && ev.customLogo) return <img src={ev.customLogo} alt={ev.name} style={{ width: size, height: size, objectFit: 'contain', borderRadius: 2 }} />
    if (tournament === 'copa') return <img src={copaLogo} alt="Copa" style={{ width: size, height: size, objectFit: 'contain' }} />
    if (tournament === 'champions') return <img src={championsLogo} alt="UCL" style={{ width: size, height: size, objectFit: 'contain' }} />
    return null
  }

  useEffect(() => { localStorage.setItem('mc_colorCats', JSON.stringify(colorCategories)) }, [colorCategories])

  // ── ALARM SYSTEM CHECK ──
  useEffect(() => {
    let bipInterval;

    if (activeAlarm) {
      if (customAlarmAudio) {
        if (!alarmAudioRef.current) {
          alarmAudioRef.current = new Audio(customAlarmAudio);
          alarmAudioRef.current.loop = true;
        }
        alarmAudioRef.current.play().catch(e => console.error("Audio play error", e));
      } else {
        // Fallback to Web Audio API continuous beeps if no custom audio
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        bipInterval = setInterval(() => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc.type = 'square';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.5);
          setTimeout(() => audioCtx.close(), 600); // Clean up context after beep
        }, 1000);
      }
    } else {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
      if (bipInterval) clearInterval(bipInterval);
    }

    return () => {
      if (bipInterval) clearInterval(bipInterval);
    }
  }, [activeAlarm, customAlarmAudio]);

  useEffect(() => {
    const checkAlarms = () => {
      if (activeAlarm) return; // Wait until current alarm is dismissed

      const now = new Date();
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const currentTimeStr = `${h}:${m}`;
      const dk = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Check Tasks (Exact Timestamp)
      const pendingTasks = tasks.filter(t => !t.done && t.date === dk && t.time === currentTimeStr);
      for (const t of pendingTasks) {
        if (dismissedAlarms.includes(`task-${t.id}`)) continue;
        if (snoozedAlarms[`task-${t.id}`] && now.getTime() < snoozedAlarms[`task-${t.id}`]) continue;

        setActiveAlarm({ id: `task-${t.id}`, type: 'task', title: t.title, time: t.time, originalId: t.id });
        return; // Trigger one at a time
      }

      // 2. Check Matches today (Exact Match Time)
      const todaysMatches = getMatchesForDate(dk);
      for (const match of todaysMatches) {
        if (match.time === currentTimeStr) {
          const mId = `match-${match.home}-${match.away}-${match.date}`;
          if (!dismissedAlarms.includes(mId)) {
            setActiveAlarm({ id: mId, type: 'match', title: `${match.home} vs ${match.away}`, time: match.time, tournament: match.tournament });
            return;
          }
        }
      }

      // 3. Check Matches Tomorrow (Day-Before Warning, once per day at 09:00 or when first opened)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDk = dateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const tomorrowMatches = getMatchesForDate(tomorrowDk);

      if (tomorrowMatches.length > 0) {
        const warningId = `warning-${tomorrowDk}`;
        if (!dismissedAlarms.includes(warningId)) {
          // We might want to just show a notification, but for the requirement we ring an alarm
          // Let's ring it at 09:00 AM or if we open the app and it's past 09:00 AM
          if (h >= '09') {
            setActiveAlarm({
              id: warningId,
              type: 'warning',
              title: `Atenção: ${tomorrowMatches.length} jogos imperdíveis amanhã!`,
              time: 'Dia Todo',
              matches: tomorrowMatches
            });
            return;
          }
        }
      }
    }

    checkAlarms();
    const timer = setInterval(checkAlarms, 10000); // Check every 10 seconds for precision
    return () => clearInterval(timer)
  }, [tasks, dismissedAlarms, snoozedAlarms, activeAlarm])

  useEffect(() => { localStorage.setItem('mc_dayColors', JSON.stringify(dayColors)) }, [dayColors])
  useEffect(() => { localStorage.setItem('mc_customAlarmAudio', customAlarmAudio || '') }, [customAlarmAudio])
  useEffect(() => { localStorage.setItem('mc_eventOverrides', JSON.stringify(eventOverrides)) }, [eventOverrides])
  useEffect(() => { localStorage.setItem('mc_customEvents', JSON.stringify(customEvents)) }, [customEvents])
  useEffect(() => { localStorage.setItem('mc_eventBorderColor', eventBorderColor) }, [eventBorderColor])
  useEffect(() => { localStorage.setItem('mc_tasks', JSON.stringify(tasks)) }, [tasks])



  const assignDayColor = (dk, catId) => setDayColors(prev => catId ? { ...prev, [dk]: catId } : (() => { const n = { ...prev }; delete n[dk]; return n })())
  const addCategory = () => { if (!newCatName.trim()) return; setColorCategories(prev => [...prev, { id: Date.now(), name: newCatName, color: newCatColor }]); setNewCatName(''); setNewCatColor('#E53935') }
  const deleteCategory = (id) => { setColorCategories(prev => prev.filter(c => c.id !== id)); setDayColors(prev => { const n = { ...prev }; Object.keys(n).forEach(k => { if (n[k] === id) delete n[k] }); return n }) }
  const getCategoryForDay = (dk) => colorCategories.find(c => c.id === dayColors[dk])

  // Helpers para Eventos
  const updateEventOverride = (id, data) => setEventOverrides(p => ({ ...p, [id]: { ...(p[id] || {}), ...data } }))
  const addCustomEvent = (ev) => setCustomEvents(p => [...p, { ...ev, id: `custom-${Date.now()}` }])
  const deleteCustomEvent = (id) => setCustomEvents(p => p.filter(ev => ev.id !== id))
  const resetEventOverride = (id) => setEventOverrides(p => { const n = { ...p }; delete n[id]; return n })

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const dk = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
    const todaysTasks = getTasksForDate(dk)
    const todaysEvents = getEventsForDay(today.getFullYear(), today.getMonth(), today.getDate(), mergedEvents)
    const favEvts = mergedEvents.filter(e => favoriteIds.includes(e.id))

    let summaryLines = []
    if (todaysTasks.length > 0) {
      summaryLines.push(`📋 Tarefas de hoje (${todaysTasks.length}):\n${todaysTasks.map(t => `  - ${t.title} (${t.time})`).join('\n')}`)
    } else {
      summaryLines.push('📋 Nenhuma tarefa pendente para hoje.')
    }

    if (todaysEvents.length > 0) {
      summaryLines.push(`📢 Eventos de hoje:\n${todaysEvents.map(e => `  - ${e.name}`).join('\n')}`)
    }

    const upcomingFavs = favEvts.map(e => {
      const d = daysUntil(e.date);
      return d > 0 ? `• ${e.name}: faltam ${d} dias` : d === 0 ? `• ${e.name}: É HOJE! 🎉` : null
    }).filter(Boolean)
    if (upcomingFavs.length > 0) {
      summaryLines.push(`⭐ Favoritos Próximos:\n${upcomingFavs.join('\n')}`)
    }

    let contextualSuggestion = "";
    if (todaysTasks.length === 0) {
      contextualSuggestion = "💡 Sugestão da Oráculo: Sua agenda de hoje está como uma página em branco. Gostaria de começar definindo suas prioridades e adicionando as primeiras tarefas?";
    } else {
      contextualSuggestion = "💡 Sugestão da Oráculo: Analisei suas tarefas e recomendo focar na prioridade máxima logo pela manhã para otimizar seus ciclos de consciência.";
    }

    const initialText = `Sistemas Online, Neo.\n\nSou A Oráculo, sua secretária pessoal. Status da Matrix: Operacional.\n\n--- 📅 AGENDA DE HOJE ---\n\n${summaryLines.join('\n\n')}\n\n------------------------\n\n${contextualSuggestion}\n\nComo sua guia de rotina, estou pronta para auxiliar na organização dos seus próximos passos.`

    setMessages([{ role: 'ai', text: initialText }])
  }, [])

  const toggleFavorite = (id) => setFavoriteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id))
  const updateNote = (id, note) => setTasks(tasks.map(t => t.id === id ? { ...t, note } : t))

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTask.title || !newTask.time) return
    setTasks([...tasks, { ...newTask, id: Date.now(), done: false }])
    setNewTask({ title: '', time: '', type: 'work', note: '', date: '', endDate: '' })
    setShowAddTask(false)
  }

  const getTasksForDate = (dk) => {
    const checkDate = new Date(dk + 'T00:00:00')
    return tasks.filter(t => {
      if (!t.date) return false
      const start = new Date(t.date + 'T00:00:00')
      const end = t.endDate ? new Date(t.endDate + 'T00:00:00') : start
      return checkDate >= start && checkDate <= end
    })
  }

  // ── VOICE MODULE — 2-Tier API Waterfall + basic fallback ──
  // Tier 1: HuggingFace via /api/tts Vercel proxy (best free quality, all devices)
  // Tier 2: Gemini 2.5 TTS via /api/gemini-tts (reliable fallback)
  // Tier 3: Native browser voice (emergency only, low quality)
  const speak = async (text, force = false) => {
    if (!isVoiceEnabled && !force) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Clean text for TTS: remove emojis and markdown
    const cleanText = text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[*#`_~>]/g, '')
      .slice(0, 600)
      .trim();
    if (!cleanText) return;

    // Helper: play a blob URL
    const playUrl = (url) => new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject;
      audio.play().catch(reject);
    });

    // ── TIER 2: HuggingFace via Vercel serverless proxy ──
    // Only available when deployed (not localhost), because the /api route needs Vercel
    const isDeployed = !window.location.hostname.includes('localhost');
    if (isDeployed) {
      try {
        console.log('[TTS] Tier 2 — HuggingFace via proxy /api/tts...');
        setVoiceTier('hf');
        const lang = selectedVoiceURI === 'en-aria' ? 'eng' : 'por';
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, lang }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          await playUrl(url);
          console.log('[TTS] Tier 2 — HuggingFace neural OK!');
          return;
        }
        console.warn('[TTS] Tier 2 failed, status:', res.status, '— escalando para Tier 3');
      } catch (e2) {
        console.warn('[TTS] Tier 2 error:', e2.message, '— escalando para Tier 3');
      }
    }

    // ── TIER 3: Gemini TTS via Vercel proxy (or direct if local) ──
    try {
      console.log('[TTS] Tier 3 — Gemini TTS...');
      setVoiceTier('gemini');
      const GEMINI_VOICES = { 'female-pt': 'Aoede', 'male-pt': 'Charon', 'en-aria': 'Puck' };
      const voiceName = GEMINI_VOICES[selectedVoiceURI] || 'Aoede';

      let audioUrl;
      if (isDeployed) {
        // Call server-side proxy (no CORS, no key exposure)
        const res = await fetch('/api/gemini-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voiceName }),
        });
        if (!res.ok) throw new Error(`Gemini proxy error: ${res.status}`);
        const blob = await res.blob();
        audioUrl = URL.createObjectURL(blob);
      } else {
        // Local dev: call Gemini API directly (no proxy needed locally)
        const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: cleanText }] }],
              generationConfig: {
                response_modalities: ['AUDIO'],
                speech_config: { voice_config: { prebuilt_voice_config: { voice_name: voiceName } } }
              }
            })
          }
        );
        if (!res.ok) throw new Error(`Gemini direct error: ${res.status}`);
        const data = await res.json();
        const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mime = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/pcm';
        if (!b64) throw new Error('No audio data');
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        let blob;
        if (mime.includes('pcm') || mime.includes('L16')) {
          const sr = 24000, ch = 1, bps = 16, pcml = bytes.length;
          const wav = new ArrayBuffer(44 + pcml);
          const v = new DataView(wav);
          const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
          ws(0, 'RIFF'); v.setUint32(4, 36 + pcml, true); ws(8, 'WAVE'); ws(12, 'fmt ');
          v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
          v.setUint32(24, sr, true); v.setUint32(28, sr * ch * bps / 8, true);
          v.setUint16(32, ch * bps / 8, true); v.setUint16(34, bps, true);
          ws(36, 'data'); v.setUint32(40, pcml, true);
          new Uint8Array(wav, 44).set(bytes);
          blob = new Blob([wav], { type: 'audio/wav' });
        } else { blob = new Blob([bytes], { type: mime }); }
        audioUrl = URL.createObjectURL(blob);
      }

      await playUrl(audioUrl);
      console.log('[TTS] Tier 3 — Gemini OK!');
    } catch (e3) {
      console.error('[TTS] Tier 3 failed:', e3.message, '— fallback para voz básica do sistema');
      setVoiceTier('none');
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(cleanText);
        u.lang = 'pt-BR';
        window.speechSynthesis.speak(u);
      }
    }
  }




  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Seu navegador não suporta a interface vocal (Web Speech API). Tente usar o Chrome ou Edge.");
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRec();

    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Mic error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev ? prev + " " + transcript : transcript);
    };

    recognition.start();
  }

  // ── SMART AI (THE ORACLE) ──
  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isThinking) return

    const userText = chatInput
    const newMsgs = [...messages, { role: 'user', text: userText }]
    setMessages(newMsgs)
    setChatInput('')
    setIsThinking(true)

    try {
      const context = { tasks, customEvents, colorCategories, dayColors }
      const { text, functionCalls } = await chatWithOracle(userText, context, messages)

      if (functionCalls) {
        functionCalls.forEach(call => {
          const { name, args } = call
          if (name === 'add_task') {
            setTasks(prev => [...prev, {
              id: Date.now() + Math.random(),
              title: args.title,
              time: args.time,
              type: args.type || 'work',
              done: false,
              note: args.note || '',
              date: args.date,
              endDate: args.endDate
            }])
          } else if (name === 'delete_task') {
            setTasks(prev => prev.filter(t => t.id !== args.id))
          } else if (name === 'add_custom_event') {
            setCustomEvents(prev => [...prev, { id: `custom-${Date.now()}`, name: args.name, date: args.date, endDate: args.endDate, category: args.category || 'Pessoal', borderColor: args.borderColor, details: [] }])
          } else if (name === 'set_day_color') {
            setDayColors(prev => ({ ...prev, [args.date]: args.categoryId }))
          }
        })
      }

      const replyText = text || "A Matrix foi alterada como você desejava.";
      setMessages(prev => [...prev, { role: 'ai', text: replyText }])
      speak(replyText);

    } catch (err) {
      console.error("Erro na comunicação com a Oráculo:", err)
      let errorMsg = `Houve uma interferência na Matrix: ${err.message || "Erro desconhecido"}`

      if (err.message?.includes("API_KEY_INVALID")) errorMsg = "Erro: Chave API inválida. Verifique o .env."
      if (err.message?.includes("QUOTA_EXCEEDED")) errorMsg = "Erro: Limite de uso excedido."

      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }])
    } finally {
      setIsThinking(false)
    }
  }

  // ══ DAY MODAL ══
  const renderDayModal = () => {
    if (!selectedDay) return null
    const { year, month, day } = selectedDay
    const dk = dateKey(year, month, day)
    const holiday = getHolidayForDay(month, day)
    const dayMatches = getMatchesForDate(dk)
    const favEvts = mergedEvents.filter(e => favoriteIds.includes(e.id))
    const dayEvents = getEventsForDay(year, month, day, mergedEvents) // Usar mergedEvents aqui para pegar tudo do dia
    const dayTasks = getTasksForDate(dk)

    return (
      <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
        <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{day} de {MONTH_NAMES[month]} de {year}</h2>
            <button className="close-btn" onClick={() => setSelectedDay(null)}>✕</button>
          </div>
          {holiday && (
            <div className="modal-section holiday-section">
              <span className="section-icon">🎉</span>
              <div><strong>Feriado</strong><p>{holiday.name}</p></div>
            </div>
          )}
          {dayMatches.length > 0 && (
            <div className="modal-section">
              <h3>⚽ Jogos do Dia</h3>
              {dayMatches.map((m, i) => (
                <div key={i} className={`match-card-symmetric ${m.highlight ? 'match-highlight' : ''}`}>
                  <div className="match-header-info">
                    <TournamentBadge tournament={m.tournament} size={18} />
                    <span className="match-phase">{m.phase}</span>
                  </div>

                  <div className="match-main-row">
                    <div className="match-team home">
                      <span className="team-name">{m.home}</span>
                      <TeamFlag team={m.home} size={32} />
                    </div>

                    <div className="match-separator">
                      {m.score ? (
                        <div className="match-score matrix-glow">{m.score}</div>
                      ) : (
                        <div className="vs-badge">VS</div>
                      )}
                      {m.time && !m.score && <span className="match-time-small">{m.time}</span>}
                    </div>

                    <div className="match-team away">
                      <TeamFlag team={m.away} size={32} />
                      <span className="team-name">{m.away}</span>
                    </div>
                  </div>

                  {(m.stadium || m.aggregate) && (
                    <div className="match-footer-info">
                      {m.stadium && <span className="match-stadium">🏟️ {m.stadium}</span>}
                      {m.aggregate && <span className="match-aggregate">📊 Agregado: <strong>{m.aggregate}</strong></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {dayEvents.length > 0 && dayMatches.length === 0 && (
            <div className="modal-section event-section-only">
              <h3>📌 Eventos</h3>
              {dayEvents.map(ev => (
                <div key={ev.id} className="modal-event-card" onClick={() => { setSelectedDay(null); setSelectedEvent(ev) }}>
                  <EventLogo event={ev} size={32} />
                  <div>
                    <strong>{ev.name} {ev.recurrence && ev.recurrence !== 'none' && <span className="recurrence-icon">🔄</span>}</strong>
                    <p>{ev.description?.slice(0, 80) || 'Clique para ver detalhes'}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {dayTasks.length > 0 && (
            <div className="modal-section task-section-only">
              <div className="section-divider"></div>
              <h3>📝 Tarefas do Dia</h3>
              {dayTasks.map(t => (
                <div key={t.id} className="modal-task">
                  <span className={`mini-dot ${t.type}`}></span>
                  <div className="modal-task-detail">
                    <span>{t.title}</span>
                    {t.note && <span className="task-note-preview">💬 {t.note}</span>}
                  </div>
                  <span className="modal-task-time">{t.time}</span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-section add-event-inline">
            <button className="add-inline-btn" onClick={() => setShowAddEventInModal(!showAddEventInModal)}>
              {showAddEventInModal ? '✕ Cancelar' : '+ Adicionar Evento'}
            </button>
            {showAddEventInModal && (
              <div className="inline-event-form glass-card">
                <input type="text" placeholder="Nome do evento" value={newEv.name} onChange={e => setNewEv({ ...newEv, name: e.target.value })} />
                <div className="inline-form-row">
                  <select value={newEv.category} onChange={e => setNewEv({ ...newEv, category: e.target.value })}>
                    <option>Pessoal</option><option>Trabalho</option><option>Esporte</option><option>Cultura</option>
                  </select>
                  <select value={newEv.recurrence} onChange={e => setNewEv({ ...newEv, recurrence: e.target.value })}>
                    <option value="none">Não repete</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <button className="inline-save-btn" onClick={() => {
                  if (!newEv.name) return;
                  addCustomEvent({ ...newEv, date: dk, customLogo: newEv.logo, details: [], description: 'Evento personalizado' });
                  setNewEv({ name: '', date: '', endDate: '', logo: '', emoji: '📅', category: 'Pessoal', borderColor: null, recurrence: 'none' });
                  setShowAddEventInModal(false);
                }}>Salvar</button>
              </div>
            )}
          </div>

          {!holiday && dayMatches.length === 0 && dayEvents.length === 0 && dayTasks.length === 0 && !showAddEventInModal && (
            <div className="modal-section empty-day"><p>Nenhum evento neste dia.</p></div>
          )}
          <div className="modal-section">
            <h3>🎨 Cor do Dia</h3>
            <div className="color-assign-row">
              {colorCategories.map(cat => (
                <button key={cat.id}
                  className={`color-assign-btn ${dayColors[dk] === cat.id ? 'active' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => assignDayColor(dk, dayColors[dk] === cat.id ? null : cat.id)}
                >
                  <span className="color-assign-dot" style={{ background: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══ EVENT DETAIL ══
  if (selectedEvent) {
    const ev = selectedEvent; const d = daysUntil(ev.date); const isFav = favoriteIds.includes(ev.id)
    const evMatches = MATCHES.filter(m => {
      const s = new Date(ev.date + 'T00:00:00'), end = ev.endDate ? new Date(ev.endDate + 'T00:00:00') : s, md = new Date(m.date + 'T00:00:00')
      return md >= s && md <= end
    })
    return (
      <div className="app-shell">
        <nav className="top-nav">
          <button className="back-btn" onClick={() => setSelectedEvent(null)}>← Voltar</button>
          <span className="nav-title matrix-glow">Matrix Chronos</span>
        </nav>
        <main className="event-detail">
          <div className="event-detail-hero glass-card">
            <div className="event-logo-large"><EventLogo event={ev} size={72} /></div>
            <h1>{ev.name}</h1>
            <span className="event-detail-cat">{ev.category}</span>
          </div>
          <div className="event-detail-countdown glass-card">
            <div className="countdown-number matrix-glow">{d > 0 ? d : d === 0 ? '🎉' : 'Enc.'}</div>
            <span className="countdown-label">{d > 0 ? 'dias restantes' : d === 0 ? 'É HOJE!' : 'Encerrado'}</span>
          </div>
          <div className="event-detail-info glass-card">
            <p>{ev.description}</p>
            <ul>{ev.details.map((det, i) => <li key={i}>{det}</li>)}</ul>
            {ev.endDate && <p className="event-dates">📅 {new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(ev.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
          </div>
          {evMatches.length > 0 && (
            <div className="event-matches glass-card">
              <h3>⚽ Jogos em Destaque</h3>
              {evMatches.map((m, i) => (
                <div key={i} className={`match-card ${m.highlight ? 'match-highlight' : ''}`}>
                  <div className="match-badge-row"><TournamentBadge tournament={m.tournament} size={18} /><span className="match-phase">
                    {m.phase} — {m.date.split('-').reverse().join('/')}</span></div>
                  <div className="match-teams">
                    <span className="team"><TeamFlag team={m.home} size={32} /> {m.home}</span>
                    <span className="match-vs">VS</span>
                    <span className="team"><TeamFlag team={m.away} size={32} /> {m.away}</span>
                  </div>
                  <span className="match-time">⏰ {m.time}</span>
                </div>
              ))}
            </div>
          )}
          <button className={`fav-btn-large ${isFav ? 'is-fav' : ''}`} onClick={() => toggleFavorite(ev.id)}>
            {isFav ? '★ Remover dos Favoritos' : '☆ Adicionar aos Favoritos'}
          </button>
        </main>
      </div>
    )
  }

  // ══ MAIN SHELL ══
  return (
    <div className="app-shell">
      {activeAlarm && (
        <div className="matrix-alarm-overlay">
          <div className="alarm-content">
            <div className="glitch-text" data-text="WAKE UP, NEO...">WAKE UP, NEO...</div>
            <div className="alarm-event-info glass-card">
              <span className="alarm-icon">⚠️</span>
              <h2>{activeAlarm.name}</h2>
              <p>O evento está programado para hoje.</p>
            </div>
            <div className="matrix-rain-bg"></div>
            <button className="dismiss-alarm-btn" onClick={() => {
              setDismissedAlarms([...dismissedAlarms, activeAlarm.id]);
              setActiveAlarm(null);
            }}>Voltar para a Realidade</button>
          </div>
        </div>
      )}
      {renderDayModal()}
      <nav className="top-nav">
        <span className="nav-title matrix-glow">Matrix Chronos</span>
        <div className="nav-tabs">
          <button className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}>👁️ Visão Geral</button>
          <button className={page === 'calendar' ? 'active' : ''} onClick={() => setPage('calendar')}>📅 Calendário</button>
          <button className={page === 'events' ? 'active' : ''} onClick={() => setPage('events')}>🏆 Eventos</button>
          <button className={page === 'tasks' ? 'active' : ''} onClick={() => setPage('tasks')}>✅ Tarefas</button>
          <button className={page === 'advisor' ? 'active' : ''} onClick={() => setPage('advisor')}>🔮 Oráculo</button>
          <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>⚙️ Config</button>
        </div>
      </nav>

      <main className="main-area">
        {/* ══ VISÃO GERAL ══ */}
        {page === 'overview' && (
          <div className="page-overview">
            {/* JARVIS-style HUD Header */}
            <section className="jarvis-hud glass-card">
              <div className="hud-greeting-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="hud-greeting">
                  <div className="hud-line-top"></div>
                  <h1>Sistemas Online, Neo...</h1>
                  <p className="hud-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button
                  className={`voice-toggle-btn ${isVoiceEnabled ? 'enabled' : ''}`}
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  title={isVoiceEnabled ? 'Desativar Voz da Oráculo' : 'Ativar Voz da Oráculo'}
                >
                  {isVoiceEnabled ? '🔊 Voz On' : '🔇 Voz Off'}
                </button>
              </div>

              <div className="hud-interface">
                <div className="hud-oracle-messages">
                  {messages.map((msg, i) => (
                    <div key={i} className={`hud-bubble ${msg.role}`}>
                      <span className="hud-tag">{msg.role === 'ai' ? 'ORACLE' : 'NEO'}</span>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                  {isThinking && <div className="hud-bubble ai thinking"><p>Escaneando Matrix...</p></div>}
                  {messages.length === 0 && <p className="empty-msg">Aguardando comando...</p>}
                  <div ref={chatEndRef} />
                </div>

                <form className="hud-chat-form" onSubmit={handleChat}>
                  <div className="hud-input-wrapper">
                    <span className="hud-prompt">CMD:</span>
                    <input
                      type="text"
                      placeholder="Analisar tendências, sugerir tarefas..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={isThinking}
                    />
                    <button
                      type="button"
                      className={`mic-btn ${isListening ? 'listening matrix-glow' : ''}`}
                      onClick={startListening}
                      disabled={isThinking || isListening}
                      title="Falar com a Oráculo (🎙️)"
                    >
                      {isListening ? '...' : '🎙️'}
                    </button>
                  </div>
                  <button type="submit" disabled={isThinking} className="hud-submit-btn">EXECUTAR</button>
                </form>
              </div>
            </section>

            <div className="overview-grid">
              {/* Eventos de Hoje (Só aparece se houver ou se for dia de jogo para eventos esportivos) */}
              {(() => {
                const dk = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
                const todaysMatches = getMatchesForDate(dk);
                const todaysEvents = getEventsForDay(today.getFullYear(), today.getMonth(), today.getDate(), mergedEvents).filter(ev => {
                  // Se for um torneio de futebol (baseado na logo), só mostre se houver jogo hoje
                  if (['copa', 'champions'].includes(ev.logo)) {
                    return todaysMatches.length > 0;
                  }
                  return true;
                });

                if (todaysEvents.length === 0) return null;

                return (
                  <section className="overview-section today-events-highlight glass-card">
                    <div className="section-header">
                      <h3>📢 Eventos de Hoje</h3>
                    </div>
                    <div className="mini-event-list">
                      {todaysEvents.map(ev => (
                        <div key={ev.id} className="mini-event-item" onClick={() => setSelectedEvent(ev)}>
                          <EventLogo event={ev} size={24} />
                          <span>{ev.name}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Hoje */}
              <section className="overview-section today-tasks glass-card">
                <div className="section-header">
                  <h3>🎯 Tarefas do Dia</h3>
                  <button className="section-link" onClick={() => setPage('tasks')}>Ver todas</button>
                </div>
                <div className="mini-task-list">
                  {getTasksForDate(dateKey(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 5).map(t => (
                    <div key={t.id} className={`mini-task ${t.done ? 'done' : ''}`}>
                      <span className={`task-dot ${t.type}`}></span>
                      <span className="task-title">{t.title}</span>
                      <span className="task-time">{t.time}</span>
                    </div>
                  ))}
                  {getTasksForDate(dateKey(today.getFullYear(), today.getMonth(), today.getDate())).length === 0 && (
                    <p className="empty-mini">Nenhuma tarefa para hoje. Siga o coelho branco. 🐇</p>
                  )}
                </div>
              </section>

              {/* Semana */}
              <section className="overview-section weekly-roadmap glass-card">
                <h3>📅 Roteiro da Semana</h3>
                <div className="weekly-grid">
                  {[...Array(7)].map((_, i) => {
                    const d = new Date()
                    d.setDate(today.getDate() + i)
                    const dk = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
                    const dayTasks = getTasksForDate(dk)
                    const dayEvents = getEventsForDay(d.getFullYear(), d.getMonth(), d.getDate(), mergedEvents)
                    return (
                      <div key={i} className={`weekly-day ${i === 0 ? 'today' : ''}`} onClick={() => setSelectedDay({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() })}>
                        <span className="day-label">{DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}</span>
                        <span className="day-num">{d.getDate()}</span>
                        <div className="day-indicators">
                          {dayTasks.length > 0 && <span className="dot-task" title={`${dayTasks.length} tarefas`}></span>}
                          {dayEvents.length > 0 && <span className="dot-event" title={`${dayEvents.length} eventos`}></span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Mês & Destaques */}
              <section className="overview-section monthly-outlook glass-card">
                <h3>🚀 Destaques do Mês</h3>
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-value">{tasks.filter(t => {
                      const d = new Date(t.date + 'T00:00:00')
                      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
                    }).length}</span>
                    <span className="stat-label">Tarefas</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{mergedEvents.filter(e => {
                      const d = new Date(e.date + 'T00:00:00')
                      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
                    }).length}</span>
                    <span className="stat-label">Eventos</span>
                  </div>
                </div>
                <div className="next-event">
                  {mergedEvents
                    .filter(e => daysUntil(e.date) >= 0)
                    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
                    .slice(0, 1)
                    .map(ev => (
                      <div key={ev.id} className="featured-event-mini" onClick={() => setSelectedEvent(ev)}>
                        <EventLogo event={ev} size={24} />
                        <div className="fe-info">
                          <strong>Próximo Grande Evento:</strong>
                          <span>{ev.name} (em {daysUntil(ev.date)} dias)</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ══ CALENDÁRIO ══ */}
        {page === 'calendar' && (
          <div className="page-calendar">
            <div className="calendar-header">
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) } else setViewMonth(viewMonth - 1) }}>◀</button>
              <h2>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) } else setViewMonth(viewMonth + 1) }}>▶</button>
            </div>
            <div className="calendar-day-names">{DAY_NAMES.map(d => <span key={d}>{d}</span>)}</div>
            {/* Color Legend */}
            <div className="color-legend">
              <div className="color-legend-items">
                {colorCategories.map(cat => (
                  <span key={cat.id} className="color-legend-item">
                    <span className="color-legend-dot" style={{ background: cat.color }} />
                    {cat.name}
                  </span>
                ))}
              </div>
              <button className="color-mgr-btn" onClick={() => setShowColorManager(true)}>⚙️ Cores</button>
            </div>
            {/* Color Manager Modal */}
            {showColorManager && (
              <div className="modal-overlay" onClick={() => setShowColorManager(false)}>
                <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                  <div className="modal-header">
                    <h2>🎨 Gerenciar Cores</h2>
                    <button className="close-btn" onClick={() => setShowColorManager(false)}>✕</button>
                  </div>
                  <div className="color-mgr-list">
                    {colorCategories.map(cat => (
                      <div key={cat.id} className="color-mgr-row">
                        <span className="color-mgr-dot" style={{ background: cat.color }} />
                        <span className="color-mgr-name">{cat.name}</span>
                        <button className="color-mgr-del" onClick={() => deleteCategory(cat.id)}>🗑️</button>
                      </div>
                    ))}
                  </div>
                  <div className="color-mgr-add">
                    <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} />
                    <input type="text" placeholder="Nome da cor..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCategory() }} />
                    <button onClick={addCategory}>+ Adicionar</button>
                  </div>
                </div>
              </div>
            )}
            <div className="calendar-grid">
              {[...Array(getFirstDayOfMonth(viewYear, viewMonth))].map((_, i) => <div key={`e${i}`} className="day-cell empty" />)}
              {[...Array(getDaysInMonth(viewYear, viewMonth))].map((_, i) => {
                const day = i + 1, dk = dateKey(viewYear, viewMonth, day)
                const holiday = getHolidayForDay(viewMonth, day)
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
                const favEvts = mergedEvents.filter(e => favoriteIds.includes(e.id))
                const dayEvents = getEventsForDay(viewYear, viewMonth, day, favEvts)
                const dayMatches = getMatchesForDate(dk)
                const bestMatch = dayMatches.find(m => m.highlight) || dayMatches[0]
                const dayTasks = getTasksForDate(dk)
                const pendingTasks = dayTasks.filter(t => !t.done).length
                const hasNote = dayTasks.some(t => t.note)
                const dayCat = getCategoryForDay(dk)

                // Lógica de Borda Dividida
                const coloredEvents = dayEvents.filter(e => e.borderColor)
                let borderStyle = {}
                if (coloredEvents.length === 1) {
                  borderStyle = { borderColor: coloredEvents[0].borderColor, borderStyle: 'solid' }
                } else if (coloredEvents.length > 1) {
                  const percent = 100 / coloredEvents.length
                  const gradientStops = coloredEvents.map((e, idx) =>
                    `${e.borderColor} ${idx * percent}%, ${e.borderColor} ${(idx + 1) * percent}%`
                  ).join(', ')
                  borderStyle = {
                    border: '1px solid transparent',
                    backgroundImage: `linear-gradient(var(--bg-main), var(--bg-main)), linear-gradient(to right, ${gradientStops})`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                  }
                }

                return (
                  <div key={day}
                    className={`day-cell ${isToday ? 'today' : ''} ${holiday ? 'has-holiday' : ''} ${dayEvents.length > 0 ? 'has-event' : ''} ${dayMatches.length > 0 ? 'has-match' : ''} ${bestMatch?.highlight ? 'match-big' : ''} ${dayCat ? 'cat-bg' : ''}`}
                    onClick={() => setSelectedDay({ year: viewYear, month: viewMonth, day })}
                    style={{
                      ...(dayCat ? { backgroundColor: `${dayCat.color}22` } : {}),
                      ...borderStyle
                    }}
                  >
                    <div className="day-cell-header">
                      <span className="day-number">{day}</span>
                      {pendingTasks > 0 && <span className="day-pending-badge" title={`${pendingTasks} tarefa(s) pendente(s)`}>{pendingTasks}</span>}
                    </div>
                    {holiday && <span className="holiday-tag">{holiday.name}</span>}
                    {bestMatch && (
                      <div className="cal-match-visual">
                        <div className="cal-flags">
                          <TeamFlag team={bestMatch.home} size={32} />
                          <span className="cal-vs">vs</span>
                          <TeamFlag team={bestMatch.away} size={32} />
                        </div>
                        <div className="cal-match-side">
                          <TournamentBadge tournament={bestMatch.tournament} size={18} />
                          {dayMatches.length > 1 && <span className="cal-match-count">+{dayMatches.length - 1}</span>}
                        </div>
                      </div>
                    )}
                    {!bestMatch && dayEvents.length > 0 && !(['copa', 'champions'].includes(dayEvents[0].logo)) && (
                      <div className="cal-event-logo"><EventLogo event={dayEvents[0]} size={22} /></div>
                    )}
                    {hasNote && <span className="cal-note-dot">💬</span>}
                  </div>
                )
              })}
            </div>
            {favoriteIds.length > 0 && (
              <div className="fav-strip">
                <h3>⭐ Seus Eventos Favoritos</h3>
                <div className="fav-strip-list">
                  {mergedEvents.filter(e => favoriteIds.includes(e.id)).map(ev => {
                    const d = daysUntil(ev.date)
                    const isOver = ev.endDate ? daysUntil(ev.endDate) < 0 : d < 0
                    const inProgress = d <= 0 && !isOver
                    return (
                      <div key={ev.id} className="fav-card glass-card" onClick={() => setSelectedEvent(ev)}>
                        <EventLogo event={ev} size={32} />
                        <div className="fav-info">
                          <strong>{ev.name}</strong>
                          <span className="fav-countdown matrix-glow">
                            {inProgress ? 'Em andamento' : d > 0 ? `${d} dias` : 'Enc.'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EVENTOS ══ */}
        {page === 'events' && (
          <div className="page-events">
            <h2>🏆 Grandes Eventos</h2>
            <p className="events-subtitle">Selecione ⭐ para acompanhar</p>
            <div className="events-grid">
              {mergedEvents.map(ev => {
                const d = daysUntil(ev.date), isFav = favoriteIds.includes(ev.id)
                return (
                  <div key={ev.id} className={`event-card glass-card ${isFav ? 'is-fav' : ''}`}>
                    <div className="event-card-top" onClick={() => setSelectedEvent(ev)}>
                      <EventLogo event={ev} size={40} />
                      <div className="event-card-info"><h4>{ev.name}</h4><span className="event-cat">{ev.category}</span></div>
                      <div className="event-countdown"><span className="countdown-big matrix-glow">{d > 0 ? d : d === 0 ? '🎉' : '—'}</span><span className="countdown-sub">{d > 0 ? 'dias' : ''}</span></div>
                    </div>
                    <button className={`fav-toggle ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(ev.id)}>{isFav ? '★ Favorito' : '☆ Adicionar'}</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ TAREFAS ══ */}
        {page === 'tasks' && (
          <div className="page-tasks">
            <div className="tasks-header">
              <h2>✅ Suas Tarefas</h2>
              <div className="tasks-actions">
                <button className={`filter-btn ${showPastTasks ? 'active' : ''}`} onClick={() => setShowPastTasks(!showPastTasks)}>
                  {showPastTasks ? '📋 Ativas' : '📜 Concluídas'}
                </button>
                <button className="add-btn" onClick={() => setShowAddTask(!showAddTask)}>{showAddTask ? 'Fechar' : '+ Nova Tarefa'}</button>
              </div>
            </div>
            {showAddTask && (
              <form className="add-form glass-card" onSubmit={handleAddTask}>
                <input type="text" placeholder="Título" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                <input type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} required />
                <div className="form-date-group">
                  <div className="field">
                    <label>Início</label>
                    <input type="date" value={newTask.date} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Fim (Opcional)</label>
                    <input type="date" value={newTask.endDate} onChange={e => setNewTask({ ...newTask, endDate: e.target.value })} />
                  </div>
                </div>
                <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}><option value="work">Trabalho</option><option value="matrix">Matrix</option></select>
                <input type="text" placeholder="Nota (opcional)" value={newTask.note} onChange={e => setNewTask({ ...newTask, note: e.target.value })} className="note-input" />
                <button type="submit">Adicionar</button>
              </form>
            )}
            <div className="task-list">
              {tasks.filter(t => showPastTasks ? t.done : !t.done).map(t => (
                <div key={t.id} className={`task-row glass-card ${t.done ? 'done' : ''}`}>
                  <button className="check-btn" onClick={() => toggleTask(t.id)}>{t.done ? '✅' : '⬜'}</button>
                  <div className={`task-type-dot ${t.type}`}></div>
                  <div className="task-row-info">
                    <div className="task-row-main">
                      <span className="task-title">{t.title}</span>
                      <span className="task-meta">
                        <span className="task-time">⏰ {t.time}</span>
                        {t.date && (
                          <span className="task-date">
                            📅 {t.date.split('-').reverse().join('/')}
                            {t.endDate && ` a ${t.endDate.split('-').reverse().join('/')}`}
                          </span>
                        )}
                      </span>
                    </div>
                    {editingNote === t.id ? (
                      <div className="note-edit">
                        <input type="text" defaultValue={t.note} placeholder="Editar nota..."
                          onKeyDown={(e) => { if (e.key === 'Enter') { updateNote(t.id, e.target.value); setEditingNote(null) } }}
                          onBlur={(e) => { updateNote(t.id, e.target.value); setEditingNote(null) }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      t.note && (
                        <div className="task-note-display" onClick={() => setEditingNote(t.id)}>
                          <span className="note-icon">💬</span> {t.note}
                        </div>
                      )
                    )}
                    {!t.note && editingNote !== t.id && (
                      <button className="add-note-btn" onClick={() => setEditingNote(t.id)}>+ Nota</button>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => deleteTask(t.id)} title="Excluir">🗑️</button>
                </div>
              ))}
              {tasks.filter(t => showPastTasks ? t.done : !t.done).length === 0 && (
                <p className="empty-msg">{showPastTasks ? 'Nenhuma tarefa concluída.' : 'Nenhuma tarefa ativa.'}</p>
              )}
            </div>
          </div>
        )}

        {/* ══ CONFIGURAÇÕES ══ */}
        {page === 'settings' && (
          <div className="page-settings">
            <h2 className="settings-title">⚙️ Configurações</h2>

            <section className="settings-section glass-card">
              <h3>🎨 Geral & Visual</h3>
              <div className="settings-row">
                <label>Cor da Borda de Eventos</label>
                <div className="color-picker-group">
                  <input type="color" value={eventBorderColor} onChange={e => setEventBorderColor(e.target.value)} />
                  <code>{eventBorderColor.toUpperCase()}</code>
                </div>
              </div>
            </section>

            {/* Gerenciar Cores (Centralizado) */}
            <section className="settings-section glass-card">
              <h3>🎨 Categorias de Cores</h3>
              <div className="color-mgr-list">
                {colorCategories.map(cat => (
                  <div key={cat.id} className="color-mgr-row">
                    <span className="color-mgr-dot" style={{ background: cat.color }} />
                    <input type="text" className="color-name-input" defaultValue={cat.name} onBlur={(e) => {
                      const newName = e.target.value;
                      setColorCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c))
                    }} />
                    <input type="color" defaultValue={cat.color} onBlur={(e) => {
                      const newColor = e.target.value;
                      setColorCategories(prev => prev.map(c => c.id === cat.id ? { ...c, color: newColor } : c))
                    }} />
                    <button className="color-mgr-del" onClick={() => deleteCategory(cat.id)}>🗑️</button>
                  </div>
                ))}
              </div>
              <div className="color-mgr-add">
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} />
                <input type="text" placeholder="Nova categoria..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCategory() }} />
                <button onClick={addCategory}>+ Adicionar</button>
              </div>
            </section>

            {/* Módulo de Voz da Oráculo */}
            <section className="settings-section glass-card">
              <h3>🎙️ Voz da Oráculo (HuggingFace Neural)</h3>
              <p className="settings-desc">Conectada ao motor Neural gratuito da Meta (HuggingFace). A voz è gerada na nuvem e funciona em todos navegadores e dispositivos.</p>

              <div className="settings-row" style={{ marginTop: '15px' }}>
                <label>Tipo de Voz</label>
                <select
                  className="voice-select"
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(0,217,255,0.3)' }}
                >
                  <option value="female-pt">🌸 Oráculo — Português Feminina</option>
                  <option value="male-pt">🔵 Arquiteto — Português Masculino</option>
                  <option value="en-aria">🌐 Agent — English</option>
                </select>
                <button
                  onClick={() => speak("Sistemas neurais online. Matrix Chronos operacional.", true)}
                  style={{ padding: '8px 15px', background: 'rgba(0,217,255,0.2)', color: '#fff', border: '1px solid #00d9ff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Testar Voz
                </button>
              </div>

              {/* Engine Status Badge */}
              <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ fontSize: '16px' }}>
                  {voiceTier === 'native' ? '⭐' : voiceTier === 'hf' ? '🟢' : voiceTier === 'gemini' ? '🟡' : '⚪'}
                </span>
                <div>
                  <strong style={{ color: '#00d9ff' }}>Motor Ativo:</strong>{' '}
                  <span style={{ color: '#ccc' }}>
                    {voiceTier === 'native' && 'Voz Nativa Premium (Edge/Google) — Máxima qualidade'}
                    {voiceTier === 'hf' && 'HuggingFace Neural (Vercel Proxy) — Alta qualidade'}
                    {voiceTier === 'gemini' && 'Gemini TTS — Qualidade funcional'}
                    {voiceTier === 'none' && 'Clique em "Testar Voz" para ativar'}
                  </span>
                </div>
              </div>
            </section>




            {/* Customizar Eventos Existentes */}
            <section className="settings-section glass-card">
              <h3>✏️ Editar Eventos do Sistema</h3>
              <div className="settings-events-list">
                {ALL_EVENTS.map(ev => {
                  const ov = eventOverrides[ev.id] || {}
                  return (
                    <div key={ev.id} className="settings-event-row">
                      <div className="settings-event-info">
                        <EventLogo event={{ ...ev, ...ov }} size={32} />
                        <div><strong>{ov.name || ev.name}</strong><br /><small>{ev.category}</small></div>
                      </div>
                      <div className="settings-event-ctrls">
                        <div className="settings-field-group">
                          <input type="text" placeholder="Nome customizado" value={ov.name || ''}
                            onChange={(e) => updateEventOverride(ev.id, { name: e.target.value })} />
                          <div className="evt-color-ctrl">
                            <input type="color" value={ov.borderColor || ev.borderColor || '#3B6FAE'}
                              style={{ opacity: (ov.borderColor === null && ev.borderColor === null ? 0.3 : 1) }}
                              onChange={(e) => updateEventOverride(ev.id, { borderColor: e.target.value })} />
                            <button className="no-color-btn" title="Sem cor de borda" onClick={() => updateEventOverride(ev.id, { borderColor: null })}>🚫</button>
                          </div>
                        </div>
                        <div className="logo-upload-group">
                          <input type="text" placeholder="URL da Logo" value={ov.customLogo || ''}
                            onChange={(e) => updateEventOverride(ev.id, { customLogo: e.target.value })} />
                          <label className="file-upload-label">
                            📁 <input type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => updateEventOverride(ev.id, { customLogo: reader.result });
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        </div>
                        {(ov.name || ov.customLogo || ov.borderColor !== undefined) && <button className="reset-btn" onClick={() => resetEventOverride(ev.id)}>Reset</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Seus Eventos Personalizados */}
            <section className="settings-section glass-card">
              <h3>📅 Eventos Personalizados</h3>
              <div className="custom-events-list">
                {customEvents.map(ev => (
                  <div key={ev.id} className="settings-event-row">
                    <div className="settings-event-info">
                      <EventLogo event={ev} size={32} />
                      <div><strong>{ev.name}</strong><br /><small>{ev.date} {ev.endDate ? `a ${ev.endDate}` : ''}</small></div>
                    </div>
                    <button className="color-mgr-del" onClick={() => deleteCustomEvent(ev.id)}>🗑️</button>
                  </div>
                ))}
              </div>

              <div className="new-event-form">
                <h4>{editingCustomId ? 'Editar Evento' : '+ Criar Novo Evento'}</h4>
                <div className="form-grid">
                  <input type="text" placeholder="Nome do Evento" value={newEv.name} onChange={e => setNewEv({ ...newEv, name: e.target.value })} />
                  <div className="date-group">
                    <input type="date" value={newEv.date} onChange={e => setNewEv({ ...newEv, date: e.target.value })} />
                    <label><input type="checkbox" checked={isMultiDay} onChange={e => setIsMultiDay(e.target.checked)} /> Vários dias</label>
                    {isMultiDay && <input type="date" value={newEv.endDate} onChange={e => setNewEv({ ...newEv, endDate: e.target.value })} />}
                  </div>
                  <div className="logo-upload-group">
                    <input type="text" placeholder="URL da Logo (ou emoji)" value={newEv.logo} onChange={e => setNewEv({ ...newEv, logo: e.target.value })} />
                    <label className="file-upload-label" title="Fazer upload de imagem">
                      📁 <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewEv({ ...newEv, logo: reader.result });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="form-row-flex">
                    <select value={newEv.category} onChange={e => setNewEv({ ...newEv, category: e.target.value })}>
                      <option>Pessoal</option><option>Trabalho</option><option>Esporte</option><option>Cultura</option>
                    </select>
                    <select value={newEv.recurrence} onChange={e => setNewEv({ ...newEv, recurrence: e.target.value })}>
                      <option value="none">Não repete</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                    <div className="new-evt-color">
                      <label>Cor da Borda:</label>
                      <input type="color" value={newEv.borderColor || '#3B6FAE'} onChange={e => setNewEv({ ...newEv, borderColor: e.target.value })} />
                      <button type="button" className={`toggle-color-btn ${!newEv.borderColor ? 'active' : ''}`}
                        onClick={() => setNewEv({ ...newEv, borderColor: newEv.borderColor ? null : '#3B6FAE' })}>
                        {newEv.borderColor ? 'Ativa' : 'Sem Cor'}
                      </button>
                    </div>
                  </div>
                  <button className="save-ev-btn" onClick={() => {
                    if (!newEv.name || !newEv.date) return;
                    addCustomEvent({ ...newEv, customLogo: newEv.logo, details: [] });
                    setNewEv({ name: '', date: '', endDate: '', logo: '', emoji: '📅', category: 'Pessoal', borderColor: null });
                    setIsMultiDay(false);
                  }}>Salvar Evento</button>
                </div>
              </div>
            </section>

            {/* Configuração do Alarme */}
            <section className="settings-section glass-card">
              <h3>🚨 Som do Alarme</h3>
              <p className="settings-desc">Faça upload de um arquivo de áudio (MP3/WAV) para substituir o bip padrão do sistema quando suas tarefas alcançarem a hora exata.</p>

              <div className="settings-row" style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
                <label className="file-upload-label" style={{ padding: '10px 20px', background: 'rgba(0, 217, 255, 0.1)', border: '1px solid currentColor', color: '#00d9ff', cursor: 'pointer', borderRadius: '8px' }}>
                  🎵 Carregar Áudio...
                  <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert("O arquivo de áudio deve ter no máximo 2MB para ser salvo na memória.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setCustomAlarmAudio(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>

                {customAlarmAudio && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => {
                      const testAudio = new Audio(customAlarmAudio);
                      testAudio.play();
                    }} style={{ background: 'transparent', border: '1px solid #4CAF50', color: '#4CAF50', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>▶ Testar</button>
                    <button onClick={() => setCustomAlarmAudio(null)} style={{ background: 'transparent', border: '1px solid #E53935', color: '#E53935', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Remover Personalizado</button>
                  </div>
                )}
                {!customAlarmAudio && <span style={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>Usando bip nativo do sistema</span>}
              </div>
            </section>
          </div>
        )}

        {/* ══ OVERLAY DE ALARME CONTÍNUO ══ */}
        {activeAlarm && (
          <div className="alarm-modal-overlay">
            <div className="alarm-modal glass-card">
              <div className="alarm-icon matrix-glow">⚠️</div>
              <h2 className="alarm-title">
                {activeAlarm.type === 'task' && "Tarefa Atingiu o Prazo!"}
                {activeAlarm.type === 'match' && "Hora do Jogo!"}
                {activeAlarm.type === 'warning' && "Preparação para Amanhã"}
              </h2>

              <div className="alarm-details">
                <strong className="alarm-name">{activeAlarm.title}</strong>
                <span className="alarm-time">⏰ {activeAlarm.time}</span>
                {activeAlarm.tournament && <TournamentBadge tournament={activeAlarm.tournament} size={40} />}
              </div>

              <div className="alarm-actions">
                <button
                  className="dismiss-btn"
                  onClick={() => {
                    setDismissedAlarms(prev => [...prev, activeAlarm.id]);
                    setActiveAlarm(null);
                  }}
                >
                  Desligar Alarme
                </button>

                {activeAlarm.type === 'task' && (
                  <button
                    className="snooze-btn"
                    onClick={() => {
                      // Snooze for 5 minutes
                      const snoozeTime = new Date().getTime() + 5 * 60000;
                      setSnoozedAlarms(prev => ({ ...prev, [activeAlarm.id]: snoozeTime }));
                      setActiveAlarm(null);
                    }}
                  >
                    Soneca (5 min)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ADVISOR (THE ORACLE) ══ */}
        {page === 'advisor' && (
          <div className="page-advisor">
            <div className="advisor-top"><h2 className="matrix-glow">🤖 The Oracle (A Oráculo)</h2><span className="status-badge">● Online</span></div>
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  <span className="bubble-tag">{msg.role === 'ai' ? 'ORACLE' : 'VOCÊ'}</span>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isThinking && <div className="chat-bubble ai thinking"><p>Sintonizando a Matrix...</p></div>}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-form" onSubmit={handleChat}>
              <input type="text" placeholder="Peça para criar tarefas, ver eventos, mudar cores..." value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isThinking} />
              <button type="submit" disabled={isThinking}>{isThinking ? '...' : 'Enviar'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

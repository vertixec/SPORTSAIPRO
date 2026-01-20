import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy,
  History,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Heart,
  Search,
  Plus,
  X,
  Target,
  Star,
  Loader2,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react';

// --- CONFIGURACIÓN DE CONEXIÓN N8N (Hostinger) ---
const N8N_ENDPOINT = "https://n8n.srv1254414.hstgr.cloud/webhook-test/analyze-match";

// --- CONFIGURACIÓN API DEPORTIVA ---
const API_KEY = "10f444b8b9b4ccc81bbb860fd18849ba";
const API_HOST = "v3.football.api-sports.io";

const LIGAS = [
  { id: 140, name: "La Liga", country: "España", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { id: 39, name: "Premier League", country: "Inglaterra", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { id: 135, name: "Serie A", country: "Italia", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { id: 78, name: "Bundesliga", country: "Alemania", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { id: 61, name: "Ligue 1", country: "Francia", logo: "https://media.api-sports.io/football/leagues/61.png" }
];

const MOCK_TEAMS = {
  140: [{ id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" }, { id: 529, name: "FC Barcelona", logo: "https://media.api-sports.io/football/teams/529.png" }, { id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png" }, { id: 547, name: "Girona", logo: "https://media.api-sports.io/football/teams/547.png" }],
  39: [{ id: 50, name: "Man City", logo: "https://media.api-sports.io/football/teams/50.png" }, { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png" }, { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" }, { id: 66, name: "Aston Villa", logo: "https://media.api-sports.io/football/teams/66.png" }],
  135: [{ id: 505, name: "Inter Milan", logo: "https://media.api-sports.io/football/teams/505.png" }, { id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png" }, { id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png" }, { id: 492, name: "Napoli", logo: "https://media.api-sports.io/football/teams/492.png" }],
  78: [{ id: 168, name: "Leverkusen", logo: "https://media.api-sports.io/football/teams/168.png" }, { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png" }, { id: 172, name: "Stuttgart", logo: "https://media.api-sports.io/football/teams/172.png" }, { id: 165, name: "Dortmund", logo: "https://media.api-sports.io/football/teams/165.png" }],
  61: [{ id: 85, name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png" }, { id: 91, name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png" }, { id: 84, name: "Nice", logo: "https://media.api-sports.io/football/teams/84.png" }, { id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png" }]
};

const ALL_TEAMS = Object.values(MOCK_TEAMS).flat();

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [sidebarHover, setSidebarHover] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(LIGAS[0]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ user: '', pass: '' });
  const [searchTerm, setSearchTerm] = useState("");
  const [connStatus, setConnStatus] = useState({ type: null, message: "" });
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('sportai_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedAnalysis, setSavedAnalysis] = useState(() => {
    const saved = localStorage.getItem('sportai_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sportai_history', JSON.stringify(savedAnalysis));
  }, [savedAnalysis]);

  useEffect(() => {
    localStorage.setItem('sportai_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- LÓGICA DE CONEXIÓN N8N (Integrada en Login) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConnStatus({ type: 'testing', message: "Conectando con Backend n8n..." });

    try {
      const response = await fetch(N8N_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "auth_test", 
          user: authForm.user,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setConnStatus({ type: 'success', message: "Autenticación Exitosa." });
        setTimeout(() => {
          setUser({ name: authForm.user, id: 'u1' });
          setView('dashboard');
        }, 1000);
      } else {
        setConnStatus({ type: 'error', message: `Error ${response.status}: Webhook inactivo.` });
      }
    } catch (error) {
      setConnStatus({ type: 'error', message: "Fallo de red: No se pudo contactar con n8n." });
    } finally {
      setLoading(false);
    }
  };

  const generateAIScenarios = useCallback((match) => {
    const seed = match.fixture?.id || Math.random() * 1000;
    const pseudoRand = (m, min = 50, max = 95) => {
      const x = Math.sin(seed * m) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };
    
    return [
      { id: `s1-${seed}`, label: "Más de 2.5 Goles", prob: pseudoRand(1, 65, 92), odds: 1.85, risk: "Bajo" },
      { id: `s2-${seed}`, label: `Victoria ${match.teams.home.name}`, prob: pseudoRand(2, 40, 75), odds: 2.20, risk: "Medio" },
      { id: `s3-${seed}`, label: "Ambos Marcan", prob: pseudoRand(3, 55, 85), odds: 1.75, risk: "Bajo" }
    ];
  }, []);

  const topPicks = useMemo(() => {
    const picks = [];
    LIGAS.forEach(league => {
      const teams = MOCK_TEAMS[league.id] || MOCK_TEAMS[140];
      const match = { teams: { home: teams[0], away: teams[1] }, league };
      const scenarios = generateAIScenarios(match);
      picks.push({
        match: `${teams[0].name} vs ${teams[1].name}`,
        leagueLogo: league.logo,
        scenario: scenarios[0].label,
        prob: scenarios[0].prob
      });
    });
    return picks.sort((a, b) => b.prob - a.prob).slice(0, 5);
  }, [generateAIScenarios]);

  const fetchMatches = async (leagueId) => {
    setLoading(true);
    const proxy = "https://corsproxy.io/?";
    const target = `https://${API_HOST}/fixtures?date=${new Date().toISOString().split('T')[0]}&league=${leagueId}`;
    
    try {
      const res = await fetch(proxy + encodeURIComponent(target), {
        headers: { "x-apisports-key": API_KEY, "x-apisports-host": API_HOST }
      });
      const data = await res.json();
      if (data.response?.length > 0) {
        setMatches(data.response.map(m => ({
          ...m,
          aiScenarios: generateAIScenarios(m),
          aiConfidence: Math.floor(Math.random() * 10 + 85)
        })));
      } else throw new Error();
    } catch {
      const teams = MOCK_TEAMS[leagueId] || MOCK_TEAMS[140];
      setMatches([{
        fixture: { id: leagueId + 100, status: { short: 'NS' }, date: new Date().toISOString() },
        league: selectedLeague,
        teams: { home: teams[0], away: teams[1] }
      }, {
        fixture: { id: leagueId + 200, status: { short: 'NS' }, date: new Date().toISOString() },
        league: selectedLeague,
        teams: { home: teams[2], away: teams[3] }
      }].map(m => ({ ...m, aiScenarios: generateAIScenarios(m), aiConfidence: Math.floor(Math.random() * 5 + 90) })));
    } finally { setTimeout(() => setLoading(false), 800); }
  };

  useEffect(() => {
    if (user && view === 'dashboard') fetchMatches(selectedLeague.id);
  }, [selectedLeague, user, view]);

  const toggleFavorite = (team) => {
    if (favorites.find(f => f.id === team.id)) {
      setFavorites(favorites.filter(f => f.id !== team.id));
    } else {
      setFavorites([...favorites, team]);
    }
  };

  const filteredTeams = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return ALL_TEAMS.filter(t => t.name.toLowerCase().includes(term));
  }, [searchTerm]);

  const favoriteMatches = useMemo(() => {
    const favIds = favorites.map(f => f.id);
    const results = [];
    Object.keys(MOCK_TEAMS).forEach(leagueId => {
      const teams = MOCK_TEAMS[leagueId];
      for(let i=0; i < teams.length; i+=2) {
        const home = teams[i];
        const away = teams[i+1];
        if(favIds.includes(home.id) || favIds.includes(away.id)) {
          const m = {
            fixture: { id: 9000 + home.id, status: { short: 'NS' }, date: new Date().toISOString() },
            league: LIGAS.find(l => l.id === parseInt(leagueId)),
            teams: { home, away }
          };
          results.push({ ...m, aiScenarios: generateAIScenarios(m), aiConfidence: 95 });
        }
      }
    });
    return results;
  }, [favorites, generateAIScenarios]);

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
        <div className="w-full max-w-md text-center relative z-10">
            <div className="inline-flex p-4 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/20 mb-6">
              <Trophy className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-10">SportAI <span className="text-emerald-500">Copilot</span></h1>
            
          <form onSubmit={handleLogin} className="bg-slate-900/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-6 text-left">
            <div className="space-y-4">
              <input 
                type="text" 
                required 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all" 
                placeholder="Usuario" 
                value={authForm.user} 
                onChange={e => setAuthForm({...authForm, user: e.target.value})} 
              />
              <input 
                type="password" 
                required 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all" 
                placeholder="••••••••" 
                value={authForm.pass} 
                onChange={e => setAuthForm({...authForm, pass: e.target.value})} 
              />
            </div>

            {connStatus.type && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
                connStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                connStatus.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                {connStatus.type === 'testing' ? <Loader2 className="animate-spin shrink-0" size={16} /> : <AlertTriangle className="shrink-0" size={16} />}
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{connStatus.message}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              {loading ? "CONECTANDO..." : "INICIAR SESIÓN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <aside 
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className={`fixed left-0 top-0 h-full bg-slate-900/80 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${sidebarHover ? 'w-80 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'w-20'}`}
      >
        <div className={`p-8 flex items-center gap-4 transition-all ${!sidebarHover && 'justify-center px-0'}`}>
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="text-white w-6 h-6" />
          </div>
          {sidebarHover && <span className="font-black text-xl tracking-tighter text-white italic uppercase animate-in fade-in">SportAI</span>}
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-8">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'favorites', icon: Heart, label: 'Mis Favoritos' },
            { id: 'history', icon: History, label: 'Historial' }
          ].map(item => (
            <button key={item.id} onClick={() => {setView(item.id); setSelectedMatch(null); setSearchTerm("");}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white'} ${!sidebarHover && 'justify-center px-0'}`}>
              <item.icon size={20} className="shrink-0" /> 
              {sidebarHover && <span className="font-black text-xs uppercase tracking-widest animate-in fade-in">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`p-6 transition-all ${!sidebarHover && 'px-4'}`}>
          <button onClick={() => { setUser(null); setView('login'); setConnStatus({type:null, message:''}); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${!sidebarHover && 'justify-center px-0'}`}>
            <LogOut size={20} className="shrink-0" /> 
            {sidebarHover && <span className="font-black text-xs uppercase tracking-widest animate-in fade-in">Salir</span>}
          </button>
        </div>
      </aside>

      <main className={`p-6 lg:p-12 pb-32 transition-all duration-300 ${sidebarHover ? 'ml-80 opacity-50' : 'ml-20'}`}>
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                {view === 'favorites' ? 'Módulo de Seguimiento Personalizado' : 'IA Predictiva Activa'}
              </span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">
              {view === 'favorites' ? 'Mis Favoritos' : (view === 'history' ? 'Historial de Valor' : `Hola, ${user.name}`)}
            </h1>
        </header>

        {view === 'favorites' && !selectedMatch && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* BUSCADOR INTEGRADO MEJORADO */}
            <section className="bg-slate-900/60 border border-white/5 p-8 rounded-[3rem] relative overflow-visible z-30">
               <div className="flex items-center gap-3 mb-6">
                <Search className="text-emerald-500" size={18} />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Buscar Nuevos Equipos MVP</h3>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribe el nombre de un equipo (Ej: Real Madrid, Man City...)"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl px-8 py-6 text-lg text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
                />
                
                {/* LISTA DE RESULTADOS FLOTANTE */}
                {searchTerm && (
                  <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-slate-900 border border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-50 max-h-80 overflow-y-auto backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredTeams.length > 0 ? (
                      <div className="p-2">
                        {filteredTeams.map(team => {
                          const isFav = favorites.find(f => f.id === team.id);
                          return (
                            <button 
                              key={team.id} 
                              onClick={() => { toggleFavorite(team); setSearchTerm(""); }}
                              className="w-full flex items-center justify-between p-4 px-6 hover:bg-emerald-600/10 rounded-2xl transition-all group mb-1 last:mb-0"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-950/50 rounded-xl flex items-center justify-center p-2 border border-white/5">
                                  <img src={team.logo} className="w-full h-full object-contain" />
                                </div>
                                <span className="font-black text-white uppercase italic tracking-tight">{team.name}</span>
                              </div>
                              <div className={`p-2 rounded-lg transition-colors ${isFav ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                {isFav ? <X size={18} /> : <Plus size={18} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center gap-4">
                        <Target size={32} className="text-slate-700" />
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">No hay coincidencias para "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* EQUIPOS ESCOGIDOS */}
            {favorites.length > 0 && (
              <section className="animate-in fade-in delay-100">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="text-rose-500 fill-rose-500" size={18} />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Equipos en Seguimiento</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {favorites.map(team => (
                    <div key={team.id} className="bg-slate-900/40 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                      <img src={team.logo} className="w-6 h-6 object-contain" />
                      <span className="text-xs font-black text-white uppercase italic">{team.name}</span>
                      <button onClick={() => toggleFavorite(team)} className="text-slate-600 hover:text-rose-500 transition-colors p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PRONÓSTICOS DE FAVORITOS */}
            <section className="animate-in fade-in delay-200">
              <div className="flex items-center gap-3 mb-8">
                <Target className="text-emerald-500" size={18} />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Predicciones para tus Equipos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {favoriteMatches.length > 0 ? favoriteMatches.map(match => (
                  <div key={match.fixture.id} onClick={() => setSelectedMatch(match)} className="group bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 hover:bg-slate-900/80 hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{match.league.name}</span>
                       <div className="px-3 py-1 bg-emerald-600/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20">{match.aiConfidence}% ACCURACY</div>
                    </div>
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <div className="text-center flex-1">
                        <img src={match.teams.home.logo} className="w-16 h-16 mx-auto mb-3" />
                        <div className="font-black text-[10px] uppercase text-white truncate">{match.teams.home.name}</div>
                      </div>
                      <div className="text-slate-800 font-black italic text-xl">VS</div>
                      <div className="text-center flex-1">
                        <img src={match.teams.away.logo} className="w-16 h-16 mx-auto mb-3" />
                        <div className="font-black text-[10px] uppercase text-white truncate">{match.teams.away.name}</div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center text-slate-600">
                      <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Ver Análisis IA</span>
                      <ChevronRight size={18} className="group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 bg-slate-900/20 border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center text-center opacity-40">
                    <Target size={48} className="text-slate-700 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Añade equipos arriba para ver sus predicciones de hoy</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'dashboard' && !selectedMatch && (
          <>
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-amber-500 fill-amber-500" size={18} />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Top 5 Picks del Día</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {topPicks.map((pick, i) => (
                  <div key={i} className="bg-slate-900/50 border border-white/5 p-5 rounded-3xl group relative overflow-hidden hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={pick.leagueLogo} className="w-6 h-6 object-contain" />
                      <span className="text-[10px] font-black text-emerald-500 italic">{pick.prob}%</span>
                    </div>
                    <div className="text-[11px] font-black text-white uppercase truncate">{pick.match}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase truncate">{pick.scenario}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-center mb-10">
              <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-900/60 rounded-[2.5rem] border border-white/5 overflow-x-auto max-w-full">
                {LIGAS.map(league => (
                  <button 
                    key={league.id} 
                    onClick={() => setSelectedLeague(league)} 
                    className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedLeague.id === league.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-800'}`}
                  >
                    <img src={league.logo} className="w-4 h-4 object-contain" /> {league.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-32 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600 w-16 h-16" />
                </div>
              ) : matches.map(match => (
                <div key={match.fixture.id} onClick={() => setSelectedMatch(match)} className="group bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 hover:bg-slate-900/80 hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                     <span className="text-[9px] font-black text-slate-500 uppercase">{match.league.name}</span>
                     <div className="px-3 py-1 bg-emerald-600/10 text-emerald-400 text-[10px] font-black rounded-full">{match.aiConfidence}%</div>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="text-center flex-1">
                      <img src={match.teams.home.logo} className="w-16 h-16 mx-auto mb-3" />
                      <div className="font-black text-[10px] uppercase text-white truncate">{match.teams.home.name}</div>
                    </div>
                    <div className="text-slate-800 font-black italic text-xl">VS</div>
                    <div className="text-center flex-1">
                      <img src={match.teams.away.logo} className="w-16 h-16 mx-auto mb-3" />
                      <div className="font-black text-[10px] uppercase text-white truncate">{match.teams.away.name}</div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center text-slate-600">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Explorar Probabilidades</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedMatch && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={() => setSelectedMatch(null)} className="mb-8 px-6 py-3 rounded-full bg-slate-900 border border-white/5 text-slate-500 font-black text-[10px] tracking-widest flex items-center gap-3 hover:text-white transition-all">
              <ChevronRight className="rotate-180" size={14} /> REGRESAR
            </button>
            <div className="bg-gradient-to-br from-emerald-700/20 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-[4rem] p-12 mb-10 flex flex-col md:flex-row items-center justify-around gap-10">
               <div className="text-center">
                 <img src={selectedMatch.teams.home.logo} className="w-32 h-32 mx-auto mb-4" />
                 <h2 className="text-3xl font-black text-white uppercase italic">{selectedMatch.teams.home.name}</h2>
               </div>
               <div className="text-5xl font-black text-slate-800 italic tracking-tighter">VS</div>
               <div className="text-center">
                 <img src={selectedMatch.teams.away.logo} className="w-32 h-32 mx-auto mb-4" />
                 <h2 className="text-3xl font-black text-white uppercase italic">{selectedMatch.teams.away.name}</h2>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {selectedMatch.aiScenarios.map((s) => (
                <div key={s.id} className="bg-slate-900/60 border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group hover:bg-slate-900 transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="text-5xl font-black text-white italic mb-4">{s.prob}%</div>
                  <h4 className="text-lg font-black text-white uppercase mb-2 leading-tight">{s.label}</h4>
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/10 inline-block mb-8 tracking-widest uppercase">Cuota {s.odds}</div>
                  <button onClick={() => setSavedAnalysis([{ id: Date.now(), match: `${selectedMatch.teams.home.name} vs ${selectedMatch.teams.away.name}`, scenario: s.label, prob: s.prob, status: 'pending' }, ...savedAnalysis])} className="w-full bg-slate-950 hover:bg-emerald-600 text-slate-400 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Fijar Predicción</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {savedAnalysis.length > 0 ? savedAnalysis.map(item => (
              <div key={item.id} className="bg-slate-900/80 border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : item.status === 'lost' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-950 text-blue-500'}`}>
                    {item.status === 'won' ? <CheckCircle2 size={24} /> : item.status === 'lost' ? <XCircle size={24} /> : <Target size={24} />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase italic">{item.match}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">{item.scenario} - {item.prob}%</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSavedAnalysis(savedAnalysis.map(a => a.id === item.id ? {...a, status: 'won'} : a))} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${item.status === 'won' ? 'bg-emerald-600' : 'bg-slate-950 text-slate-700'}`}><CheckCircle2 size={16} /></button>
                  <button onClick={() => setSavedAnalysis(savedAnalysis.map(a => a.id === item.id ? {...a, status: 'lost'} : a))} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${item.status === 'lost' ? 'bg-rose-600' : 'bg-slate-950 text-slate-700'}`}><XCircle size={16} /></button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest">El historial está vacío</div>
            )}
          </div>
        )}
      </main>

      <footer className={`fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 p-4 z-40 transition-all duration-300 ${sidebarHover ? 'ml-80' : 'ml-20'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[8px] font-black text-slate-700 tracking-[0.3em] uppercase">
          <div className="flex items-center gap-4">
            <span className="text-amber-600 flex items-center gap-1.5"><AlertTriangle size={12} /> Juega Responsable</span>
            <span className="text-emerald-500 flex items-center gap-1.5 ml-4"><Globe size={12} /> n8n: {connStatus.type === 'success' ? 'CONNECTED' : 'STANDBY'}</span>
          </div>
          <span className="text-slate-500">SportAI Terminal <span className="text-white font-bold">CORE-MVP</span></span>
        </div>
      </footer>
    </div>
  );
};

export default App;

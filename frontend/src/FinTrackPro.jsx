import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, TrendingUp, Receipt,
  Settings as Cog, Plus, Search, Trash2, Edit2, X,
  Download, Sun, Moon,
  Wallet, CheckCircle, AlertTriangle
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CATS_EXPENSE = ["Food","Transport","Housing","Health","Shopping","Travel","Entertainment","Bills","Education","Other"];

const CAT_COLORS = {
  Food:"#f59e0b", Transport:"#3b82f6", Housing:"#8b5cf6",
  Health:"#ef4444", Shopping:"#ec4899", Travel:"#06b6d4",
  Entertainment:"#f97316", Bills:"#dc2626", Education:"#a78bfa",
  Other:"#6b7280",
};

const CAT_EMOJI = {
  Food:"🍔", Transport:"🚗", Housing:"🏠", Health:"❤️", Shopping:"🛍️",
  Travel:"✈️", Entertainment:"🎬", Bills:"💡", Education:"📚",
  Other:"📦",
};

const CURRENCIES = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥" };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const NAV_ITEMS = [
  { id:"dashboard",    icon:LayoutDashboard, label:"Dashboard"    },
  { id:"transactions", icon:Receipt,         label:"Transactions"  },
  { id:"analytics",    icon:TrendingUp,      label:"Analytics"    },
  { id:"settings",     icon:Cog,             label:"Settings"     },
];

// ─────────────────────────────────────────────────────────────────────────────
// No seed data — users start fresh
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// THEME SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

const THEME = {
  dark: {
    bg:"#080c14",        card:"#0f1520",     cardAlt:"#141c2e",
    border:"#1e2a3e",    borderHover:"#2a3a54",
    text:"#e8edf5",      textMuted:"#7a8ca3", textFaint:"#4a5568",
    accent:"#5b8def",    accentBg:"rgba(91,141,239,0.12)",
    green:"#00d4a0",     greenBg:"rgba(0,212,160,0.12)",
    red:"#ff5277",       redBg:"rgba(255,82,119,0.12)",
    amber:"#ffb547",     amberBg:"rgba(255,181,71,0.12)",
    purple:"#a78bfa",    purpleBg:"rgba(167,139,250,0.12)",
    sidebar:"#0b1019",
  },
  light: {
    bg:"#f0f4f8",        card:"#ffffff",     cardAlt:"#f8fafc",
    border:"#e2e8f0",    borderHover:"#cbd5e1",
    text:"#0f172a",      textMuted:"#64748b", textFaint:"#94a3b8",
    accent:"#3b6fd4",    accentBg:"rgba(59,111,212,0.08)",
    green:"#059669",     greenBg:"rgba(5,150,105,0.08)",
    red:"#dc2626",       redBg:"rgba(220,38,38,0.08)",
    amber:"#d97706",     amberBg:"rgba(217,119,6,0.08)",
    purple:"#7c3aed",    purpleBg:"rgba(124,58,237,0.08)",
    sidebar:"#ffffff",
  },
};

const fmt = (amount, sym = "$") =>
  `${sym}${Math.abs(amount).toLocaleString("en", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT STATE HOOK  (with version-based auto-purge)
// ─────────────────────────────────────────────────────────────────────────────

const DATA_VERSION = "v2"; // bump this whenever we want a clean slate

// Purge old keys if version mismatch (runs once at module load time)
const _storedVersion = localStorage.getItem("ft_version");
if (_storedVersion !== DATA_VERSION) {
  ["ft_txs","ft_mainAmounts","ft_currentMonth","ft_dark","ft_currency"].forEach(k => localStorage.removeItem(k));
  localStorage.setItem("ft_version", DATA_VERSION);
}

function useStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : (typeof initial === "function" ? initial() : initial);
    } catch { return typeof initial === "function" ? initial() : initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function FinTrackPro({ user, onLogout }) {
  // ── Persisted State (survives page refresh) ────────────────────────────
  const [dark,            setDark]            = useStorage("ft_dark", true);
  const [currency,        setCurrency]        = useStorage("ft_currency", "USD");
  const [txs,             setTxs]             = useStorage("ft_txs", []);
  const [mainAmounts,     setMainAmounts]     = useStorage("ft_mainAmounts", {});
  const [currentMonthStr, setCurrentMonthStr] = useStorage("ft_currentMonth", () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });

  // ── Ephemeral UI State ─────────────────────────────────────────────────
  const [view,        setView]        = useState("dashboard");
  const [modal,       setModal]       = useState(null);
  const [editTx,      setEditTx]      = useState(null);
  const [newMonthYear, setNewMonthYear] = useState(() => parseInt(currentMonthStr.split("-")[0]));
  const [newMonthIdx,  setNewMonthIdx]  = useState(null);
  const [newMonthAmt,  setNewMonthAmt]  = useState("");
  const [form,        setForm]        = useState({ amount:"", category:"Food", desc:"", date:new Date().toISOString().split("T")[0], recurring:false });
  const [mainAmtForm, setMainAmtForm] = useState("");
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [notif,       setNotif]       = useState(null);

  const T   = dark ? THEME.dark : THEME.light;
  const sym = CURRENCIES[currency];

  // ── Derived / Memoized ──────────────────────────────────────────────────
  const currentTxs = useMemo(() => txs.filter(t => t.date.startsWith(currentMonthStr)), [txs, currentMonthStr]);
  const monthExp   = currentTxs.reduce((s, t) => s + t.amount, 0);
  const monthMain  = mainAmounts[currentMonthStr] || null;
  const remaining  = monthMain ? monthMain - monthExp : 0;
  
  const savingsRate = monthMain && monthMain > 0 ? ((remaining / monthMain) * 100).toFixed(1) : 0;

  // Monthly bar-chart data — last 6 months dynamically
  const monthlyData = useMemo(() => {
    const months = [];
    const [curY, curM] = currentMonthStr.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      let m = curM - i;
      let y = curY;
      if (m <= 0) { m += 12; y -= 1; }
      const prefix = `${y}-${String(m).padStart(2, "0")}`;
      const label  = new Date(y, m - 1).toLocaleString("default", { month: "short" });
      const mTxs   = txs.filter(t => t.date.startsWith(prefix));
      months.push({
        month: label,
        limit: mainAmounts[prefix] || 0,
        spent: mTxs.reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [txs, mainAmounts, currentMonthStr]);

  // Category breakdown
  const catData = useMemo(() => {
    const map = {};
    txs.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
  }, [txs]);

  // Filtered txs
  const filteredTxs = useMemo(() => {
    return txs.filter(t => {
      const q = search.toLowerCase();
      if (q && !t.desc.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      if (filterCat !== "All" && t.category !== filterCat) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [txs, search, filterCat]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showNotif = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  const openAdd = () => {
    setForm({ amount:"", category:"Food", desc:"", date:`${currentMonthStr}-15`, recurring:false });
    setEditTx(null);
    setModal("add");
  };

  const openNewMonth = () => {
    setNewMonthYear(parseInt(currentMonthStr.split("-")[0]));
    setNewMonthIdx(null);
    setNewMonthAmt("");
    setModal("newMonth");
  };

  const saveNewMonth = () => {
    if (newMonthIdx === null) return;
    const amt = parseFloat(newMonthAmt);
    if (isNaN(amt) || amt <= 0) return;
    const mm = String(newMonthIdx + 1).padStart(2, "0");
    const key = `${newMonthYear}-${mm}`;
    setMainAmounts(prev => ({ ...prev, [key]: amt }));
    setCurrentMonthStr(key);
    setModal(null);
    showNotif(`New month ${MONTHS[newMonthIdx]} ${newMonthYear} started!`);
  };

  const openEdit = tx => {
    setForm({ amount:String(tx.amount), category:tx.category, desc:tx.desc, date:tx.date, recurring:tx.recurring });
    setEditTx(tx);
    setModal("edit");
  };

  const saveTx = () => {
    const amount = parseFloat(form.amount);
    if (!form.desc || isNaN(amount) || amount <= 0) return;
    if (modal === "edit" && editTx) {
      setTxs(prev => prev.map(t => t.id === editTx.id ? { ...t, type:"expense", amount } : t));
      showNotif("Expense updated!");
    } else {
      setTxs(prev => [{ ...form, type:"expense", amount, id:Date.now() }, ...prev]);
      showNotif("Expense added!");
    }
    setModal(null);
  };

  const saveMainAmount = () => {
    const val = parseFloat(mainAmtForm);
    if (isNaN(val) || val <= 0) return;
    setMainAmounts(prev => ({ ...prev, [currentMonthStr]: val }));
    setMainAmtForm("");
    setModal(null);
    showNotif(`Main Amount set for ${currentMonthStr}!`);
  };

  const deleteTx = id => {
    setTxs(prev => prev.filter(t => t.id !== id));
    showNotif("Expense deleted.", "info");
  };

  const exportCSV = () => {
    const rows = [["Date","Category","Description","Amount"], ...txs.map(t => [t.date, t.category, t.desc, t.amount])];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const a    = document.createElement("a");
    a.href     = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "fintrack_expenses.csv";
    a.click();
    showNotif("Exported as fintrack_expenses.csv");
  };

  // ── Shared Style Objects ─────────────────────────────────────────────────
  const S = {
    card:  { background:T.card,  border:`1px solid ${T.border}`, borderRadius:16, padding:"1.5rem" },
    btn:   { display:"inline-flex", alignItems:"center", gap:8, padding:"0.6rem 1.2rem", borderRadius:10, border:"none", cursor:"pointer", fontWeight:500, fontSize:14, transition:"all 0.15s" },
    input: { width:"100%", background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:"0.65rem 1rem", color:T.text, fontSize:14, outline:"none", boxSizing:"border-box" },
    label: { fontSize:12, color:T.textMuted, fontWeight:500, display:"block", marginBottom:4 },
  };

  const StatCard = ({ label, value, sub, color, icon:Icon }) => (
    <div style={{ ...S.card, flex:1, minWidth:160 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <span style={{ fontSize:12, color:T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</span>
        <div style={{ width:36, height:36, borderRadius:10, background:color+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.5px", marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted }}>{sub}</div>}
    </div>
  );

  const TxRow = ({ tx, compact }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0.75rem 0", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:38, height:38, borderRadius:10, background:(CAT_COLORS[tx.category]||"#6b7280")+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>
        {CAT_EMOJI[tx.category] || "💳"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.desc}</div>
        <div style={{ fontSize:12, color:T.textMuted }}>{tx.category} · {tx.date}{tx.recurring && " · ↻"}</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:600, color:T.red }}>
          −{fmt(tx.amount, sym)}
        </div>
      </div>
      {!compact && (
        <div style={{ display:"flex", gap:4, marginLeft:4 }}>
          <button onClick={() => openEdit(tx)} style={{ ...S.btn, padding:"0.35rem", background:"transparent", color:T.textMuted }}>
            <Edit2 size={14} />
          </button>
          <button onClick={() => deleteTx(tx.id)} style={{ ...S.btn, padding:"0.35rem", background:"transparent", color:T.red }}>
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );

  const ProgressBar = ({ pct }) => {
    const isOver = pct >= 100;
    const isWarning = pct >= 80;
    const color = isOver ? T.red : isWarning ? T.amber : T.green;
    return (
      <div style={{ height:8, background:T.border, borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:color, borderRadius:4, transition:"width 0.4s" }} />
      </div>
    );
  };

  const ChartTip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"0.6rem 1rem", fontSize:13 }}>
        <div style={{ fontWeight:600, marginBottom:4, color:T.text }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color:p.color }}>{p.name}: {fmt(p.value, sym)}</div>
        ))}
      </div>
    ) : null;

  // ── VIEW: DASHBOARD ─────────────────────────────────────────────────────
  const ViewDashboard = () => {
    // If no main amount set, show prompt HERO
    if (monthMain === null) {
      return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
          <div style={{ ...S.card, width:460, textAlign:"center", padding:"3rem 2rem", background:T.accentBg, border:`1px solid ${T.accent}30` }}>
            <div style={{ width:60, height:60, borderRadius:20, background:T.accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
              <Wallet size={28} />
            </div>
            <h2 style={{ margin:"0 0 10px", fontSize:22, fontWeight:700 }}>Welcome to {currentMonthStr}</h2>
            <p style={{ color:T.textMuted, fontSize:15, marginBottom:"20px", lineHeight:1.5 }}>
              On Day 1 of the month, you set your Main Amount. All your upcoming expenses will be deducted from this balance.
            </p>
            <button onClick={() => setModal("mainAmount")} style={{ ...S.btn, background:T.accent, color:"#fff", fontSize:16, padding:"0.75rem 1.75rem" }}>
              Set Main Amount
            </button>
          </div>
        </div>
      );
    }

    const pctLeft = ((monthExp / monthMain) * 100);
    const isOverspent = remaining < 0;

    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2rem", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:700, letterSpacing:"-0.5px" }}>Overview · {currentMonthStr}</h1>
            <p style={{ margin:"4px 0 0", color:T.textMuted, fontSize:14 }}>Welcome back, {user?.name || 'Alex'} 👋</p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {isOverspent && (
              <div style={{ display:"flex", alignItems:"center", gap:6, background:T.redBg, color:T.red, borderRadius:9, padding:"0.5rem 0.9rem", fontSize:13, border:`1px solid ${T.red}30` }}>
                <AlertTriangle size={14} /> You've overspent your Main Amount!
              </div>
            )}
            <button onClick={openAdd} style={{ ...S.btn, background:T.accent, color:"#fff" }}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        <div style={{ display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" }}>
          <StatCard label="Main Amount"      value={fmt(monthMain,sym)}   sub="Starting Monthly Limit"                 color={T.accent}  icon={Wallet}         />
          <StatCard label="Spent So Far"     value={fmt(monthExp,sym)}    sub={`of ${fmt(monthMain,sym)}`}            color={T.purple}  icon={TrendingUp}     />
          <StatCard label="Remaining"        value={fmt(remaining,sym)}   sub={`Savings rate: ${savingsRate}%`}        color={isOverspent ? T.red : T.green} icon={CheckCircle} />
          <StatCard label="Active Expenses"  value={currentTxs.length}    sub="Total entries this month"               color={T.textMuted} icon={Receipt}     />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)", gap:14, marginBottom:20 }}>
          <div style={S.card}>
            <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Main Amount Burn Down ({currentMonthStr})</h3>
            <div style={{ marginBottom:20 }}>
               <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                  <span style={{ color:T.textMuted }}>{fmt(monthExp,sym)} spent</span>
                  <span style={{ fontWeight:700, color:isOverspent ? T.red : T.green }}>{fmt(remaining,sym)} left</span>
               </div>
               <ProgressBar pct={pctLeft} />
            </div>
            
            <h3 style={{ margin:"1.5rem 0 1rem", fontSize:15, fontWeight:600 }}>Limit vs Spent History</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:12, fill:T.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:T.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${(v/1000).toFixed(1)}k`} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="limit" name="Main Amount" fill={T.accent} radius={[4,4,0,0]} />
                <Bar dataKey="spent" name="Spent" fill={T.red} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>Recent Expenses</h3>
              <button onClick={() => setView("transactions")} style={{ ...S.btn, padding:"0.3rem 0.8rem", background:T.accentBg, color:T.accent, fontSize:12 }}>
                View all
              </button>
            </div>
            {currentTxs.length > 0 ? (
               [...currentTxs].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5).map(tx => <TxRow key={tx.id} tx={tx} compact />)
            ) : (
               <div style={{ padding:"2rem", textAlign:"center", color:T.textMuted }}>No expenses recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── VIEW: TRANSACTIONS ───────────────────────────────────────────────────
  const ViewTransactions = () => {
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", flexWrap:"wrap", gap:12 }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>Expense History</h1>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={exportCSV} style={{ ...S.btn, background:T.card, border:`1px solid ${T.border}`, color:T.text }}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={openAdd} style={{ ...S.btn, background:T.accent, color:"#fff" }}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        <div style={{ ...S.card, marginBottom:14, display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:200, position:"relative" }}>
            <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…" style={{ ...S.input, paddingLeft:36 }} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...S.input, width:"auto", cursor:"pointer" }}>
            <option value="All">All Categories</option>
            {CATS_EXPENSE.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={S.card}>
          {filteredTxs.length === 0
            ? <div style={{ textAlign:"center", padding:"3rem", color:T.textMuted }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:600, marginBottom:4 }}>No expenses yet</div>
                <div style={{ fontSize:13 }}>Click "Add Expense" to log your first expense.</div>
              </div>
            : filteredTxs.map(tx => <TxRow key={tx.id} tx={tx} />)
          }
        </div>

        {/* Clear All History — bottom of list */}
        {txs.length > 0 && (
          <div style={{ marginTop:16, textAlign:"center" }}>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete ALL expense history? This cannot be undone.")) {
                  setTxs([]);
                  localStorage.removeItem("ft_txs");
                  showNotif("All expense history cleared.", "info");
                }
              }}
              style={{ ...S.btn, background:T.redBg, color:T.red, border:`1px solid ${T.red}30`, fontSize:13 }}
            >
              <Trash2 size={14} /> Clear All History
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── VIEW: ANALYTICS ──────────────────────────────────────────────────────
  const ViewAnalytics = () => (
    <div>
      <h1 style={{ margin:"0 0 1.5rem", fontSize:24, fontWeight:700 }}>Analytics</h1>
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)", gap:14, marginBottom:14 }}>
        <div style={S.card}>
          <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Where your money goes</h3>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={85} innerRadius={50} dataKey="value" strokeWidth={0}>
                  {catData.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name]||"#6b7280"} />)}
                </Pie>
                <Tooltip formatter={v => [fmt(v,sym),"Amount"]} contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, overflow:"hidden" }}>
              {catData.slice(0,7).map(e => (
                <div key={e.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:T.textMuted, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:9, height:9, borderRadius:2, background:CAT_COLORS[e.name]||"#6b7280", display:"inline-block", flexShrink:0 }} />
                    {e.name}
                  </span>
                  <span style={{ fontSize:12, fontWeight:500 }}>{fmt(e.value,sym)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Top Expenses</h3>
          <ResponsiveContainer width="100%" height={Math.max(catData.length * 42, 200)}>
            <BarChart data={catData} layout="vertical" margin={{ left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:11, fill:T.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:12, fill:T.textMuted }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={v => [fmt(v,sym),"Spent"]} contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} />
              <Bar dataKey="value" name="Spent" radius={[0,5,5,0]}>
                {catData.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name]||T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ── VIEW: SETTINGS ───────────────────────────────────────────────────────
  const ViewSettings = () => (
    <div>
      <h1 style={{ margin:"0 0 1.5rem", fontSize:24, fontWeight:700 }}>Settings</h1>
      <div style={{ display:"grid", gap:14, maxWidth:640 }}>

        {/* Account */}
        <div style={S.card}>
          <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Account</h3>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.75rem 1rem", background:T.cardAlt, borderRadius:12, marginBottom:14 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:15 }}>{user?.name || "User"}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>{user?.email || ""}{user?.username ? ` · @${user.username}` : ""}</div>
            </div>
            <div style={{ width:40, height:40, borderRadius:"50%", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:16 }}>
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
          </div>
          {onLogout && (
            <button onClick={onLogout} style={{ ...S.btn, background:T.redBg, color:T.red, border:`1px solid ${T.red}30`, width:"100%", justifyContent:"center" }}>
              Logout from FinTrack Pro
            </button>
          )}
        </div>

        {/* Appearance */}
        <div style={S.card}>
          <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Appearance</h3>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:500, fontSize:14 }}>Theme</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>Toggle between dark and light mode</div>
            </div>
            <button onClick={() => setDark(d => !d)} style={{ ...S.btn, background:T.cardAlt, border:`1px solid ${T.border}`, color:T.text }}>
              {dark ? <Sun size={15}/> : <Moon size={15}/>}
              {dark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:500, fontSize:14 }}>Currency</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>Display currency symbol</div>
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...S.input, width:110, cursor:"pointer" }}>
              {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Data */}
        <div style={S.card}>
          <h3 style={{ margin:"0 0 1rem", fontSize:15, fontWeight:600 }}>Data Management</h3>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button onClick={exportCSV} style={{ ...S.btn, background:T.greenBg, color:T.green, border:`1px solid ${T.green}30` }}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => {
              setTxs([]);
              setMainAmounts({});
              localStorage.removeItem("ft_txs");
              localStorage.removeItem("ft_mainAmounts");
              localStorage.removeItem("ft_currentMonth");
              showNotif("All data cleared.", "info");
            }}
              style={{ ...S.btn, background:T.redBg, color:T.red, border:`1px solid ${T.red}30` }}>
              <Trash2 size={15} /> Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── MODAL: Add / Edit Transaction ────────────────────────────────────────
  // Defined as JSX variable (NOT a component) so it never remounts on keystroke
  const modalAddEditJSX = (modal === "add" || modal === "edit") && (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
      <div style={{ ...S.card, width:440, maxWidth:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{modal==="edit" ? "Edit" : "Log"} Expense</h2>
          <button onClick={() => setModal(null)} style={{ ...S.btn, padding:"0.35rem", background:"transparent", color:T.textMuted }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display:"grid", gap:14 }}>
          <div>
            <label style={S.label}>Amount ({sym})</label>
            <input
              type="number" min="0" step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              style={{ ...S.input, fontSize:20, fontWeight:700 }}
              autoFocus
            />
          </div>
          <div>
            <label style={S.label}>Description</label>
            <input
              value={form.desc}
              onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
              placeholder="What did you spend on?"
              style={S.input}
            />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={S.label}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...S.input, cursor:"pointer" }}>
                {CATS_EXPENSE.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...S.input, cursor:"pointer" }} />
            </div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, cursor:"pointer" }}>
            <input type="checkbox" checked={form.recurring} onChange={e => setForm(p => ({ ...p, recurring: e.target.checked }))} />
            Recurring expense
          </label>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:"1.5rem" }}>
          <button onClick={() => setModal(null)} style={{ ...S.btn, flex:1, justifyContent:"center", background:T.cardAlt, border:`1px solid ${T.border}`, color:T.text }}>
            Cancel
          </button>
          <button onClick={saveTx} style={{ ...S.btn, flex:1, justifyContent:"center", background:T.accent, color:"#fff" }}>
            {modal==="edit" ? "Update" : "Add"} Expense
          </button>
        </div>
      </div>
    </div>
  );
  
  // ── MODAL: Main Amount (current month) ─────────────────────────────────
  const ModalMainAmount = () => (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
      <div style={{ ...S.card, width:400, maxWidth:"100%" }}>
         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Set Main Amount</h2>
            <button onClick={() => setModal(null)} style={{ ...S.btn, padding:"0.35rem", background:"transparent", color:T.textMuted }}><X size={20} /></button>
         </div>
         <p style={{ fontSize:13, color:T.textMuted, marginBottom:16 }}>Enter your total starting amount for {currentMonthStr}.</p>
         <div>
            <label style={S.label}>Main Amount ({sym})</label>
            <input type="number" min="0" step="1" value={mainAmtForm}
               onChange={e => setMainAmtForm(e.target.value)}
               placeholder="e.g. 5000" style={{ ...S.input, fontSize:20, fontWeight:700 }} />
         </div>
         <div style={{ display:"flex", gap:10, marginTop:"1.5rem" }}>
            <button onClick={saveMainAmount} style={{ ...S.btn, flex:1, justifyContent:"center", background:T.accent, color:"#fff" }}>Confirm Amount</button>
         </div>
      </div>
    </div>
  );

  // ── MODAL: New Month Picker ─────────────────────────────────────────────
  const ModalNewMonth = () => (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
      <div style={{ ...S.card, width:480, maxWidth:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Start a New Month</h2>
          <button onClick={() => setModal(null)} style={{ ...S.btn, padding:"0.35rem", background:"transparent", color:T.textMuted }}><X size={20} /></button>
        </div>

        {/* Year Selector */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:18 }}>
          <button onClick={() => setNewMonthYear(y => y - 1)} style={{ ...S.btn, padding:"0.35rem 0.8rem", background:T.cardAlt, border:`1px solid ${T.border}`, color:T.text }}>‹</button>
          <span style={{ fontWeight:700, fontSize:18 }}>{newMonthYear}</span>
          <button onClick={() => setNewMonthYear(y => y + 1)} style={{ ...S.btn, padding:"0.35rem 0.8rem", background:T.cardAlt, border:`1px solid ${T.border}`, color:T.text }}>›</button>
        </div>

        {/* 12-month grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
          {MONTHS.map((m, i) => {
            const key = `${newMonthYear}-${String(i+1).padStart(2,"0")}`;
            const hasData = !!mainAmounts[key];
            const isSelected = newMonthIdx === i;
            return (
              <button key={m} onClick={() => setNewMonthIdx(i)} style={{
                padding:"10px 0", borderRadius:10, border:`${isSelected ? 2 : 1}px solid ${isSelected ? T.accent : T.border}`,
                background: isSelected ? T.accentBg : T.cardAlt,
                color: isSelected ? T.accent : hasData ? T.text : T.textMuted,
                fontWeight: isSelected ? 700 : hasData ? 600 : 400,
                cursor:"pointer", fontSize:13, position:"relative",
              }}>
                {m.slice(0,3)}
                {hasData && <span style={{ position:"absolute", top:4, right:4, width:6, height:6, borderRadius:"50%", background:T.green }} />}
              </button>
            );
          })}
        </div>

        {newMonthIdx !== null && (
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>
              Main Amount for {MONTHS[newMonthIdx]} {newMonthYear} ({sym})
            </label>
            <input type="number" min="0" step="1" value={newMonthAmt}
              onChange={e => setNewMonthAmt(e.target.value)}
              placeholder="e.g. 50000" autoFocus
              style={{ ...S.input, fontSize:20, fontWeight:700 }} />
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setModal(null)} style={{ ...S.btn, flex:1, justifyContent:"center", background:T.cardAlt, border:`1px solid ${T.border}`, color:T.text }}>Cancel</button>
          <button onClick={saveNewMonth} disabled={newMonthIdx === null} style={{ ...S.btn, flex:1, justifyContent:"center", background:T.accent, color:"#fff", opacity: newMonthIdx === null ? 0.5 : 1 }}>
            Start Month
          </button>
        </div>
      </div>
    </div>
  );

  // ── ROOT RENDER ──────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',system-ui,sans-serif", position:"relative" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:220, background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Brand */}
        <div style={{ padding:"1.5rem 1.25rem 1rem", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Wallet size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, letterSpacing:"-0.3px" }}>FinTrack</div>
              <div style={{ fontSize:10, color:T.textMuted, fontWeight:600, letterSpacing:2, textTransform:"uppercase" }}>Pro</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"0.75rem 0.6rem" }}>
          {NAV_ITEMS.map(({ id, icon:Icon, label }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"0.65rem 0.9rem", borderRadius:10, border:"none", cursor:"pointer",
                marginBottom:2, textAlign:"left", fontSize:14, transition:"all 0.15s",
                background: active ? T.accentBg : "transparent",
                color:      active ? T.accent   : T.textMuted,
                fontWeight: active ? 600         : 400,
              }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: New Month + Theme toggle */}
        <div style={{ padding:"1rem 0.75rem", borderTop:`1px solid ${T.border}` }}>
          <button onClick={openNewMonth} style={{ ...S.btn, width:"100%", justifyContent:"center", background:T.accentBg, border:`1px solid ${T.accent}30`, color:T.accent, fontSize:13, marginBottom:8 }}>
            <Plus size={14}/> New Month
          </button>
          <button onClick={() => setDark(d => !d)} style={{ ...S.btn, width:"100%", justifyContent:"center", background:T.cardAlt, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:13 }}>
            {dark ? <Sun size={14}/> : <Moon size={14}/>}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, overflow:"auto", padding:"2rem", minWidth:0 }}>
        {view === "dashboard"    && <ViewDashboard    />}
        {view === "transactions" && <ViewTransactions />}
        {view === "analytics"    && <ViewAnalytics    />}
        {view === "settings"     && <ViewSettings     />}
      </main>

      {/* ── MODAL OVERLAY ── */}
      {modalAddEditJSX}
      {modal === "mainAmount" && <ModalMainAmount />}
      {modal === "newMonth" && <ModalNewMonth />}

      {/* ── TOAST NOTIFICATION ── */}
      {notif && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:300,
          background: notif.type==="success" ? T.green : notif.type==="info" ? T.accent : T.red,
          color:"#fff", borderRadius:11, padding:"0.75rem 1.25rem",
          fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:8,
          boxShadow:"0 8px 30px rgba(0,0,0,0.35)",
        }}>
          <CheckCircle size={16} /> {notif.msg}
        </div>
      )}
    </div>
  );
}

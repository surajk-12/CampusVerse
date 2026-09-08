import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useThemeContext } from "../context/CustomThemeContext.jsx";

/* ─────────────── Seed / Mock Data ─────────────── */
const SAMPLE_COLLEGES = [
  { _id: "mock-nehru", collegeName: "Nehru College",   city: "New Delhi", state: "Delhi",       students: 4200  },
  { _id: "mock-qwe",   collegeName: "QWE College",     city: "Mumbai",    state: "Maharashtra", students: 2800  },
  { _id: "mock-du",    collegeName: "Delhi University", city: "Delhi",     state: "Delhi",       students: 12500 },
  { _id: "mock-iitb",  collegeName: "IIT Bombay",      city: "Mumbai",    state: "Maharashtra", students: 8900  },
  { _id: "mock-mit",   collegeName: "MIT Engineering",  city: "Pune",      state: "Maharashtra", students: 3100  },
];

/* ─────────────── Dynamic Theme Tokens Generator ─────────────── */
const getT = (isDark) => ({
  bg:         isDark ? "#0B0F19" : "#F8FAFC",   // Deep Space background vs Light slate background
  surface:    isDark ? "#0F172A" : "#FFFFFF",   // Slate surface / paper vs Crisp white paper
  surfaceAlt: isDark ? "#111827" : "#F1F5F9",   // Slightly lighter surface vs soft grey
  card:       isDark ? "rgba(30,41,59,0.45)" : "#FFFFFF",
  cardHover:  isDark ? "rgba(30,41,59,0.7)" : "#FFFFFF",
  inputBg:    isDark ? "rgba(11,15,25,0.7)" : "#F1F5F9",
  previewBg:  isDark ? "rgba(11,15,25,0.5)" : "#F8FAFC",
  chipBg:     isDark ? "rgba(30,41,59,0.6)" : "#E2E8F0",
  border:     isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
  borderHov:  isDark ? "rgba(129,140,248,0.35)" : "rgba(79,70,229,0.35)",
  primary:    isDark ? "#818CF8" : "#4F46E5",
  primaryDk:  isDark ? "#4F46E5" : "#3730A3",
  primaryMd:  isDark ? "#6366F1" : "#4F46E5",
  pink:       "#EC4899",
  emerald:    "#10B981",
  amber:      "#F59E0B",
  purple:     "#A78BFA",
  textPrimary:isDark ? "#F8FAFC" : "#0F172A",
  textSec:    isDark ? "#94A3B8" : "#475569",
  textMuted:  isDark ? "#64748B" : "#64748B",
  headlineColor: isDark ? "#FFFFFF" : "#0F172A",
  heroGrad:   isDark
    ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, #0B0F19 70%)"
    : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, #F8FAFC 70%)",
  finderBoxShadow: isDark
    ? "0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
});

/* ─────────────── Helper ─────────────── */
const esc = (s) => s.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDark } = useThemeContext();
  const T = getT(isDark);

  const [colleges,    setColleges]    = useState(SAMPLE_COLLEGES);
  const [searchVal,   setSearchVal]   = useState("");
  const [selected,    setSelected]    = useState(null);
  const [activeTab,   setActiveTab]   = useState("qa");
  const [openFaq,     setOpenFaq]     = useState(null);

  /* fetch real colleges */
  useEffect(() => {
    api.get("/colleges").then(({ data }) => {
      const real = Array.isArray(data) ? data : (Array.isArray(data.colleges) ? data.colleges : []);
      const merged = [
        ...real,
        ...SAMPLE_COLLEGES.filter(m => !real.some(r =>
          (r.collegeName || r.name || "").toLowerCase() === m.collegeName.toLowerCase()
        )),
      ];
      setColleges(merged);
    }).catch(() => {});
  }, []);

  /* search */
  const handleSearch = (val) => {
    setSearchVal(val);
    if (!val.trim()) { setSelected(null); return; }
    setSelected(colleges.find(c =>
      (c.collegeName || c.name || "").toLowerCase().includes(val.toLowerCase()) ||
      (c.city || c.location || "").toLowerCase().includes(val.toLowerCase())
    ) || null);
  };

  const pick = (name) => {
    setSearchVal(name);
    setSelected(colleges.find(c => (c.collegeName || c.name) === name) || null);
  };

  const handleJoin = () => {
    if (!selected) return;
    navigate("/register/student", { state: { college: selected._id, collegeName: selected.collegeName || selected.name, collegeLocation: selected.city || selected.location } });
  };

  const handleExplore = () => {
    if (!selected) return;
    navigate(`/colleges/${selected._id}/students`, { state: { collegeId: selected._id, collegeName: selected.collegeName || selected.name } });
  };

  const noMatch = searchVal.trim() !== "" && !selected;

  /* preview panel */
  const Preview = () => {
    if (!searchVal.trim()) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"10px 0" }}>
        <span style={{ fontSize:22, opacity:0.25 }}>📍</span>
        <span style={{ fontSize:11, color:T.textMuted, textAlign:"center", maxWidth:230, lineHeight:1.55 }}>
          Search your college above to explore peer directories and join.
        </span>
      </div>
    );
    if (noMatch) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, textAlign:"center" }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.textPrimary }}>No workspace found for "{esc(searchVal)}"</span>
        <button onClick={() => navigate("/register")} style={{ background:"none", border:"none", color:T.primary, fontSize:11, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
          Register your college →
        </button>
      </div>
    );
    const col = selected;
    const name = col.collegeName || col.name;
    const city = col.city || col.location || "";
    const count = typeof col.students === "number"
      ? col.students.toLocaleString() + "+"
      : (col.students?.length != null ? col.students.length.toLocaleString() + "+" : "—");
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <span style={{ fontWeight:800, fontSize:13, color:T.textPrimary }}>{name}</span>
          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"rgba(16,185,129,0.12)", color:T.emerald, border:"1px solid rgba(16,185,129,0.2)" }}>
            ✓ Verified
          </span>
        </div>
        <span style={{ fontSize:11, color:T.textSec }}>{city} · {count} active students</span>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={handleJoin} style={{ flex:1, padding:"8px 14px", borderRadius:10, background:`linear-gradient(135deg,${T.primaryDk},${T.primaryMd})`, color:"#fff", fontSize:12, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 12px rgba(79,70,229,0.3)` }}>
            Join Sub-Verse →
          </button>
          <button onClick={handleExplore} style={{ flex:1, padding:"8px 14px", borderRadius:10, background:T.card, color:T.textPrimary, fontSize:12, fontWeight:600, border:`1px solid ${T.border}`, cursor:"pointer", fontFamily:"inherit" }}>
            Explore Peer Directory →
          </button>
        </div>
      </div>
    );
  };

  /* ────────────────────────────────────────────────── */
  return (
    <div style={{ backgroundColor:T.bg, color:T.textPrimary, fontFamily:"Inter, Poppins, Outfit, sans-serif", overflowX:"hidden", minHeight:"100vh", transition: "background-color 0.3s ease, color 0.3s ease" }}>

      {/* ════════════ HERO ════════════ */}
      <section id="college-search-hero" style={{
        width:"100%",
        padding:"72px 0 80px",
        textAlign:"center",
        borderBottom:`1px solid ${T.border}`,
        background: T.heroGrad,
        position:"relative",
      }}>
        <div style={{ width:"100%", maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:22 }}>

          {/* version badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px", borderRadius:999, background:"rgba(129,140,248,0.08)", border:"1px solid rgba(129,140,248,0.2)", color:T.primary, fontSize:11, fontWeight:500 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:T.primary, display:"inline-block" }} />
            <span style={{ fontWeight:900, color:T.primary, fontSize:10, letterSpacing:"0.08em" }}>v2.0</span>
            <span style={{ color:T.textMuted }}>·</span>
            <span style={{ color:T.textSec }}>The premium network for connected college campuses</span>
          </div>

          {/* headline */}
          <h1 style={{ fontSize:"clamp(2.4rem,6.5vw,4.5rem)", fontWeight:900, letterSpacing:"-0.04em", lineHeight:1.06, margin:0, color: T.headlineColor }}>
            Step into the<br />
            <span style={{ background: isDark ? "linear-gradient(135deg,#ffffff 0%,#c7d2fe 45%,#818CF8 100%)" : "linear-gradient(135deg,#0F172A 0%,#4338CA 45%,#4F46E5 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              CampusVerse
            </span>
          </h1>

          {/* subtitle */}
          <p style={{ maxWidth:580, fontSize:14, color:T.textSec, lineHeight:1.75, margin:0 }}>
            Share lecture materials, resolve homework doubts, trade textbooks, post announcements, and message peers securely inside your verified university workspace.
          </p>

          {/* feature badges */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
            {[
              { icon:"✓", label:"Verified Student IDs Only", c:T.emerald  },
              { icon:"🛡", label:"Role-Based Access",         c:T.primary  },
              { icon:"📁", label:"NotesVerse File Vault",     c:T.purple   },
              { icon:"🛒", label:"Local Peer Marketplace",    c:T.amber    },
            ].map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}`, color:T.textPrimary, fontSize:12, fontWeight:500, backdropFilter:"blur(6px)" }}>
                <span style={{ color:b.c }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

          {/* ── CAMPUS FINDER CARD ── */}
          <div id="portal" style={{ width:"100%", maxWidth:540, marginTop:10 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:`1px solid ${T.borderHov}`, borderRadius:24, padding:"24px 28px", textAlign:"left", boxShadow: T.finderBoxShadow }}>

              {/* header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, borderBottom:`1px solid ${T.border}`, marginBottom:18 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,rgba(79,70,229,0.18),rgba(129,140,248,0.18))`, border:`1px solid rgba(129,140,248,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0, boxShadow:"0 4px 16px rgba(79,70,229,0.15)" }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:900, color:T.textPrimary, letterSpacing:"-0.01em" }}>Campus Portal Finder</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>Join your university sub-verse workspace</div>
                </div>
              </div>

              {/* search input */}
              <div style={{ position:"relative", marginBottom:14 }}>
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:13 }}>🔍</span>
                <input
                  value={searchVal}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search university name..."
                  style={{ width:"100%", boxSizing:"border-box", background: T.inputBg, border:`1px solid ${T.border}`, borderRadius:14, padding:"11px 38px 11px 36px", fontSize:12, color:T.textPrimary, outline:"none", fontFamily:"inherit", transition:"all 0.2s" }}
                  onFocus={e => { e.target.style.borderColor=T.primary; e.target.style.boxShadow=`0 0 0 3px rgba(129,140,248,0.15)`; }}
                  onBlur={e => { e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
                />
                {searchVal && (
                  <button onClick={() => { setSearchVal(""); setSelected(null); }}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:13, lineHeight:1 }}>
                    ✕
                  </button>
                )}
              </div>

              {/* preview box */}
              <div style={{ background: T.previewBg, border:`1px solid ${selected ? "rgba(129,140,248,0.18)" : T.border}`, borderRadius:16, padding:"14px 18px", minHeight:108, display:"flex", flexDirection:"column", alignItems: selected ? "stretch" : "center", justifyContent:"center", marginBottom:16, transition:"border-color 0.2s" }}>
                <Preview />
              </div>

              {/* suggested chips */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <span style={{ fontSize:10, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.12em" }}>Suggested Universities:</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {SAMPLE_COLLEGES.slice(0,4).map(col => (
                    <button key={col._id} onClick={() => pick(col.collegeName)}
                      style={{ padding:"5px 12px", borderRadius:10, background: selected?.collegeName === col.collegeName ? "rgba(99,102,241,0.18)" : T.chipBg, border: selected?.collegeName === col.collegeName ? `1px solid rgba(129,140,248,0.45)` : `1px solid ${T.border}`, color: selected?.collegeName === col.collegeName ? T.primary : T.textSec, fontSize:11, cursor:"pointer", transition:"all 0.18s", fontFamily:"inherit", fontWeight:600 }}>
                      {col.collegeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* register link */}
              <div style={{ paddingTop:14, marginTop:14, borderTop:`1px solid ${T.border}`, textAlign:"center" }}>
                <button onClick={() => navigate("/register")}
                  style={{ fontSize:11, color:T.primary, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600, opacity:0.85 }}>
                  Can't find your college? Register a new record ↗
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ════════════ STATS ════════════ */}
      <section id="why-choose-us" style={{ width:"100%", padding:"40px 24px", borderBottom:`1px solid ${T.border}`, background:T.surfaceAlt }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:24, textAlign:"center" }}>
          {[
            { val:"15,000+",  label:"Active Students",     c:"#fff"      },
            { val:"120+",     label:"Campuses Registered", c:"#fff"      },
            { val:"45,000+",  label:"Shared NotesVerse",   c:"#fff"      },
            { val:"99.8%",    label:"Approval Security",   c:T.emerald   },
          ].map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:900, color:s.c, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ WORKFLOW ════════════ */}
      <section id="how-it-works" style={{ width:"100%", padding:"72px 24px", borderBottom:`1px solid ${T.border}`, background:`radial-gradient(ellipse 70% 60% at 50% 50%, rgba(168,85,247,0.08) 0%, ${T.bg} 70%)` }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontSize:10, fontWeight:800, color:T.primary, textTransform:"uppercase", letterSpacing:"0.18em", padding:"4px 14px", borderRadius:999, background:"rgba(129,140,248,0.08)", border:`1px solid rgba(129,140,248,0.2)`, display:"inline-block", marginBottom:12 }}>WORKFLOW</span>
            <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.8rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 12px" }}>Unified College Collaboration</h2>
            <p style={{ fontSize:13, color:T.textSec, maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>CampusVerse replaces cluttered social media groups with clean, secure, academic-scoped modules.</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
            {[
              { num:"01", icon:"🏛", title:"Select Your Campus",       hc:`rgba(99,102,241,0.4)`,  desc:"Select from our database of accredited universities. If your college isn't registered, submit an entry." },
              { num:"02", icon:"🪪", title:"Verify Student Status",     hc:`rgba(168,85,247,0.4)`,  desc:"Upload your university ID card. College Admins review submissions to guarantee community safety." },
              { num:"03", icon:"💬", title:"Ask & Verify Academic Q&A", hc:`rgba(16,185,129,0.4)`,  desc:"Post queries regarding fees, mid-terms, or placements. Get answers verified by faculty and seniors." },
              { num:"04", icon:"🗄", title:"Vault Notes & Marketplace", hc:`rgba(245,158,11,0.4)`,  desc:"Access previous year papers, lecture notes, and trade used textbooks with peers inside your campus." },
            ].map((step,i) => (
              <StepCard key={i} {...step} T={T} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES TABS ════════════ */}
      <section id="features" style={{ width:"100%", padding:"72px 24px", borderBottom:`1px solid ${T.border}`, background:T.surfaceAlt }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>

          <div style={{ textAlign:"center", marginBottom:40 }}>
            <span style={{ fontSize:10, fontWeight:800, color:T.purple, textTransform:"uppercase", letterSpacing:"0.18em", padding:"4px 14px", borderRadius:999, background:"rgba(168,85,247,0.08)", border:`1px solid rgba(168,85,247,0.2)`, display:"inline-block", marginBottom:12 }}>MODULES</span>
            <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.8rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", margin:0 }}>Built for Modern Student Life</h2>
          </div>

          {/* tab switcher */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <div style={{ display:"inline-flex", background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:4, gap:2 }}>
              {[
                { id:"qa",     icon:"💬", label:"Q&A Feed"    },
                { id:"notes",  icon:"📚", label:"Notes Vault" },
                { id:"market", icon:"🛍", label:"Marketplace" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding:"9px 22px", borderRadius:12, fontSize:12, fontWeight: activeTab===tab.id ? 700 : 500, background: activeTab===tab.id ? `linear-gradient(135deg,${T.primaryDk},${T.primaryMd})` : "transparent", color: activeTab===tab.id ? "#fff" : T.textMuted, border:"none", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", boxShadow: activeTab===tab.id ? `0 4px 12px rgba(79,70,229,0.3)` : "none" }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* tab panels */}
          {activeTab === "qa" && (
            <TabCard
              badge={{ text:"✓ Solved Question", c:T.emerald, bg:"rgba(16,185,129,0.1)", bc:"rgba(16,185,129,0.25)" }}
              title="B.Tech CSE Semester 3 Fee Breakdown & Installments"
              meta="Nehru College"
              body="Tuition fee is ₹65,000 per semester with a refundable caution deposit of ₹10,000 paid during enrollment. Installments are split into 2 equal payments before mid-term exams."
              footer={
                <><span style={{ color:T.emerald, fontWeight:700, fontSize:12 }}>👍 24 Helpful</span><span style={{ color:T.textMuted }}>·</span><span style={{ color:T.textSec, fontSize:11 }}>3 verified answers</span></>
              }
              footerRight={<span style={{ color:T.primary, fontFamily:"monospace", fontSize:11 }}>#fees #cse</span>}
              T={T}
            />
          )}
          {activeTab === "notes" && (
            <TabCard
              badge={{ text:"📄 NotesVerse File Vault", c:T.purple, bg:"rgba(168,85,247,0.1)", bc:"rgba(168,85,247,0.25)" }}
              title="Data Structures & Algorithms Handwritten Lecture Notes"
              meta="PDF · 14.2 MB"
              body="Complete unit 1-5 handwritten notes including Graph algorithms, Tree traversals, and dynamic programming examples with solved past paper questions."
              footer={
                <><span style={{ color:T.amber, fontSize:11 }}>⭐ 4.9 (88 ratings)</span><span style={{ color:T.textMuted }}>·</span><span style={{ color:T.textSec, fontSize:11 }}>1,240 downloads</span></>
              }
              footerRight={<button onClick={() => showToast("Note download started","success")} style={{ fontSize:11, fontWeight:700, color:T.primary, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Download PDF</button>}
              T={T}
            />
          )}
          {activeTab === "market" && (
            <TabCard
              badge={{ text:"🏷 Peer Marketplace", c:T.amber, bg:"rgba(245,158,11,0.1)", bc:"rgba(245,158,11,0.25)" }}
              title="Engineering Mathematics 3rd Ed. (Cormen & Ross)"
              meta={<span style={{ fontSize:18, fontWeight:900, color:T.emerald, fontFamily:"monospace" }}>₹450</span>}
              body="Like new condition, zero highlighter marks. Includes supplementary formula chart book. Available for immediate pick-up at Campus Block B."
              footer={<span style={{ color:T.textPrimary, fontWeight:500, fontSize:12 }}>Seller: Priya S. (CSE 3rd Year)</span>}
              footerRight={<button onClick={() => showToast("Message sent to seller!","success")} style={{ padding:"6px 16px", borderRadius:10, background:`linear-gradient(135deg,${T.primaryDk},${T.primaryMd})`, color:"#fff", fontSize:12, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit" }}>Contact Seller</button>}
              T={T}
            />
          )}
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section id="faq" style={{ width:"100%", padding:"72px 24px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 8px" }}>Frequently Asked Questions</h2>
            <p style={{ fontSize:12, color:T.textMuted }}>Everything you need to know about joining CampusVerse</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { q:"How is student identity verified?",       a:"Students must sign up using their official university email or upload a photo of their valid student ID card. Campus admins review each submission before granting access." },
              { q:"Is CampusVerse free for students?",       a:"Yes! CampusVerse is 100% free for students and university clubs. Advanced moderation tools for administrators are available on request." },
              { q:"What if my university isn't listed yet?", a:"Click \"Register a new record\" in the Campus Portal Finder. Once 5 students from your campus sign up, your workspace is activated automatically!" },
              { q:"Can I connect with students from other campuses?", a:"Yes. While registered into your home campus sub-verse, you can browse directory registries and marketplace items globally." },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} open={openFaq===i} toggle={() => setOpenFaq(openFaq===i ? null : i)} T={T} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section style={{ width:"100%", padding:"80px 24px", background:`radial-gradient(ellipse 70% 80% at 50% 100%, rgba(99,102,241,0.12) 0%, ${T.bg} 65%)`, textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
          <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.6rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", margin:0 }}>Step into the CampusVerse Today</h2>
          <p style={{ fontSize:13, color:T.textSec, lineHeight:1.7, margin:0 }}>Join your classmates, access verified study files, and connect with peers on a secured campus platform.</p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginTop:4 }}>
            <button
              onClick={() => { const el=document.getElementById("portal"); el?.scrollIntoView({behavior:"smooth"}); }}
              style={{ padding:"13px 32px", borderRadius:14, background:`linear-gradient(135deg,${T.primaryDk},${T.primaryMd})`, color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 8px 24px rgba(79,70,229,0.35)`, transition:"all 0.2s" }}>
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{ padding:"13px 32px", borderRadius:14, background:"transparent", color:T.textPrimary, fontSize:14, fontWeight:700, border:`1px solid rgba(255,255,255,0.15)`, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ width:"100%", padding:"24px", borderTop:`1px solid ${T.border}`, background:T.surfaceAlt }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, color:T.textMuted }}>
            <div style={{ width:26, height:26, borderRadius:8, background:`linear-gradient(135deg,${T.primaryDk},${T.primaryMd})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12 }}>🎓</div>
            <span style={{ fontWeight:800, color:T.textPrimary, fontSize:13 }}>CampusVerse</span>
            <span>© 2026 CampusVerse Network Inc.</span>
          </div>
          <div style={{ display:"flex", gap:24, fontSize:12, color:T.textMuted }}>
            {["Privacy Policy","Terms of Service","Contact Support"].map(link => (
              <span key={link} style={{ cursor:"pointer", transition:"color 0.2s" }}
                onMouseEnter={e => e.target.style.color=T.textPrimary}
                onMouseLeave={e => e.target.style.color=T.textMuted}>{link}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        input::placeholder { color: #475569; }
        * { box-sizing: border-box; }
        button:hover { opacity: 0.92; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

function StepCard({ num, icon, title, desc, hc, T }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:T.card, border:`1px solid ${hov ? hc : T.border}`, borderRadius:20, padding:"26px 28px", position:"relative", overflow:"hidden", transition:"border-color 0.2s, transform 0.2s, box-shadow 0.2s", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? "0 12px 32px rgba(0,0,0,0.3)" : "none", backdropFilter:"blur(6px)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:`rgba(129,140,248,0.08)`, border:`1px solid rgba(129,140,248,0.18)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
          {icon}
        </div>
        <span style={{ fontSize:"clamp(2rem,5vw,3rem)", fontWeight:900, color: hov ? hc : T.border, transition:"color 0.2s", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{num}</span>
      </div>
      <h3 style={{ fontSize:15, fontWeight:800, color:T.textPrimary, margin:"0 0 10px", letterSpacing:"-0.01em" }}>{title}</h3>
      <p style={{ fontSize:12, color:T.textSec, margin:0, lineHeight:1.7 }}>{desc}</p>
    </div>
  );
}

function TabCard({ badge, title, meta, body, footer, footerRight, T }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:"24px 28px", backdropFilter:"blur(6px)" }}>
      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"flex-start", justifyContent:"space-between", gap:14, paddingBottom:18, borderBottom:`1px solid ${T.border}`, marginBottom:16 }}>
        <div>
          <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:7, background:badge.bg, color:badge.c, border:`1px solid ${badge.bc}`, display:"inline-block", marginBottom:8 }}>{badge.text}</span>
          <h3 style={{ fontSize:15, fontWeight:800, color:T.textPrimary, margin:0, letterSpacing:"-0.01em" }}>{title}</h3>
        </div>
        <span style={{ fontSize:11, color:T.textMuted, fontFamily:"monospace", flexShrink:0 }}>{meta}</span>
      </div>
      <p style={{ fontSize:13, color:T.textSec, lineHeight:1.75, marginBottom:18 }}>{body}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>{footer}</div>
        <div>{footerRight}</div>
      </div>
    </div>
  );
}

function FaqItem({ q, a, open, toggle, T }) {
  return (
    <div onClick={toggle}
      style={{ background:T.card, border:`1px solid ${open ? "rgba(129,140,248,0.2)" : T.border}`, borderRadius:14, padding:"16px 20px", cursor:"pointer", userSelect:"none", transition:"border-color 0.2s", backdropFilter:"blur(6px)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
        <span style={{ fontWeight:700, fontSize:13, color:T.textPrimary }}>{q}</span>
        <span style={{ color:T.textMuted, fontSize:11, transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s", flexShrink:0 }}>▼</span>
      </div>
      {open && (
        <p style={{ fontSize:12, color:T.textSec, marginTop:12, marginBottom:0, lineHeight:1.75 }}>{a}</p>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { loadIdeas, saveIdeas } from "../lib/supabase";

const C = {
  bg: "#0D0D0D", card: "#161616", card2: "#1E1E1E",
  gold: "#FFBA00", goldDim: "rgba(255,186,0,0.12)",
  text: "#F0F0F0", muted: "#888", border: "#252525",
  blue: "#3B82F6", purple: "#8B5CF6", orange: "#F97316",
  green: "#22C55E", red: "#EF4444",
};

const STAGES = [
  { id: "ideas",       label: "Ideas / Propuesta",    etapa: "I",  color: "#3B82F6", desc: "5.1 Ideas y Propuestas" },
  { id: "viabilidad",  label: "Evaluación",            etapa: "I",  color: "#8B5CF6", desc: "5.2 Evaluación y Viabilidad" },
  { id: "propuesta",   label: "Propuesta Completa",    etapa: "I",  color: "#F97316", desc: "5.3 Propuesta Completa" },
  { id: "aprobacion",  label: "Aprobación GG",         etapa: "I",  color: "#FFBA00", desc: "5.4 / 5.5 Aprobación" },
  { id: "lanzamiento", label: "Lanzamiento",           etapa: "II", color: "#FB923C", desc: "6.1 Lanzamiento" },
  { id: "seguimiento", label: "Seguimiento & Ajustes", etapa: "II", color: "#22C55E", desc: "Post-lanzamiento" },
];

const CATEGORIAS = ["Hamburguesas","Salsas & Condimentos","Sides","Bebidas","Postres","Ingredientes Premium","Otro"];
const TIPOS = ["Lanzamiento Grande","Lanzamiento Satélite"];
const OBJETIVOS = ["Volumen","Rentabilidad","Ambos"];

async function callClaude(userMsg, system, useSearch = false) {
  const body = {
    model: "claude-sonnet-4-20250514", max_tokens: 1200, system,
    messages: [{ role: "user", content: userMsg }],
  };
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || d.error);
  return d.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

const SYS_TRENDS = `Sos un experto en tendencias gastronómicas globales especializado en hamburguesas y fast food premium americano. Respondé en español de Argentina, conciso y práctico. Enfocate en los últimos 6-12 meses.`;
const SYS_PRODUCT = `Sos el head of product development de BIG PONS, hamburguesería premium americana con locales en Argentina y Miami. Desarrollás conceptos viables, alineados a la marca. Respondé en español de Argentina.`;
const SYS_RECIPE = `Sos el chef de desarrollo de BIG PONS. Hacés recetas precisas, escalables, listas para producción en fast food premium. Incluís gramajes, tiempos, temperatura, notas de calidad. Respondé en español de Argentina.`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0D0D0D}::-webkit-scrollbar-thumb{background:#252525;border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.fu{animation:fadeUp .3s ease forwards}
.spin{animation:spin .7s linear infinite}
.pulse{animation:pulse 1.4s ease infinite}
input,select,textarea{background:#1E1E1E;border:1px solid #252525;color:#F0F0F0;border-radius:8px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:#FFBA00}
select option{background:#161616}
textarea{resize:vertical;line-height:1.6}
.hcard{transition:border-color .2s,transform .2s,box-shadow .2s}
.hcard:hover{border-color:#FFBA00!important;transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,186,0,.07)}
.btn-gold{background:#FFBA00;color:#000;border:none;padding:10px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;white-space:nowrap;display:inline-flex;align-items:center;gap:8px}
.btn-gold:hover:not(:disabled){background:#ffd040;transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,186,0,.3)}
.btn-gold:disabled{background:#2a2a2a;color:#555;cursor:not-allowed}
.btn-ol{background:transparent;color:#FFBA00;border:1px solid #FFBA00;padding:9px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-ol:hover:not(:disabled){background:rgba(255,186,0,0.12)}
.btn-ol:disabled{opacity:.4;cursor:not-allowed}
.btn-gh{background:transparent;border:1px solid #252525;color:#888;padding:7px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-gh:hover{border-color:#888;color:#F0F0F0}
.btn-rd{background:transparent;border:1px solid rgba(239,68,68,.3);color:#EF4444;padding:7px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-rd:hover{background:rgba(239,68,68,.1)}
.tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.3px}
.tab{background:transparent;border:none;color:#888;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;padding:12px 20px;cursor:pointer;position:relative;transition:color .2s;white-space:nowrap}
.tab.on{color:#FFBA00}
.tab.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#FFBA00;border-radius:2px 2px 0 0}
.lbl{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#888;margin-bottom:6px}
.fg{display:grid;gap:16px}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:580px){.fr{grid-template-columns:1fr}}
`;

const Spinner = ({ size = 20, color = "#FFBA00" }) => (
  <div style={{ width:size, height:size, border:`2px solid #252525`, borderTopColor:color, borderRadius:"50%", flexShrink:0 }} className="spin" />
);
const Tag = ({ children, color = "#FFBA00" }) => (
  <span className="tag" style={{ background:color+"22", color }}>{children}</span>
);
const Lbl = ({ children }) => <div className="lbl">{children}</div>;
const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom:28 }}>
    <h1 style={{ fontFamily:"'Bebas Neue'", fontSize:34, color:"#FFBA00", letterSpacing:1, lineHeight:1 }}>{children}</h1>
    {sub && <p style={{ color:"#888", fontSize:14, marginTop:6 }}>{sub}</p>}
  </div>
);
const Empty = ({ icon, text }) => (
  <div style={{ textAlign:"center", padding:"50px 20px", border:`1px dashed #252525`, borderRadius:12, color:"#888" }}>
    <div style={{ fontSize:44, marginBottom:12 }}>{icon}</div>
    <p style={{ fontSize:14, maxWidth:340, margin:"0 auto", lineHeight:1.6 }}>{text}</p>
  </div>
);

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#161616", border:`1px solid #252525`, borderRadius:16, width:"100%", maxWidth:wide?720:560, maxHeight:"90vh", overflow:"auto" }} className="fu">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:`1px solid #252525`, position:"sticky", top:0, background:"#161616", zIndex:1 }}>
          <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:"#FFBA00", letterSpacing:1 }}>{title}</h2>
          <button className="btn-gh" onClick={onClose} style={{ padding:"5px 12px" }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function IdeaForm({ initial, onSave, onCancel }) {
  const empty = { name:"", categoria:"Hamburguesas", tipo:"Lanzamiento Grande", objetivo:"Rentabilidad", concept:"", perfil:"", precioARS:"", precioUSD:"", cmv:"", ingredientes:"", recipe:"", viabilidad:"", notas:"", trend:"", stage:"ideas" };
  const [f, setF] = useState(initial ? { ...empty, ...initial } : empty);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));
  const ok = f.name.trim().length > 0;
  return (
    <div className="fg">
      <div><Lbl>NOMBRE DEL PRODUCTO *</Lbl><input placeholder="Ej: Smash Burger Trufa Negra" value={f.name} onChange={e=>set("name",e.target.value)} /></div>
      <div className="fr">
        <div><Lbl>CATEGORÍA</Lbl><select value={f.categoria} onChange={e=>set("categoria",e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><Lbl>TIPO DE LANZAMIENTO</Lbl><select value={f.tipo} onChange={e=>set("tipo",e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <div className="fr">
        <div><Lbl>OBJETIVO</Lbl><select value={f.objetivo} onChange={e=>set("objetivo",e.target.value)}>{OBJETIVOS.map(o=><option key={o}>{o}</option>)}</select></div>
        <div><Lbl>ETAPA ACTUAL (P08.001)</Lbl><select value={f.stage} onChange={e=>set("stage",e.target.value)}>{STAGES.map(s=><option key={s.id} value={s.id}>Etapa {s.etapa} – {s.label}</option>)}</select></div>
      </div>
      <div><Lbl>CONCEPTO / DESCRIPCIÓN</Lbl><textarea rows={4} placeholder="Qué es el producto, qué lo hace especial, por qué encaja con BIG PONS..." value={f.concept} onChange={e=>set("concept",e.target.value)} /></div>
      <div className="fr">
        <div><Lbl>PERFIL DE CLIENTE</Lbl><input placeholder="Ej: Adultos 25-40, foodie premium" value={f.perfil} onChange={e=>set("perfil",e.target.value)} /></div>
        <div><Lbl>CMV OBJETIVO (%)</Lbl><input placeholder="Ej: 28" value={f.cmv} onChange={e=>set("cmv",e.target.value)} /></div>
      </div>
      <div className="fr">
        <div><Lbl>PRECIO VENTA — ARG (ARS)</Lbl><input placeholder="Ej: 12.500" value={f.precioARS} onChange={e=>set("precioARS",e.target.value)} /></div>
        <div><Lbl>PRECIO VENTA — MIAMI (USD)</Lbl><input placeholder="Ej: 18.50" value={f.precioUSD} onChange={e=>set("precioUSD",e.target.value)} /></div>
      </div>
      <div><Lbl>INGREDIENTES CLAVE</Lbl><textarea rows={3} placeholder="Ingredientes principales o insumos nuevos necesarios..." value={f.ingredientes} onChange={e=>set("ingredientes",e.target.value)} /></div>
      <div><Lbl>RECETA / PROCEDIMIENTO (opcional)</Lbl><textarea rows={5} placeholder="Podés cargarla acá o generarla con IA desde el detalle..." value={f.recipe} onChange={e=>set("recipe",e.target.value)} /></div>
      <div><Lbl>NOTAS ADICIONALES</Lbl><textarea rows={3} placeholder="Observaciones, restricciones, aprobaciones pendientes..." value={f.notas} onChange={e=>set("notas",e.target.value)} /></div>
      <div><Lbl>TENDENCIA DE ORIGEN (si aplica)</Lbl><input placeholder="Ej: Smash burgers con queso americano fundido" value={f.trend} onChange={e=>set("trend",e.target.value)} /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid #252525` }}>
        <button className="btn-gh" onClick={onCancel}>Cancelar</button>
        <button className="btn-gold" disabled={!ok} onClick={()=>onSave(f)}>{initial ? "💾 Guardar cambios" : "➕ Crear idea"}</button>
      </div>
    </div>
  );
}

export default function BigPonsLab() {
  const [tab, setTab] = useState("tendencias");
  const [ideas, setIdeas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newModal, setNewModal] = useState(false);

  useEffect(() => {
    loadIdeas().then(d => { setIdeas(d); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaving(true);
    const t = setTimeout(async () => {
      await saveIdeas(ideas);
      setSaving(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [ideas, loaded]);

  const addIdea = useCallback((data) => {
    setIdeas(p => [{ id: Date.now(), createdAt: new Date().toISOString(), ...data }, ...p]);
    setNewModal(false);
  }, []);

  const updateIdea = useCallback((id, changes) => {
    setIdeas(p => p.map(i => i.id === id ? { ...i, ...changes } : i));
  }, []);

  const deleteIdea = useCallback((id) => {
    if (confirm("¿Eliminar esta idea?")) setIdeas(p => p.filter(i => i.id !== id));
  }, []);

  const TABS = [
    { id:"tendencias", label:"🌍  Tendencias" },
    { id:"ideas",      label:`💡  Ideas (${ideas.length})` },
    { id:"pipeline",   label:"🚀  Pipeline" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", color:"#F0F0F0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ position:"sticky", top:0, zIndex:100, background:"#0D0D0D", borderBottom:`1px solid #252525` }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"stretch", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"stretch" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 24px 14px 0", borderRight:`1px solid #252525`, marginRight:20, flexShrink:0 }}>
              <div style={{ width:30, height:30, background:"#FFBA00", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"'Bebas Neue'", fontSize:15, color:"#000" }}>BP</span>
              </div>
              <div>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:17, color:"#FFBA00", letterSpacing:1, lineHeight:1 }}>BIG★PONS</div>
                <div style={{ fontSize:8, color:"#888", letterSpacing:2, fontWeight:600, lineHeight:1 }}>PRODUCT LAB</div>
              </div>
            </div>
            {TABS.map(t => <button key={t.id} className={`tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {saving && <span style={{ fontSize:11, color:"#888" }}>💾 Guardando...</span>}
            <button className="btn-gold" style={{ fontSize:13, padding:"8px 18px" }} onClick={()=>setNewModal(true)}>➕ Nueva Idea</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>
        {!loaded && (
          <div style={{ textAlign:"center", padding:80 }}><Spinner size={40} /><p style={{ color:"#888", marginTop:16 }} className="pulse">Cargando datos...</p></div>
        )}
        {loaded && tab==="tendencias" && <TendenciasTab addIdea={addIdea} />}
        {loaded && tab==="ideas"      && <IdeasTab ideas={ideas} updateIdea={updateIdea} deleteIdea={deleteIdea} />}
        {loaded && tab==="pipeline"   && <PipelineTab ideas={ideas} updateIdea={updateIdea} deleteIdea={deleteIdea} />}
      </div>

      {newModal && (
        <Modal title="NUEVA IDEA MANUAL" onClose={()=>setNewModal(false)} wide>
          <IdeaForm onSave={addIdea} onCancel={()=>setNewModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function TendenciasTab({ addIdea }) {
  const [cat, setCat] = useState("hamburguesas");
  const [region, setRegion] = useState("global");
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState([]);
  const [developing, setDeveloping] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);

  const buscar = async () => {
    setLoading(true); setTrends([]); setDraft(null); setSaved(null);
    try {
      const reg = { global:"a nivel mundial", usa:"en USA y Miami", argentina:"en Argentina y LATAM" }[region];
      const result = await callClaude(
        `Buscá las 5 tendencias más actuales en "${cat}" ${reg}. Para cada una: nombre, descripción concreta y ejemplo real. Numeralas del 1 al 5.`,
        SYS_TRENDS, true
      );
      const blocks = result.split(/\n(?=\d+[\.\)]|\*\*\d+)/g).filter(b=>b.trim().length>20);
      const parsed = blocks.map(b => {
        const lines = b.split("\n");
        const title = lines[0].replace(/^\d+[\.\)]\s*\*?\*?/,"").replace(/\*\*/g,"").trim();
        const body = lines.slice(1).join(" ").replace(/\*\*/g,"").trim();
        return { title, body };
      }).filter(b=>b.title.length>3);
      setTrends(parsed.length>=2 ? parsed : [{ title:"Tendencias detectadas", body:result }]);
    } catch(e) { setTrends([{ title:"Error", body:"No se pudo conectar: " + e.message }]); }
    setLoading(false);
  };

  const desarrollar = async (trend) => {
    setDeveloping(trend.title); setDraft(null);
    try {
      const result = await callClaude(
        `Tendencia: "${trend.title}"\n${trend.body}\n\nDesarrollá un concepto de producto para BIG PONS:\n**NOMBRE DEL PRODUCTO:**\n**CONCEPTO:**\n**PERFIL DE CLIENTE:**\n**PRECIO ARS:**\n**PRECIO USD (Miami):**\n**TOPE CMV (%):**\n**INGREDIENTES CLAVE:**\n**OBJETIVO:**\n**TIPO:** (grande o satélite)`,
        SYS_PRODUCT
      );
      setDraft({ trend, content: result });
    } catch { alert("Error generando el concepto."); }
    setDeveloping(null);
  };

  const guardar = () => {
    if (!draft) return;
    const lines = draft.content.split("\n");
    const nameLine = lines.find(l=>/nombre/i.test(l)) || lines[0];
    const name = nameLine.replace(/\*\*/g,"").replace(/.*?:/,"").trim() || draft.trend.title;
    addIdea({ name, trend:draft.trend.title, categoria:cat, region, concept:draft.content, stage:"ideas" });
    setSaved(name); setDraft(null);
  };

  return (
    <div className="fu">
      <SectionTitle sub="Buscá tendencias globales en tiempo real y convertílas en conceptos para BIG PONS">EXPLORADOR DE TENDENCIAS</SectionTitle>
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", alignItems:"flex-end" }}>
        {[
          { lbl:"CATEGORÍA", val:cat, set:setCat, opts:[["hamburguesas","🍔 Hamburguesas"],["salsas y condimentos","🫙 Salsas"],["sides","🍟 Sides"],["bebidas","🥤 Bebidas"],["postres fast food","🍨 Postres"],["ingredientes premium","⭐ Premium"],["técnicas de cocción","🔥 Técnicas"]] },
          { lbl:"REGIÓN", val:region, set:setRegion, opts:[["global","🌍 Global"],["usa","🇺🇸 USA / Miami"],["argentina","🇦🇷 Argentina"]] },
        ].map(({ lbl, val, set, opts }) => (
          <div key={lbl} style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div className="lbl">{lbl}</div>
            <select value={val} onChange={e=>set(e.target.value)} style={{ minWidth:180, width:"auto" }}>
              {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
        <button className="btn-gold" onClick={buscar} disabled={loading} style={{ height:42 }}>
          {loading ? <><Spinner size={14} color="#000" /> Buscando...</> : "🔍 Buscar Tendencias"}
        </button>
      </div>

      {saved && (
        <div className="fu" style={{ background:"rgba(34,197,94,.1)", border:`1px solid rgba(34,197,94,.3)`, borderRadius:10, padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#22C55E" }}>✓</span>
          <span style={{ fontSize:14 }}>Guardada: <strong>"{saved}"</strong> — revisala en Ideas</span>
          <button className="btn-gh" style={{ marginLeft:"auto", padding:"4px 10px" }} onClick={()=>setSaved(null)}>✕</button>
        </div>
      )}

      {loading && <div style={{ textAlign:"center", padding:60 }}><Spinner size={36} /><p style={{ color:"#888", marginTop:16, fontSize:14 }} className="pulse">Buscando tendencias en tiempo real...</p></div>}

      {draft && !loading && (
        <div className="fu" style={{ background:"#161616", border:`2px solid #FFBA00`, borderRadius:14, padding:28, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:"#FFBA00", marginBottom:4 }}>CONCEPTO GENERADO POR IA</div>
              <div style={{ fontSize:13, color:"#888" }}>Basado en: {draft.trend.title}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-gh" onClick={()=>setDraft(null)}>← Volver</button>
              <button className="btn-gold" onClick={guardar}>💾 Guardar en Ideas</button>
            </div>
          </div>
          <div style={{ background:"#1E1E1E", borderRadius:10, padding:20 }}>
            <pre style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.8, color:"#F0F0F0", fontFamily:"'DM Sans'" }}>{draft.content}</pre>
          </div>
        </div>
      )}

      {!loading && !draft && trends.length > 0 && (
        <div style={{ display:"grid", gap:12 }} className="fu">
          {trends.map((t,i) => (
            <div key={i} className="hcard" style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}><Tag color="#FFBA00">#{i+1}</Tag><Tag color="#888">{cat.toUpperCase()}</Tag></div>
                  <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{t.title}</h3>
                  <p style={{ fontSize:14, color:"#888", lineHeight:1.65 }}>{t.body}</p>
                </div>
                <button className="btn-ol" onClick={()=>desarrollar(t)} disabled={!!developing} style={{ flexShrink:0 }}>
                  {developing===t.title ? <><Spinner size={13} /> Generando...</> : "→ Desarrollar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !draft && trends.length===0 && <Empty icon="🌍" text="Elegí categoría y región, luego buscá las últimas tendencias del mundo gastronómico." />}
    </div>
  );
}

function IdeasTab({ ideas, updateIdea, deleteIdea }) {
  const [sel, setSel] = useState(null);
  const [subTab, setSubTab] = useState("concepto");
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [filter, setFilter] = useState("todas");

  const idea = ideas.find(i=>i.id===sel);
  const filtered = filter==="todas" ? ideas : ideas.filter(i=>i.stage===filter);

  const genRecipe = async () => {
    if (!idea) return; setLoading(true);
    try {
      const r = await callClaude(
        `Receta completa para producción:\nProducto: ${idea.name}\nConcepto: ${idea.concept||""}\nIngredientes clave: ${idea.ingredientes||""}\nCMV objetivo: ${idea.cmv||""}%\n\nIncluí:\n**NOMBRE FINAL:**\n**DESCRIPCIÓN PARA MENÚ:**\n**INGREDIENTES** (gramajes por porción):\n**PROCEDIMIENTO** (con temperatura y tiempo):\n**PRESENTACIÓN:**\n**ALÉRGENOS:**\n**NOTAS DE PRODUCCIÓN:**\n**CMV ESTIMADO:**`,
        SYS_RECIPE
      );
      updateIdea(sel, { recipe:r });
    } catch { alert("Error generando receta."); }
    setLoading(false);
  };

  const genViab = async () => {
    if (!idea) return; setLoading(true);
    try {
      const r = await callClaude(
        `Análisis de viabilidad P08.001 para:\nProducto: ${idea.name}\nConcepto: ${idea.concept||""}\nPrecio ARS: ${idea.precioARS||"?"} / USD: ${idea.precioUSD||"?"}\nCMV: ${idea.cmv||"?"}%\nIngredientes: ${idea.ingredientes||""}\n\nAnalizá:\n**VIABILIDAD TÉCNICA:**\n**VIABILIDAD OPERACIONAL:**\n¿Lanzamiento grande o satélite?\n**VIABILIDAD ECONÓMICA:**\n**VIABILIDAD COMERCIAL:**\n**PLAN MKT SUGERIDO:**\n**RECOMENDACIÓN FINAL:**`,
        SYS_PRODUCT
      );
      updateIdea(sel, { viabilidad:r, stage:(idea.stage==="ideas"||idea.stage==="viabilidad")?"propuesta":idea.stage });
    } catch { alert("Error generando análisis."); }
    setLoading(false);
  };

  if (sel && idea) {
    const stage = STAGES.find(s=>s.id===idea.stage)||STAGES[0];
    return (
      <div className="fu">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          <button className="btn-gh" onClick={()=>{ setSel(null); setSubTab("concepto"); }}>← Volver</button>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:"#FFBA00" }}>{idea.name}</h2>
            <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
              <Tag color={stage.color}>⬡ Etapa {stage.etapa} – {stage.label}</Tag>
              {idea.categoria && <Tag color="#8B5CF6">{idea.categoria}</Tag>}
              {idea.tipo && <Tag color="#3B82F6">{idea.tipo}</Tag>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn-ol" onClick={()=>setEditModal(true)}>✏️ Editar</button>
            <StageSel idea={idea} updateIdea={updateIdea} />
          </div>
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid #252525`, marginBottom:24, overflowX:"auto" }}>
          {[["concepto","💡 Concepto"],["recipe","🍔 Receta"],["viabilidad","📊 Viabilidad"],["info","ℹ️ Info"]].map(([v,l])=>(
            <button key={v} className={`tab ${subTab===v?"on":""}`} onClick={()=>setSubTab(v)} style={{ fontSize:13 }}>{l}</button>
          ))}
        </div>

        {subTab==="concepto" && (
          <div>
            {idea.concept
              ? <div style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:24, marginBottom:16 }}><pre style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.85, color:"#F0F0F0", fontFamily:"'DM Sans'" }}>{idea.concept}</pre></div>
              : <div style={{ background:"#1E1E1E", border:`1px dashed #252525`, borderRadius:12, padding:24, color:"#888", fontSize:14, marginBottom:16 }}>Sin concepto. Editá la idea para agregar una descripción.</div>
            }
            {idea.trend && <Tag color="#3B82F6">📈 Tendencia: {idea.trend}</Tag>}
          </div>
        )}

        {subTab==="recipe" && (
          <div>
            {idea.recipe
              ? <div style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:24, marginBottom:16 }}><pre style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.85, color:"#F0F0F0", fontFamily:"'DM Sans'" }}>{idea.recipe}</pre></div>
              : <div style={{ marginBottom:16 }}><Empty icon="🍔" text="No hay receta. Generála con IA o escribila manualmente en edición." /></div>
            }
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <button className="btn-gold" onClick={genRecipe} disabled={loading}>
                {loading ? <><Spinner size={13} color="#000" /> Generando...</> : (idea.recipe ? "🔄 Regenerar con IA" : "🤖 Generar Receta con IA")}
              </button>
              <button className="btn-ol" onClick={()=>setEditModal(true)}>✏️ Editar manualmente</button>
            </div>
          </div>
        )}

        {subTab==="viabilidad" && (
          <div>
            {idea.viabilidad
              ? <div style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:24, marginBottom:16 }}><pre style={{ whiteSpace:"pre-wrap", fontSize:14, lineHeight:1.85, color:"#F0F0F0", fontFamily:"'DM Sans'" }}>{idea.viabilidad}</pre></div>
              : <div style={{ marginBottom:16 }}><Empty icon="📊" text="No hay análisis de viabilidad. Generalo con IA cuando tengas el concepto completo." /></div>
            }
            <button className="btn-gold" onClick={genViab} disabled={loading}>
              {loading ? <><Spinner size={13} color="#000" /> Analizando...</> : (idea.viabilidad ? "🔄 Regenerar con IA" : "🤖 Generar Análisis de Viabilidad")}
            </button>
          </div>
        )}

        {subTab==="info" && (
          <div style={{ display:"grid", gap:10 }}>
            {[
              ["Categoría",idea.categoria],["Tipo",idea.tipo],["Objetivo",idea.objetivo],
              ["Perfil de Cliente",idea.perfil],
              ["Precio ARS",idea.precioARS?`$ ${idea.precioARS}`:""],
              ["Precio USD",idea.precioUSD?`USD ${idea.precioUSD}`:""],
              ["CMV Objetivo",idea.cmv?`${idea.cmv}%`:""],
              ["Ingredientes Clave",idea.ingredientes],["Notas",idea.notas],
              ["Tendencia origen",idea.trend],
              ["Fecha",idea.createdAt?new Date(idea.createdAt).toLocaleDateString("es-AR"):""],
            ].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{ background:"#161616", border:`1px solid #252525`, borderRadius:10, padding:"12px 18px", display:"flex", gap:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#888", minWidth:150, flexShrink:0 }}>{k.toUpperCase()}</span>
                <span style={{ fontSize:14 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {editModal && (
          <Modal title={`EDITAR — ${idea.name}`} onClose={()=>setEditModal(false)} wide>
            <IdeaForm initial={idea} onSave={d=>{ updateIdea(sel,d); setEditModal(false); }} onCancel={()=>setEditModal(false)} />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="fu">
      <SectionTitle sub="Administrá todas tus ideas — generadas con IA o cargadas manualmente">IDEAS & DESARROLLO</SectionTitle>
      {ideas.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          <button className="btn-gh" style={{ borderColor:filter==="todas"?"#FFBA00":"#252525", color:filter==="todas"?"#FFBA00":"#888" }} onClick={()=>setFilter("todas")}>Todas ({ideas.length})</button>
          {STAGES.map(s => {
            const count = ideas.filter(i=>i.stage===s.id).length;
            if (!count) return null;
            return <button key={s.id} className="btn-gh" style={{ borderColor:filter===s.id?s.color:"#252525", color:filter===s.id?s.color:"#888" }} onClick={()=>setFilter(s.id)}>{s.label} ({count})</button>;
          })}
        </div>
      )}
      {ideas.length === 0
        ? <Empty icon="💡" text='No hay ideas todavía. Usá "➕ Nueva Idea" para cargar manualmente, o explorá tendencias.' />
        : (
          <div style={{ display:"grid", gap:12 }}>
            {filtered.map(idea => {
              const stage = STAGES.find(s=>s.id===idea.stage)||STAGES[0];
              return (
                <div key={idea.id} className="hcard" style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                    <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>{ setSel(idea.id); setSubTab("concepto"); }}>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                        <Tag color={stage.color}>⬡ {stage.label}</Tag>
                        {idea.categoria && <Tag color="#8B5CF6">{idea.categoria}</Tag>}
                        {idea.recipe && <Tag color="#22C55E">✓ Receta</Tag>}
                        {idea.viabilidad && <Tag color="#3B82F6">✓ Viabilidad</Tag>}
                        {idea.trend && <Tag color="#888">📈 IA</Tag>}
                      </div>
                      <h3 style={{ fontSize:17, fontWeight:600, marginBottom:6 }}>{idea.name}</h3>
                      {(idea.precioARS||idea.precioUSD||idea.cmv) && (
                        <div style={{ display:"flex", gap:16, fontSize:13, color:"#888", marginBottom:8 }}>
                          {idea.precioARS && <span>🇦🇷 ${idea.precioARS}</span>}
                          {idea.precioUSD && <span>🇺🇸 USD {idea.precioUSD}</span>}
                          {idea.cmv && <span>CMV: {idea.cmv}%</span>}
                        </div>
                      )}
                      {idea.concept && <p style={{ fontSize:13, color:"#888", lineHeight:1.5 }}>{idea.concept.replace(/\*\*/g,"").substring(0,160)}...</p>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
                      <button className="btn-ol" onClick={()=>{ setSel(idea.id); setSubTab("concepto"); }}>Ver →</button>
                      <button className="btn-rd" onClick={()=>deleteIdea(idea.id)}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

function StageSel({ idea, updateIdea }) {
  const [open, setOpen] = useState(false);
  const cur = STAGES.find(s=>s.id===idea.stage)||STAGES[0];
  return (
    <div style={{ position:"relative" }}>
      <button className="btn-gh" onClick={()=>setOpen(p=>!p)} style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:cur.color, flexShrink:0 }} />
        {cur.label} ▾
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"100%", marginTop:4, background:"#1E1E1E", border:`1px solid #252525`, borderRadius:10, padding:6, zIndex:50, minWidth:230, boxShadow:"0 8px 32px rgba(0,0,0,.7)" }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={()=>{ updateIdea(idea.id,{stage:s.id}); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:s.id===idea.stage?"rgba(255,186,0,.12)":"transparent", border:"none", color:s.id===idea.stage?"#FFBA00":"#F0F0F0", padding:"9px 12px", borderRadius:7, cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans'", fontSize:13 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }} />
              <div><div style={{ fontWeight:500 }}>{s.label}</div><div style={{ fontSize:10, color:"#888" }}>Etapa {s.etapa} · {s.desc}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineTab({ ideas, updateIdea, deleteIdea }) {
  const [editCard, setEditCard] = useState(null);
  const saveEdit = (id, field, value) => { updateIdea(id,{[field]:value}); setEditCard(null); };

  const EtapaBlock = ({ label, stageIds }) => {
    const stages = STAGES.filter(s=>stageIds.includes(s.id));
    return (
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ height:1, flex:1, background:"#252525" }} />
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:"#888", padding:"0 14px", background:"#161616", border:`1px solid #252525`, borderRadius:20, whiteSpace:"nowrap" }}>{label}</span>
          <div style={{ height:1, flex:1, background:"#252525" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${stages.length},1fr)`, gap:10 }}>
          {stages.map(stage => {
            const stageIdeas = ideas.filter(i=>i.stage===stage.id);
            const idx = STAGES.findIndex(s=>s.id===stage.id);
            return (
              <div key={stage.id} style={{ background:"#161616", border:`1px solid #252525`, borderRadius:12, padding:12, minHeight:130 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, paddingBottom:10, borderBottom:`1px solid #252525` }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:stage.color, marginBottom:2 }}>ETAPA {stage.etapa}</div>
                    <div style={{ fontSize:12, fontWeight:600, lineHeight:1.3 }}>{stage.label}</div>
                    <div style={{ fontSize:10, color:"#888", marginTop:1 }}>{stage.desc}</div>
                  </div>
                  <div style={{ background:stage.color+"22", color:stage.color, width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{stageIdeas.length}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {stageIdeas.map(idea => {
                    const isEditing = editCard===idea.id;
                    return (
                      <div key={idea.id} style={{ background:"#1E1E1E", border:`1px solid #252525`, borderRadius:8, padding:10 }}>
                        {isEditing ? (
                          <div style={{ marginBottom:8 }}>
                            <input defaultValue={idea.name} autoFocus style={{ fontSize:13, fontWeight:600, padding:"6px 8px" }}
                              onBlur={e=>saveEdit(idea.id,"name",e.target.value)}
                              onKeyDown={e=>{ if(e.key==="Enter") saveEdit(idea.id,"name",e.target.value); if(e.key==="Escape") setEditCard(null); }} />
                            <div style={{ fontSize:10, color:"#888", marginTop:4 }}>Enter para guardar · Esc para cancelar</div>
                          </div>
                        ) : (
                          <div title="Clic para editar nombre" style={{ fontSize:13, fontWeight:600, marginBottom:6, cursor:"text", lineHeight:1.3 }} onClick={()=>setEditCard(idea.id)}>{idea.name}</div>
                        )}
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                          {idea.recipe && <span style={{ fontSize:9, color:"#22C55E", fontWeight:700 }}>✓REC</span>}
                          {idea.viabilidad && <span style={{ fontSize:9, color:"#3B82F6", fontWeight:700 }}>✓VIA</span>}
                          {idea.precioARS && <span style={{ fontSize:9, color:"#888" }}>ARS {idea.precioARS}</span>}
                          {idea.precioUSD && <span style={{ fontSize:9, color:"#888" }}>USD {idea.precioUSD}</span>}
                        </div>
                        {idea.notas && !isEditing && <div style={{ fontSize:11, color:"#888", marginBottom:8, lineHeight:1.4, fontStyle:"italic" }}>{idea.notas.substring(0,80)}{idea.notas.length>80?"...":""}</div>}
                        <div style={{ display:"flex", gap:5 }}>
                          {idx>0 && <button onClick={()=>updateIdea(idea.id,{stage:STAGES[idx-1].id})} style={{ fontSize:10, padding:"4px 8px", background:"transparent", border:`1px solid #252525`, color:"#888", borderRadius:5, cursor:"pointer", fontFamily:"'DM Sans'" }}>← Atrás</button>}
                          {idx<STAGES.length-1 && <button onClick={()=>updateIdea(idea.id,{stage:STAGES[idx+1].id})} style={{ flex:1, fontSize:10, padding:"4px 8px", background:stage.color+"22", border:`1px solid ${stage.color}55`, color:stage.color, borderRadius:5, cursor:"pointer", fontFamily:"'DM Sans'", fontWeight:600 }}>Avanzar →</button>}
                          <button onClick={()=>deleteIdea(idea.id)} style={{ fontSize:10, padding:"4px 8px", background:"transparent", border:`1px solid rgba(239,68,68,.3)`, color:"#EF4444", borderRadius:5, cursor:"pointer", fontFamily:"'DM Sans'" }}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                  {stageIdeas.length===0 && <div style={{ textAlign:"center", padding:"14px 8px", border:`1px dashed #252525`, borderRadius:8 }}><div style={{ fontSize:10, color:"#888" }}>Sin productos</div></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fu">
      <SectionTitle sub={`Kanban del proceso P08.001 · ${ideas.length} producto${ideas.length!==1?"s":""} en desarrollo`}>PIPELINE DE LANZAMIENTO</SectionTitle>
      <EtapaBlock label="ETAPA I — DESARROLLO DE LA PROPUESTA" stageIds={["ideas","viabilidad","propuesta","aprobacion"]} />
      <EtapaBlock label="ETAPA II — LANZAMIENTO" stageIds={["lanzamiento","seguimiento"]} />
      {ideas.length===0 && <Empty icon="🚀" text='No hay productos en el pipeline. Creá una idea con "➕ Nueva Idea" o desde Tendencias.' />}
    </div>
  );
}

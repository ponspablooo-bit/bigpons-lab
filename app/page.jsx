"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { loadIdeas, saveIdeas } from "../lib/supabase";

const FASES = [
  { id:"fase1", label:"Fase 1 — Idea",                    num:1, color:"#3B82F6", icon:"💡", desc:"Propuesta inicial" },
  { id:"fase2", label:"Fase 2 — Prueba de Producto",      num:2, color:"#8B5CF6", icon:"🧪", desc:"Desarrollo técnico" },
  { id:"fase3", label:"Fase 3 — Listo para Presentación", num:3, color:"#FFBA00", icon:"⭐", desc:"Ficha completa" },
];
const CATEGORIAS = ["Hamburguesas","Salsas & Condimentos","Sides","Bebidas","Postres","Ingredientes Premium","Otro"];
const TIPOS = ["Lanzamiento Grande","Lanzamiento Satélite"];
const SEGMENTOS = ["S","A","B","C"];

async function callClaude(userMsg, system) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:1400, system, messages:[{role:"user",content:userMsg}] }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
  return d.content.filter(b=>b.type==="text").map(b=>b.text).join("\n");
}

const SYS_RECIPE = `Sos el chef de BIG PONS, hamburguesería premium americana en Argentina. Hacés recetas precisas con gramajes, tiempos y temperatura. Respondé en español de Argentina.`;
const SYS_LAYOUT = `Sos el jefe de operaciones de BIG PONS. Hacés layouts de armado visuales (de abajo hacia arriba) con tiempos y puntos de control. Respondé en español de Argentina.`;
const SYS_FICHA = `Sos el responsable de producto de BIG PONS. Generás fichas técnicas completas y profesionales listas para el Gerente General. Respondé en español de Argentina.`;

async function sLoad() { try { return await loadIdeas(); } catch { return []; } }
async function sSave(ideas) { try { await saveIdeas(ideas); } catch {} }

// ── PDF GENERATOR ─────────────────────────────────────────────────────────────
function generarPDF(idea) {
  const foto1 = idea.fotos?.[0]?.url || null;
  const fotos = idea.fotos || [];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Ficha — ${idea.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; background:#fff; color:#111; font-size:12px; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print { display:none; }
    .page-break { page-break-before:always; }
  }
  .btn-print { position:fixed; top:16px; right:16px; background:#FFBA00; color:#000; border:none; padding:10px 24px; border-radius:8px; font-family:'DM Sans',sans-serif; font-weight:700; font-size:14px; cursor:pointer; z-index:999; }
  /* HEADER */
  .header { background:#111; color:#fff; padding:28px 32px; display:flex; justify-content:space-between; align-items:center; }
  .header-logo { display:flex; align-items:center; gap:12px; }
  .logo-box { width:44px; height:44px; background:#FFBA00; border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .logo-text { font-family:'Bebas Neue'; font-size:20px; color:#000; }
  .brand-name { font-family:'Bebas Neue'; font-size:22px; color:#FFBA00; letter-spacing:2px; }
  .brand-sub { font-size:8px; color:#888; letter-spacing:3px; font-weight:600; }
  .header-right { text-align:right; }
  .doc-type { font-family:'Bebas Neue'; font-size:28px; color:#FFBA00; letter-spacing:1px; }
  .doc-date { font-size:10px; color:#888; margin-top:2px; }
  /* HERO */
  .hero { padding:32px; border-bottom:3px solid #FFBA00; display:flex; gap:28px; align-items:flex-start; }
  .hero-info { flex:1; }
  .product-name { font-family:'Bebas Neue'; font-size:48px; color:#111; letter-spacing:1px; line-height:1; margin-bottom:8px; }
  .badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .badge { padding:4px 12px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:.5px; }
  .badge-gold { background:#FFBA00; color:#000; }
  .badge-blue { background:#3B82F6; color:#fff; }
  .badge-purple { background:#8B5CF6; color:#fff; }
  .badge-green { background:#22C55E; color:#000; }
  .concept-box { background:#f9f9f9; border-left:4px solid #FFBA00; padding:14px 16px; border-radius:0 8px 8px 0; }
  .concept-label { font-size:9px; font-weight:700; color:#888; letter-spacing:1.5px; margin-bottom:6px; }
  .concept-text { font-size:13px; line-height:1.7; color:#333; }
  .hero-foto { width:220px; height:180px; border-radius:12px; overflow:hidden; flex-shrink:0; border:2px solid #eee; }
  .hero-foto img { width:100%; height:100%; object-fit:cover; }
  .hero-foto-empty { width:100%; height:100%; background:#f5f5f5; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:32px; }
  /* GRID INFO */
  .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; border-bottom:1px solid #eee; }
  .info-cell { padding:16px 20px; border-right:1px solid #eee; }
  .info-cell:last-child { border-right:none; }
  .info-label { font-size:9px; font-weight:700; color:#888; letter-spacing:1.5px; margin-bottom:4px; }
  .info-value { font-size:14px; font-weight:600; color:#111; }
  /* SECTIONS */
  .section { padding:24px 32px; border-bottom:1px solid #eee; }
  .section-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .section-icon { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .section-title { font-family:'Bebas Neue'; font-size:18px; letter-spacing:1px; }
  .section-content { font-size:12px; line-height:1.9; color:#333; white-space:pre-wrap; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  /* FOTOS */
  .fotos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:4px; }
  .foto-item { border-radius:8px; overflow:hidden; aspect-ratio:4/3; border:1px solid #eee; }
  .foto-item img { width:100%; height:100%; object-fit:cover; }
  /* FOOTER */
  .footer { background:#111; color:#555; padding:16px 32px; display:flex; justify-content:space-between; align-items:center; font-size:10px; margin-top:auto; }
  .footer-brand { font-family:'Bebas Neue'; font-size:14px; color:#FFBA00; letter-spacing:1px; }
  .confidencial { background:#FFBA00; color:#000; padding:3px 10px; border-radius:4px; font-weight:700; font-size:9px; letter-spacing:1px; }
</style>
</head>
<body>
<button class="btn-print no-print" onclick="window.print()">⬇ Descargar PDF</button>

<!-- HEADER -->
<div class="header">
  <div class="header-logo">
    <div class="logo-box"><span class="logo-text">BP</span></div>
    <div>
      <div class="brand-name">BIG★PONS</div>
      <div class="brand-sub">AMERICAN CLASSIC BURGERS</div>
    </div>
  </div>
  <div class="header-right">
    <div class="doc-type">FICHA DE PRODUCTO</div>
    <div class="doc-date">Fecha: ${new Date().toLocaleDateString("es-AR", {day:"2-digit",month:"long",year:"numeric"})}</div>
  </div>
</div>

<!-- HERO -->
<div class="hero">
  <div class="hero-info">
    <div class="product-name">${idea.name || "Sin nombre"}</div>
    <div class="badges">
      ${idea.segmento ? `<span class="badge badge-gold">SEGMENTO ${idea.segmento}</span>` : ""}
      ${idea.categoria ? `<span class="badge badge-purple">${idea.categoria}</span>` : ""}
      ${idea.tipo ? `<span class="badge badge-blue">${idea.tipo}</span>` : ""}
      <span class="badge badge-green">⭐ APROBADO</span>
    </div>
    ${idea.concept ? `
    <div class="concept-box">
      <div class="concept-label">CONCEPTO DEL PRODUCTO</div>
      <div class="concept-text">${idea.concept.replace(/\*\*/g,"").substring(0,400)}</div>
    </div>` : ""}
  </div>
  <div class="hero-foto">
    ${foto1 ? `<img src="${foto1}" />` : `<div class="hero-foto-empty">📷</div>`}
  </div>
</div>

<!-- INFO GRID -->
<div class="info-grid">
  <div class="info-cell">
    <div class="info-label">PERFIL DE CLIENTE</div>
    <div class="info-value">${idea.perfil || "—"}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">TIPO DE LANZAMIENTO</div>
    <div class="info-value">${idea.tipo || "—"}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">TENDENCIA / INSPIRACIÓN</div>
    <div class="info-value">${idea.trend || "—"}</div>
  </div>
</div>

<!-- INSUMOS + RECETA -->
${(idea.insumos || idea.recipe) ? `
<div class="section">
  <div class="two-col">
    ${idea.insumos ? `
    <div>
      <div class="section-header">
        <div class="section-icon" style="background:#8B5CF620;">🧪</div>
        <div class="section-title" style="color:#8B5CF6;">INSUMOS E INGREDIENTES</div>
      </div>
      <div class="section-content">${idea.insumos}</div>
    </div>` : ""}
    ${idea.recipe ? `
    <div>
      <div class="section-header">
        <div class="section-icon" style="background:#F9731620;">📋</div>
        <div class="section-title" style="color:#F97316;">RECETA DETALLADA</div>
      </div>
      <div class="section-content">${idea.recipe}</div>
    </div>` : ""}
  </div>
</div>` : ""}

<!-- LAYOUT -->
${idea.layout ? `
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#22C55E20;">🏗️</div>
    <div class="section-title" style="color:#22C55E;">PROCEDIMIENTO Y LAYOUT DE ARMADO</div>
  </div>
  <div class="section-content">${idea.layout}</div>
</div>` : ""}

<!-- FICHA IA -->
${idea.ficha ? `
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#FFBA0020;">⭐</div>
    <div class="section-title" style="color:#111;">ANÁLISIS Y RECOMENDACIÓN</div>
  </div>
  <div class="section-content">${idea.ficha.replace(/\*\*/g,"")}</div>
</div>` : ""}

<!-- FOTOS -->
${fotos.length > 1 ? `
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#3B82F620;">📷</div>
    <div class="section-title" style="color:#3B82F6;">REGISTRO FOTOGRÁFICO</div>
  </div>
  <div class="fotos-grid">
    ${fotos.map(f=>`<div class="foto-item"><img src="${f.url}" /></div>`).join("")}
  </div>
</div>` : ""}

<!-- FOOTER -->
<div class="footer">
  <div class="footer-brand">BIG★PONS — PRODUCT LAB</div>
  <div>${idea.name} · Ficha Técnica Oficial</div>
  <div class="confidencial">CONFIDENCIAL</div>
</div>

</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 800);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0D0D0D}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.fu{animation:fadeUp .3s ease forwards}
.spin{animation:spin .7s linear infinite}
.pulse{animation:pulse 1.5s ease infinite}
input,select,textarea{background:#1A1A1A;border:1px solid #2E2E2E;color:#F0F0F0;border-radius:8px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:#FFBA00}
select option{background:#161616}
textarea{resize:vertical;line-height:1.65}
.hcard{transition:border-color .2s,transform .15s,box-shadow .2s;cursor:pointer}
.hcard:hover{border-color:#FFBA00!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,186,0,.08)}
.btn-gold{background:#FFBA00;color:#000;border:none;padding:10px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.btn-gold:hover:not(:disabled){background:#ffd040;transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,186,0,.35)}
.btn-gold:disabled{background:#252525;color:#555;cursor:not-allowed}
.btn-purple{background:#8B5CF6;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.btn-purple:hover:not(:disabled){background:#a78bfa;transform:translateY(-1px)}
.btn-purple:disabled{background:#252525;color:#555;cursor:not-allowed}
.btn-ol{background:transparent;color:#FFBA00;border:1px solid #FFBA00;padding:9px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.btn-ol:hover:not(:disabled){background:rgba(255,186,0,.1)}
.btn-ol:disabled{opacity:.35;cursor:not-allowed}
.btn-gh{background:transparent;border:1px solid #2E2E2E;color:#888;padding:7px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.btn-gh:hover{border-color:#888;color:#F0F0F0}
.btn-rd{background:transparent;border:1px solid rgba(239,68,68,.3);color:#EF4444;padding:7px 12px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .2s}
.btn-rd:hover{background:rgba(239,68,68,.1)}
.tab{background:transparent;border:none;color:#666;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;padding:12px 18px;cursor:pointer;position:relative;transition:color .2s;white-space:nowrap}
.tab.on{color:#FFBA00}
.tab.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:#FFBA00;border-radius:2px 2px 0 0}
.lbl{font-size:10px;font-weight:700;letter-spacing:1.8px;color:#666;margin-bottom:7px;text-transform:uppercase}
.tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.card{background:#161616;border:1px solid #252525;border-radius:12px;padding:22px}
.section{background:#161616;border:1px solid #252525;border-radius:12px;padding:24px;margin-bottom:14px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:600px){.grid2{grid-template-columns:1fr}.grid3{grid-template-columns:1fr}}
.phase-bar{display:flex;align-items:center;gap:0;margin-bottom:28px;background:#161616;border:1px solid #252525;border-radius:12px;overflow:hidden}
.phase-step{flex:1;padding:14px 10px;text-align:center;position:relative;transition:background .2s;cursor:pointer}
.phase-step.active{background:rgba(255,186,0,.08)}
.phase-step.done{background:rgba(34,197,94,.05)}
.phase-sep{width:1px;background:#252525;align-self:stretch;flex-shrink:0}
`;

const Spinner = ({size=18,color="#FFBA00"}) => (
  <div style={{width:size,height:size,border:`2px solid #333`,borderTopColor:color,borderRadius:"50%",flexShrink:0}} className="spin"/>
);
const Tag = ({children,color="#FFBA00"}) => (
  <span className="tag" style={{background:color+"20",color}}>{children}</span>
);
const Lbl = ({children}) => <div className="lbl">{children}</div>;
const SectionTitle = ({children,sub}) => (
  <div style={{marginBottom:28}}>
    <h1 style={{fontFamily:"'Bebas Neue'",fontSize:32,color:"#FFBA00",letterSpacing:1,lineHeight:1}}>{children}</h1>
    {sub && <p style={{color:"#666",fontSize:14,marginTop:6}}>{sub}</p>}
  </div>
);
const Empty = ({icon,text}) => (
  <div style={{textAlign:"center",padding:"50px 20px",border:`1px dashed #252525`,borderRadius:12,color:"#666"}}>
    <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
    <p style={{fontSize:14,maxWidth:320,margin:"0 auto",lineHeight:1.6}}>{text}</p>
  </div>
);
const Locked = ({text}) => (
  <div style={{textAlign:"center",padding:"40px 20px",background:"rgba(0,0,0,.3)",border:`1px dashed #252525`,borderRadius:12}}>
    <div style={{fontSize:32,marginBottom:10}}>🔒</div>
    <p style={{fontSize:13,color:"#666"}}>{text}</p>
  </div>
);

function Modal({title,onClose,children,wide}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#161616",border:`1px solid #2E2E2E`,borderRadius:16,width:"100%",maxWidth:wide?740:560,maxHeight:"92vh",overflow:"auto"}} className="fu">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:`1px solid #252525`,position:"sticky",top:0,background:"#161616",zIndex:1}}>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#FFBA00",letterSpacing:1}}>{title}</h2>
          <button className="btn-gh" onClick={onClose} style={{padding:"4px 10px"}}>✕</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}

function Fase1Form({initial,onSave,onCancel}) {
  const def={name:"",categoria:"Hamburguesas",tipo:"Lanzamiento Grande",segmento:"A",concept:"",perfil:"",trend:""};
  const [f,setF]=useState(initial?{...def,...initial}:def);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{display:"grid",gap:16}}>
      <div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:18}}>💡</span>
        <div><div style={{fontSize:11,fontWeight:700,color:"#3B82F6",letterSpacing:.5}}>FASE 1 — IDEA INICIAL</div><div style={{fontSize:11,color:"#666"}}>Completá los datos básicos para evaluar la idea</div></div>
      </div>
      <div><Lbl>Nombre del producto *</Lbl><input placeholder="Ej: Crispy Bacon Smash" value={f.name} onChange={e=>s("name",e.target.value)}/></div>
      <div className="grid3">
        <div><Lbl>Categoría</Lbl><select value={f.categoria} onChange={e=>s("categoria",e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><Lbl>Tipo de Lanzamiento</Lbl><select value={f.tipo} onChange={e=>s("tipo",e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
        <div><Lbl>Segmento</Lbl><select value={f.segmento} onChange={e=>s("segmento",e.target.value)}>{SEGMENTOS.map(sg=><option key={sg}>{sg}</option>)}</select></div>
      </div>
      <div><Lbl>Concepto y descripción</Lbl><textarea rows={5} placeholder="Qué es, qué lo hace especial, por qué encaja con BIG PONS..." value={f.concept} onChange={e=>s("concept",e.target.value)}/></div>
      <div><Lbl>Perfil de cliente objetivo</Lbl><input placeholder="Ej: Adultos 25-40, foodie premium" value={f.perfil} onChange={e=>s("perfil",e.target.value)}/></div>
      <div><Lbl>Tendencia / inspiración (opcional)</Lbl><input placeholder="Ej: Smash burgers con doble queso americano" value={f.trend} onChange={e=>s("trend",e.target.value)}/></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid #252525`}}>
        <button className="btn-gh" onClick={onCancel}>Cancelar</button>
        <button className="btn-gold" disabled={!f.name.trim()} onClick={()=>onSave(f)}>{initial?"💾 Guardar cambios":"➕ Crear idea"}</button>
      </div>
    </div>
  );
}

function Fase2Form({initial,onSave,onCancel}) {
  const def={insumos:"",recipe:"",layout:""};
  const [f,setF]=useState(initial?{...def,insumos:initial.insumos||"",recipe:initial.recipe||"",layout:initial.layout||""}:def);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{display:"grid",gap:16}}>
      <div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:18}}>🧪</span>
        <div><div style={{fontSize:11,fontWeight:700,color:"#8B5CF6",letterSpacing:.5}}>FASE 2 — PRUEBA DE PRODUCTO</div><div style={{fontSize:11,color:"#666"}}>Cargá el detalle técnico</div></div>
      </div>
      <div><Lbl>Insumos — listado de ingredientes</Lbl><textarea rows={7} placeholder={"- Pan brioche — 1 unidad (80g)\n- Medallón de carne — 180g\n- Queso cheddar — 2 fetas (30g)"} value={f.insumos} onChange={e=>s("insumos",e.target.value)}/></div>
      <div><Lbl>Receta detallada</Lbl><textarea rows={8} placeholder={"1. Precalentar plancha a 220°C\n2. Formar medallón...\n3. Cocinar 2 min por lado..."} value={f.recipe} onChange={e=>s("recipe",e.target.value)}/></div>
      <div><Lbl>Procedimiento y Layout de armado</Lbl><textarea rows={9} placeholder={"LAYOUT (de abajo hacia arriba):\n[ BASE DEL PAN ]\n[ SALSA — 15g ]\n[ LECHUGA — 20g ]\n[ MEDALLÓN + QUESO ]\n[ TAPA DEL PAN ]"} value={f.layout} onChange={e=>s("layout",e.target.value)}/></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid #252525`}}>
        <button className="btn-gh" onClick={onCancel}>Cancelar</button>
        <button className="btn-purple" onClick={()=>onSave(f)}>💾 Guardar</button>
      </div>
    </div>
  );
}

export default function BigPonsLab() {
  const [tab,setTab]=useState("ideas");
  const [ideas,setIdeas]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [saving,setSaving]=useState(false);
  const [newModal,setNewModal]=useState(false);

  useEffect(()=>{sLoad().then(d=>{setIdeas(d);setLoaded(true);});},[]);
  useEffect(()=>{
    if(!loaded)return;
    setSaving(true);
    const t=setTimeout(async()=>{await sSave(ideas);setSaving(false);},1000);
    return()=>clearTimeout(t);
  },[ideas,loaded]);

  const addIdea=useCallback((data)=>{setIdeas(p=>[{id:Date.now(),createdAt:new Date().toISOString(),fase:"fase1",fotos:[],...data},...p]);setNewModal(false);},[]);
  const updateIdea=useCallback((id,changes)=>{setIdeas(p=>p.map(i=>i.id===id?{...i,...changes}:i));},[]);
  const deleteIdea=useCallback((id)=>{if(confirm("¿Eliminar esta idea?"))setIdeas(p=>p.filter(i=>i.id!==id));},[]);

  const TABS=[
    {id:"ideas",label:`💡  Ideas (${ideas.length})`},
    {id:"pipeline",label:"🚀  Pipeline"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0D0D0D",color:"#F0F0F0",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{position:"sticky",top:0,zIndex:100,background:"#0D0D0D",borderBottom:`1px solid #252525`}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"stretch",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"stretch"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 22px 13px 0",borderRight:`1px solid #252525`,marginRight:20,flexShrink:0}}>
              <div style={{width:30,height:30,background:"#FFBA00",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:15,color:"#000"}}>BP</span>
              </div>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:17,color:"#FFBA00",letterSpacing:1,lineHeight:1}}>BIG★PONS</div>
                <div style={{fontSize:8,color:"#555",letterSpacing:2,fontWeight:600}}>PRODUCT LAB</div>
              </div>
            </div>
            {TABS.map(t=><button key={t.id} className={`tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {saving&&<span style={{fontSize:11,color:"#555"}}>💾 Guardando...</span>}
            <button className="btn-gold" style={{fontSize:13,padding:"8px 18px"}} onClick={()=>setNewModal(true)}>➕ Nueva Idea</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        {!loaded&&<div style={{textAlign:"center",padding:80}}><Spinner size={40}/><p style={{color:"#555",marginTop:16}} className="pulse">Cargando...</p></div>}
        {loaded&&tab==="ideas"&&<IdeasTab ideas={ideas} updateIdea={updateIdea} deleteIdea={deleteIdea}/>}
        {loaded&&tab==="pipeline"&&<PipelineTab ideas={ideas} updateIdea={updateIdea} deleteIdea={deleteIdea}/>}
      </div>

      {newModal&&(
        <Modal title="NUEVA IDEA — FASE 1" onClose={()=>setNewModal(false)} wide>
          <Fase1Form onSave={addIdea} onCancel={()=>setNewModal(false)}/>
        </Modal>
      )}
    </div>
  );
}

function IdeasTab({ideas,updateIdea,deleteIdea}) {
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("todas");
  const idea=ideas.find(i=>i.id===sel);
  const filtered=filter==="todas"?ideas:ideas.filter(i=>i.fase===filter);
  if(sel&&idea) return <IdeaDetail idea={idea} updateIdea={updateIdea} onBack={()=>setSel(null)}/>;
  return (
    <div className="fu">
      <SectionTitle sub="Todas las ideas del equipo — desde el concepto hasta el producto listo">IDEAS & DESARROLLO</SectionTitle>
      {ideas.length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button className="btn-gh" style={{borderColor:filter==="todas"?"#FFBA00":"#2E2E2E",color:filter==="todas"?"#FFBA00":"#666"}} onClick={()=>setFilter("todas")}>Todas ({ideas.length})</button>
          {FASES.map(f=>{
            const count=ideas.filter(i=>i.fase===f.id).length;
            if(!count)return null;
            return <button key={f.id} className="btn-gh" style={{borderColor:filter===f.id?f.color:"#2E2E2E",color:filter===f.id?f.color:"#666"}} onClick={()=>setFilter(f.id)}>{f.icon} {f.label} ({count})</button>;
          })}
        </div>
      )}
      {ideas.length===0
        ?<Empty icon="💡" text='No hay ideas todavía. Usá "➕ Nueva Idea" para empezar.'/>
        :(
          <div style={{display:"grid",gap:12}}>
            {filtered.map(idea=>{
              const fase=FASES.find(f=>f.id===idea.fase)||FASES[0];
              return (
                <div key={idea.id} className="hcard card" onClick={()=>setSel(idea.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                      <span className="tag" style={{background:fase.color+"20",color:fase.color}}>{fase.icon} {fase.label}</span>
                      {idea.categoria&&<Tag color="#8B5CF6">{idea.categoria}</Tag>}
                      {idea.segmento&&<span className="tag" style={{background:"rgba(255,186,0,.12)",color:"#FFBA00",border:"1px solid rgba(255,186,0,.2)"}}>SEG {idea.segmento}</span>}
                      {idea.fotos?.length>0&&<Tag color="#22C55E">📷 {idea.fotos.length}</Tag>}
                    </div>
                    <h3 style={{fontSize:17,fontWeight:600,marginBottom:6}}>{idea.name}</h3>
                    {idea.perfil&&<p style={{fontSize:12,color:"#666",marginBottom:6}}>👤 {idea.perfil}</p>}
                    {idea.concept&&<p style={{fontSize:13,color:"#666",lineHeight:1.5}}>{idea.concept.replace(/\*\*/g,"").substring(0,180)}...</p>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                    <button className="btn-ol" onClick={()=>setSel(idea.id)}>Ver →</button>
                    <button className="btn-rd" onClick={()=>deleteIdea(idea.id)}>🗑</button>
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

function IdeaDetail({idea,updateIdea,onBack}) {
  const [activeTab,setActiveTab]=useState("fase1");
  const [loading,setLoading]=useState(null);
  const [editFase1,setEditFase1]=useState(false);
  const [editFase2,setEditFase2]=useState(false);
  const fileRef=useRef(null);
  const fase=FASES.find(f=>f.id===idea.fase)||FASES[0];
  const faseNum=fase.num;

  const aprobarFase1=()=>{updateIdea(idea.id,{fase:"fase2"});setActiveTab("fase2");};
  const aprobarFase2=async()=>{
    updateIdea(idea.id,{fase:"fase3"});
    setActiveTab("fase3");
    if(!idea.ficha){
      setLoading("ficha");
      try {
        const r=await callClaude(
          `Ficha técnica para BIG PONS:\nNombre: ${idea.name}\nCategoría: ${idea.categoria||""}\nSegmento: ${idea.segmento||""}\nTipo: ${idea.tipo||""}\nConcepto: ${idea.concept||""}\nPerfil: ${idea.perfil||""}\nInsumos: ${idea.insumos||""}\nReceta: ${(idea.recipe||"").substring(0,300)}\nLayout: ${(idea.layout||"").substring(0,300)}\n\nGenerá análisis de:\n- Precio de venta sugerido (ARS)\n- CMV estimado (%)\n- Objetivo (volumen o rentabilidad)\n- Potencial de ventas\n- Alérgenos\n- Notas para producción\n- Recomendación final`,
          SYS_FICHA
        );
        updateIdea(idea.id,{fase:"fase3",ficha:r});
      } catch(e){alert("Error generando análisis: "+e.message);}
      setLoading(null);
    }
  };

  const genRecipe=async()=>{
    setLoading("recipe");
    try {
      const r=await callClaude(
        `Receta para BIG PONS:\nProducto: ${idea.name}\nConcepto: ${idea.concept||""}\nInsumos: ${idea.insumos||""}\n\nDesarrollá:\n- Nombre final\n- Descripción para menú\n- Ingredientes con gramajes por porción\n- Procedimiento paso a paso con temperatura y tiempo\n- Puntos de control de calidad\n- Alérgenos\n- Rendimiento y merma`,
        SYS_RECIPE
      );
      updateIdea(idea.id,{recipe:r});
    } catch(e){alert("Error: "+e.message);}
    setLoading(null);
  };

  const genLayout=async()=>{
    setLoading("layout");
    try {
      const r=await callClaude(
        `Layout de armado para BIG PONS:\nProducto: ${idea.name}\nInsumos: ${idea.insumos||""}\nReceta: ${(idea.recipe||"").substring(0,400)}\n\nDesarrollá:\n- Layout visual de abajo hacia arriba\n- Procedimiento de armado paso a paso\n- Tiempos por paso\n- Presentación final\n- Notas para el equipo`,
        SYS_LAYOUT
      );
      updateIdea(idea.id,{layout:r});
    } catch(e){alert("Error: "+e.message);}
    setLoading(null);
  };

  const genFicha=async()=>{
    setLoading("ficha");
    try {
      const r=await callClaude(
        `Análisis técnico-comercial para BIG PONS:\nProducto: ${idea.name}\nConcepto: ${idea.concept||""}\nSegmento: ${idea.segmento||""}\nInsumos: ${idea.insumos||""}\n\nIncluí: precio ARS sugerido, CMV estimado, objetivo (volumen/rentabilidad), potencial de ventas, alérgenos, notas de producción, recomendación final`,
        SYS_FICHA
      );
      updateIdea(idea.id,{ficha:r});
    } catch(e){alert("Error: "+e.message);}
    setLoading(null);
  };

  const handlePhotos=(e)=>{
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const newFoto={id:Date.now()+Math.random(),url:ev.target.result,name:file.name};
        updateIdea(idea.id,{fotos:[...(idea.fotos||[]),newFoto]});
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteFoto=(fotoId)=>updateIdea(idea.id,{fotos:(idea.fotos||[]).filter(f=>f.id!==fotoId)});

  const PhaseBar=()=>(
    <div className="phase-bar">
      {FASES.map((f,i)=>{
        const isDone=faseNum>f.num;
        const isActive=faseNum===f.num;
        return (
          <div key={f.id} style={{display:"contents"}}>
            <div className={`phase-step ${isActive?"active":""} ${isDone?"done":""}`} onClick={()=>setActiveTab(f.id)}>
              <div style={{fontSize:16,marginBottom:4}}>{isDone?"✅":f.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:isActive?f.color:isDone?"#22C55E":"#444",letterSpacing:.5}}>FASE {f.num}</div>
              <div style={{fontSize:11,color:isActive?f.color:isDone?"#22C55E":"#444",fontWeight:500}}>{f.num===1?"Idea":f.num===2?"Prueba":"Presentación"}</div>
            </div>
            {i<FASES.length-1&&<div className="phase-sep"/>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fu">
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button className="btn-gh" onClick={onBack}>← Volver</button>
        <div style={{flex:1}}>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:28,color:"#FFBA00"}}>{idea.name}</h2>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            <span className="tag" style={{background:fase.color+"20",color:fase.color}}>{fase.icon} {fase.label}</span>
            {idea.categoria&&<Tag color="#8B5CF6">{idea.categoria}</Tag>}
            {idea.segmento&&<span className="tag" style={{background:"rgba(255,186,0,.12)",color:"#FFBA00"}}>SEG {idea.segmento}</span>}
          </div>
        </div>
        {faseNum===3&&(
          <button className="btn-gold" onClick={()=>generarPDF(idea)} style={{background:"#FFBA00",fontSize:13}}>
            ⬇ Descargar PDF
          </button>
        )}
      </div>

      <PhaseBar/>

      <div style={{display:"flex",borderBottom:`1px solid #252525`,marginBottom:24,overflowX:"auto"}}>
        <button className={`tab ${activeTab==="fase1"?"on":""}`} onClick={()=>setActiveTab("fase1")} style={{fontSize:13}}>💡 Fase 1 — Idea</button>
        <button className={`tab ${activeTab==="fase2"?"on":""}`} onClick={()=>setActiveTab("fase2")} style={{fontSize:13,opacity:faseNum>=2?1:.4,pointerEvents:faseNum>=2?"auto":"none"}}>🧪 Fase 2 — Prueba</button>
        <button className={`tab ${activeTab==="fase3"?"on":""}`} onClick={()=>setActiveTab("fase3")} style={{fontSize:13,opacity:faseNum>=3?1:.4,pointerEvents:faseNum>=3?"auto":"none"}}>⭐ Fase 3 — Presentación</button>
      </div>

      {/* FASE 1 */}
      {activeTab==="fase1"&&(
        <div>
          <div className="section">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:12,fontWeight:700,color:"#3B82F6",letterSpacing:.5}}>💡 IDEA INICIAL</div>
              <button className="btn-ol" style={{fontSize:12}} onClick={()=>setEditFase1(true)}>✏️ Editar</button>
            </div>
            <div style={{display:"grid",gap:10}}>
              {[["Categoría",idea.categoria],["Tipo",idea.tipo],["Segmento",idea.segmento?`Segmento ${idea.segmento}`:""],["Perfil de Cliente",idea.perfil],["Tendencia",idea.trend]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:16,padding:"8px 0",borderBottom:`1px solid #1E1E1E`}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#555",minWidth:140,flexShrink:0}}>{k.toUpperCase()}</span>
                  <span style={{fontSize:14}}>{v}</span>
                </div>
              ))}
            </div>
            {idea.concept&&<div style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:"#555",marginBottom:8}}>CONCEPTO</div><pre style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.8,color:"#E0E0E0",fontFamily:"'DM Sans'"}}>{idea.concept}</pre></div>}
          </div>
          {idea.fase==="fase1"&&(
            <div style={{background:"rgba(139,92,246,.07)",border:`1px solid rgba(139,92,246,.2)`,borderRadius:12,padding:20,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>¿Se aprueba esta idea?</div>
                <div style={{fontSize:13,color:"#666"}}>Al aprobar pasa a <strong style={{color:"#8B5CF6"}}>Fase 2 — Prueba de Producto</strong>.</div>
              </div>
              <button className="btn-purple" onClick={aprobarFase1}>✅ Aprobar → Fase 2</button>
            </div>
          )}
        </div>
      )}

      {/* FASE 2 */}
      {activeTab==="fase2"&&(
        <div>
          {faseNum<2?<Locked text="Se habilita al aprobar la Fase 1."/>:(
            <div>
              <div className="section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#8B5CF6",letterSpacing:.5}}>🧪 INSUMOS</div>
                  <button className="btn-gh" onClick={()=>setEditFase2(true)}>✏️ Editar</button>
                </div>
                {idea.insumos?<pre style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.8,color:"#E0E0E0",fontFamily:"'DM Sans'"}}>{idea.insumos}</pre>:<p style={{color:"#555",fontSize:13}}>Sin insumos. Hacé clic en Editar.</p>}
              </div>
              <div className="section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#F97316",letterSpacing:.5}}>📋 RECETA</div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn-gold" disabled={!!loading} onClick={genRecipe} style={{fontSize:12,padding:"6px 14px"}}>
                      {loading==="recipe"?<><Spinner size={12} color="#000"/>Generando...</>:(idea.recipe?"🔄 Regenerar":"🤖 Generar IA")}
                    </button>
                    <button className="btn-gh" onClick={()=>setEditFase2(true)}>✏️ Editar</button>
                  </div>
                </div>
                {idea.recipe?<pre style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.8,color:"#E0E0E0",fontFamily:"'DM Sans'"}}>{idea.recipe}</pre>:<p style={{color:"#555",fontSize:13}}>Sin receta. Generala o cargala manualmente.</p>}
              </div>
              <div className="section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#22C55E",letterSpacing:.5}}>🏗️ LAYOUT DE ARMADO</div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn-gold" disabled={!!loading} onClick={genLayout} style={{fontSize:12,padding:"6px 14px"}}>
                      {loading==="layout"?<><Spinner size={12} color="#000"/>Generando...</>:(idea.layout?"🔄 Regenerar":"🤖 Generar IA")}
                    </button>
                    <button className="btn-gh" onClick={()=>setEditFase2(true)}>✏️ Editar</button>
                  </div>
                </div>
                {idea.layout?<pre style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.8,color:"#E0E0E0",fontFamily:"'DM Sans'"}}>{idea.layout}</pre>:<p style={{color:"#555",fontSize:13}}>Sin layout. Generalo o cargalo manualmente.</p>}
              </div>
              {idea.fase==="fase2"&&(
                <div style={{background:"rgba(255,186,0,.06)",border:`1px solid rgba(255,186,0,.2)`,borderRadius:12,padding:20,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>¿Se aprueba la Prueba de Producto?</div>
                    <div style={{fontSize:13,color:"#666"}}>Al aprobar pasa a <strong style={{color:"#FFBA00"}}>Fase 3</strong> y se genera el análisis automáticamente.</div>
                  </div>
                  <button className="btn-gold" onClick={aprobarFase2} disabled={!!loading}>
                    {loading==="ficha"?<><Spinner size={14} color="#000"/>Generando...</>:"⭐ Aprobar → Fase 3"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FASE 3 */}
      {activeTab==="fase3"&&(
        <div>
          {faseNum<3?<Locked text="Se habilita al aprobar la Fase 2."/>:(
            <div>
              <div style={{background:"rgba(255,186,0,.07)",border:`1px solid rgba(255,186,0,.2)`,borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:24}}>⭐</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#FFBA00"}}>PRODUCTO LISTO PARA PRESENTACIÓN</div>
                    <div style={{fontSize:12,color:"#666"}}>Ficha completa + fotos del producto</div>
                  </div>
                </div>
                <button className="btn-gold" onClick={()=>generarPDF(idea)} style={{fontSize:14,padding:"10px 24px"}}>
                  ⬇ Descargar PDF
                </button>
              </div>

              {/* Análisis IA */}
              <div className="section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#FFBA00",letterSpacing:.5}}>📊 ANÁLISIS Y RECOMENDACIÓN</div>
                  <button className="btn-gold" disabled={!!loading} onClick={genFicha} style={{fontSize:12,padding:"6px 14px"}}>
                    {loading==="ficha"?<><Spinner size={12} color="#000"/>Generando...</>:(idea.ficha?"🔄 Regenerar":"🤖 Generar análisis")}
                  </button>
                </div>
                {idea.ficha?<pre style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.9,color:"#E0E0E0",fontFamily:"'DM Sans'"}}>{idea.ficha}</pre>:<p style={{color:"#555",fontSize:13}}>Sin análisis. Hacé clic en "Generar análisis".</p>}
              </div>

              {/* Fotos */}
              <div className="section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#3B82F6",letterSpacing:.5}}>📷 FOTOS DEL PRODUCTO</div>
                  <button className="btn-ol" style={{fontSize:12}} onClick={()=>fileRef.current?.click()}>📷 Agregar fotos</button>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handlePhotos}/>
                </div>
                {(!idea.fotos||idea.fotos.length===0)?(
                  <div style={{border:`2px dashed #2E2E2E`,borderRadius:10,padding:"40px 20px",textAlign:"center",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
                    <div style={{fontSize:36,marginBottom:10}}>📷</div>
                    <div style={{fontSize:14,color:"#555"}}>Hacé clic para subir fotos</div>
                    <div style={{fontSize:12,color:"#444",marginTop:4}}>JPG, PNG, WEBP — podés subir varias a la vez</div>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
                    {idea.fotos.map(foto=>(
                      <div key={foto.id} style={{position:"relative",borderRadius:10,overflow:"hidden",border:`1px solid #252525`,aspectRatio:"4/3"}}>
                        <img src={foto.url} alt={foto.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        <button onClick={()=>deleteFoto(foto.id)} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.8)",border:"none",color:"#EF4444",width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                      </div>
                    ))}
                    <div style={{border:`2px dashed #2E2E2E`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",minHeight:120,aspectRatio:"4/3"}} onClick={()=>fileRef.current?.click()}>
                      <div style={{textAlign:"center",color:"#444"}}><div style={{fontSize:24,marginBottom:4}}>+</div><div style={{fontSize:12}}>Más fotos</div></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {editFase1&&(
        <Modal title={`EDITAR FASE 1 — ${idea.name}`} onClose={()=>setEditFase1(false)} wide>
          <Fase1Form initial={idea} onSave={d=>{updateIdea(idea.id,{...d});setEditFase1(false);}} onCancel={()=>setEditFase1(false)}/>
        </Modal>
      )}
      {editFase2&&(
        <Modal title={`EDITAR FASE 2 — ${idea.name}`} onClose={()=>setEditFase2(false)} wide>
          <Fase2Form initial={idea} onSave={d=>{updateIdea(idea.id,{...d});setEditFase2(false);}} onCancel={()=>setEditFase2(false)}/>
        </Modal>
      )}
    </div>
  );
}

function PipelineTab({ideas,updateIdea,deleteIdea}) {
  return (
    <div className="fu">
      <SectionTitle sub={`${ideas.length} producto${ideas.length!==1?"s":""} en desarrollo`}>PIPELINE DE LANZAMIENTO</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {FASES.map(fase=>{
          const faseIdeas=ideas.filter(i=>i.fase===fase.id);
          const faseIdx=FASES.findIndex(f=>f.id===fase.id);
          return (
            <div key={fase.id} style={{background:"#161616",border:`1px solid #252525`,borderRadius:14,padding:14,minHeight:180}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,paddingBottom:12,borderBottom:`1px solid #252525`}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:fase.color,marginBottom:3}}>FASE {fase.num}</div>
                  <div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>{fase.icon} {fase.label.replace(`Fase ${fase.num} — `,"")}</div>
                  <div style={{fontSize:10,color:"#555",marginTop:2}}>{fase.desc}</div>
                </div>
                <div style={{background:fase.color+"20",color:fase.color,width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{faseIdeas.length}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {faseIdeas.map(idea=>(
                  <div key={idea.id} style={{background:"#1A1A1A",border:`1px solid #2E2E2E`,borderRadius:8,padding:10}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{idea.name}</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                      {idea.segmento&&<span style={{fontSize:9,color:"#FFBA00",fontWeight:700}}>SEG {idea.segmento}</span>}
                      {idea.insumos&&<span style={{fontSize:9,color:"#8B5CF6",fontWeight:700}}>✓INS</span>}
                      {idea.recipe&&<span style={{fontSize:9,color:"#F97316",fontWeight:700}}>✓REC</span>}
                      {idea.layout&&<span style={{fontSize:9,color:"#22C55E",fontWeight:700}}>✓LAY</span>}
                      {idea.ficha&&<span style={{fontSize:9,color:"#FFBA00",fontWeight:700}}>✓ANÁLISIS</span>}
                      {idea.fotos?.length>0&&<span style={{fontSize:9,color:"#3B82F6",fontWeight:700}}>📷{idea.fotos.length}</span>}
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      {faseIdx>0&&<button onClick={()=>updateIdea(idea.id,{fase:FASES[faseIdx-1].id})} style={{fontSize:10,padding:"4px 8px",background:"transparent",border:`1px solid #2E2E2E`,color:"#666",borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans'"}}>← Atrás</button>}
                      {faseIdx<FASES.length-1&&<button onClick={()=>updateIdea(idea.id,{fase:FASES[faseIdx+1].id})} style={{flex:1,fontSize:10,padding:"4px 8px",background:fase.color+"18",border:`1px solid ${fase.color}44`,color:fase.color,borderRadius:5,cursor:"pointer",fontFamily:"'DM Sans'",fontWeight:600}}>Avanzar →</button>}
                      <button onClick={()=>deleteIdea(idea.id)} style={{fontSize:10,padding:"4px 8px",background:"transparent",border:`1px solid rgba(239,68,68,.25)`,color:"#EF4444",borderRadius:5,cursor:"pointer"}}>🗑</button>
                    </div>
                  </div>
                ))}
                {faseIdeas.length===0&&<div style={{textAlign:"center",padding:"18px 8px",border:`1px dashed #252525`,borderRadius:8}}><div style={{fontSize:10,color:"#444"}}>Sin productos</div></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


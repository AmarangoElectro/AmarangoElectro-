"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, Brush, ChevronRight, CirclePause, CreditCard, Plus, Search,
  ShieldCheck, Store, Trash2, UserPlus, UsersRound
} from "lucide-react";
import type {
  SubscriberMemberDraft,
  SubscriberStatus,
  SubscriberWorkspaceDraft,
  WorkspaceMemberRole,
} from "@/lib/subscribers/types";
import styles from "./subscribers.module.css";

const STORAGE_KEY = "amarango_v16_subscribers_sandbox_v1";

const statusLabel: Record<SubscriberStatus, string> = {
  DRAFT: "Borrador",
  TRIAL: "Prueba",
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
};

function id(prefix: string) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function emptyDraft(): SubscriberWorkspaceDraft {
  return {
    id: id("workspace"),
    commercialName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    planLabel: "A definir",
    status: "DRAFT",
    members: [],
    branding: {
      primaryColor: "#0B2D6B",
      secondaryColor: "#FFFFFF",
      accentColor: "#FF7A00",
      logoLabel: "",
    },
    createdAt: new Date().toISOString(),
  };
}

export function SubscribersWorkspace() {
  const [items, setItems] = useState<SubscriberWorkspaceDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubscriberWorkspaceDraft>(emptyDraft);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<WorkspaceMemberRole>("ADMIN");
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SubscriberWorkspaceDraft[];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {}
    }
    setHydrated(true);
  }, []);

  function persist(next: SubscriberWorkspaceDraft[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function startNew() {
    const next = emptyDraft();
    setDraft(next);
    setSelectedId(null);
  }

  function select(item: SubscriberWorkspaceDraft) {
    setSelectedId(item.id);
    setDraft(structuredClone(item));
  }

  function saveLocal() {
    if (!draft.commercialName.trim()) return;
    const normalized = { ...draft, commercialName: draft.commercialName.trim() };
    const exists = items.some((item) => item.id === normalized.id);
    const next = exists
      ? items.map((item) => item.id === normalized.id ? normalized : item)
      : [normalized, ...items];
    persist(next);
    setSelectedId(normalized.id);
  }

  function deleteLocal() {
    if (!selectedId) return;
    persist(items.filter((item) => item.id !== selectedId));
    startNew();
  }

  function addMember() {
    if (!memberName.trim() && !memberEmail.trim()) return;
    const member: SubscriberMemberDraft = {
      id: id("member"),
      name: memberName.trim() || memberEmail.trim(),
      email: memberEmail.trim(),
      role: memberRole,
    };
    setDraft((current) => ({ ...current, members: [...current.members, member] }));
    setMemberName("");
    setMemberEmail("");
    setMemberRole("ADMIN");
  }

  function removeMember(memberId: string) {
    setDraft((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== memberId),
    }));
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es-AR");
    if (!needle) return items;
    return items.filter((item) =>
      [item.commercialName, item.contactName, item.contactEmail, item.planLabel]
        .join(" ")
        .toLocaleLowerCase("es-AR")
        .includes(needle)
    );
  }, [items, query]);

  const active = items.filter((item) => item.status === "ACTIVE").length;
  const trials = items.filter((item) => item.status === "TRIAL").length;
  const members = items.reduce((sum, item) => sum + item.members.length, 0);

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>SUSCRIPTORES · FAMILIA · EQUIPO</p>
          <h1>Una tienda por negocio.<span> Todo separado y controlado.</span></h1>
          <p className={styles.lead}>Acá se prepara cada suscriptor, su familia/equipo, plan e identidad. En este gate todo se guarda únicamente en este dispositivo para probar la experiencia sin escribir en Supabase.</p>
        </div>
        <div className={styles.safeBadge}><ShieldCheck/><div><strong>Sandbox seguro</strong><span>0 escrituras productivas</span></div></div>
      </section>

      <section className={styles.metrics}>
        <article><Store/><div><span>Suscriptores preparados</span><strong>{items.length}</strong></div></article>
        <article><BadgeCheck/><div><span>Activos</span><strong>{active}</strong></div></article>
        <article><CirclePause/><div><span>En prueba</span><strong>{trials}</strong></div></article>
        <article><UsersRound/><div><span>Familia / equipo</span><strong>{members}</strong></div></article>
      </section>

      <section className={styles.layout}>
        <aside className={styles.listPanel}>
          <div className={styles.panelTitle}>
            <div><small>WORKSPACES</small><h2>Suscriptores</h2></div>
            <button onClick={startNew} type="button"><Plus/> Nuevo</button>
          </div>
          <label className={styles.search}><Search/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar negocio o contacto"/></label>

          <div className={styles.list}>
            {!hydrated ? <p className={styles.empty}>Cargando sandbox…</p> : visible.length === 0 ? (
              <div className={styles.emptyState}><Store/><strong>Todavía no hay suscriptores preparados.</strong><span>Creá el primero sin tocar producción.</span></div>
            ) : visible.map((item) => (
              <button key={item.id} type="button" className={selectedId===item.id ? styles.selected : ""} onClick={()=>select(item)}>
                <span className={styles.avatar} style={{background:item.branding.primaryColor}}>{item.commercialName.slice(0,2).toUpperCase()}</span>
                <span><strong>{item.commercialName}</strong><small>{statusLabel[item.status]} · {item.planLabel}</small></span>
                <ChevronRight/>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.editor}>
          <div className={styles.editorHeader}>
            <div><small>{selectedId ? "EDITAR BORRADOR LOCAL" : "NUEVO BORRADOR LOCAL"}</small><h2>{draft.commercialName || "Nuevo suscriptor"}</h2></div>
            <div className={styles.editorActions}>
              {selectedId ? <button type="button" className={styles.danger} onClick={deleteLocal}><Trash2/> Quitar borrador</button> : null}
              <button type="button" className={styles.primary} onClick={saveLocal}>Guardar en este dispositivo</button>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeading}><Store/><div><strong>Tienda</strong><span>Datos comerciales del workspace.</span></div></div>
            <div className={styles.formGrid}>
              <label className={styles.full}>Nombre comercial<input value={draft.commercialName} onChange={(e)=>setDraft({...draft,commercialName:e.target.value})} placeholder="Ej: Electro Round"/></label>
              <label>Responsable<input value={draft.contactName} onChange={(e)=>setDraft({...draft,contactName:e.target.value})} placeholder="Nombre y apellido"/></label>
              <label>Email<input value={draft.contactEmail} onChange={(e)=>setDraft({...draft,contactEmail:e.target.value})} placeholder="correo@tienda.com"/></label>
              <label>Teléfono<input value={draft.contactPhone} onChange={(e)=>setDraft({...draft,contactPhone:e.target.value})} placeholder="Opcional"/></label>
              <label>Estado<select value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value as SubscriberStatus})}><option value="DRAFT">Borrador</option><option value="TRIAL">Prueba</option><option value="ACTIVE">Activo</option><option value="SUSPENDED">Suspendido</option></select></label>
              <label className={styles.full}>Plan<input value={draft.planLabel} onChange={(e)=>setDraft({...draft,planLabel:e.target.value})} placeholder="A definir"/></label>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeading}><UsersRound/><div><strong>Familia / equipo</strong><span>Personas que pertenecerán únicamente a esta tienda.</span></div></div>
            <div className={styles.memberComposer}>
              <input value={memberName} onChange={(e)=>setMemberName(e.target.value)} placeholder="Nombre"/>
              <input value={memberEmail} onChange={(e)=>setMemberEmail(e.target.value)} placeholder="Email"/>
              <select value={memberRole} onChange={(e)=>setMemberRole(e.target.value as WorkspaceMemberRole)}><option value="OWNER">Propietario de tienda</option><option value="ADMIN">Administrador</option><option value="ADVISOR">Asesor</option></select>
              <button type="button" onClick={addMember}><UserPlus/> Agregar</button>
            </div>
            <div className={styles.members}>
              {draft.members.length===0 ? <p className={styles.empty}>Sin integrantes todavía.</p> : draft.members.map((member)=>(
                <article key={member.id}><span>{member.name.slice(0,2).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.email || "Sin email"} · {member.role}</small></div><button type="button" onClick={()=>removeMember(member.id)} aria-label="Quitar integrante">×</button></article>
              ))}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeading}><Brush/><div><strong>Identidad de tienda</strong><span>Preview de marca blanca por workspace.</span></div></div>
            <div className={styles.brandGrid}>
              <label>Color principal<input type="color" value={draft.branding.primaryColor} onChange={(e)=>setDraft({...draft,branding:{...draft.branding,primaryColor:e.target.value}})}/></label>
              <label>Secundario<input type="color" value={draft.branding.secondaryColor} onChange={(e)=>setDraft({...draft,branding:{...draft.branding,secondaryColor:e.target.value}})}/></label>
              <label>Acento<input type="color" value={draft.branding.accentColor} onChange={(e)=>setDraft({...draft,branding:{...draft.branding,accentColor:e.target.value}})}/></label>
              <label className={styles.full}>Logo / referencia<input value={draft.branding.logoLabel} onChange={(e)=>setDraft({...draft,branding:{...draft.branding,logoLabel:e.target.value}})} placeholder="Todavía no sube archivos; guardá una referencia"/></label>
            </div>
            <div className={styles.brandPreview} style={{background:draft.branding.primaryColor,color:draft.branding.secondaryColor,borderColor:draft.branding.accentColor}}>
              <span style={{background:draft.branding.accentColor}}/>
              <div><small>PREVIEW</small><strong>{draft.commercialName || "Tu tienda"}</strong><p>Identidad propia sin cambiar AmarangoElectro.</p></div>
            </div>
          </div>

          <div className={styles.foundation}>
            <CreditCard/><div><strong>Infraestructura real ya preparada</strong><span>Workspaces, membresías, branding, planes, módulos y asignaciones existen en la base. Este gate no los escribe todavía.</span></div>
          </div>
        </section>
      </section>
    </main>
  );
}

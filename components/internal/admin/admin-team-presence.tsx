import Image from "next/image";

const team = [
  { name: "Maxi", role: "Propietario", image: "/assets/v16-final/team/maxi.jpg", position: "50% 24%" },
  { name: "Angie", role: "Propietaria", image: "/assets/v16-final/team/angie.jpg", position: "50% 22%" },
] as const;

export function AdminTeamPresence() {
  return (
    <section className="admin-team-presence" aria-label="Equipo propietario visible en esta vista">
      <div><small>EQUIPO PROPIETARIO</small><strong>Maxi y Angie</strong><span>Presencia de demostración · sin conexión a estado productivo</span></div>
      <ul>{team.map((member) => <li key={member.name}><span className="admin-team-presence__avatar"><Image src={member.image} alt={`Foto de ${member.name}`} fill sizes="52px" style={{ objectPosition: member.position }} unoptimized /><i aria-hidden="true" /></span><span><strong>{member.name}</strong><small>{member.role} · en esta vista</small></span></li>)}</ul>
    </section>
  );
}

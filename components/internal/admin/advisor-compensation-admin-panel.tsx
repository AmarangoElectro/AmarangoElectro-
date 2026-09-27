"use client";

import { LockKeyhole, Trophy } from "lucide-react";
import {
  NOT_CONNECTED_ADVISOR_MONTHS,
  type AdvisorCompensationReadResult,
  type AdvisorMonthReadModel,
} from "@/lib/advisor-compensation/advisor-compensation-read-model";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
const quantity = (value: number) => value.toLocaleString("es-AR", { maximumFractionDigits: 1 });

export function AdvisorCompensationAdminPanel({
  result = NOT_CONNECTED_ADVISOR_MONTHS,
}: {
  result?: AdvisorCompensationReadResult<readonly AdvisorMonthReadModel[]>;
}) {
  return (
    <section className="advisor-comp-admin" aria-labelledby="advisor-comp-admin-title">
      <header><div><p className="eyebrow orange">CIERRE MENSUAL</p><h3 id="advisor-comp-admin-title">Comisiones y premios</h3></div><Trophy aria-hidden="true" /></header>
      {result.status !== "ok" ? (
        <div className="crm-empty-state" role="status"><LockKeyhole aria-hidden="true" /><b>Conexión operativa requerida</b><p>El resumen se habilita únicamente con cierres reales y auditados. No se calculan ni muestran datos de ejemplo.</p></div>
      ) : (
        <div className="advisor-comp-admin-list">
          {result.data.map((month) => (
            <article key={`${month.advisorId}:${month.period}`}>
              <div><small>ASESOR</small><strong>{month.advisorName}</strong><span>{month.period}{month.closedAt ? " · Cerrado" : " · Pendiente de cierre"}</span></div>
              <div><small>VENTAS</small><strong>{month.validSales} · {quantity(month.equivalentSales)} equiv.</strong><span>Aceptadas {month.acceptedOperations} · Pendientes {month.pendingOperations} · Excluidas {month.excludedOperations}</span></div>
              <div><small>COMISIÓN</small><strong>{money(month.commissionGeneratedArs)}</strong><span>Pagado {money(month.commissionCollectedArs)} · Pendiente {money(month.commissionPendingArs)}</span></div>
              <div><small>PREMIO</small><strong>{money(month.bonusArs)}</strong><span>{month.mainGoalReached ? `Adicional post-20: ${money(month.additionalBonusArs)}` : `Próximo objetivo: ${quantity(month.nextGoalEquivalentSales ?? 0)}`}</span></div>
            </article>
          ))}
          {result.data.length === 0 && <div className="crm-empty-state"><b>No hay cierres mensuales disponibles.</b></div>}
        </div>
      )}
    </section>
  );
}


"use client";

import { CircleDollarSign, LockKeyhole, Target, Trophy } from "lucide-react";
import {
  NOT_CONNECTED_ADVISOR_MONTH,
  type AdvisorCompensationReadResult,
  type AdvisorMonthReadModel,
} from "@/lib/advisor-compensation/advisor-compensation-read-model";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
const quantity = (value: number) => value.toLocaleString("es-AR", { maximumFractionDigits: 1 });

function ConnectionNotice({ result }: { result: Exclude<AdvisorCompensationReadResult<AdvisorMonthReadModel>, { status: "ok" }> }) {
  const copy = result.status === "unauthorized"
    ? "Tu identidad no tiene permiso para ver este cierre."
    : result.status === "error"
      ? result.message
      : "Se necesita la sesión operativa autorizada para leer ventas, entregas, cobranzas y el cierre mensual. No mostramos cifras simuladas.";
  return (
    <div className="advisor-month-disconnected" role="status">
      <LockKeyhole aria-hidden="true" />
      <div><strong>Conexión segura requerida</strong><p>{copy}</p></div>
    </div>
  );
}

export function AdvisorMonthDashboard({
  result = NOT_CONNECTED_ADVISOR_MONTH,
}: {
  result?: AdvisorCompensationReadResult<AdvisorMonthReadModel>;
}) {
  return (
    <section id="advisor-month" className="advisor-month" aria-labelledby="advisor-month-title">
      <header className="advisor-month-heading">
        <div><p className="eyebrow orange">🏆 TU MES</p><h2 id="advisor-month-title">Tu progreso, claro y verificable.</h2></div>
        <span>Comisión por operación + premio mensual</span>
      </header>
      {result.status !== "ok" ? <ConnectionNotice result={result} /> : <AdvisorMonthContent month={result.data} />}
    </section>
  );
}

function AdvisorMonthContent({ month }: { month: AdvisorMonthReadModel }) {
  const goalLabel = month.mainGoalReached
    ? `+${money(7_500)} por cada venta equivalente adicional`
    : `${quantity(month.nextGoalEquivalentSales ?? 0)} ventas → ${money(month.nextGoalBonusArs ?? 0)}`;
  return (
    <>
      <div className="advisor-month-grid">
        <article className="advisor-month-progress">
          <Trophy aria-hidden="true" />
          <small>VENTAS EQUIVALENTES</small>
          <strong>{quantity(month.equivalentSales)}{month.mainGoalReached ? "+" : ` / ${quantity(month.nextGoalEquivalentSales ?? 0)}`}</strong>
          <div className="advisor-progress-track" aria-label={`Progreso ${month.progressPercent}%`}><span style={{ width: `${month.progressPercent}%` }} /></div>
          <p>{month.mainGoalReached ? "Meta principal alcanzada — $100.000" : `Te faltan ${quantity(month.remainingEquivalentSales)} ventas equivalentes`}</p>
        </article>
        <article><Target aria-hidden="true" /><small>PREMIO ALCANZADO</small><strong>{money(month.bonusArs)}</strong><p>{goalLabel}</p></article>
        <article><CircleDollarSign aria-hidden="true" /><small>COMISIONES DEL MES</small><strong>{money(month.commissionGeneratedArs)}</strong><p>Cobradas {money(month.commissionCollectedArs)} · Pendientes {money(month.commissionPendingArs)}</p></article>
      </div>
      <div className="advisor-month-validation">
        <span><b>{month.validSales}</b> ventas válidas</span>
        <span><b>{month.pendingOperations}</b> pendientes de validación</span>
        <span><b>{month.excludedOperations}</b> excluidas</span>
      </div>
      <div className="advisor-operation-list" aria-label="Detalle de operaciones del asesor">
        {month.operations.map((operation) => (
          <article key={operation.saleId}>
            <div><small>{operation.modality === "cash" ? "CONTADO" : "FINANCIADA"}</small><strong>{operation.productLabel}</strong><span>Precio contado {money(operation.finalCashPriceArs)}</span></div>
            <div><small>COMISIÓN TOTAL</small><strong>{money(operation.commissionTotalArs)}</strong><span>Cobrado {money(operation.commissionCollectedArs)} · Pendiente {money(operation.commissionPendingArs)}</span></div>
            <div><small>PAGOS</small><strong>{operation.commissionPayments.map((payment) => `${payment.part}: ${money(payment.amountArs)}`).join(" · ")}</strong><span>{operation.commissionPayments.map((payment) => payment.status === "collected" ? "Cobrado" : "Pendiente").join(" · ")}</span></div>
            <div><small>PREMIO</small><strong>{operation.countsForBonus ? "Sí cuenta" : "No cuenta todavía"}</strong><span className={`advisor-validation is-${operation.validation}`}>{operation.validationReason}</span></div>
          </article>
        ))}
        {month.operations.length === 0 && <p className="advisor-operation-empty">No hay operaciones registradas en este período.</p>}
      </div>
      <p className="advisor-month-footnote">Período {month.period} · Política {month.policyVersion}{month.closedAt ? ` · Cierre auditado ${month.closedAt}` : " · Cierre pendiente"}</p>
    </>
  );
}


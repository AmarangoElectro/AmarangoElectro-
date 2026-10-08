"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";

type Request = {title: string; description: string; confirmLabel: string; required?: boolean; maxLength?: number};

/** Resolves only on explicit confirmation; closing or leaving the view cancels. */
export function useReasonDialog() {
  const [request, setRequest] = useState<Request | null>(null);
  const [reason, setReason] = useState("");
  const pending = useRef<((value: string | null) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => () => {pending.current?.(null); pending.current = null}, []);

  function finish(value: string | null) {
    pending.current?.(value); pending.current = null; setRequest(null);
  }
  function requestReason(options: Request): Promise<string | null> {
    pending.current?.(null);
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setReason(""); setRequest(options);
    return new Promise(resolve => {pending.current = resolve});
  }

  const reasonDialog = <Dialog.Root open={!!request} onOpenChange={open => {if(!open) finish(null)}}>
    <Dialog.Portal><Dialog.Overlay className="amarango-dialog-overlay"/><Dialog.Content className="amarango-reason-dialog"
      onCloseAutoFocus={event => {event.preventDefault(); returnFocus.current?.focus()}}>
      <small>AMARANGOELECTRO</small><Dialog.Title>{request?.title}</Dialog.Title><Dialog.Description>{request?.description}</Dialog.Description>
      <form onSubmit={event => {event.preventDefault(); if(!request?.required || reason.trim()) finish(reason.trim())}}>
        <label>Motivo {request?.required ? "(obligatorio)" : "(opcional)"}<textarea autoFocus value={reason} onChange={event => setReason(event.target.value)} maxLength={request?.maxLength ?? 1000} rows={3}/></label>
        <div className="amarango-reason-actions"><button type="button" onClick={() => finish(null)}>Volver</button><button className="primary" type="submit" disabled={!!request?.required && !reason.trim()}>{request?.confirmLabel ?? "Confirmar"}</button></div>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
  return {requestReason, reasonDialog};
}

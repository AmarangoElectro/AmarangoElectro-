"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Select } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { appSelectOptions } from "./app-select-options";

type Props = Omit<ComponentProps<"select">, "multiple" | "size">;

/** App-styled popup; the hidden native control only serializes and validates forms. */
export function AppSelect({children, value, defaultValue, onChange, name, required, disabled, form, className, style, id, onInvalid, ...props}: Props) {
  const options = appSelectOptions(children);
  const initial = String(defaultValue ?? options.find(option => !option.disabled)?.value ?? "");
  const [localValue, setLocalValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = String(value ?? localValue);
  const index = options.findIndex(option => option.value === selected);

  useEffect(() => {
    const element = native.current?.form;
    // The browser resets native options after dispatching reset. Restore our value afterwards.
    const reset = () => {queueMicrotask(() => {
      setLocalValue(initial); setInvalid(false); setOpen(false);
      if (native.current) native.current.value = String(value ?? initial);
    })};
    element?.addEventListener("reset", reset);
    return () => element?.removeEventListener("reset", reset);
  }, [initial, value]);

  return <span className={`amarango-select ${className ?? ""}`} style={style}>
    <select {...props} ref={native} className="amarango-select-native" aria-hidden="true" tabIndex={-1}
      name={name} form={form} required={required} disabled={disabled} value={selected}
      onChange={event => {setLocalValue(event.target.value); setInvalid(false); onChange?.(event)}}
      onInvalid={event => {event.preventDefault(); setInvalid(true); trigger.current?.focus(); setOpen(true); onInvalid?.(event)}}>
      {children}
    </select>
    <Select.Root value={index < 0 ? "" : String(index)} open={open} onOpenChange={setOpen} disabled={disabled}
      onValueChange={key => {
        const option = options[Number(key)];
        if (!option || option.disabled || !native.current) return;
        native.current.value = option.value;
        native.current.dispatchEvent(new Event("change", {bubbles: true}));
      }}>
      <Select.Trigger ref={trigger} id={id} form={form} className="amarango-select-trigger"
        aria-label={props["aria-label"]} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]}
        aria-required={required} aria-invalid={invalid || props["aria-invalid"]} title={props.title} autoFocus={props.autoFocus}>
        <Select.Value>{options[index]?.label ?? "Elegir opción"}</Select.Value><Select.Icon><ChevronDown size={17}/></Select.Icon>
      </Select.Trigger>
      <Select.Portal><Select.Content className="amarango-select-popup" position="popper" sideOffset={6} collisionPadding={12}>
        <Select.ScrollUpButton className="amarango-select-scroll"><ChevronUp size={16}/></Select.ScrollUpButton>
        <Select.Viewport className="amarango-select-options">
          {options.map((option, i) => <Select.Item className="amarango-select-option" key={`${i}:${option.value}`} value={String(i)} disabled={option.disabled}>
            <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className="amarango-select-check"><Check size={17}/></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="amarango-select-scroll"><ChevronDown size={16}/></Select.ScrollDownButton>
      </Select.Content></Select.Portal>
    </Select.Root>
  </span>;
}

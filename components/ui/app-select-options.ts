import { Children, Fragment, isValidElement, type ReactNode } from "react";

export type AppSelectOption = { value: string; label: string; disabled: boolean; group?: string };

function optionText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement<{ children?: ReactNode }>(node)) return optionText(node.props.children);
  return Children.toArray(node).map(child => optionText(child)).join("");
}

/** Preserve option values exactly, including empty values and implicit numeric values. */
export function appSelectOptions(children: ReactNode, group?: string, groupDisabled = false): AppSelectOption[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{value?: string | number; children?: ReactNode; label?: string; disabled?: boolean}>(child)) return [];
    if (child.type === Fragment) return appSelectOptions(child.props.children, group, groupDisabled);
    if (child.type === "optgroup") return appSelectOptions(child.props.children, child.props.label, !!child.props.disabled);
    if (child.type !== "option") return [];
    const text = optionText(child.props.children);
    return [{value: child.props.value === undefined ? text : String(child.props.value), label: child.props.label ?? text, disabled: groupDisabled || !!child.props.disabled, group}];
  });
}

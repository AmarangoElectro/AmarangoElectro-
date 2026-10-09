export function displayProductName(value: string): string {
  if (/[a-záéíóúñ]/.test(value)) return value;
  const acronyms = /^(?:TV|LED|OLED|QLED|UHD|HD|FHD|RAM|GB|TB|USB|BT|JBL|LG|TCL|RCA|BGH|AIWA|POCO|\d.*|.*\d.*)$/;
  return value.split(/(\s+)/).map(word => acronyms.test(word) || !word.trim() ? word : word.charAt(0) + word.slice(1).toLocaleLowerCase("es-AR")).join("");
}

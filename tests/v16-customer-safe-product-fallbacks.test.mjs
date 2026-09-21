import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const card=fs.readFileSync("app/components/product-card.tsx","utf8"), pdp=fs.readFileSync("app/producto/[slug]/page.tsx","utf8"), all=card+pdp;
test("technical catalog-state wording is absent",()=>{for(const x of ["FOTO OFICIAL PENDIENTE","Información pendiente del catálogo oficial.","Dato pendiente del catálogo","Cuotas no validadas","Se mostrarán al conectar el catálogo oficial","V16 no completa información ausente"]) assert.ok(!all.includes(x),x);});
test("missing image remains truthful",()=>{assert.match(card,/FOTO EN ACTUALIZACIÓN/);});
test("card uses clean consult states",()=>{for(const x of ["Consultar disponibilidad","Consultá precio y opciones de pago","Consultá opciones de pago y disponibilidad"]) assert.ok(card.includes(x),x);});
test("PDP uses clean truthful consultation copy",()=>{for(const x of ["Consultá características y disponibilidad.","Consultá disponibilidad y condiciones de entrega para tu zona.","Consultá la garantía correspondiente a este producto.","Consultá con nuestro equipo los datos comerciales que no figuren publicados."]) assert.ok(pdp.includes(x),x);});
test("no zero-value commerce facts are fabricated",()=>{for(const x of ["$0","6x $0","0 cuotas","0 meses"]) assert.ok(!all.includes(x),x);});

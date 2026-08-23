import base from "./worker.mjs";

const PRO_UX_HEAD = `
<link rel="stylesheet" href="/professional-ux.css?v=20260823-1">
`;

const PRO_UX_BODY = `
<script src="/professional-ux.js?v=20260823-1" defer></script>
`;

function aplicarUxProfesional(response) {
  const tipo = String(response.headers.get("content-type") || "").toLowerCase();
  if (!tipo.includes("text/html")) return response;
  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.append(PRO_UX_HEAD, { html: true });
      },
    })
    .on("body", {
      element(el) {
        el.append(PRO_UX_BODY, { html: true });
      },
    })
    .transform(response);
}

export default {
  async fetch(request, env, ctx) {
    const response = await base.fetch(request, env, ctx);
    if (request.method === "GET") return aplicarUxProfesional(response);
    return response;
  },
  async scheduled(controller, env, ctx) {
    if (base && typeof base.scheduled === "function") {
      return base.scheduled(controller, env, ctx);
    }
  },
};

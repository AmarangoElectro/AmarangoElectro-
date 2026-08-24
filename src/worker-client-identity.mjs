import base from "./worker-professional.mjs";
import { servirIdentidadCliente } from "./client-identity-api.mjs";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/cliente-identidad") {
      return servirIdentidadCliente(request, env);
    }
    return base.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    if (base && typeof base.scheduled === "function") {
      return base.scheduled(controller, env, ctx);
    }
  },
};

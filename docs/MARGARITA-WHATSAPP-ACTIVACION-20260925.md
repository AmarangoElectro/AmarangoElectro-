# Margarita WhatsApp — rama de activación 2026-09-25

Esta rama contiene únicamente el puente aislado para el Worker existente `amarango-margarita-whatsapp`.

## Cloudflare

El Worker existente ya conserva estas variables históricas, que el código acepta directamente:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ALLOWED_NUMBERS` o `WHATSAPP_ALLOWED_NUMBER`

No subir valores secretos a GitHub.

## Deploy command

`npx wrangler deploy -c wrangler.margarita-whatsapp.jsonc`

## Health

Después del deploy:

`/health`

debe devolver `listo: true`.

## Webhook

Acepta tanto la raíz `/` como `/webhooks/whatsapp`, para ser compatible con la configuración anterior de Meta.

## Margarita Core

El puente consulta al Worker actual de Margarita:
`https://amara.max-huracan73.workers.dev`

No modifica V16, main, producción de la tienda ni Supabase.

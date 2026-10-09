# V16 — Audio scenes and storefront installment display

## Result

Audisat, Harrison, Joog and Stromberg now have different photographic scenes. Audio also receives a category-appropriate Ken Brown scene, and separate portable-speaker, tower and soundbar scenes. Brand names remain live text in the existing drawer typography. Home hero banners, catalogue records, product photos and cash prices are unchanged.

Product cards emphasize the existing calculator's installment amount above a smaller cash price, without an orange price box. Cards, comparison and card sharing consume the same read-only installment transport. The comparison retains its price/installment-only structure, totals and final-installment rounding disclosure.

## Financing source

The old route read the private financing-mode table directly, which the runtime role cannot select. The route now obtains the current signed-in identity with the existing Sites helper and calls the existing identity-aware operational bridge for `v16_get_active_financing_mode`. It does not grant permissions or change authentication, schema, roles, financing policy or mode.

CLASSIC display estimates use the unchanged calculator engine and current Amarango policy for 2, 4 and 6 installments. The server reads catalogue prices; the browser submits only product IDs. PROTECTED mode and failed/unauthorized reads return no estimates rather than guessing private costs. Displayed installments remain indicative until an authorized quotation confirms them. No sale, quotation or payment is created by this route.

A shared browser loader batches up to 100 mounted cards per request, deduplicates concurrent reads, bounds its in-memory cache and uses a 15-second timeout. Subscriber storefront pricing and workspace data are untouched.

## Assets

Generated with the built-in image generation tool. Images are decorative category scenes, not evidence of a particular model's specifications. Each source scene is 2172 × 724; deployed images are 1536 × 512 WebP. The matching pale stone/ivory, navy and subtle orange palette leaves the left side clear for existing live text.

All assets are under `public/assets/v16-generated/audio-scenes-v2/`:

| File | Generation scene brief |
| --- | --- |
| audisat.webp | PA speaker, compact mixer and microphone in a bright rehearsal studio with pale concrete and timber acoustics. |
| harrison.webp | Party tower with restrained orange/blue rings in a sunny rooftop lounge with urban skyline. |
| joog.webp | Two compact textile portable speakers on a travertine garden table, blue sky and olive foliage. |
| stromberg.webp | Slim black tower and handled boombox in a daylight brick loft with walnut shelving. |
| ken-brown.webp | Two party towers and microphone in a bright wood-lined music room; no television or appliances. |
| parlantes-portatiles.webp | Three portable speakers with handles/straps in graphite, navy and muted orange on a garden terrace. |
| torres.webp | Two tall party towers with distinct woofer arrangements and subtle RGB rings in a limestone/wood room. |
| barras-de-sonido.webp | Slim soundbar and subwoofer under an unlit television in a bright living room with walnut console and horizontal blinds. |

## Verification

- 53 relevant automated tests passed, including distinct image hashes, category scoping, batch/dedup behavior, current-identity bridge requests, unauthorized/protected failure handling, real engine amounts and server-rendered card price hierarchy.
- Official Sites production build passed.
- Global TypeScript checking still reports existing diagnostics outside the changed files (Cloudflare worker types and internal gateway status types); no changed-file diagnostics were found.
- Android browser and signed-in deployment QA remain pending. The managed runner has no supported browser QA capability. Automatic approval review rejected a database test that attempted to simulate privileged JWT claims; it was not retried. Authorized local transport mocks and ordinary read-only diagnostics were used instead.

## Android follow-up

Open Audio; check distinct brands and the three sound categories. Open two products with cash prices and confirm the large six-installment amount and smaller cash amount on cards, then compare them and confirm the same installment values. Check sharing and reduced-motion preference. Confirm existing home banners and subscriber storefronts remain unchanged. An unmapped or expired session must show an unavailable installment state, never invented prices.

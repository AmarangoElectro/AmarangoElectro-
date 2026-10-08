# V16 — Flyer evidence and product sharing

## Product information

The existing local Spanish OCR worker now prepares small supplier images at a larger reading size, filters low-confidence lines and rejects corrupted numeric units instead of guessing them. The literal parser supports phones, appliances, ovens and audio, including multiline technical headings, dimensions and split number/unit lines. Cash prices, installment offers and internal commercial fields are not technical evidence.

Photo editors keep manual review before persisting extracted metadata through their existing authorized, workspace-scoped endpoints. Paid subscriber OCR gates remain in place. The PDP and main comparison also read existing supplier photos when technical information is sparse, without writing to the master catalogue: results live only in page memory. A single queued worker and image cache avoid simultaneous OCR jobs. Verified catalogue fields take precedence, and conflicting storage variants are discarded.

Empty technical sections are hidden. Comparisons normalize technical key aliases, show up to five keys present in every selected product, and also show up to five literal characteristics for each product. Products without common keys retain their own information. Missing evidence is never supplemented from guessed model specifications.

## Sharing

Product cards, PDP, advisor, admin and subscriber cards use one sharing flow. It prepares an actual JPEG/PNG/WebP file, the canonical product link and available installment values. Main-store missing installment information comes only from the existing read-only financing endpoint and current policy. Subscriber sharing uses that workspace's configured rates and permitted level, never the main-store finance endpoint. Total and final-installment adjustments are preserved when provided.

Native file sharing includes the link in the text caption. Preparation is warmed on pointer/focus on public cards and the PDP. If user activation expires while loading, an Amarango modal offers a fresh “Compartir ahora” tap. Cancellation does not send, copy or open WhatsApp. If native file sharing is unavailable, the message explicitly reports text/link only and offers a separate photo download. Recipient selection and final sending remain the user's actions.

## Verification

- 63 focused tests passed: literal extraction, variant guards, common-key comparison, rendered empty/populated PDP and free/paid subscriber storefronts, image bytes plus caption, user activation, cancellation, unavailable financing, route authorization and tenant isolation.
- Real OCR was run locally against read-only Samsung and Codini supplier photos using the bundled Spanish model. Small unreadable details remain absent; this is not a guarantee that every supplier image is readable.
- Official Sites production build passed. Full repository TypeScript checking still reports pre-existing Cloudflare, growth-gateway and legacy lab type errors; changed application files have no reported type errors.
- No catalogue source data, stored prices, banners, workspaces, authorization, plan status or payment integration was changed. No database mutation was needed.
- Android/WhatsApp end-to-end reception is still unverified. Open a product, use Compartir (and Compartir ahora when offered), choose WhatsApp, and inspect the actual received image, installment text and product link before declaring Android PASS.

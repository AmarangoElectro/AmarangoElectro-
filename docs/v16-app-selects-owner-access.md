# V16 — App controls and Ángela owner access

## Scope

Replace interactive native select menus throughout Administración, catalogue and subscriber tools with a shared Amarango control. Light and dark modes use the existing theme variables; selection, focus, keyboard navigation and disabled states are provided by Radix. The hidden native select remains only for form serialization and validation. Empty values and backend enum values are preserved. Acquisition sources, reward types and release conditions display Spanish labels.

Replace native reason prompts in advisor assignments, supplier threads and deliveries with an accessible Amarango modal. Dismissal resolves to `null` and performs no mutation. Explicit confirmation of an optional empty delivery note is still supported. Catalogue data, banners, subscription prices, workspace isolation and plan authorization remain unchanged.

## Owner access

The user explicitly authorized Ángela at the exact supplied email. On the V16 staging backend only, the trusted Sites identity bridge now resolves that email to an active `owner` membership with existing owner capabilities. No password, provider identity or email verification assertion was created, and no schema or authentication flow was changed. The grant was guarded by the existing active owner's membership and an email-specific advisory lock. Other memberships and production were not modified.

The real `v16_chatgpt_space_access` RPC was checked under its service-role claim in a rolled-back read transaction: Ángela and Maxi receive owner/admin/advisor flags; an unknown email receives no role or grants. The private Site viewer allowlist is updated after publication to include Ángela alongside Maxi. Site viewer access and the application's owner role are separate; this does not grant source-editor access or open the Site publicly.

## Verification

- Shared-control tests: 2 passed, including real React/Radix DOM integration for keyboard selection, FormData, validation, reset, disabled controls and modal cancellation. Run with `V16_UI_TEST_RUNTIME` pointing to an external jsdom installation; no application dependency was added.
- Role-entry, route-auth, subscriber-store, newsletter/photo access and brand-accordion regression tests: 57 passed.
- Official Sites build completed successfully.
- A broader legacy module run has 8 failing assertions, including outdated recovery text and old unauthenticated route behavior. Checked baseline source already lacks the four reported text assertions. The full repository TypeScript check also reports existing issues in offers, Cloudflare declarations and growth gateway types. Neither run is represented as fully passing.
- Actual Android interaction and Ángela's sign-in remain to be verified by the account holders. DOM tests are not Android QA.

## Android review

Reload Administración, open sources, periods and reward menus, select an option and verify its label. Review a cancellation modal and use Volver; the record must remain unchanged. Ángela opens Mi espacio using the authorized account, then Propietarios. Confirm an unknown account cannot reach internal pages. Keep the Site private and the principal catalogue unchanged.

# V16 USER ACCESS — SERVER CONTRACT
Authority: `v16_user_access`.

Required server-only operation:
`resolveCurrentAccess(authenticatedIdentity) -> { role, capabilities, advisorId }`

Rules: identity comes only from authenticated server session; authority is enforced server-side; return minimum projection; unknown/missing/disabled identity fails closed; Owner/Admin administration requires `admin.access`; Advisor workspace requires role `advisor`, non-null `advisorId`, and `advisors.access`; Customer receives no internal workspace access. No backend/RPC/SQL implementation is included in this gate.

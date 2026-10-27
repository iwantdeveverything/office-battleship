# Security & Anti-Cheat Policy

## Supported Versions

| Version | Supported |
| :--- | :---: |
| `1.0.x` (`main`) | :white_check_mark: |
| `< 1.0.0` | :x: |

## Security & Fog-of-War Boundaries

RECON-Q4 treats multiplayer anti-cheat and session isolation as first-class security invariants:

1. **Server-Side Coordinate Redaction:** [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts) never returns un-audited opponent `shipId` or `shipCode` values in `radarGrid` while a match is in `SETUP` or `IN_PROGRESS`.
2. **Player Token Masking:** Public room listings and room state payloads mask raw player `uid` tokens as `REDACTED_P1` / `REDACTED_P2` so an opponent cannot spoof turns or inspect enemy boards via network payloads.
3. **Server-Side Geometry Validation:** Fleet placement payloads submitted to `READY_FLEET` are validated server-side for bounds (`10x10`), exact template cell counts (`5, 4, 3, 3, 2`), collinearity, contiguity, and non-overlap.

## Reporting a Vulnerability

If you discover a Fog-of-War bypass, UID spoofing vector, or security vulnerability:

1. **Do not open a public issue** with exploit payloads.
2. Report the finding privately via [GitHub Security Advisories](https://github.com/iwantdeveverything/office-battleship/security/advisories/new) or contact `@hstrejoluna`.
3. Include reproduction steps, the affected endpoint or component, and the expected vs. actual payload.

# OnePDF Frontend Route Map

## Marketing (future)
| Route | Page |
|-------|------|
| `/landing` | Marketing homepage |
| `/pricing` | Pricing tiers |
| `/login` | Auth login |
| `/signup` | Auth signup |

## App Shell (authenticated)
| Route | Workspace | Inspector |
|-------|-----------|-----------|
| `/` | Home / Recent | — |
| `/files` | File browser + spaces | — |
| `/files/[id]` | File detail + versions | Properties |
| `/editor` | PDF editor (no doc) | Properties |
| `/editor/[id]` | PDF editor (document) | Properties, Comments, AI |
| `/organize` | Page organizer | Page properties |
| `/organize/[id]` | Organize specific doc | Page properties |
| `/convert` | Conversion hub | Job status |
| `/forms` | Forms hub | — |
| `/forms/[id]` | Form builder | Field inspector |
| `/sign` | Signature hub | — |
| `/sign/[id]` | Signature request detail | Audit timeline |
| `/sign/[token]` | Public signing (no shell) | — |
| `/review` | Review hub | — |
| `/review/[id]` | Review workspace | Comments |
| `/protect` | Protection hub | Security |
| `/protect/[id]` | Protect workspace | Redaction preview |
| `/compare` | Compare hub | — |
| `/compare/[id]` | Compare results | Change summary |
| `/ai` | AI Workspace | Citations |
| `/ai/[conversationId]` | AI conversation | Citations |
| `/automation` | Templates & workflows | — |
| `/settings` | User settings | — |
| `/settings/team` | Team admin | — |
| `/settings/billing` | Stripe billing | — |

## API Routes
| Route | Handler |
|-------|---------|
| `/api/v1/documents` | Document CRUD |
| `/api/v1/convert` | Conversion jobs |
| `/api/v1/ocr` | OCR jobs |
| `/api/v1/ai` | AI endpoints |
| `/api/webhooks/stripe` | Stripe webhooks |

## Query Parameters
| Param | Routes | Purpose |
|-------|--------|---------|
| `?mode=edit` | `/editor` | Active editor mode |
| `?action=upload` | `/files` | Open upload dialog |
| `?compare=docId` | `/compare` | Pre-select comparison doc |

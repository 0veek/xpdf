# OnePDF — Product Specification

> Acrobat Pro capability · Apple-grade elegance · 2026 AI-native workflow · Web-first speed

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · PDF.js · pdf-lib · Supabase · Stripe

---

## 1. Product Vision

OnePDF is a unified PDF editor platform for personal, professional, legal, academic, and enterprise document work. It targets practical feature parity with Adobe Acrobat Pro–class workflows while delivering a cleaner, faster, more elegant 2026 Apple-like experience.

**Positioning:** Acrobat-class capability without Acrobat-class clutter. More elegant visual system. Better AI trust layer. Faster common flows. Cleaner team collaboration. Better mobile signing/review.

**Core pillars:**
- **Edit anything** — text, images, pages, forms, scans, metadata, protection, structure
- **Understand instantly** — AI summaries, ask-anything, compare, extract, contextual assistance
- **Sign and collaborate** — review, comment, request signatures, approve, track progress
- **Protect and comply** — redact, password-protect, permissions, audit trails, accessible outputs
- **Move fast** — blazing performance, smart defaults, keyboard-first, minimal friction

---

## 2. Core User Personas

| Persona | Primary jobs | Key workspaces |
|---------|-------------|----------------|
| **Freelancer** | Edit contracts, invoices, proposals | Editor, Sign, Convert |
| **Student** | Annotate papers, summarize readings | Review, AI, Editor |
| **Lawyer** | Redlines, Bates numbering, redaction | Compare, Protect, Organize |
| **Ops manager** | Collect signatures, form responses | Sign, Forms, Files |
| **Accountant** | Convert statements, extract tables | Convert, AI, OCR |
| **Designer/marketer** | Polish proposals, watermarks | Editor, Protect |
| **Enterprise knowledge worker** | Multi-doc compare, AI Q&A | AI Workspace, Compare, Files |

---

## 3. Feature Architecture

```
OnePDF Platform
├── Core Engine
│   ├── PDF Renderer (PDF.js)
│   ├── PDF Editor (pdf-lib + custom text layer)
│   ├── Annotation Layer (canvas/SVG overlays)
│   ├── Form Layer (AcroForm read/write)
│   └── Worker Pool (OCR, convert, diff, rasterize)
├── Workspaces (mode-based UI)
│   ├── Editor · Organize · Convert · Forms
│   ├── Sign · Review · Protect · Compare
│   └── AI Workspace · Automation
├── Collaboration
│   ├── Realtime comments (Supabase Realtime)
│   ├── Shared review links
│   ├── Presence indicators
│   └── Version continuity
├── Security & Compliance
│   ├── Encryption (at rest + in transit)
│   ├── Redaction pipeline
│   ├── Audit logs
│   └── Accessibility validation
└── Platform Services
    ├── Auth (Supabase Auth + SSO enterprise)
    ├── Storage (Supabase Storage)
    ├── Billing (Stripe)
    ├── Job Queue (Supabase Edge Functions + pg_cron)
    └── AI (OpenAI / Anthropic via Edge Functions)
```

### Open-source library map

| Capability | Library | Notes |
|-----------|---------|-------|
| View/render | `pdfjs-dist` | Mozilla PDF.js, worker-based |
| Create/edit PDF | `pdf-lib` | Merge, split, metadata, forms |
| OCR | Tesseract via worker or server | `tesseract.js` client; server for quality |
| Diff/compare | Custom text diff + raster compare | `diff` npm package for text |
| Annotations | Custom SVG/canvas layer | Inspired by PDF.js annotation layer |
| Text editing | Custom bounding-box editor | Tiptap patterns for inline edit UX |
| State | `zustand` | Document session, undo stack |
| Virtualization | `@tanstack/react-virtual` | Thumbnails, page grid |
| Drag-and-drop | `@dnd-kit/core` | Page reorder, field builder |
| Command palette | `cmdk` (via shadcn) | ⌘K navigation |
| Auth/DB/Storage | `@supabase/supabase-js` | RLS-first |
| Payments | `stripe` | Subscriptions + usage metering |
| Theming | `next-themes` | Light/dark/system |

---

## 4. Information Architecture

### Primary navigation (left sidebar)
Home · Files · Editor · Organize · Convert · Forms · Sign · Review · Protect · Compare · AI Workspace · Automation · Settings

### Shell layout
- **Left:** Primary nav (collapsible to icons)
- **Top:** Search, breadcrumbs, doc title, collaboration presence, AI, account
- **Center:** Primary scroll region / canvas
- **Right:** Contextual inspector (properties, comments, AI, forms, a11y, signatures)

### Editor modes (toolbar tabs)
Edit · Annotate · Organize · Forms · OCR · Compare · Redact · Sign · AI

---

## 5. Workspace UX Specifications

### Editor
- **Jobs:** Direct text/image edit, object selection, undo/redo
- **Toolbar:** Select, text, image, shape, measure, zoom
- **Inspector:** Font, spacing, alignment, opacity, layer order
- **Shortcuts:** E (edit), ⌘Z/⌘⇧Z, ⌘+/- zoom
- **States:** Empty canvas, loading skeleton, font substitution warning, save conflict

### Organize Pages
- **Jobs:** Reorder, rotate, split, merge, extract, crop
- **Views:** Thumbnail grid, filmstrip
- **Batch:** Multi-select rotate/delete/extract
- **Performance:** Virtualized thumbnails for 500+ pages

### Convert
- **Jobs:** PDF↔Office/images, batch queues
- **Presets:** Smallest, balanced, print, archival, editable fidelity
- **Output:** Confidence indicators, issue summary panel

### OCR
- **Jobs:** Scan detection, language select, error correction
- **UI:** Confidence heatmap, side-by-side scan vs text, searchable overlay

### Forms
- **Jobs:** Auto-detect fields, drag-drop builder, validation, tab order
- **Inspector:** Field type, validation rules, conditional logic, submission dest

### Review
- **Jobs:** Comment, highlight, draw, stamp, mention, resolve
- **Collab:** Shared links, presence, activity feed, version threads

### Sign
- **Jobs:** Create sig, place fields, request signers, track status
- **Mobile:** Full-screen signing, draw/type/upload
- **Audit:** Timeline of viewed/signed/declined events

### Protect
- **Jobs:** Password, permissions, redact, watermark, metadata scrub
- **Safety:** Preview-before-apply redaction, sensitive info suggestions

### Compare
- **Jobs:** Side-by-side, overlay, change filter, export report
- **AI:** Summary of major revisions

### AI Workspace
- **Jobs:** Summarize, Q&A with citations, multi-doc extract, suggest redactions
- **Trust:** Source locations, confidence, confirm destructive changes, conversation history

---

## 6. Visual Design System

### Principles
Clarity · Deference to document · Depth through layers · Dense but calm · All states designed

### Typography scale (compact web-app)
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `page-title` | 18px | 600 | Workspace headings |
| `section` | 12px uppercase | 500 | Section labels |
| `body` | 14px | 400 | Default UI |
| `label` | 12px | 500 | Form labels |
| `metadata` | 12px | 400 | Timestamps, counts |

### Color
- Neutral-first surfaces (`oklch` cool grays)
- Single restrained accent (`--accent-brand`)
- Semantic: success, warning, error, security
- Canvas layer distinct from chrome (`--canvas`)

### Surfaces
`canvas` · `background` · `card` · `muted` · `sidebar` · `popover` · `floating-toolbar`

### Motion
- 150–200ms ease for panels, 250ms for modals
- `prefers-reduced-motion` respected
- Motion reveals hierarchy, never decorates

### Radius hierarchy
`sm` (4px) · `md` (6px) · `lg` (10px) · `xl` (14px)

---

## 7. Component Inventory

**Shell:** AppShell, AppSidebar, AppTopbar, InspectorPanel, CommandPalette, ThemeToggle

**Document:** PdfViewer, PageThumbnail, PageFilmstrip, DocumentTabs, ZoomControls, RulerOverlay

**Editing:** TextEditBox, ImageEditHandles, SelectionMarquee, UndoTimeline, FloatingToolbar

**Annotations:** HighlightTool, CommentThread, StickyNote, DrawingCanvas, StampPicker

**Forms:** FieldPalette, FieldInspector, TabOrderList, ValidationRuleBuilder

**Sign:** SignaturePad, SignerList, StatusBadge, AuditTimeline

**AI:** CitationBlock, ConfidenceBadge, SuggestionCard, ConversationPanel

**Shared:** EmptyState, JobProgress, FileDropzone, ShortcutSheet, ConflictDialog

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (RSC + Client Components)           │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ │
│  │ Pages   │ │ Workspace│ │ PDF Engine│ │ Workers  │ │
│  │ /app    │ │ Shell    │ │ (client)  │ │ (Web)    │ │
│  └────┬────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘ │
└───────┼───────────┼─────────────┼────────────┼────────┘
        │           │             │            │
        ▼           ▼             ▼            ▼
┌───────────────────────────────────────────────────────┐
│  API Routes / Server Actions / Edge Functions         │
│  upload · convert · ocr · sign · ai · webhooks        │
└───────────────────────────┬───────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Supabase Auth      Supabase DB         Supabase Storage
   (JWT + RLS)        (Postgres)          (encrypted blobs)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                      Stripe Billing
                      Job Queue (pg + Edge)
```

### Worker architecture
Heavy tasks run in Web Workers (client) or Edge Functions (server):
- Thumbnail generation
- OCR passes
- Page rasterization
- PDF compression
- Text diffing
- Export pipelines

---

## 9. Security & Compliance

- **Encryption:** TLS in transit; Supabase Storage SSE at rest; optional client-side encryption (enterprise)
- **RLS:** Every table policy-scoped; never trust `user_metadata` for auth
- **Redaction:** Rasterize affected regions before save; verify no text layer leakage
- **Signatures:** Immutable audit log; timestamp + IP + user agent
- **Retention:** Configurable per org; temp processing files auto-deleted (24h)
- **Sharing:** Expiring review links; permission tiers (view/comment/edit/sign)
- **Compliance:** Document event history; exportable audit reports (enterprise)

---

## 10. Accessibility

- Full keyboard navigation; visible focus rings
- Screen reader labels on all controls
- `prefers-reduced-motion` support
- High-contrast theme option
- PDF/UA validation workflow in Protect workspace
- Touch targets ≥ 44px on mobile signing

---

## 11. Performance Strategy

- Virtualized thumbnails and comment lists
- Incremental page rendering (render visible ±2 pages)
- Lazy-load inspector panels and advanced tools
- PDF.js worker off main thread
- Optimistic UI for annotations; server confirm
- Progress indicators for files > 50MB
- Service worker for shell caching (PWA, V2)

---

## 12. AI Trust Design

1. **Citations required** — every answer links to page/paragraph
2. **Confidence shown** — low-confidence flagged visually
3. **Suggestion vs applied** — distinct UI states
4. **Confirm destructive** — redactions, deletions, bulk edits need explicit OK
5. **Conversation scoped** — per file or per space
6. **No silent edits** — AI proposes; user applies

---

## 13. Monetization

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | View, annotate, basic sign (3/mo), 50MB files |
| **Pro** | $14/mo | Full edit, OCR, convert, forms, compare, redact, 100 AI credits |
| **Team** | $24/user/mo | Collaboration, shared spaces, admin, 500 AI credits |
| **Enterprise** | Custom | SSO, retention, audit, governance, unlimited AI add-on |

**Add-ons:** Extra AI credits, batch OCR, advanced signing (certificate-based)

---

## 14. Roadmap

See [ROADMAP.md](./ROADMAP.md) for milestone breakdown.

**MVP (V1):** Auth, file upload, PDF viewer, basic annotations, page organize, export PDF, light/dark shell

**V2:** Text editing, OCR, convert, forms builder, e-sign, AI summarize/Q&A

**V3:** Compare, redact, collaboration, automation, enterprise SSO, preflight

---

## 15. Microcopy

**Homepage hero:** "Your documents, understood."  
**Subhead:** "Edit, sign, protect, and explore PDFs with professional depth and none of the clutter."

**Empty editor:** "Import a PDF to begin editing"  
**OCR in progress:** "Recognizing text… This may take a moment for large scans."  
**Redaction confirm:** "This permanently removes content. Preview before applying."  
**AI citation:** "Source: Page 4, paragraph 2"  
**Sign sent:** "Signature request sent. You'll be notified when it's complete."

---

## 16. Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| PDF text edit fidelity | Font substitution warnings; fallback to overlay text boxes |
| OCR accuracy | Human correction flow; confidence heatmaps |
| Large file performance | Workers, virtualization, streaming upload |
| Redaction leaks | Rasterize + verify pipeline |
| Scope creep | Strict phased roadmap; mode-based UI contains complexity |
| AI hallucination | Citations required; no auto-apply for edits |

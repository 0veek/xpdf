# OnePDF Roadmap

Free, client-side PDF editor. No accounts, no backend. Everything runs in the browser via IndexedDB.

---

## M1 — Core Editor ✅

- [x] Local file import (PDF + images → PDF)
- [x] IndexedDB document storage
- [x] Multi-page PDF viewer with zoom
- [x] Annotations: highlight, underline, sticky notes
- [x] Undo/redo
- [x] Page organize: drag reorder, rotate, delete, merge
- [x] Export PDF with annotations burned in

---

## V2 — Professional Tools ✅

### Convert
- [x] PDF → PNG/JPEG export (all pages)
- [x] Text export from PDF text layer (.txt)

### OCR
- [x] Tesseract.js integration
- [x] Language selection
- [x] Side-by-side correction UI
- [x] OCR results saved per page in IndexedDB

### Forms
- [x] Read AcroForm fields (pdf-lib)
- [x] Fill text, checkbox, dropdown, radio fields
- [x] Export filled PDF

### Sign
- [x] Signature pad (draw) and typed signature
- [x] Place signature on page
- [x] Export signed PDF

### Review
- [x] Draw, stamp, highlight, underline, sticky notes
- [x] Comment threads on annotations

### AI (local)
- [x] Word/character stats
- [x] Extractive summary (first key sentences)
- [x] Keyword search with context snippets

---

## V3 — Advanced ✅

### Compare
- [x] Side-by-side page visual comparison
- [x] Text diff (added/removed lines)

### Protect
- [x] Redaction boxes with preview-before-apply
- [x] Watermark overlay
- [x] Metadata scrub

### Automation
- [x] Batch export pages as PNG
- [x] Saved presets (localStorage)
- [x] One-click watermark / scrub / text export

---

## Architecture

```
Browser only
├── IndexedDB — documents, annotations, OCR data
├── PDF.js — render + text extraction
├── pdf-lib — edit, forms, merge, export, watermark
├── Tesseract.js — OCR
└── diff — text comparison
```

**Note:** True PDF password encryption is not supported in-browser (pdf-lib limitation). Protect uses watermark + redaction + metadata scrub.

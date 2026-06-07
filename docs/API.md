# OnePDF API Surface

Base URL: `/api/v1`

All authenticated routes require `Authorization: Bearer <supabase_jwt>`.

---

## Documents

```
POST   /documents                    Upload new document
GET    /documents                    List documents (paginated)
GET    /documents/:id                Get document metadata
PATCH  /documents/:id                Update title, metadata
DELETE /documents/:id                Delete document
GET    /documents/:id/download       Download current version
POST   /documents/:id/versions       Create new version from upload
GET    /documents/:id/versions       List versions
```

## Pages & Organize

```
GET    /documents/:id/pages          List page metadata + thumbnail URLs
POST   /documents/:id/pages/reorder  Reorder pages { order: number[] }
POST   /documents/:id/pages/rotate   Rotate pages { pages: number[], degrees: 90|180|270 }
POST   /documents/:id/pages/extract  Extract pages → new document
POST   /documents/:id/pages/delete   Delete pages
POST   /documents/:id/merge          Merge another document { sourceId }
POST   /documents/:id/split          Split at pages { at: number[] }
```

## Annotations

```
GET    /documents/:id/annotations
POST   /documents/:id/annotations
PATCH  /annotations/:id
DELETE /annotations/:id
POST   /annotations/:id/resolve
```

## Comments

```
GET    /annotations/:id/thread
POST   /annotations/:id/comments
PATCH  /comments/:id
DELETE /comments/:id
```

## Convert

```
POST   /convert                      Start conversion job
GET    /jobs/:id                     Job status + result
DELETE /jobs/:id                     Cancel job

# POST /convert body
{
  "sourceDocumentId": "uuid",
  "targetFormat": "docx" | "xlsx" | "pptx" | "png" | "jpg" | "tiff",
  "preset": "balanced" | "smallest" | "print" | "archival" | "editable"
}
```

## OCR

```
POST   /documents/:id/ocr            Start OCR job
GET    /documents/:id/ocr/results    OCR text layers + confidence map
PATCH  /documents/:id/ocr/corrections  Submit manual corrections
```

## Forms

```
GET    /documents/:id/forms/fields
POST   /documents/:id/forms/fields
PATCH  /forms/fields/:id
DELETE /forms/fields/:id
POST   /documents/:id/forms/detect   Auto-detect fields
POST   /documents/:id/forms/submit   Submit filled form
GET    /documents/:id/forms/responses
```

## Sign

```
POST   /documents/:id/sign/requests  Create signature request
GET    /sign/requests/:id
POST   /sign/requests/:id/send
GET    /sign/requests/:id/signers
POST   /sign/requests/:id/remind
POST   /sign/:token/complete         Public signer endpoint
```

## Protect

```
POST   /documents/:id/protect        Apply password/permissions
POST   /documents/:id/redact         Apply redactions { regions[] }
POST   /documents/:id/watermark
POST   /documents/:id/metadata/scrub
GET    /documents/:id/accessibility  Run a11y validation
```

## Compare

```
POST   /compare                      { docA, docB, mode: "side-by-side" | "overlay" }
GET    /compare/:jobId/results
```

## AI

```
POST   /ai/conversations
GET    /ai/conversations/:id
POST   /ai/conversations/:id/messages  { content, documentIds? }
POST   /ai/summarize                   { documentId }
POST   /ai/extract                     { documentId, schema }
POST   /ai/suggest-redactions
```

## Spaces & Collaboration

```
POST   /spaces
GET    /spaces/:id
POST   /spaces/:id/documents
POST   /documents/:id/share            { permission, expiresAt }
GET    /documents/:id/activity
```

## Billing (Stripe)

```
POST   /billing/checkout               Create Stripe checkout session
POST   /billing/portal                 Customer portal
POST   /webhooks/stripe               Stripe webhook handler
GET    /billing/usage                  Current plan + credits
```

## Realtime (Supabase channels)

```
document:{id}          Annotation + comment updates
presence:{documentId}  User presence
job:{id}               Processing progress
```

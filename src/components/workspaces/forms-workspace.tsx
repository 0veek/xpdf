"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentStore } from "@/stores/document-store";
import { getFormFields, fillFormFields } from "@/lib/pdf/forms";
import type { FormFieldInfo } from "@/lib/pdf/types";
import { downloadBlob } from "@/lib/pdf/types";
import { exportWithAnnotations } from "@/lib/pdf/operations";

type FormsWorkspaceProps = { documentId: string };

export function FormsWorkspace({ documentId }: FormsWorkspaceProps) {
  const router = useRouter();
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loadingFields, setLoadingFields] = useState(true);

  const { currentDocument, annotations, isLoading, openDocument, updateDocumentData, saveFormValues } =
    useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/forms");
    });
  }, [documentId, openDocument, router]);

  useEffect(() => {
    if (!currentDocument) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoadingFields(true);
      getFormFields(currentDocument.data)
        .then((f) => {
          if (cancelled) return;
          setFields(f);
          const initial: Record<string, string | boolean> = { ...currentDocument.formValues };
          for (const field of f) {
            if (initial[field.name] === undefined && field.value !== undefined) {
              initial[field.name] = field.value;
            }
          }
          setValues(initial);
        })
        .catch(() => {
          if (!cancelled) toast.error("Failed to read form fields");
        })
        .finally(() => {
          if (!cancelled) setLoadingFields(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [currentDocument]);

  const handleSave = async () => {
    if (!currentDocument) return;
    try {
      const filled = await fillFormFields(currentDocument.data, values);
      await updateDocumentData(filled);
      await saveFormValues(values);
      toast.success("Form saved");
    } catch {
      toast.error("Failed to save form");
    }
  };

  const handleExport = async () => {
    if (!currentDocument) return;
    try {
      const filled = await fillFormFields(currentDocument.data, values);
      const withAnn = await exportWithAnnotations(filled, annotations);
      downloadBlob(new Blob([withAnn], { type: "application/pdf" }), currentDocument.name);
      toast.success("Exported filled PDF");
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="Forms"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Forms", href: "/forms" },
        { label: currentDocument.name },
      ]}
    >
      <div className="flex flex-col gap-6 p-6 max-w-lg">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentDocument.name}</p>
        </div>

        {loadingFields ? (
          <p className="text-sm text-muted-foreground">Reading form fields…</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-lg p-4">
            No interactive form fields detected in this PDF.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <Label className="text-xs">{field.name}</Label>
                {field.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!values[field.name]}
                      onCheckedChange={(c) =>
                        setValues((v) => ({ ...v, [field.name]: !!c }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">{field.type}</span>
                  </div>
                ) : field.type === "dropdown" || field.type === "radio" ? (
                  <select
                    className="flex h-8 w-full rounded-lg border bg-background px-2 text-sm"
                    value={String(values[field.name] ?? "")}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={String(values[field.name] ?? "")}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>Save to document</Button>
              <Button variant="outline" onClick={handleExport}>Export filled PDF</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

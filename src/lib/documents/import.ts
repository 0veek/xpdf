import { editorHref, isXhtmlFilename } from "@/lib/documents/kind";
import { imagesToPdf } from "@/lib/pdf/operations";

function isXhtmlFile(file: File): boolean {
  return (
    isXhtmlFilename(file.name) ||
    file.type === "application/xhtml+xml" ||
    file.type === "text/html" ||
    file.type === "application/xml" ||
    file.type === "text/xml"
  );
}

export type ImportHandlers = {
  importFile: (file: File) => Promise<string>;
  importBuffer: (name: string, data: ArrayBuffer) => Promise<string>;
};

export type ImportResult = {
  id: string;
  name: string;
  href: string;
  message: string;
};

export async function importDocumentsFromFiles(
  files: File[],
  handlers: ImportHandlers
): Promise<ImportResult | null> {
  const xhtml = files.filter(isXhtmlFile);
  const pdfs = files.filter((f) => f.type === "application/pdf");
  const images = files.filter((f) => f.type.startsWith("image/"));

  if (xhtml.length > 0) {
    const file = xhtml[0];
    const id = await handlers.importFile(file);
    return {
      id,
      name: file.name,
      href: editorHref(id, { name: file.name, kind: "xhtml" }),
      message: `Imported ${file.name}`,
    };
  }

  if (pdfs.length > 0) {
    const file = pdfs[0];
    const id = await handlers.importFile(file);
    return {
      id,
      name: file.name,
      href: editorHref(id, { name: file.name, kind: "pdf" }),
      message: `Imported ${file.name}`,
    };
  }

  if (images.length > 0) {
    const data = await imagesToPdf(images);
    const name =
      images.length === 1 ? `${images[0].name.replace(/\.\w+$/, "")}.pdf` : "Images.pdf";
    const id = await handlers.importBuffer(name, data);
    return {
      id,
      name,
      href: editorHref(id, { name, kind: "pdf" }),
      message: `Created PDF from ${images.length} image(s)`,
    };
  }

  return null;
}

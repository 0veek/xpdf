import xmlFormat from "xml-formatter";

export function arrayBufferToText(data: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(data);
}

export function textToArrayBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

export function validateXhtml(source: string): { valid: boolean; error?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    const message = parseError.textContent?.trim() || "Invalid XHTML/XML";
    return { valid: false, error: message.slice(0, 500) };
  }
  return { valid: true };
}

export function formatXhtml(source: string): string {
  try {
    return xmlFormat(source, {
      indentation: "  ",
      collapseContent: true,
      lineSeparator: "\n",
    });
  } catch {
    return source;
  }
}

export const BLANK_XHTML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Untitled</title>
  </head>
  <body>
    <h1>Hello, XHTML</h1>
    <p>Start editing your document.</p>
  </body>
</html>
`;

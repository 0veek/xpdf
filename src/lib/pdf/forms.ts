import { PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";
import { loadPdf } from "./operations";
import type { FormFieldInfo } from "./types";

export async function getFormFields(data: ArrayBuffer): Promise<FormFieldInfo[]> {
  const pdf = await loadPdf(data);
  const form = pdf.getForm();
  const fields = form.getFields();
  const result: FormFieldInfo[] = [];

  for (const field of fields) {
    const name = field.getName();
    const ctor = field.constructor.name;

    if (field instanceof PDFTextField) {
      result.push({ name, type: "text", value: field.getText() ?? "" });
    } else if (field instanceof PDFCheckBox) {
      result.push({ name, type: "checkbox", value: field.isChecked() });
    } else if (field instanceof PDFDropdown) {
      const options = field.getOptions();
      result.push({
        name,
        type: "dropdown",
        value: field.getSelected()?.[0] ?? "",
        options,
      });
    } else if (field instanceof PDFRadioGroup) {
      result.push({
        name,
        type: "radio",
        value: field.getSelected() ?? "",
        options: field.getOptions(),
      });
    } else {
      result.push({ name, type: ctor.replace("PDF", "").replace("Field", "").toLowerCase() });
    }
  }

  return result;
}

export async function fillFormFields(
  data: ArrayBuffer,
  values: Record<string, string | boolean>
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    try {
      if (typeof value === "boolean") {
        const cb = form.getCheckBox(name);
        if (value) {
          cb.check();
        } else {
          cb.uncheck();
        }
      } else {
        const tf = form.getTextField(name);
        tf.setText(value);
      }
    } catch {
      try {
        const dd = form.getDropdown(name);
        dd.select(value as string);
      } catch {
        try {
          const rg = form.getRadioGroup(name);
          rg.select(value as string);
        } catch {
          // Field type mismatch — skip
        }
      }
    }
  }

  form.updateFieldAppearances();
  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function hasFormFields(data: ArrayBuffer): Promise<boolean> {
  const fields = await getFormFields(data);
  return fields.length > 0;
}

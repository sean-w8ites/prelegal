"use client";

import { io } from "next/cache";
import { use, useMemo, useState } from "react";
import { MndaFormFields } from "@/components/MndaFormFields";
import { MndaPreview } from "@/components/MndaPreview";
import { buildMnda, type Block, type MndaDocument } from "@/lib/mnda/document";
import { defaultForm, toIsoDate } from "@/lib/mnda/form";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Firefox and Safari need the link in the document, and the URL alive until the download starts.
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// The PDF and Word libraries are large, so they are only loaded when a download is requested.
async function downloadPdf(doc: MndaDocument) {
  const [{ pdf }, { MndaPdf }] = await Promise.all([import("@react-pdf/renderer"), import("@/lib/mnda/pdf")]);
  download(await pdf(<MndaPdf doc={doc} />).toBlob(), "Mutual-NDA.pdf");
}

async function downloadDocx(doc: MndaDocument) {
  const { toDocxBlob } = await import("@/lib/mnda/docx");
  download(await toDocxBlob(doc), "Mutual-NDA.docx");
}

const buttonClass =
  "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";

export function MndaCreator({ standardTerms }: { standardTerms: Block[] }) {
  // Read the current date at request time rather than baking the build date into the page.
  use(io());
  const [form, setForm] = useState(() => defaultForm(toIsoDate(new Date())));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const doc = useMemo(() => buildMnda(form, standardTerms), [form, standardTerms]);

  async function handleDownload(generate: (doc: MndaDocument) => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await generate(doc);
    } catch (e) {
      console.error(e);
      setError("Sorry, the document could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <section aria-label="MNDA details">
        <MndaFormFields form={form} onChange={setForm} />
      </section>
      <section aria-label="Document preview" className="min-w-0">
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 bg-gray-100 py-2" aria-busy={busy}>
          <button type="button" className={buttonClass} disabled={busy} onClick={() => handleDownload(downloadPdf)}>
            Download PDF
          </button>
          <button type="button" className={buttonClass} disabled={busy} onClick={() => handleDownload(downloadDocx)}>
            Download Word
          </button>
          {busy && <span className="text-sm text-gray-600">Generating...</span>}
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        </div>
        <MndaPreview doc={doc} />
      </section>
    </div>
  );
}

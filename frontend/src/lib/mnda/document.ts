import { formatDate, type MndaForm } from "./form";

/** A run of text with optional bold styling. */
export type Run = { text: string; bold?: boolean };

/**
 * Format-neutral description of the MNDA. The HTML preview, PDF and Word
 * renderers each convert this into their own output.
 */
export type Block =
  | { type: "title"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; runs: Run[]; number?: string; small?: boolean }
  | { type: "parties"; rows: { label: string; party1: string; party2: string }[] }
  | { type: "pageBreak" };

export type MndaDocument = Block[];

/** Shown in place of an empty field so it can be completed by hand. */
export const BLANK = "____________________";

const orBlank = (value: string) => value.trim() || BLANK;

const plural = (years: number) => `${years} year${years === 1 ? "" : "s"}`;

const paragraph = (text: string): Block => ({ type: "paragraph", runs: [{ text }] });

/** Parses templates/Mutual-NDA.md into blocks. Pure, so it can run at build time or in tests. */
export function parseStandardTerms(markdown: string): Block[] {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith("# ")) return { type: "title", text: chunk.slice(2).trim() };
      const numbered = /^(\d+)\.\s+([\s\S]*)$/.exec(chunk);
      if (numbered) return { type: "paragraph", number: numbered[1], runs: parseInline(numbered[2]) };
      return { type: "paragraph", runs: parseInline(chunk), small: true };
    });
}

/**
 * Strips template-only markup and splits **bold** segments into runs. Links become
 * "text (url)" so the CC BY 4.0 licence URL survives in PDF and Word output.
 */
export function parseInline(text: string): Run[] {
  const plain = text
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  return plain
    .split("**")
    .map((segment, i) => (i % 2 === 1 ? { text: segment, bold: true } : { text: segment }))
    .filter((run) => run.text);
}

/** Builds the full MNDA: the filled-in Cover Page followed by the Standard Terms. */
export function buildMnda(form: MndaForm, standardTerms: Block[]): MndaDocument {
  const mndaTerm =
    form.mndaTerm.kind === "expires"
      ? `Expires ${plural(form.mndaTerm.years)} from Effective Date.`
      : "Continues until terminated in accordance with the terms of the MNDA.";

  const confidentialityTerm =
    form.confidentialityTerm.kind === "years"
      ? `${plural(form.confidentialityTerm.years)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : "In perpetuity.";

  const partyRow = (label: string, key: keyof MndaForm["party1"]) => ({
    label,
    party1: form.party1[key].trim(),
    party2: form.party2[key].trim(),
  });

  return [
    { type: "title", text: "Mutual Non-Disclosure Agreement" },
    { type: "heading", text: "Using this Mutual Non-Disclosure Agreement" },
    {
      type: "paragraph",
      runs: [
        { text: "This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“" },
        { text: "Cover Page", bold: true },
        { text: "”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (“" },
        { text: "Standard Terms", bold: true },
        {
          text: "”) identical to those posted at commonpaper.com/standards/mutual-nda/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.",
        },
      ],
    },
    { type: "heading", text: "Purpose" },
    paragraph(orBlank(form.purpose)),
    { type: "heading", text: "Effective Date" },
    paragraph(formatDate(form.effectiveDate) || BLANK),
    { type: "heading", text: "MNDA Term" },
    paragraph(mndaTerm),
    { type: "heading", text: "Term of Confidentiality" },
    paragraph(confidentialityTerm),
    { type: "heading", text: "Governing Law & Jurisdiction" },
    paragraph(`Governing Law: ${orBlank(form.governingLaw)}`),
    paragraph(`Jurisdiction: ${orBlank(form.jurisdiction)}`),
    { type: "heading", text: "MNDA Modifications" },
    paragraph(form.modifications.trim() || "None."),
    paragraph("By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date."),
    {
      type: "parties",
      rows: [
        { label: "Signature", party1: "", party2: "" },
        partyRow("Print Name", "name"),
        partyRow("Title", "title"),
        partyRow("Company", "company"),
        partyRow("Notice Address", "noticeAddress"),
        { label: "Date", party1: "", party2: "" },
      ],
    },
    {
      type: "paragraph",
      small: true,
      runs: [
        {
          text: "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).",
        },
      ],
    },
    { type: "pageBreak" },
    ...standardTerms,
  ];
}

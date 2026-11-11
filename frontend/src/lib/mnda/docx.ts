import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Block, MndaDocument, Run } from "./document";

// Word ignores "\n" inside a run, so each line after the first starts with an explicit break.
const runs = (items: Run[], size?: number) =>
  items.flatMap((run) =>
    run.text.split("\n").map((line, i) => new TextRun({ text: line, bold: run.bold, size, break: i > 0 ? 1 : undefined })),
  );

const cell = (text: string, bold = false) =>
  new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 100, right: 100 },
    children: [new Paragraph({ children: runs([{ text, bold }]) })],
  });

function toDocxBlocks(block: Block): (Paragraph | Table)[] {
  switch (block.type) {
    case "title":
      return [new Paragraph({ text: block.text, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })];
    case "heading":
      return [new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2, spacing: { before: 240 } })];
    case "paragraph": {
      const number = block.number ? [new TextRun(`${block.number}. `)] : [];
      return [
        new Paragraph({
          children: [...number, ...runs(block.runs, block.small ? 16 : undefined)],
          spacing: { after: 160 },
          alignment: block.number ? AlignmentType.JUSTIFIED : undefined,
        }),
      ];
    }
    case "parties":
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [cell(""), cell("PARTY 1", true), cell("PARTY 2", true)] }),
            ...block.rows.map(
              (row) => new TableRow({ children: [cell(row.label, true), cell(row.party1), cell(row.party2)] }),
            ),
          ],
        }),
        new Paragraph({ text: "" }),
      ];
    case "pageBreak":
      return [new Paragraph({ children: [new PageBreak()] })];
  }
}

export function toDocx(doc: MndaDocument): Document {
  return new Document({
    creator: "Prelegal",
    title: "Mutual Non-Disclosure Agreement",
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children: doc.flatMap(toDocxBlocks) }],
  });
}

export function toDocxBlob(doc: MndaDocument): Promise<Blob> {
  return Packer.toBlob(toDocx(doc));
}

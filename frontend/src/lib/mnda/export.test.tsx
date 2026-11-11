import { renderToBuffer } from "@react-pdf/renderer";
import { Packer } from "docx";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildMnda, parseStandardTerms } from "./document";
import { toDocx } from "./docx";
import { defaultForm } from "./form";
import { MndaPdf } from "./pdf";

const doc = buildMnda(defaultForm("2026-11-11"), parseStandardTerms("# Standard Terms\n\n1. **Intro**. Text."));

describe("document export", () => {
  it("generates a Word document", async () => {
    const buffer = await Packer.toBuffer(toDocx(doc));
    expect(buffer.subarray(0, 2).toString()).toBe("PK"); // .docx is a zip archive
  });

  it("turns newlines into Word line breaks", async () => {
    const multiLine = buildMnda({ ...defaultForm("2026-11-11"), modifications: "First change\nSecond change" }, []);
    const files = unzipSync(new Uint8Array(await Packer.toBuffer(toDocx(multiLine))));
    const xml = strFromU8(files["word/document.xml"]);
    expect(xml).toMatch(/First change<\/w:t>[\s\S]*?<w:br\/>[\s\S]*?Second change/);
  });

  it("generates a PDF", async () => {
    const buffer = await renderToBuffer(<MndaPdf doc={doc} />);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

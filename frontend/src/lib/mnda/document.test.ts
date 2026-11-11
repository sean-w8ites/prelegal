import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BLANK, buildMnda, parseInline, parseStandardTerms, type Block } from "./document";
import { defaultForm, formatDate, type MndaForm } from "./form";

const templatePath = path.resolve(__dirname, "../../../../templates/Mutual-NDA.md");
const standardTerms = parseStandardTerms(readFileSync(templatePath, "utf-8"));

/** Concatenates all visible text in the document, for simple assertions. */
const textOf = (blocks: Block[]) =>
  blocks
    .map((block) => {
      if (block.type === "title" || block.type === "heading") return block.text;
      if (block.type === "paragraph") return block.runs.map((run) => run.text).join("");
      if (block.type === "parties") return block.rows.map((r) => `${r.label} ${r.party1} ${r.party2}`).join("\n");
      return "";
    })
    .join("\n");

describe("parseInline", () => {
  it("strips spans, keeps link URLs as text and splits bold runs", () => {
    expect(parseInline('**Introduction**. Use for the <span class="coverpage_link">Purpose</span> [here](https://x.y).')).toEqual([
      { text: "Introduction", bold: true },
      { text: ". Use for the Purpose here (https://x.y)." },
    ]);
  });
});

describe("parseStandardTerms", () => {
  it("parses the template into a title, 11 numbered sections and the license footer", () => {
    expect(standardTerms[0]).toEqual({ type: "title", text: "Standard Terms" });
    const numbered = standardTerms.filter((b) => b.type === "paragraph" && b.number);
    expect(numbered.map((b) => b.type === "paragraph" && b.number)).toEqual(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
    );
    expect(standardTerms.at(-1)).toMatchObject({ type: "paragraph", small: true });
    expect(textOf(standardTerms)).not.toMatch(/<span|\*\*|\]\(/);
    expect(textOf(standardTerms)).toContain("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)");
  });
});

describe("formatDate", () => {
  it("formats ISO dates and rejects empty input", () => {
    expect(formatDate("2026-11-11")).toBe("November 11, 2026");
    expect(formatDate("")).toBe("");
  });
});

describe("buildMnda", () => {
  const filled: MndaForm = {
    ...defaultForm("2026-11-11"),
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    mndaTerm: { kind: "expires", years: 2 },
    confidentialityTerm: { kind: "years", years: 3 },
    party1: { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.test" },
    party2: { name: "Alan Turing", title: "CTO", company: "Widgets Ltd.", noticeAddress: "alan@widgets.test" },
  };

  it("fills the cover page from the form and appends the standard terms", () => {
    const doc = buildMnda(filled, standardTerms);
    const text = textOf(doc);
    expect(doc[0]).toEqual({ type: "title", text: "Mutual Non-Disclosure Agreement" });
    expect(text).toContain("November 11, 2026");
    expect(text).toContain("Expires 2 years from Effective Date.");
    expect(text).toContain("3 years from Effective Date, but in the case of trade secrets");
    expect(text).toContain("Governing Law: Delaware");
    expect(text).toContain("Jurisdiction: courts located in New Castle, DE");
    expect(text).toContain("Company Acme Inc. Widgets Ltd.");
    expect(text).toContain("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)");
    expect(doc.slice(-standardTerms.length)).toEqual(standardTerms);
  });

  it("uses singular years and the alternative term options", () => {
    const text = textOf(buildMnda(defaultForm("2026-11-11"), []));
    expect(text).toContain("Expires 1 year from Effective Date.");

    const open = textOf(
      buildMnda(
        { ...filled, mndaTerm: { kind: "untilTerminated", years: 2 }, confidentialityTerm: { kind: "perpetual", years: 3 } },
        [],
      ),
    );
    expect(open).toContain("Continues until terminated in accordance with the terms of the MNDA.");
    expect(open).toContain("In perpetuity.");
  });

  it("shows blanks for missing required fields and 'None.' for no modifications", () => {
    const text = textOf(buildMnda({ ...defaultForm(""), purpose: " " }, []));
    expect(text).toContain(`Governing Law: ${BLANK}`);
    expect(text.match(new RegExp(BLANK, "g"))).toHaveLength(4); // purpose, date, law, jurisdiction
    expect(text).toContain("None.");
  });
});

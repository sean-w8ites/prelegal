export type Party = {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type MndaForm = {
  purpose: string;
  /** ISO date string, YYYY-MM-DD. */
  effectiveDate: string;
  /** `years` is kept when the other option is selected, so switching back restores it. */
  mndaTerm: { kind: "expires" | "untilTerminated"; years: number };
  confidentialityTerm: { kind: "years" | "perpetual"; years: number };
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
};

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

/** Defaults mirror templates/Mutual-NDA-coverpage.md. */
export function defaultForm(today: string): MndaForm {
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: today,
    mndaTerm: { kind: "expires", years: 1 },
    confidentialityTerm: { kind: "years", years: 1 },
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "2026-11-11" -> "November 11, 2026". Returns "" for an empty or invalid date. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

import { useId, useState, type ReactNode } from "react";
import type { MndaForm, Party } from "@/lib/mnda/form";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-gray-200 pt-4">
      <legend className="pr-2 font-semibold text-gray-900">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Whole-number years input. Keeps its own text while editing so the box can be cleared and
 * retyped; only valid values (integers >= 1) are passed up, and blur restores the last valid value.
 */
function YearsInput({ label, value, onChange }: { label: string; value: number; onChange: (years: number) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <input
      type="number"
      min={1}
      step={1}
      value={text}
      aria-label={label}
      onChange={(e) => {
        setText(e.target.value);
        const years = Number(e.target.value);
        if (Number.isInteger(years) && years >= 1) onChange(years);
      }}
      onBlur={() => setText(String(value))}
      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  );
}

/**
 * A two-option term choice, e.g. "Expires [N] year(s) from the effective date" or "Continues until terminated".
 * Editing the years selects the years option.
 */
function TermChoice({
  legend,
  yearsSelected,
  years,
  yearsPrefix,
  yearsLabel,
  otherLabel,
  onSelectYears,
  onSelectOther,
}: {
  legend: string;
  yearsSelected: boolean;
  years: number;
  yearsPrefix?: string;
  yearsLabel: string;
  otherLabel: string;
  onSelectYears: (years: number) => void;
  onSelectOther: () => void;
}) {
  const name = useId();
  const yearsId = `${name}-years`;
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-gray-700">{legend}</legend>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="radio"
          id={yearsId}
          name={name}
          checked={yearsSelected}
          onChange={() => onSelectYears(years)}
        />
        {yearsPrefix && <label htmlFor={yearsId}>{yearsPrefix}</label>}
        <YearsInput label={yearsLabel} value={years} onChange={onSelectYears} />
        <label htmlFor={yearsId}>year(s) from the effective date</label>
      </div>
      <label className="mt-1 flex items-center gap-2 text-sm">
        <input type="radio" name={name} checked={!yearsSelected} onChange={onSelectOther} />
        {otherLabel}
      </label>
    </fieldset>
  );
}

function PartyFields({ title, party, onChange }: { title: string; party: Party; onChange: (party: Party) => void }) {
  const set = (key: keyof Party) => (e: { target: { value: string } }) => onChange({ ...party, [key]: e.target.value });
  return (
    <Section title={title}>
      <Field label="Print name">
        <input className={inputClass} value={party.name} onChange={set("name")} />
      </Field>
      <Field label="Title">
        <input className={inputClass} value={party.title} onChange={set("title")} />
      </Field>
      <Field label="Company">
        <input className={inputClass} value={party.company} onChange={set("company")} />
      </Field>
      <Field label="Notice address (email or postal)">
        <input className={inputClass} value={party.noticeAddress} onChange={set("noticeAddress")} />
      </Field>
    </Section>
  );
}

export function MndaFormFields({ form, onChange }: { form: MndaForm; onChange: (form: MndaForm) => void }) {
  const update = (patch: Partial<MndaForm>) => onChange({ ...form, ...patch });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement terms">
        <Field label="Purpose (how Confidential Information may be used)">
          <textarea
            className={inputClass}
            rows={3}
            value={form.purpose}
            onChange={(e) => update({ purpose: e.target.value })}
          />
        </Field>
        <Field label="Effective date">
          <input
            type="date"
            className={inputClass}
            value={form.effectiveDate}
            onChange={(e) => update({ effectiveDate: e.target.value })}
          />
        </Field>

        <TermChoice
          legend="MNDA term"
          yearsSelected={form.mndaTerm.kind === "expires"}
          years={form.mndaTerm.years}
          yearsPrefix="Expires"
          yearsLabel="MNDA term in years"
          otherLabel="Continues until terminated"
          onSelectYears={(years) => update({ mndaTerm: { kind: "expires", years } })}
          onSelectOther={() => update({ mndaTerm: { ...form.mndaTerm, kind: "untilTerminated" } })}
        />
        <TermChoice
          legend="Term of confidentiality"
          yearsSelected={form.confidentialityTerm.kind === "years"}
          years={form.confidentialityTerm.years}
          yearsLabel="Term of confidentiality in years"
          otherLabel="In perpetuity"
          onSelectYears={(years) => update({ confidentialityTerm: { kind: "years", years } })}
          onSelectOther={() => update({ confidentialityTerm: { ...form.confidentialityTerm, kind: "perpetual" } })}
        />

        <Field label="Governing law (state)">
          <input
            className={inputClass}
            placeholder="e.g. Delaware"
            value={form.governingLaw}
            onChange={(e) => update({ governingLaw: e.target.value })}
          />
        </Field>
        <Field label="Jurisdiction (city or county and state)">
          <input
            className={inputClass}
            placeholder="e.g. courts located in New Castle, DE"
            value={form.jurisdiction}
            onChange={(e) => update({ jurisdiction: e.target.value })}
          />
        </Field>
        <Field label="MNDA modifications (optional)">
          <textarea
            className={inputClass}
            rows={2}
            value={form.modifications}
            onChange={(e) => update({ modifications: e.target.value })}
          />
        </Field>
      </Section>

      <PartyFields title="Party 1" party={form.party1} onChange={(party1) => update({ party1 })} />
      <PartyFields title="Party 2" party={form.party2} onChange={(party2) => update({ party2 })} />
    </form>
  );
}

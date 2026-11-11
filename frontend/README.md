# Prelegal frontend

Next.js app for creating a Common Paper Mutual Non-Disclosure Agreement (Jira PL-3).
Fill in the form, check the live preview, then download the agreement as PDF or Word.
Everything runs in the browser; there is no backend.

## Commands

Run from this `frontend/` directory:

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # production build
npm run lint
npm run test:unit   # vitest
```

## How it works

- `src/app/page.tsx` reads the Standard Terms from `../templates/Mutual-NDA.md` at build time.
- `src/lib/mnda/document.ts` builds a format-neutral `MndaDocument` (cover page from the form, then the Standard Terms).
- That document is rendered three ways: `src/components/MndaPreview.tsx` (HTML preview), `src/lib/mnda/pdf.tsx` (PDF via `@react-pdf/renderer`) and `src/lib/mnda/docx.ts` (Word via `docx`).

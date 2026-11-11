import { readFileSync } from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { MndaCreator } from "@/components/MndaCreator";
import { parseStandardTerms } from "@/lib/mnda/document";

// The Standard Terms come from the shared templates directory (see catalog.json) and are read once at build time.
const standardTerms = parseStandardTerms(
  readFileSync(path.join(process.cwd(), "..", "templates", "Mutual-NDA.md"), "utf-8"),
);

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mutual NDA Creator</h1>
        <p className="mt-1 text-gray-600">
          Fill in the details below to generate a Common Paper Mutual Non-Disclosure Agreement, then download it as a
          PDF or Word document.
        </p>
      </header>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <MndaCreator standardTerms={standardTerms} />
      </Suspense>
    </main>
  );
}

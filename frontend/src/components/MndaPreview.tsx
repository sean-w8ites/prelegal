import type { Block, MndaDocument, Run } from "@/lib/mnda/document";

function Runs({ runs }: { runs: Run[] }) {
  return runs.map((run, i) => (run.bold ? <strong key={i}>{run.text}</strong> : <span key={i}>{run.text}</span>));
}

function PreviewBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "title":
      return <h2 className="mb-4 text-center text-2xl font-bold">{block.text}</h2>;
    case "heading":
      return <h3 className="mt-5 mb-1 font-bold">{block.text}</h3>;
    case "paragraph":
      return (
        <p
          className={`whitespace-pre-line ${block.small ? "mb-3 text-xs text-gray-500" : block.number ? "mb-3 text-justify" : "mb-3"}`}
        >
          {block.number && `${block.number}. `}
          <Runs runs={block.runs} />
        </p>
      );
    case "parties":
      return (
        <table className="my-4 w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="border border-gray-400 p-2">
                <span className="sr-only">Field</span>
              </th>
              <th scope="col" className="border border-gray-400 p-2">
                PARTY 1
              </th>
              <th scope="col" className="border border-gray-400 p-2">
                PARTY 2
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="border border-gray-400 p-2 text-left">
                  {row.label}
                </th>
                <td className="h-10 border border-gray-400 p-2 break-words">{row.party1}</td>
                <td className="h-10 border border-gray-400 p-2 break-words">{row.party2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "pageBreak":
      return <hr className="my-8 border-dashed border-gray-300" />;
  }
}

export function MndaPreview({ doc }: { doc: MndaDocument }) {
  return (
    <article className="rounded bg-white p-10 font-serif text-[15px] leading-relaxed text-gray-900 shadow">
      {doc.map((block, i) => (
        <PreviewBlock key={i} block={block} />
      ))}
    </article>
  );
}

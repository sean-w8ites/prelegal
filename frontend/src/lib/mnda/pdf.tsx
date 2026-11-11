import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Block, MndaDocument, Run } from "./document";

// Don't hyphenate ordinary words (hyphenated legal terms are hard to read); only break
// unusually long strings, such as long email addresses, so they can't overflow a table cell.
Font.registerHyphenationCallback((word) => (word.length > 40 ? (word.match(/.{1,30}/g) ?? [word]) : [word]));

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.4 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 12 },
  heading: { fontSize: 11.5, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 },
  paragraph: { marginBottom: 6 },
  numbered: { marginBottom: 8, textAlign: "justify" },
  small: { marginBottom: 8, fontSize: 8.5, color: "#555555" },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#999999", marginVertical: 8 },
  row: { flexDirection: "row" },
  cell: { flex: 1, minHeight: 24, padding: 5, fontSize: 9.5, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#999999" },
  labelCell: { flex: 0.6 },
});

function Runs({ runs }: { runs: Run[] }) {
  return runs.map((run, i) => (
    <Text key={i} style={run.bold ? styles.bold : undefined}>
      {run.text}
    </Text>
  ));
}

function PdfBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "title":
      return <Text style={styles.title}>{block.text}</Text>;
    case "heading":
      return <Text style={styles.heading}>{block.text}</Text>;
    case "paragraph":
      return (
        <Text style={block.small ? styles.small : block.number ? styles.numbered : styles.paragraph}>
          {block.number && `${block.number}. `}
          <Runs runs={block.runs} />
        </Text>
      );
    case "parties":
      return (
        <View style={styles.table} wrap={false}>
          {[{ label: "", party1: "PARTY 1", party2: "PARTY 2" }, ...block.rows].map((row, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, styles.labelCell, styles.bold]}>{row.label}</Text>
              <Text style={i === 0 ? [styles.cell, styles.bold] : styles.cell}>{row.party1}</Text>
              <Text style={i === 0 ? [styles.cell, styles.bold] : styles.cell}>{row.party2}</Text>
            </View>
          ))}
        </View>
      );
    case "pageBreak":
      return <View break />;
  }
}

export function MndaPdf({ doc }: { doc: MndaDocument }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" creator="Prelegal">
      <Page size="LETTER" style={styles.page}>
        {doc.map((block, i) => (
          <PdfBlock key={i} block={block} />
        ))}
      </Page>
    </Document>
  );
}

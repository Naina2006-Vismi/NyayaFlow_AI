import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(filePath) {
  const pdf = await getDocument(filePath).promise;
  const pages = [];

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    pages.push({ number: index, text });
  }

  return {
    pageCount: pdf.numPages,
    pages,
    fullText: pages.map((page) => page.text).join("\n"),
  };
}

import fs from "node:fs/promises";
import path from "node:path";
import { analyzeDocument } from "./extractionService.js";
import { listCases, replaceAllCases } from "./db.js";

const sourcePdf = "/Users/namburunainavismi/Downloads/WP_19885_2025_20260428110602.pdf";
const documentDir = path.resolve("public/documents");
const copiedPdfName = "WP_19885_2025_20260428110602.pdf";
const copiedPdfPath = path.join(documentDir, copiedPdfName);

export async function ensureSeedData() {
  if (listCases().length > 0) {
    return;
  }
  await seedDatabase();
}

export async function seedDatabase() {
  await fs.mkdir(documentDir, { recursive: true });
  await fs.copyFile(sourcePdf, copiedPdfPath);

  const primaryCase = await analyzeDocument({
    filePath: sourcePdf,
    sourceName: copiedPdfName,
    documentUrl: `/documents/${copiedPdfName}`,
    forcedId: "wp-19885-2025",
    mode: "auto",
  });

  replaceAllCases([primaryCase]);
  return primaryCase;
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase()
    .then((record) => {
      console.log(`Seeded database with case ${record.caseNumber}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

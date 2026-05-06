import { buildCaseRecord, heuristicExtract, mergeExtractionResults } from "./caseBuilder.js";
import { extractPdfText } from "./extractPdf.js";
import { extractWithOpenAI, isOpenAIEnabled } from "./openaiExtractor.js";

function buildSelectedText(extraction) {
  const keywordPages = extraction.pages.filter((page) =>
    /(order|shall|directed|quashed|allowed|dismissed|completed within|recalculate|pension|respondent)/i.test(page.text),
  );

  const chosenPages = [
    ...extraction.pages.slice(0, 6),
    ...keywordPages.slice(-10),
  ].filter((page, index, array) => array.findIndex((item) => item.number === page.number) === index);

  return chosenPages
    .slice(0, 14)
    .map((page) => `Page ${page.number}:\n${page.text.slice(0, 3500)}`)
    .join("\n\n");
}

export async function analyzeDocument({
  filePath,
  sourceName,
  documentUrl,
  forcedId,
  mode = "auto",
}) {
  const extraction = await extractPdfText(filePath);
  const heuristic = heuristicExtract(extraction);
  let aiResult = null;

  if ((mode === "auto" || mode === "openai") && isOpenAIEnabled()) {
    try {
      aiResult = await extractWithOpenAI({
        sourceName,
        heuristic,
        selectedText: buildSelectedText(extraction),
      });
    } catch (error) {
      aiResult = {
        alerts: [
          ...(heuristic.alerts ?? []),
          {
            severity: "warning",
            title: "OpenAI extraction fallback",
            detail: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }

  const analysis = mergeExtractionResults(heuristic, aiResult);

  return buildCaseRecord({
    sourceName,
    documentUrl,
    extraction,
    analysis,
    forcedId,
  });
}

export function getExtractionProviderState() {
  return {
    openaiEnabled: isOpenAIEnabled(),
    model: process.env.OPENAI_MODEL || "gpt-5.2",
  };
}

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const DirectiveSchema = z.object({
  title: z.string(),
  detail: z.string(),
  source: z.string(),
  deadline: z.string().nullable().optional(),
  tone: z.enum(["critical", "priority", "deadline"]).default("priority"),
});

const EvidenceSchema = z.object({
  label: z.string(),
  page: z.number(),
  quote: z.string(),
});

const AlertSchema = z.object({
  severity: z.enum(["info", "warning", "danger"]),
  title: z.string(),
  detail: z.string(),
});

const ExtractionSchema = z.object({
  caseNumber: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  court: z.string().nullable().optional(),
  orderDate: z.string().nullable().optional(),
  judge: z.string().nullable().optional(),
  petitioner: z.string().nullable().optional(),
  respondent: z.string().nullable().optional(),
  caseType: z.string().nullable().optional(),
  legalArea: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  disposition: z.string().nullable().optional(),
  connectedCaseCount: z.number().nullable().optional(),
  complianceDays: z.number().nullable().optional(),
  riskLevel: z.enum(["Low", "Medium", "High"]).nullable().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
  summary: z.string().nullable().optional(),
  directives: z.array(DirectiveSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  alerts: z.array(AlertSchema).default([]),
});

function buildPrompt({ sourceName, heuristic, selectedText }) {
  return [
    "You are extracting structured operational data from a court judgment.",
    "Return only grounded fields. If a field is unclear, leave it null or omit it.",
    "Prioritize operative directions, relief granted, responsible department, time-bound actions, and reviewer-ready summary.",
    "",
    `Source file: ${sourceName}`,
    "",
    "Heuristic baseline:",
    JSON.stringify(heuristic, null, 2),
    "",
    "Judgment excerpts:",
    selectedText,
  ].join("\n");
}

export function isOpenAIEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function extractWithOpenAI({ sourceName, heuristic, selectedText }) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  const response = await client.responses.parse({
    model,
    input: buildPrompt({ sourceName, heuristic, selectedText }),
    text: {
      format: zodTextFormat(ExtractionSchema, "judgment_extraction"),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    extractionMethod: "openai",
    extractionModel: model,
  };
}

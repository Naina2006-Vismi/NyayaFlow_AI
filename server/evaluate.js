import { analyzeDocument } from "./extractionService.js";

const sourcePdf = "/Users/namburunainavismi/Downloads/WP_19885_2025_20260428110602.pdf";

const expectations = [
  {
    label: "Case number",
    pass: (record) => record.caseNumber === "WP/19885/2025",
    actual: (record) => record.caseNumber,
  },
  {
    label: "Order date",
    pass: (record) => record.orderDate === "30 April 2026",
    actual: (record) => record.orderDate,
  },
  {
    label: "Judge",
    pass: (record) => /Anant Ramanath Hegde/i.test(record.judge),
    actual: (record) => record.judge,
  },
  {
    label: "Department",
    pass: (record) => record.department === "EPFO",
    actual: (record) => record.department,
  },
  {
    label: "Due date",
    pass: (record) => record.dueDate === "29 July 2026",
    actual: (record) => record.dueDate,
  },
  {
    label: "Directive count",
    pass: (record) => record.directives.length >= 3,
    actual: (record) => record.directives.length,
  },
];

const record = await analyzeDocument({
  filePath: sourcePdf,
  sourceName: "WP_19885_2025_20260428110602.pdf",
  documentUrl: "/documents/WP_19885_2025_20260428110602.pdf",
  forcedId: "evaluation-seed",
  mode: "auto",
});

const results = expectations.map((expectation) => ({
  label: expectation.label,
  passed: expectation.pass(record),
  actual: expectation.actual(record),
}));

const passed = results.filter((result) => result.passed).length;

console.log(JSON.stringify({
  passed,
  total: results.length,
  extractionMethod: record.extractionMethod,
  extractionModel: record.extractionModel,
  results,
}, null, 2));

if (passed !== results.length) {
  process.exitCode = 1;
}

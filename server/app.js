import "dotenv/config.js";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { analyzeDocument, getExtractionProviderState } from "./extractionService.js";
import {
  getCase,
  getDashboardData,
  getSummary,
  insertCase,
  listActivity,
  listCases,
  updateCase,
} from "./db.js";
import { ensureSeedData } from "./seed.js";

await ensureSeedData();

const app = express();
const port = Number(process.env.PORT || 8787);
const uploadDir = path.resolve("public/documents/uploads");

await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use("/documents", express.static(path.resolve("public/documents")));

function filterCases(items, { q, status, department, risk }) {
  return items.filter((item) => {
    const searchable = `${item.caseNumber} ${item.title} ${item.summary} ${item.petitioner} ${item.respondent} ${item.department}`.toLowerCase();
    const matchesQuery = !q || searchable.includes(q);
    const matchesStatus = status === "all" || item.status.toLowerCase() === status;
    const matchesDepartment = department === "all" || item.department.toLowerCase() === department;
    const matchesRisk = risk === "all" || item.riskLevel.toLowerCase() === risk;
    return matchesQuery && matchesStatus && matchesDepartment && matchesRisk;
  });
}

app.get("/api/summary", (_req, res) => {
  res.json(getSummary());
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getDashboardData());
});

app.get("/api/system", (_req, res) => {
  res.json(getExtractionProviderState());
});

app.get("/api/cases", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const status = String(req.query.status || "all").trim().toLowerCase();
  const department = String(req.query.department || "all").trim().toLowerCase();
  const risk = String(req.query.risk || "all").trim().toLowerCase();
  res.json(filterCases(listCases(), { q, status, department, risk }));
});

app.get("/api/cases/:id", (req, res) => {
  const record = getCase(req.params.id);
  if (!record) {
    res.status(404).json({ message: "Case not found" });
    return;
  }
  res.json(record);
});

app.patch("/api/cases/:id", (req, res) => {
  const existing = getCase(req.params.id);
  if (!existing) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  const patch = req.body ?? {};
  const nextStatus = patch.action === "approve"
    ? "Approved"
    : patch.action === "reject"
      ? "Rejected"
      : patch.status ?? existing.status;

  const updated = updateCase(req.params.id, {
    status: nextStatus,
    title: patch.title ?? existing.title,
    summary: patch.summary ?? existing.summary,
    department: patch.department ?? existing.department,
    dueDate: patch.dueDate ?? existing.dueDate,
    dueDateIso: patch.dueDateIso ?? existing.dueDateIso,
    riskLevel: patch.riskLevel ?? existing.riskLevel,
    reviewerName: patch.reviewerName ?? existing.reviewerName,
    reviewerNotes: patch.reviewerNotes ?? existing.reviewerNotes,
    directives: patch.directives ?? existing.directives,
    alerts: patch.alerts ?? existing.alerts,
  }, {
    eventType: "review",
    title:
      patch.action === "approve"
        ? "Case approved"
        : patch.action === "reject"
          ? "Case rejected"
          : "Case updated",
    detail:
      patch.action === "approve"
        ? `${existing.caseNumber} was approved for dispatch.`
        : patch.action === "reject"
          ? `${existing.caseNumber} was rejected and needs further review.`
          : `${existing.caseNumber} fields were updated by the reviewer.`,
    actor: patch.reviewerName || "Workspace reviewer",
    createdAt: new Date().toISOString(),
  });

  res.json(updated);
});

app.post("/api/cases/:id/reextract", async (req, res) => {
  const existing = getCase(req.params.id);
  if (!existing) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  try {
    const filePath = path.resolve(`public${existing.documentUrl}`);
    const reExtracted = await analyzeDocument({
      filePath,
      sourceName: existing.documentName,
      documentUrl: existing.documentUrl,
      forcedId: existing.id,
      mode: req.body?.mode || "auto",
    });

    const updated = updateCase(existing.id, {
      ...reExtracted,
      status: "Needs review",
      reviewerNotes: existing.reviewerNotes,
      reviewerName: existing.reviewerName,
    }, {
      eventType: "reextract",
      title: "Case re-extracted",
      detail: `${existing.caseNumber} was re-processed through the ${reExtracted.extractionMethod} pipeline.`,
      actor: "NyayaFlow Pipeline",
      createdAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Re-extraction failed.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/activity", (_req, res) => {
  res.json(listActivity());
});

app.post("/api/uploads", upload.single("document"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "PDF document is required." });
    return;
  }

  try {
    const record = await analyzeDocument({
      filePath: req.file.path,
      sourceName: req.file.filename,
      documentUrl: `/documents/uploads/${req.file.filename}`,
      mode: req.body?.mode || "auto",
    });

    insertCase(record, {
      eventType: "upload",
      title: "Original document uploaded",
      detail: `${req.file.originalname} was parsed and added to the review queue.`,
      actor: "Workspace operator",
      createdAt: record.createdAt,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({
      message: "Upload succeeded, but extraction failed.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default app;

if (process.argv[1] && process.argv[1].endsWith("app.js")) {
  app.listen(port, () => {
    console.log(`NyayaFlow API running on http://localhost:${port}`);
  });
}

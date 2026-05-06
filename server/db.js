import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { buildWorkflow } from "./caseBuilder.js";
import { getExtractionProviderState } from "./extractionService.js";

const dataDir = path.resolve("server/data");
const dbPath = path.join(dataDir, "nyayaflow.db");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT NOT NULL,
    title TEXT NOT NULL,
    court TEXT NOT NULL,
    order_date TEXT,
    order_date_iso TEXT,
    judge TEXT,
    petitioner TEXT,
    respondent TEXT,
    status TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    page_count INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    due_date TEXT,
    due_date_iso TEXT,
    summary TEXT NOT NULL,
    source_type TEXT NOT NULL,
    extracted_at TEXT NOT NULL,
    directives_json TEXT NOT NULL,
    evidence_json TEXT NOT NULL,
    workflow_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    actor TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function existingColumns(table) {
  return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
}

function ensureColumn(table, name, typeSql) {
  const columns = existingColumns(table);
  if (!columns.has(name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${typeSql}`);
  }
}

[
  ["cases", "department", "TEXT"],
  ["cases", "case_type", "TEXT"],
  ["cases", "bench", "TEXT"],
  ["cases", "legal_area", "TEXT"],
  ["cases", "disposition", "TEXT"],
  ["cases", "lead_case_number", "TEXT"],
  ["cases", "connected_case_count", "INTEGER DEFAULT 0"],
  ["cases", "compliance_days", "INTEGER"],
  ["cases", "reviewer_name", "TEXT DEFAULT ''"],
  ["cases", "reviewer_notes", "TEXT DEFAULT ''"],
  ["cases", "extraction_method", "TEXT DEFAULT 'heuristic'"],
  ["cases", "extraction_model", "TEXT"],
  ["cases", "alerts_json", "TEXT DEFAULT '[]'"],
  ["cases", "language", "TEXT DEFAULT 'en'"],
  ["cases", "created_at", "TEXT"],
  ["cases", "updated_at", "TEXT"],
].forEach(([table, name, typeSql]) => ensureColumn(table, name, typeSql));

function hydrateCase(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    caseNumber: row.case_number,
    title: row.title,
    court: row.court,
    orderDate: row.order_date,
    orderDateIso: row.order_date_iso,
    judge: row.judge,
    petitioner: row.petitioner,
    respondent: row.respondent,
    status: row.status,
    confidence: row.confidence,
    pageCount: row.page_count,
    documentName: row.document_name,
    documentUrl: row.document_url,
    riskLevel: row.risk_level,
    dueDate: row.due_date,
    dueDateIso: row.due_date_iso,
    summary: row.summary,
    sourceType: row.source_type,
    extractedAt: row.extracted_at,
    caseType: row.case_type,
    bench: row.bench,
    legalArea: row.legal_area,
    department: row.department,
    disposition: row.disposition,
    leadCaseNumber: row.lead_case_number,
    connectedCaseCount: row.connected_case_count ?? 0,
    complianceDays: row.compliance_days,
    reviewerName: row.reviewer_name ?? "",
    reviewerNotes: row.reviewer_notes ?? "",
    extractionMethod: row.extraction_method ?? "heuristic",
    extractionModel: row.extraction_model ?? null,
    directives: JSON.parse(row.directives_json || "[]"),
    evidence: JSON.parse(row.evidence_json || "[]"),
    alerts: JSON.parse(row.alerts_json || "[]"),
    workflow:
      row.workflow_json
        ? JSON.parse(row.workflow_json)
        : buildWorkflow(row.status, row.extraction_method ?? "heuristic", row.department ?? "General"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    language: row.language ?? "en",
  };
}

function serializeCase(record) {
  return {
    id: record.id,
    caseNumber: record.caseNumber,
    title: record.title,
    court: record.court,
    orderDate: record.orderDate,
    orderDateIso: record.orderDateIso,
    judge: record.judge,
    petitioner: record.petitioner,
    respondent: record.respondent,
    status: record.status,
    confidence: record.confidence,
    pageCount: record.pageCount,
    documentName: record.documentName,
    documentUrl: record.documentUrl,
    riskLevel: record.riskLevel,
    dueDate: record.dueDate,
    dueDateIso: record.dueDateIso,
    summary: record.summary,
    sourceType: record.sourceType,
    extractedAt: record.extractedAt,
    caseType: record.caseType,
    bench: record.bench,
    legalArea: record.legalArea,
    department: record.department,
    disposition: record.disposition,
    leadCaseNumber: record.leadCaseNumber,
    connectedCaseCount: record.connectedCaseCount ?? 0,
    complianceDays: record.complianceDays ?? null,
    reviewerName: record.reviewerName ?? "",
    reviewerNotes: record.reviewerNotes ?? "",
    extractionMethod: record.extractionMethod ?? "heuristic",
    extractionModel: record.extractionModel ?? null,
    directivesJson: JSON.stringify(record.directives ?? []),
    evidenceJson: JSON.stringify(record.evidence ?? []),
    alertsJson: JSON.stringify(record.alerts ?? []),
    workflowJson: JSON.stringify(
      record.workflow ?? buildWorkflow(record.status, record.extractionMethod, record.department),
    ),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function writeActivity(activityEntry) {
  db.prepare(`
    INSERT INTO activity (case_id, event_type, title, detail, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    activityEntry.caseId,
    activityEntry.eventType,
    activityEntry.title,
    activityEntry.detail,
    activityEntry.actor,
    activityEntry.createdAt,
  );
}

export function replaceAllCases(cases) {
  db.exec("DELETE FROM activity;");
  db.exec("DELETE FROM cases;");

  const insert = db.prepare(`
    INSERT INTO cases (
      id, case_number, title, court, order_date, order_date_iso, judge, petitioner,
      respondent, status, confidence, page_count, document_name, document_url, risk_level,
      due_date, due_date_iso, summary, source_type, extracted_at, directives_json, evidence_json,
      workflow_json, department, case_type, bench, legal_area, disposition, lead_case_number,
      connected_case_count, compliance_days, reviewer_name, reviewer_notes, extraction_method,
      extraction_model, alerts_json, created_at, updated_at
    ) VALUES (
      @id, @caseNumber, @title, @court, @orderDate, @orderDateIso, @judge, @petitioner,
      @respondent, @status, @confidence, @pageCount, @documentName, @documentUrl, @riskLevel,
      @dueDate, @dueDateIso, @summary, @sourceType, @extractedAt, @directivesJson, @evidenceJson,
      @workflowJson, @department, @caseType, @bench, @legalArea, @disposition, @leadCaseNumber,
      @connectedCaseCount, @complianceDays, @reviewerName, @reviewerNotes, @extractionMethod,
      @extractionModel, @alertsJson, @createdAt, @updatedAt
    )
  `);

  db.exec("BEGIN");
  try {
    for (const record of cases) {
      insert.run(serializeCase(record));
      writeActivity({
        caseId: record.id,
        eventType: "seed",
        title: "Original judgment indexed",
        detail: `${record.documentName} was parsed and stored for review.`,
        actor: "NyayaFlow Seeder",
        createdAt: record.createdAt,
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function insertCase(record, activityEntry) {
  const insert = db.prepare(`
    INSERT INTO cases (
      id, case_number, title, court, order_date, order_date_iso, judge, petitioner,
      respondent, status, confidence, page_count, document_name, document_url, risk_level,
      due_date, due_date_iso, summary, source_type, extracted_at, directives_json, evidence_json,
      workflow_json, department, case_type, bench, legal_area, disposition, lead_case_number,
      connected_case_count, compliance_days, reviewer_name, reviewer_notes, extraction_method,
      extraction_model, alerts_json, created_at, updated_at
    ) VALUES (
      @id, @caseNumber, @title, @court, @orderDate, @orderDateIso, @judge, @petitioner,
      @respondent, @status, @confidence, @pageCount, @documentName, @documentUrl, @riskLevel,
      @dueDate, @dueDateIso, @summary, @sourceType, @extractedAt, @directivesJson, @evidenceJson,
      @workflowJson, @department, @caseType, @bench, @legalArea, @disposition, @leadCaseNumber,
      @connectedCaseCount, @complianceDays, @reviewerName, @reviewerNotes, @extractionMethod,
      @extractionModel, @alertsJson, @createdAt, @updatedAt
    )
  `);

  db.exec("BEGIN");
  try {
    insert.run(serializeCase(record));
    writeActivity({ caseId: record.id, ...activityEntry });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function updateCase(id, updates, activityEntry) {
  const existing = getCase(id);
  if (!existing) {
    return null;
  }

  const next = {
    ...existing,
    ...updates,
    workflow: buildWorkflow(
      updates.status ?? existing.status,
      updates.extractionMethod ?? existing.extractionMethod,
      updates.department ?? existing.department,
    ),
    updatedAt: new Date().toISOString(),
  };

  const update = db.prepare(`
    UPDATE cases SET
      case_number = @caseNumber,
      title = @title,
      court = @court,
      order_date = @orderDate,
      order_date_iso = @orderDateIso,
      judge = @judge,
      petitioner = @petitioner,
      respondent = @respondent,
      status = @status,
      confidence = @confidence,
      page_count = @pageCount,
      document_name = @documentName,
      document_url = @documentUrl,
      risk_level = @riskLevel,
      due_date = @dueDate,
      due_date_iso = @dueDateIso,
      summary = @summary,
      source_type = @sourceType,
      extracted_at = @extractedAt,
      directives_json = @directivesJson,
      evidence_json = @evidenceJson,
      workflow_json = @workflowJson,
      department = @department,
      case_type = @caseType,
      bench = @bench,
      legal_area = @legalArea,
      disposition = @disposition,
      lead_case_number = @leadCaseNumber,
      connected_case_count = @connectedCaseCount,
      compliance_days = @complianceDays,
      reviewer_name = @reviewerName,
      reviewer_notes = @reviewerNotes,
      extraction_method = @extractionMethod,
      extraction_model = @extractionModel,
      alerts_json = @alertsJson,
      created_at = @createdAt,
      updated_at = @updatedAt
    WHERE id = @id
  `);

  db.exec("BEGIN");
  try {
    update.run(serializeCase(next));
    if (activityEntry) {
      writeActivity({ caseId: id, ...activityEntry });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getCase(id);
}

export function listCases() {
  return db.prepare("SELECT * FROM cases ORDER BY updated_at DESC").all().map(hydrateCase);
}

export function getCase(id) {
  return hydrateCase(db.prepare("SELECT * FROM cases WHERE id = ?").get(id));
}

export function listActivity(limit = 60) {
  return db
    .prepare(`
      SELECT a.*, c.case_number
      FROM activity a
      LEFT JOIN cases c ON c.id = a.case_id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ?
    `)
    .all(limit)
    .map((row) => ({
      id: row.id,
      caseId: row.case_id,
      caseNumber: row.case_number,
      eventType: row.event_type,
      title: row.title,
      detail: row.detail,
      actor: row.actor,
      createdAt: row.created_at,
    }));
}

function computeDepartmentBreakdown(cases) {
  const map = new Map();
  for (const item of cases) {
    const current = map.get(item.department) ?? {
      department: item.department,
      count: 0,
      approved: 0,
      pending: 0,
      highRisk: 0,
    };
    current.count += 1;
    current.approved += item.status === "Approved" ? 1 : 0;
    current.pending += item.status !== "Approved" ? 1 : 0;
    current.highRisk += item.riskLevel === "High" ? 1 : 0;
    map.set(item.department, current);
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getSummary() {
  const cases = listCases();
  const departments = computeDepartmentBreakdown(cases);
  return {
    totalCases: cases.length,
    reviewQueue: cases.filter((item) => item.status === "Needs review").length,
    approvedCases: cases.filter((item) => item.status === "Approved").length,
    rejectedCases: cases.filter((item) => item.status === "Rejected").length,
    averageConfidence:
      cases.length > 0
        ? Math.round(cases.reduce((sum, item) => sum + item.confidence, 0) / cases.length)
        : 0,
    highRiskCases: cases.filter((item) => item.riskLevel === "High").length,
    departments,
    provider: getExtractionProviderState(),
  };
}

export function getDashboardData() {
  const cases = listCases();
  return {
    summary: getSummary(),
    alerts: cases
      .flatMap((item) =>
        item.alerts.map((alert) => ({
          ...alert,
          caseId: item.id,
          caseNumber: item.caseNumber,
          department: item.department,
        })),
      )
      .sort((a, b) => (a.severity < b.severity ? 1 : -1))
      .slice(0, 10),
    upcoming: cases
      .filter((item) => item.dueDateIso)
      .sort((a, b) => String(a.dueDateIso).localeCompare(String(b.dueDateIso)))
      .slice(0, 8),
  };
}

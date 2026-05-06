function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function capitalizeWords(value) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractCaseNumber(text) {
  const match = text.match(/WP(?: No\.?|_| )\s*([0-9]+)\s*(?:of|\/)\s*(20[0-9]{2})/i);
  return match ? `WP/${match[1]}/${match[2]}` : "Unclassified filing";
}

function extractOrderDate(text) {
  const match = text.match(/DATED THIS THE\s+([0-9]{1,2})\s*(?:ST|ND|RD|TH)?\s+DAY OF\s+([A-Z]+)\s*,?\s*(20[0-9]{2})/i);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${day} ${month[0]}${month.slice(1).toLowerCase()} ${year}`;
}

function parseDisplayDate(displayDate) {
  if (!displayDate) {
    return null;
  }

  const match = displayDate.match(/^([0-9]{1,2})\s+([A-Za-z]+)\s+(20[0-9]{2})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${month} ${day}, ${year} 12:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toIsoDate(displayDate) {
  const parsed = parseDisplayDate(displayDate);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function extractJudge(text) {
  const match = text.match(/BEFORE THE HON'?BLE\s+MR\.?\s+JUSTICE\s+([A-Z\s]+?)\s+WRIT PETITION/i);
  return match ? `Justice ${capitalizeWords(normalizeWhitespace(match[1]))}` : "Not parsed";
}

function findPage(pages, matcher) {
  return pages.find((page) => matcher(page.text));
}

function extractPartyBlock(text, marker, fallback) {
  const regex = new RegExp(`${marker}:?\\s*(.+?)\\s+(?:AND:|AND|RESPONDENT|RESPONDENTS|PETITIONER|PETITIONERS)`, "is");
  const match = text.match(regex);
  if (!match) {
    return fallback;
  }

  return normalizeWhitespace(match[1]).slice(0, 240);
}

function detectDepartment(text) {
  const rules = [
    ["Provident Fund", "EPFO"],
    ["Employees' Provident Fund", "EPFO"],
    ["Revenue", "Revenue"],
    ["PWD", "PWD"],
    ["Public Works", "PWD"],
    ["BBMP", "BBMP"],
    ["Police", "Police"],
    ["Municipal", "Municipal Administration"],
  ];

  for (const [needle, department] of rules) {
    if (text.toLowerCase().includes(needle.toLowerCase())) {
      return department;
    }
  }

  return "General";
}

function detectLegalArea(text) {
  if (/\(L-PF\)|pension|provident fund/i.test(text)) {
    return "Labour and pension";
  }
  if (/revenue|mutation|land/i.test(text)) {
    return "Revenue administration";
  }
  if (/contractor|payment|works/i.test(text)) {
    return "Public works";
  }
  return "General public law";
}

function detectDisposition(text) {
  if (/writ petitions are allowed|petition is allowed/i.test(text)) {
    return "Allowed";
  }
  if (/dismissed/i.test(text)) {
    return "Dismissed";
  }
  if (/disposed of/i.test(text)) {
    return "Disposed";
  }
  return "Under review";
}

function extractComplianceDays(text) {
  const match = text.match(/within\s+([0-9]{1,3})\s+days/i);
  if (match) {
    return Number(match[1]);
  }

  const weeks = text.match(/within\s+([0-9]{1,2})\s+weeks/i);
  if (weeks) {
    return Number(weeks[1]) * 7;
  }

  return null;
}

function extractComplianceDaysFromPages(pages) {
  for (const page of [...pages].reverse()) {
    const value = extractComplianceDays(page.text);
    if (value) {
      return value;
    }
  }
  return null;
}

function extractConnectedCaseCount(text) {
  const matches = text.match(/WRIT PETITION NO\./gi) ?? [];
  return Math.max(0, matches.length - 1);
}

function cleanSnippet(text, limit = 340) {
  return normalizeWhitespace(text).slice(0, limit);
}

function sentenceSplit(text) {
  return normalizeWhitespace(text)
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractDirectiveSentences(pages, fallbackDueDate) {
  const candidatePages = pages.filter((page) =>
    /(ORDER|directed|shall|quashed|recalculate|disburse|completed within|reconsider)/i.test(page.text),
  );

  const sentences = candidatePages.flatMap((page) =>
    sentenceSplit(page.text)
      .filter((sentence) => /(shall|directed|quashed|allowed|completed within|reconsider)/i.test(sentence))
      .slice(0, 5)
      .map((sentence, index) => ({
        id: `${page.number}-${index + 1}`,
        source: `Page ${page.number}`,
        sentence,
      })),
  );

  const unique = [];
  const seen = new Set();
  for (const item of sentences) {
    const key = item.sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique.slice(0, 6).map((item, index) => ({
    id: `directive-${index + 1}`,
    title: index === 0 ? "Primary operative direction" : `Directive ${index + 1}`,
    detail: item.sentence,
    source: item.source,
    deadline: fallbackDueDate,
    tone: index === 0 ? "critical" : index === 1 ? "priority" : "deadline",
  }));
}

function buildAlerts({ dueDateValue, riskLevel, status, department, caseNumber, directives }) {
  const alerts = [];
  if (dueDateValue) {
    const diffDays = Math.ceil((dueDateValue.getTime() - Date.now()) / 86400000);
    if (diffDays < 0) {
      alerts.push({
        severity: "danger",
        title: "Deadline breached",
        detail: `${caseNumber} appears overdue for ${department} action.`,
      });
    } else if (diffDays <= 14) {
      alerts.push({
        severity: "warning",
        title: "Deadline within two weeks",
        detail: `${caseNumber} is due in ${diffDays} day${diffDays === 1 ? "" : "s"}.`,
      });
    }
  }

  if (riskLevel === "High" && status !== "Approved") {
    alerts.push({
      severity: "danger",
      title: "High-risk matter awaiting review",
      detail: `${department} compliance should be reviewed before dispatch.`,
    });
  }

  if (directives.length >= 3) {
    alerts.push({
      severity: "info",
      title: "Multi-step compliance",
      detail: `This order contains ${directives.length} extracted operational directions.`,
    });
  }

  return alerts;
}

export function heuristicExtract(extraction) {
  const firstPages = extraction.pages.slice(0, 8).map((page) => page.text).join(" ");
  const allText = extraction.fullText;
  const orderPage = findPage(extraction.pages.slice(-16), (page) => /(Hence the following:?\s+ORDER|ORDER\s+1\.|The Writ Petitions are allowed)/i.test(page.text))
    ?? findPage(extraction.pages, (page) => /(Hence the following:?\s+ORDER|ORDER\s+1\.|The Writ Petitions are allowed)/i.test(page.text));
  const orderDate = extractOrderDate(firstPages);
  const orderDateValue = parseDisplayDate(orderDate);
  const complianceDays =
    extractComplianceDaysFromPages(extraction.pages.slice(-20))
    ?? extractComplianceDays(orderPage?.text ?? "")
    ?? 30;
  const dueDateValue = orderDateValue ? addDays(orderDateValue, complianceDays) : null;
  const dueDate = dueDateValue ? formatDisplayDate(dueDateValue) : "Deadline to be reviewed";
  const department = detectDepartment(allText);
  const disposition = detectDisposition(orderPage?.text ?? allText);
  const directives = extractDirectiveSentences(extraction.pages, dueDate);
  const legalArea = detectLegalArea(allText);
  const caseNumber = extractCaseNumber(firstPages);
  const riskLevel = directives.length >= 3 || complianceDays <= 30 ? "High" : "Medium";

  const petitioner = extractPartyBlock(
    firstPages,
    "BETWEEN",
    "Petitioner details require review from the original order.",
  );
  const respondent = /EMPLOYEES'? PROVIDENT FUND/i.test(allText)
    ? "Employees' Provident Fund Organisation and connected respondents"
    : "Respondent details require review from the original order.";

  return {
    caseNumber,
    leadCaseNumber: caseNumber,
    title:
      legalArea === "Labour and pension"
        ? "Higher pension joint-option order"
        : `${legalArea} compliance order`,
    court: /HIGH COURT OF KARNATAKA/i.test(firstPages)
      ? "High Court of Karnataka at Bengaluru"
      : "Court under review",
    orderDate: orderDate ?? "Date under review",
    orderDateIso: toIsoDate(orderDate),
    judge: extractJudge(firstPages),
    petitioner,
    respondent,
    status: "Needs review",
    confidence: Math.min(94, 60 + directives.length * 8 + (orderDate ? 8 : 0) + (department !== "General" ? 8 : 0)),
    pageCount: extraction.pageCount,
    riskLevel,
    dueDate,
    dueDateIso: toIsoDate(dueDate),
    caseType: /WRIT PETITION/i.test(firstPages) ? "Writ Petition" : "Judgment",
    bench: extractJudge(firstPages),
    legalArea,
    department,
    disposition,
    complianceDays,
    connectedCaseCount: extractConnectedCaseCount(firstPages),
    directives: directives.length
      ? directives
      : [
          {
            id: "directive-1",
            title: "Review original order",
            detail: "Directive extraction needs manual review from the source document.",
            source: orderPage ? `Page ${orderPage.number}` : "Source document",
            deadline: dueDate,
            tone: "critical",
          },
        ],
    evidence: [
      orderPage && {
        label: "Operative order",
        page: orderPage.number,
        quote: cleanSnippet(orderPage.text),
      },
      extraction.pages[0] && {
        label: "Header metadata",
        page: extraction.pages[0].number,
        quote: cleanSnippet(extraction.pages[0].text),
      },
      extraction.pages[2] && {
        label: "Party details",
        page: extraction.pages[2].number,
        quote: cleanSnippet(extraction.pages[2].text),
      },
    ].filter(Boolean),
    alerts: buildAlerts({
      dueDateValue,
      riskLevel,
      status: "Needs review",
      department,
      caseNumber,
      directives,
    }),
    summary:
      directives[0]?.detail
        ? `${caseNumber} concerns ${legalArea.toLowerCase()} and appears to ${disposition.toLowerCase()} the petition. Primary direction: ${directives[0].detail.slice(0, 180)}`
        : `${caseNumber} requires review to confirm the operative directions and compliance window.`,
    sourceType: "Original court PDF",
    extractedAt: new Date().toISOString(),
    extractionMethod: "heuristic",
    extractionModel: null,
    reviewerName: "",
    reviewerNotes: "",
  };
}

export function mergeExtractionResults(baseResult, aiResult) {
  if (!aiResult) {
    return baseResult;
  }

  const merged = { ...baseResult, ...aiResult };
  merged.caseNumber = aiResult.caseNumber || baseResult.caseNumber;
  merged.directives = aiResult.directives?.length ? aiResult.directives : baseResult.directives;
  merged.evidence = aiResult.evidence?.length ? aiResult.evidence : baseResult.evidence;
  merged.alerts = aiResult.alerts?.length ? aiResult.alerts : baseResult.alerts;
  merged.extractionMethod = aiResult.extractionMethod || baseResult.extractionMethod;
  merged.extractionModel = aiResult.extractionModel || baseResult.extractionModel;
  merged.confidence = Math.max(baseResult.confidence, aiResult.confidence ?? 0);
  return merged;
}

export function buildCaseRecord({
  sourceName,
  documentUrl,
  extraction,
  analysis,
  forcedId,
}) {
  const now = new Date().toISOString();
  const orderDateValue = parseDisplayDate(analysis.orderDate);
  const dueDateValue = parseDisplayDate(analysis.dueDate);
  const status = analysis.status || "Needs review";

  return {
    id: forcedId ?? slugify(`${analysis.caseNumber}-${sourceName}`),
    caseNumber: analysis.caseNumber,
    title: analysis.title,
    court: analysis.court,
    orderDate: analysis.orderDate,
    orderDateIso: analysis.orderDateIso || (orderDateValue ? orderDateValue.toISOString().slice(0, 10) : null),
    judge: analysis.judge,
    petitioner: analysis.petitioner,
    respondent: analysis.respondent,
    status,
    confidence: analysis.confidence,
    pageCount: extraction.pageCount,
    documentName: sourceName,
    documentUrl,
    riskLevel: analysis.riskLevel,
    dueDate: analysis.dueDate,
    dueDateIso: analysis.dueDateIso || (dueDateValue ? dueDateValue.toISOString().slice(0, 10) : null),
    summary: analysis.summary,
    sourceType: analysis.sourceType || "Original court PDF",
    extractedAt: analysis.extractedAt || now,
    caseType: analysis.caseType,
    bench: analysis.bench,
    legalArea: analysis.legalArea,
    department: analysis.department,
    disposition: analysis.disposition,
    leadCaseNumber: analysis.leadCaseNumber || analysis.caseNumber,
    connectedCaseCount: analysis.connectedCaseCount ?? 0,
    complianceDays: analysis.complianceDays ?? null,
    reviewerName: analysis.reviewerName ?? "",
    reviewerNotes: analysis.reviewerNotes ?? "",
    extractionMethod: analysis.extractionMethod ?? "heuristic",
    extractionModel: analysis.extractionModel ?? null,
    directives: analysis.directives,
    evidence: analysis.evidence,
    alerts: analysis.alerts ?? [],
    workflow: buildWorkflow(status, analysis.extractionMethod, analysis.department),
    createdAt: analysis.createdAt || now,
    updatedAt: now,
  };
}

export function buildWorkflow(status, extractionMethod, department) {
  return [
    {
      label: "Document indexed",
      detail: `The judgment was processed through the ${extractionMethod} extraction pipeline.`,
      tone: "complete",
    },
    {
      label: "Field validation",
      detail:
        status === "Approved"
          ? `${department} routing fields were confirmed by a reviewer.`
          : "Reviewer should confirm parties, relief, and compliance window.",
      tone: status === "Approved" ? "complete" : "active",
    },
    {
      label: "Department dispatch",
      detail:
        status === "Approved"
          ? `Case is approved and ready for ${department} follow-up.`
          : "Approval is pending before dispatch and escalation alerts go live.",
      tone: status === "Approved" ? "active" : "pending",
    },
  ];
}

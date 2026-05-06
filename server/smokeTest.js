import app from "./app.js";

const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));

const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;

const summary = await fetch(`http://127.0.0.1:${port}/api/summary`).then((res) => res.json());
const cases = await fetch(`http://127.0.0.1:${port}/api/cases`).then((res) => res.json());
const dashboard = await fetch(`http://127.0.0.1:${port}/api/dashboard`).then((res) => res.json());
const caseId = cases[0]?.id;
let patchVerified = false;

if (caseId) {
  const original = await fetch(`http://127.0.0.1:${port}/api/cases/${caseId}`).then((res) => res.json());
  const patched = await fetch(`http://127.0.0.1:${port}/api/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "approve",
      reviewerName: "Smoke Test",
      reviewerNotes: "Approval persistence check",
      summary: `${original.summary} [verified]`,
      department: original.department,
      dueDate: original.dueDate,
      riskLevel: original.riskLevel,
      title: original.title,
    }),
  }).then((res) => res.json());

  patchVerified =
    patched.status === "Approved"
    && patched.reviewerName === "Smoke Test"
    && patched.reviewerNotes === "Approval persistence check";

  await fetch(`http://127.0.0.1:${port}/api/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: original.status,
      reviewerName: original.reviewerName,
      reviewerNotes: original.reviewerNotes,
      summary: original.summary,
      department: original.department,
      dueDate: original.dueDate,
      riskLevel: original.riskLevel,
      title: original.title,
      directives: original.directives,
      alerts: original.alerts,
    }),
  });
}

console.log(JSON.stringify({
  summary,
  firstCase: cases[0]?.caseNumber ?? null,
  dashboardAlerts: dashboard.alerts.length,
  patchVerified,
}, null, 2));

await new Promise((resolve) => server.close(resolve));

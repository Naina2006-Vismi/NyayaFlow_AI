# NyayaFlow AI — Multi-Agent Legal Document Processing System

> Transforming Karnataka High Court judgment processing with autonomous AI agents

## Problem Statement

Karnataka's Court Case Management System (CCMS) processes thousands of judgments monthly. Manual data entry from PDF judgments is slow, error-prone, and creates backlogs. Legal staff spend hours extracting structured data from complex legal documents instead of focusing on higher-value work.

## Solution

NyayaFlow AI is a **multi-agent system** built with Google ADK that autonomously processes Karnataka HC judgment PDFs through a three-stage pipeline, extracting structured data, analyzing legal risks, and generating plain-language summaries — all with a mandatory human verification gate before CCMS entry.

## Architecture

```
User uploads PDF
      │
      ▼
┌─────────────────────────────────────────────┐
│         NyayaFlow Orchestrator Agent         │
│              (SequentialAgent)               │
└──────┬──────────────┬──────────────┬────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐
│ Extractor│  │Risk Analyzer │  │   Summarizer  │
│  Agent   │  │    Agent     │  │    Agent      │
│          │  │              │  │               │
│ Extracts │  │ Flags risks, │  │ Plain-language│
│ structured│  │ precedents,  │  │ summary +     │
│ fields   │  │ compliance   │  │ CCMS fields   │
└──────────┘  └──────────────┘  └──────────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  MCP Server     │
            │  Legal Tools    │
            │                 │
            │ • Search HC     │
            │   precedents    │
            │ • Validate case │
            │   numbers       │
            │ • CCMS schema   │
            │ • Act validity  │
            └─────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Human Review    │
            │ Gate (required) │
            └─────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ CCMS Entry      │
            │ (pre-filled)    │
            └─────────────────┘
```

## Key Concepts Demonstrated

| Concept | Implementation |
|---|---|
| ✅ Multi-agent system (ADK) | SequentialAgent orchestrating 3 specialized agents |
| ✅ MCP Server | `legal_tools_mcp.py` — 4 legal domain tools |
| ✅ Security features | Input validation, API key auth, injection detection, audit trail |
| ✅ Deployability | Dockerfile + Cloud Run deployment |
| ✅ Agent Skills | Extractor, RiskAnalyzer, Summarizer as distinct skills |

## Tech Stack

- **Agent Framework**: Google ADK (Agent Development Kit)
- **LLM**: Gemini 2.0 Flash / Gemini 3 Pro
- **API Layer**: FastAPI + Uvicorn
- **MCP Server**: Model Context Protocol server for legal tools
- **Frontend**: React + Vite
- **Backend**: Node.js + Express + SQLite
- **Deployment**: Docker + Google Cloud Run

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (free at aistudio.google.com)

## Working Prototype

The current prototype is a React + Vite premium SaaS interface backed by a local Node/Express API and SQLite database.

Start the backend:
```bash
npm run start:api
```

Start the frontend in another terminal:
```bash
npm run dev
```

Open:
```text
http://127.0.0.1:5173/
```

Prototype features currently working:

- Dashboard metrics from the local case database
- PDF upload and extraction through `/api/uploads`
- Case analysis cards using uploaded/indexed case data
- AI Assistant prototype responses through `/api/ai/chat`
- Legal research search through `/api/research`
- Document draft generation through `/api/documents/generate`
- Light/dark mode, responsive layout, toast notifications, loading states, and polished SaaS UI

The AI Assistant, research, and document generator are local prototype endpoints. They are designed so real LLM/search integrations can be swapped in later without redesigning the frontend.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nyayaflow-ai
cd nyayaflow-ai
```

### 2. Set up Python agent layer
```bash
cd nyayaflow-agents
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### 3. Set up Node.js backend
```bash
cd server
npm install
npm run start
# Runs at http://localhost:8787
```

### 4. Set up React frontend
```bash
npm install
npm run dev
# Runs at http://localhost:5173
```

### 5. Start the agent API server
```bash
cd nyayaflow-agents
uvicorn api_server:app --reload --port 8000
```

### 6. Start the MCP server
```bash
python mcp_server/legal_tools_mcp.py
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | None | Health check |
| `/api/agents/process` | POST | API Key | Process a legal document |
| `/api/agents/status` | GET | API Key | Agent pipeline status |

### Example request
```bash
curl -X POST http://localhost:8000/api/agents/process \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "IN THE HIGH COURT OF KARNATAKA...",
    "case_number": "WP 19885/2025"
  }'
```

## Cloud Run Deployment

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/nyayaflow-agents

# Deploy
gcloud run deploy nyayaflow-agents \
  --image gcr.io/YOUR_PROJECT/nyayaflow-agents \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_key
```

## Testing the Agent Demo Mode

A demo-mode regression test confirms the FastAPI server can run without Google ADK installed and still return valid structured output.

1. Start the FastAPI server:
```bash
uvicorn api_server:app --reload --port 8000
```

2. Run the demo script:
```bash
python3 tests/demo_api_test.py
```

3. Run the pytest regression test:
```bash
python3 -m pytest tests/test_demo_api.py
```

> The test uses `NYAYAFLOW_API_KEY` from the environment or defaults to `nyayaflow-dev-key-change-in-prod`.

## Security Features

1. **API Key Authentication** — all agent endpoints require `X-API-Key` header
2. **Input Validation** — length limits, character validation, injection detection
3. **Prompt Injection Guard** — filters dangerous patterns before LLM processing
4. **Audit Trail** — every processed document gets a unique audit ID
5. **Human Verification Gate** — low-confidence extractions flagged for manual review
6. **Non-root Docker** — container runs as unprivileged user

## Team

Built by Naina Vismi as part of Bharath Hackathon and Kaggle's 5-Day AI Agents: Intensive Vibe Coding Course with Google (July 2026).

#!/usr/bin/env python3
import os
import time
import sys
import json
import httpx

API_KEY = os.getenv("NYAYAFLOW_API_KEY", "nyayaflow-dev-key-change-in-prod")
BASE = os.getenv("AGENT_SERVER_URL", "http://127.0.0.1:8000")

HEALTH = f"{BASE}/health"
PROCESS = f"{BASE}/api/agents/process"

sample_text = "IN THE HIGH COURT OF KARNATAKA: " + ("This is a sample legal text. " * 30)
payload = {"document_text": sample_text, "case_number": "WP 12345/2025"}

client = httpx.Client(timeout=20.0)

# wait for server
for i in range(15):
    try:
        r = client.get(HEALTH)
        if r.status_code == 200:
            print("Server healthy.")
            break
    except Exception:
        pass
    print("Waiting for server...")
    time.sleep(1)
else:
    print("Server did not become healthy in time", file=sys.stderr)
    sys.exit(2)

# call process endpoint
headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
try:
    r = client.post(PROCESS, headers=headers, json=payload)
    print("POST status:", r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)
        sys.exit(1)
except Exception as e:
    print("Request failed:", str(e), file=sys.stderr)
    sys.exit(3)

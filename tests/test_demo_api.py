import os
import httpx


def test_agent_demo_mode():
    """Verify the FastAPI agent server returns demo-mode output without ADK installed."""
    base_url = os.getenv("AGENT_SERVER_URL", "http://127.0.0.1:8000")
    api_key = os.getenv("NYAYAFLOW_API_KEY", "nyayaflow-dev-key-change-in-prod")
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }

    client = httpx.Client(timeout=20.0)
    try:
        health = client.get(f"{base_url}/health")
        assert health.status_code == 200

        response = client.post(
            f"{base_url}/api/agents/process",
            headers=headers,
            json={
                "document_text": "IN THE HIGH COURT OF KARNATAKA: " + ("Legal text sample. " * 30),
                "case_number": "WP 12345/2025",
            },
        )
        assert response.status_code == 200
        result = response.json()

        assert result["success"] is True
        assert result.get("demo_mode") is True
        assert result["extraction"]["case_number"] == "WP 12345/2025"
        assert "summary" in result
        assert "audit_trail" in result
    finally:
        client.close()

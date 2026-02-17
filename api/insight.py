from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request


def build_insight_prompt(schema: str) -> str:
    return f"""You are a senior data analyst consultant. Your job is to explore a dataset, run queries to understand it, and produce actionable business insights.

DATASET SCHEMA:
{schema}

INSTRUCTIONS:
1. You must explore the data before giving insights. Run queries to understand distributions, trends, anomalies, and key metrics.
2. You have a maximum of 5 queries — make them count.
3. Focus on actionable business insights, not just descriptions of the data.
4. Return ONLY valid JSON (no markdown code blocks).

RESPONSE FORMAT — you must return one of two JSON shapes:

To run a query:
{{"action": "query", "sql": "SELECT ...", "reasoning": "Why I'm running this query"}}

To deliver final insights (after you've explored enough):
{{"action": "insight", "summary": "Overall summary of findings", "insights": [
  {{
    "title": "Short insight title",
    "description": "Detailed explanation with specific numbers from your analysis",
    "type": "trend|anomaly|recommendation|observation",
    "priority": "high|medium|low"
  }}
]}}

RULES:
- Start by understanding the shape and distribution of the data
- Each query should build on what you learned from previous results
- Use standard SQL compatible with DuckDB
- When you have enough information, deliver insights — don't use all 5 queries if you don't need to
- Every insight must reference specific numbers or patterns you found
- Prioritize insights that would drive business decisions"""


def parse_insight_response(raw: str) -> dict:
    content = raw.strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    parsed = json.loads(content)

    action = parsed.get("action")
    if action == "query":
        if "sql" not in parsed or "reasoning" not in parsed:
            raise ValueError("Query response missing 'sql' or 'reasoning'")
    elif action == "insight":
        if "summary" not in parsed or "insights" not in parsed:
            raise ValueError("Insight response missing 'summary' or 'insights'")
        if not isinstance(parsed["insights"], list):
            raise ValueError("'insights' must be an array")
    else:
        raise ValueError(f"Unknown action: {action}")

    return parsed


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            schema = data.get("schema")
            messages = data.get("messages", [])

            if not schema:
                self._send_error(400, "Missing schema")
                return

            if not messages:
                self._send_error(400, "Missing messages")
                return

            system_prompt = build_insight_prompt(schema)

            api_key = os.environ.get("OPENROUTER_API_KEY", "")
            if not api_key:
                raise ValueError("OPENROUTER_API_KEY environment variable not set")

            api_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                api_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

            payload = json.dumps({
                "model": "openai/gpt-oss-120b:free",
                "messages": api_messages,
                "temperature": 0.2,
                "max_tokens": 2048,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=60) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))

            raw_content = resp_data["choices"][0]["message"]["content"]
            result = parse_insight_response(raw_content)

            self._send_json(200, result)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON in request body")
        except ValueError as e:
            self._send_error(500, str(e))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            self._send_error(502, f"LLM API error ({e.code}): {error_body[:200]}")
        except Exception as e:
            self._send_error(500, f"Internal error: {str(e)}")

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {"error": message})

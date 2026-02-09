from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request


def build_system_prompt(document_context: str) -> str:
    # Truncate document if too large (keep ~60k chars to stay within context)
    max_chars = 60000
    if len(document_context) > max_chars:
        document_context = document_context[:max_chars] + "\n\n[Document truncated due to length...]"

    return f"""You are a helpful document analyst. You answer questions about the provided PDF document accurately and concisely.

DOCUMENT CONTENT:
{document_context}

RULES:
1. Return ONLY valid JSON with keys: answer, pages (optional)
2. "answer" should be a clear, well-structured response to the user's question
3. "pages" should be an array of page numbers that are most relevant to your answer (e.g. [1, 3, 5])
4. Only include "pages" when you can identify specific pages that support your answer
5. Base your answers strictly on the document content — do not make up information
6. If the answer is not in the document, say so clearly
7. For summaries, cover all key points from the document
8. Keep answers concise but thorough
9. Do NOT wrap the JSON in markdown code blocks — return raw JSON only"""


def call_openrouter(system_prompt: str, messages: list) -> dict:
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
        "temperature": 0.1,
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
        data = json.loads(resp.read().decode("utf-8"))

    content = data["choices"][0]["message"]["content"]

    # Strip markdown code fences if present
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    return json.loads(content)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            document_context = data.get("documentContext")
            messages = data.get("messages", [])

            if not document_context:
                self._send_error(400, "Missing document context")
                return

            if not messages:
                self._send_error(400, "Missing messages")
                return

            system_prompt = build_system_prompt(document_context)
            result = call_openrouter(system_prompt, messages)

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

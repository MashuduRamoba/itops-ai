
import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").lower()

OLLAMA_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://127.0.0.1:11434"
).rstrip("/")

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b"
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b"
)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """
You are ITOps AI, an intelligent IT support assistant.

You specialise in:
- SharePoint Online
- Microsoft 365
- Microsoft Teams
- Microsoft Entra ID
- ServiceNow incident management
- General IT troubleshooting

When analysing an incident:
1. Summarise the issue.
2. Identify possible root causes.
3. Provide step-by-step troubleshooting instructions.
4. Suggest when escalation is required.
5. Draft a professional ServiceNow ticket update.

Do not claim that you have performed actions
or resolved incidents.
Never ask for passwords or MFA codes.
"""


async def analyse_incident(description: str) -> str:
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": description
        }
    ]

    async with httpx.AsyncClient(timeout=180.0) as client:

        if AI_PROVIDER == "groq":
            if not GROQ_API_KEY:
                raise RuntimeError(
                    "GROQ_API_KEY is missing from environment variables."
                )

            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.3
                }
            )

            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]

        elif AI_PROVIDER == "ollama":
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False
                }
            )

            response.raise_for_status()

            data = response.json()
            return data["message"]["content"]

        else:
            raise ValueError(
                f"Unsupported AI_PROVIDER: {AI_PROVIDER}"
            )

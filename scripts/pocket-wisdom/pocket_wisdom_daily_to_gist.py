#!/usr/bin/env python3
"""
Daily Pocket Wisdom & Kurals Generator
Generates one concise bilingual literary quote & micro-reflection per day using Gemini 4 Hydrogen
and publishes to a GitHub Gist.
"""

import os
import sys
import json
import random
from datetime import datetime
from pathlib import Path

from google import genai
from github import Github, InputFileContent

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-4-hydrogen")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
POCKET_WISDOM_GIST_ID = os.environ.get("POCKET_WISDOM_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "pocket-wisdom"
PUBLIC_DOCS_DIR = Path(__file__).parent.parent.parent / "public" / "docs" / "pocket-wisdom"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"


def load_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def save_file(filepath, content):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def _sanitize_gist_files(files: dict) -> dict:
    sanitized = {}
    for name, value in (files or {}).items():
        if value is None:
            sanitized[name] = None
        elif isinstance(value, InputFileContent):
            sanitized[name] = value
        elif isinstance(value, dict):
            sanitized[name] = InputFileContent(value.get("content", str(value)))
        else:
            sanitized[name] = InputFileContent(str(value))
    return sanitized


def get_next_quote_num(gist):
    files = [f for f in gist.files.keys() if f.startswith("quote_") and f.endswith(".md")]
    nums = []
    for filename in files:
        try:
            nums.append(int(filename.replace("quote_", "").replace(".md", "")))
        except ValueError:
            continue
    return max(nums) + 1 if nums else 1


def generate_quote(language):
    client = genai.Client(api_key=GEMINI_API_KEY)
    template = load_file(PROMPTS_DIR / "quote_prompt.txt")
    prompt = template.format(language=language)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


def extract_title_and_quote(text):
    title = ""
    quote = ""
    for line in text.splitlines():
        s = line.strip()
        if not title and s.startswith("# "):
            title = s.replace("# ", "", 1).strip()
        elif not quote and s.startswith("> "):
            quote = s.replace("> ", "", 1).strip().strip('"')
    return title or f"Reflection {datetime.now().strftime('%Y-%m-%d')}", quote


def update_chapters_json(gist):
    files = sorted([f for f in gist.files.keys() if f.startswith("quote_") and f.endswith(".md")])
    entries = []
    for filename in files:
        try:
            num = int(filename.replace("quote_", "").replace(".md", ""))
            content = gist.files[filename].content
            title, quote_line = extract_title_and_quote(content)
            item = {
                "chapter": num,
                "filename": filename,
                "url": gist.files[filename].raw_url,
                "gist_url": f"https://gist.github.com/{POCKET_WISDOM_GIST_ID}#{filename}",
                "chapter_name": title,
                "quote": quote_line,
            }
            for line in reversed(content.splitlines()[-6:]):
                if line.startswith("<!-- Language: ") and line.endswith(" -->"):
                    item["language"] = line.replace("<!-- Language: ", "").replace(" -->", "").strip()
                if line.startswith("<!-- Published: ") and line.endswith(" -->"):
                    item["published_date"] = line.replace("<!-- Published: ", "").replace(" -->", "").strip()
            entries.append(item)
        except (ValueError, KeyError):
            continue

    data = {
        "novel_title": "Pocket Wisdom & Kurals",
        "genre": "Aphorisms & Quotes",
        "subgenre": "Bilingual Reflections",
        "language": "English & Tamil",
        "difficulty": "low",
        "update_frequency": "Updated daily",
        "total_chapters": len(entries),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": POCKET_WISDOM_GIST_ID,
        "completed": False,
        "chapters": entries,
    }
    return json.dumps(data, indent=2, ensure_ascii=False)


def main():
    if not GEMINI_API_KEY or not GIST_TOKEN or not POCKET_WISDOM_GIST_ID:
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    gist = Github(GIST_TOKEN).get_gist(POCKET_WISDOM_GIST_ID)
    num = get_next_quote_num(gist)
    language = "Tamil" if num % 2 == 0 else "English"
    text = generate_quote(language)
    _, quote_line = extract_title_and_quote(text)

    filename = f"quote_{num:03d}.md"
    publish_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    full_content = (
        f"{text}\n\n"
        f"<!-- Language: {language} -->\n"
        f"<!-- Quote: {quote_line} -->\n"
        f"<!-- Published: {publish_dt} -->"
    )
    gist.edit(
        description=f"Pocket Wisdom & Kurals - {num} Reflections",
        files=_sanitize_gist_files({filename: full_content}),
    )

    refreshed = Github(GIST_TOKEN).get_gist(POCKET_WISDOM_GIST_ID)
    chapters_json = update_chapters_json(refreshed)
    refreshed.edit(files=_sanitize_gist_files({"chapters.json": chapters_json}))
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    save_file(PUBLIC_DOCS_DIR / "chapters.json", chapters_json)
    print(f"✓ Daily Pocket Wisdom #{num} ({language}) published!")


if __name__ == "__main__":
    main()

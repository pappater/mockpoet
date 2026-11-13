#!/usr/bin/env python3
"""
Daily Tamil Poetry Generator (காற்றில் கலந்த கவிதை)
Generates one original Tamil poem per day across classical Sangam and modern Pudukkavithai traditions.
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
TAMIL_POETRY_GIST_ID = os.environ.get("TAMIL_POETRY_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "tamil-poetry"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"
STYLES_FILE = SCRIPTS_DIR / "poets.json"


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


def load_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


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


def get_poem_number(gist):
    poem_files = [f for f in gist.files.keys() if f.startswith("poem_") and f.endswith(".md")]
    nums = []
    for filename in poem_files:
        try:
            nums.append(int(filename.replace("poem_", "").replace(".md", "")))
        except ValueError:
            continue
    return max(nums) + 1 if nums else 1


def select_random_style():
    data = load_json(STYLES_FILE)
    if not data or not data.get("styles"):
        print("ERROR: Could not load poets.json")
        sys.exit(1)
    style = random.choice(data["styles"])
    print(f"Selected Tamil style: {style}")
    return style


def generate_poem(poem_num, style):
    client = genai.Client(api_key=GEMINI_API_KEY)
    template = load_file(PROMPTS_DIR / "poem_prompt.txt")
    prompt = template.format(style=style)
    print(f"Generating Tamil Poem #{poem_num} ({style}) with {GEMINI_MODEL}...")
    return client.models.generate_content(model=GEMINI_MODEL, contents=prompt).text


def extract_poem_title(poem_text):
    lines = poem_text.strip().split("\n")
    if lines and lines[0].startswith("# "):
        return lines[0].replace("# ", "").strip()
    return f"தமிழ் கவிதை {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist):
    poem_files = sorted([f for f in gist.files.keys() if f.startswith("poem_") and f.endswith(".md")])
    poems = []
    for filename in poem_files:
        try:
            poem_num = int(filename.replace("poem_", "").replace(".md", ""))
            content = gist.files[filename].content
            poem_data = {
                "chapter": poem_num,
                "filename": filename,
                "url": gist.files[filename].raw_url,
                "gist_url": f"https://gist.github.com/{TAMIL_POETRY_GIST_ID}#{filename}",
                "chapter_name": extract_poem_title(content),
            }
            for line in reversed(content.split("\n")[-5:]):
                if line.startswith("<!-- Published: ") and line.endswith(" -->"):
                    poem_data["published_date"] = line.replace("<!-- Published: ", "").replace(" -->", "").strip()
                if line.startswith("<!-- Poetry Type: ") and line.endswith(" -->"):
                    poem_data["poetry_type"] = line.replace("<!-- Poetry Type: ", "").replace(" -->", "").strip()
            poems.append(poem_data)
        except (ValueError, KeyError):
            continue

    chapters_data = {
        "novel_title": "காற்றில் கலந்த கவிதை (Tamil Poetry)",
        "genre": "Poetry",
        "subgenre": "Tamil Poetry",
        "language": "Tamil",
        "difficulty": "medium",
        "update_frequency": "Updated daily",
        "total_chapters": len(poems),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": TAMIL_POETRY_GIST_ID,
        "completed": False,
        "chapters": poems,
    }
    return json.dumps(chapters_data, ensure_ascii=False, indent=2)


def main():
    if not GEMINI_API_KEY or not GIST_TOKEN or not TAMIL_POETRY_GIST_ID:
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    gist = Github(GIST_TOKEN).get_gist(TAMIL_POETRY_GIST_ID)
    poem_num = get_poem_number(gist)
    style = select_random_style()
    poem_text = generate_poem(poem_num, style)

    poem_filename = f"poem_{poem_num:03d}.md"
    publish_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    files = {poem_filename: f"{poem_text}\n\n<!-- Poetry Type: {style} -->\n<!-- Published: {publish_datetime} -->"}
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme

    gist.edit(
        description=f"Tamil Poetry Collection - {poem_num} Poems",
        files=_sanitize_gist_files(files),
    )

    refreshed_gist = Github(GIST_TOKEN).get_gist(TAMIL_POETRY_GIST_ID)
    chapters_json = update_chapters_json(refreshed_gist)
    refreshed_gist.edit(files=_sanitize_gist_files({"chapters.json": chapters_json}))
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    print("✓ Daily Tamil poem generation complete!")


if __name__ == "__main__":
    main()

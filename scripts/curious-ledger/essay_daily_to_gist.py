#!/usr/bin/env python3
"""
Daily Essay Generator (The Curious Ledger)
Randomly picks a difficulty level (low, medium, high) and a topic each day,
generates an essay using Google Gemini AI, and publishes it to a GitHub Gist.
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
CURIOUS_LEDGER_GIST_ID = os.environ.get("CURIOUS_LEDGER_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "curious-ledger"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"
TOPICS_FILE = SCRIPTS_DIR / "topics.json"
CONFIG_FILE = SCRIPTS_DIR / "config.json"


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


def get_essay_number(gist):
    essay_files = [f for f in gist.files.keys() if f.startswith("essay_") and f.endswith(".md")]
    nums = []
    for filename in essay_files:
        try:
            nums.append(int(filename.replace("essay_", "").replace(".md", "")))
        except ValueError:
            continue
    return max(nums) + 1 if nums else 1


def select_random_difficulty_and_topic():
    config = load_json(CONFIG_FILE) or {}
    levels = config.get("difficulty_levels", ["low", "medium", "high"])
    difficulty = random.choice(levels)
    word_ranges = config.get("word_count_by_difficulty", {})
    min_words, max_words = word_ranges.get(difficulty, [1000, 1500])

    topics_data = load_json(TOPICS_FILE) or {}
    topics = topics_data.get("topics", ["The quiet architecture of everyday life"])
    topic = random.choice(topics)

    print(f"Selected difficulty: {difficulty} | topic: {topic}")
    return difficulty, topic, min_words, max_words


def generate_essay(essay_num, difficulty, topic, min_words, max_words):
    client = genai.Client(api_key=GEMINI_API_KEY)
    template = load_file(PROMPTS_DIR / "essay_prompt.txt")
    prompt = template.format(
        topic=topic,
        difficulty=difficulty,
        min_words=min_words,
        max_words=max_words,
    )
    print(f"Generating Essay #{essay_num} ({difficulty}) with {GEMINI_MODEL}...")
    return client.models.generate_content(model=GEMINI_MODEL, contents=prompt).text


def extract_title(text):
    lines = text.strip().split("\n")
    if lines and lines[0].startswith("# "):
        return lines[0].replace("# ", "").strip()
    return f"Essay {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist):
    essay_files = sorted([f for f in gist.files.keys() if f.startswith("essay_") and f.endswith(".md")])
    essays = []
    for filename in essay_files:
        try:
            essay_num = int(filename.replace("essay_", "").replace(".md", ""))
            content = gist.files[filename].content
            essay_data = {
                "chapter": essay_num,
                "filename": filename,
                "url": gist.files[filename].raw_url,
                "gist_url": f"https://gist.github.com/{CURIOUS_LEDGER_GIST_ID}#{filename}",
                "chapter_name": extract_title(content),
                "difficulty": "medium",
            }
            for line in reversed(content.split("\n")[-6:]):
                if line.startswith("<!-- Published: ") and line.endswith(" -->"):
                    essay_data["published_date"] = line.replace("<!-- Published: ", "").replace(" -->", "").strip()
                if line.startswith("<!-- Difficulty: ") and line.endswith(" -->"):
                    essay_data["difficulty"] = line.replace("<!-- Difficulty: ", "").replace(" -->", "").strip().lower()
                if line.startswith("<!-- Topic: ") and line.endswith(" -->"):
                    essay_data["topic"] = line.replace("<!-- Topic: ", "").replace(" -->", "").strip()
            essays.append(essay_data)
        except (ValueError, KeyError):
            continue

    chapters_data = {
        "novel_title": "The Curious Ledger",
        "genre": "Non-Fiction",
        "subgenre": "Essays",
        "difficulty": "mixed",
        "update_frequency": "Updated daily (Low / Medium / High)",
        "total_chapters": len(essays),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": CURIOUS_LEDGER_GIST_ID,
        "completed": False,
        "chapters": essays,
    }
    return json.dumps(chapters_data, indent=2)


def main():
    if not GEMINI_API_KEY or not GIST_TOKEN or not CURIOUS_LEDGER_GIST_ID:
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    gist = Github(GIST_TOKEN).get_gist(CURIOUS_LEDGER_GIST_ID)
    essay_num = get_essay_number(gist)
    difficulty, topic, min_words, max_words = select_random_difficulty_and_topic()
    essay_text = generate_essay(essay_num, difficulty, topic, min_words, max_words)

    essay_filename = f"essay_{essay_num:03d}.md"
    publish_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    files = {
        essay_filename: (
            f"{essay_text}\n\n"
            f"<!-- Difficulty: {difficulty} -->\n"
            f"<!-- Topic: {topic} -->\n"
            f"<!-- Published: {publish_datetime} -->"
        )
    }
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme

    gist.edit(
        description=f"The Curious Ledger - Daily Essays - {essay_num} Essays",
        files=_sanitize_gist_files(files),
    )

    refreshed_gist = Github(GIST_TOKEN).get_gist(CURIOUS_LEDGER_GIST_ID)
    chapters_json = update_chapters_json(refreshed_gist)
    refreshed_gist.edit(files=_sanitize_gist_files({"chapters.json": chapters_json}))
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    print("✓ Daily essay generation complete!")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Daily Paper Lantern Short Story Generator
Generates one short story per day using Google Gemini AI in the style of a randomly selected
literary author, and publishes all outputs to a single public GitHub Gist.
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
PAPER_LANTERN_GIST_ID = os.environ.get("PAPER_LANTERN_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "paper-lantern"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

AUTHORS_FILE = SCRIPTS_DIR / "authors.json"
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


def get_story_number(gist):
    story_files = [f for f in gist.files.keys() if f.startswith("story_") and f.endswith(".md")]
    if not story_files:
        return 1
    nums = []
    for filename in story_files:
        try:
            nums.append(int(filename.replace("story_", "").replace(".md", "")))
        except ValueError:
            continue
    return max(nums) + 1 if nums else 1


def select_random_author():
    authors_data = load_json(AUTHORS_FILE)
    if not authors_data or not authors_data.get("authors"):
        print("ERROR: Could not load authors list")
        sys.exit(1)
    selected = random.choice(authors_data["authors"])
    print(f"Selected author: {selected}")
    return selected


def generate_short_story(story_num, author, min_words, max_words):
    client = genai.Client(api_key=GEMINI_API_KEY)
    template = load_file(PROMPTS_DIR / "story_prompt.txt")
    prompt = template.format(author=author, min_words=min_words, max_words=max_words)
    print(f"Generating Short Story #{story_num} in the style of {author} ({GEMINI_MODEL})...")
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text


def extract_story_title(story_text):
    lines = story_text.strip().split("\n")
    if lines and lines[0].startswith("# "):
        return lines[0].replace("# ", "").strip()
    return f"Story {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist):
    story_files = sorted([f for f in gist.files.keys() if f.startswith("story_") and f.endswith(".md")])
    stories = []
    for filename in story_files:
        try:
            story_num = int(filename.replace("story_", "").replace(".md", ""))
            raw_url = gist.files[filename].raw_url
            story_data = {
                "chapter": story_num,
                "filename": filename,
                "url": raw_url,
                "gist_url": f"https://gist.github.com/{PAPER_LANTERN_GIST_ID}#{filename}",
            }
            content = gist.files[filename].content
            title = extract_story_title(content)
            if title:
                story_data["chapter_name"] = title
            for line in reversed(content.split("\n")[-5:]):
                if line.startswith("<!-- Published: ") and line.endswith(" -->"):
                    story_data["published_date"] = line.replace("<!-- Published: ", "").replace(" -->", "").strip()
                if line.startswith("<!-- Author Style: ") and line.endswith(" -->"):
                    story_data["author_style"] = line.replace("<!-- Author Style: ", "").replace(" -->", "").strip()
            stories.append(story_data)
        except (ValueError, KeyError):
            continue

    chapters_data = {
        "novel_title": "The Paper Lantern",
        "genre": "Fiction",
        "subgenre": "Short Stories",
        "difficulty": "medium",
        "update_frequency": "Updated daily",
        "total_chapters": len(stories),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": PAPER_LANTERN_GIST_ID,
        "completed": False,
        "chapters": stories,
    }
    return json.dumps(chapters_data, indent=2)


def update_gist(story_num, story_text, author, gist):
    story_filename = f"story_{story_num:03d}.md"
    publish_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    files = {
        story_filename: f"{story_text}\n\n<!-- Author Style: {author} -->\n<!-- Published: {publish_datetime} -->"
    }
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme

    gist.edit(
        description=f"The Paper Lantern - Short Story Collection - {story_num} Stories",
        files=_sanitize_gist_files(files),
    )

    refreshed_gist = Github(GIST_TOKEN).get_gist(PAPER_LANTERN_GIST_ID)
    chapters_json = update_chapters_json(refreshed_gist)
    refreshed_gist.edit(files=_sanitize_gist_files({"chapters.json": chapters_json}))
    save_file(DOCS_DIR / "chapters.json", chapters_json)


def main():
    if not GEMINI_API_KEY or not GIST_TOKEN or not PAPER_LANTERN_GIST_ID:
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    config_data = load_json(CONFIG_FILE) or {}
    min_words = config_data.get("min_word_count", 5000)
    max_words = config_data.get("max_word_count", 7500)

    gist = Github(GIST_TOKEN).get_gist(PAPER_LANTERN_GIST_ID)
    story_num = get_story_number(gist)
    author = select_random_author()
    story_text = generate_short_story(story_num, author, min_words, max_words)
    update_gist(story_num, story_text, author, gist)
    print("✓ Daily Paper Lantern short story generation complete!")


if __name__ == "__main__":
    main()

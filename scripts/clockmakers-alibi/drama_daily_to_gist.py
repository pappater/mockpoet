#!/usr/bin/env python3
"""
Daily Drama Generator: The Clockmaker's Alibi
Generates one scene per day across 3 Acts (12 scenes total) until complete,
then marks the drama as completed and stops generating.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

from google import genai
from github import Github, InputFileContent

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-4-hydrogen")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
GIST_ID = os.environ.get("CLOCKMAKERS_ALIBI_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "clockmakers-alibi"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

DRAMA_STRUCTURE = [
    (1, 1, "The Stopped Pendulum"),
    (1, 2, "The Platform Ticket"),
    (1, 3, "Two Keys in Brass"),
    (1, 4, "The Midnight Express"),
    (2, 1, "The Apprentice's Ledger"),
    (2, 2, "Tea at the Stationmaster's"),
    (2, 3, "The Missing Mainspring"),
    (2, 4, "Voices Behind the Shutter"),
    (3, 1, "The Fog Lifts"),
    (3, 2, "Twelve Strikes at Nine"),
    (3, 3, "The Second Confession"),
    (3, 4, "Final Winding"),
]


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


def main():
    chapters_path = DOCS_DIR / "chapters.json"
    existing_meta = json.loads(load_file(chapters_path) or "{}")
    if existing_meta.get("completed", False):
        print("Drama is already completed. Exiting.")
        sys.exit(0)

    if not GEMINI_API_KEY or not GIST_TOKEN or not GIST_ID:
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    gist = Github(GIST_TOKEN).get_gist(GIST_ID)
    existing_chapters = existing_meta.get("chapters", [])
    next_index = len(existing_chapters)

    if next_index >= len(DRAMA_STRUCTURE):
        existing_meta["completed"] = True
        existing_meta["update_frequency"] = "Complete drama"
        out = json.dumps(existing_meta, indent=2)
        save_file(chapters_path, out)
        gist.edit(files=_sanitize_gist_files({"chapters.json": out}))
        print("All scenes finished; marked drama as completed.")
        sys.exit(0)

    act_num, scene_num, scene_title = DRAMA_STRUCTURE[next_index]
    series_bible = load_file(DOCS_DIR / "series_bible.md") or ""
    outline = load_file(DOCS_DIR / "outline.md") or ""
    previous_summary = load_file(DOCS_DIR / "summaries.md") or ""

    client = genai.Client(api_key=GEMINI_API_KEY)

    scene_prompt = load_file(PROMPTS_DIR / "scene_prompt.txt").format(
        act_num=act_num,
        scene_num=scene_num,
        scene_title=scene_title,
        series_bible=series_bible,
        outline=outline,
        previous_summary=previous_summary,
    )
    scene_text = client.models.generate_content(model=GEMINI_MODEL, contents=scene_prompt).text

    summary_prompt = load_file(PROMPTS_DIR / "summary_prompt.txt").format(
        act_num=act_num,
        scene_num=scene_num,
        scene_text=scene_text,
    )
    summary = client.models.generate_content(model=GEMINI_MODEL, contents=summary_prompt).text

    filename = f"act_{act_num}_scene_{scene_num:02d}.md"
    save_file(DOCS_DIR / filename, scene_text)

    updated_summaries = previous_summary + f"\n\n## Act {act_num}, Scene {scene_num}: {scene_title}\n\n{summary}"
    save_file(DOCS_DIR / "summaries.md", updated_summaries)

    is_completed = (next_index + 1) >= len(DRAMA_STRUCTURE)
    files_to_upload = {
        filename: scene_text,
        "summaries.md": updated_summaries,
    }
    gist.edit(files=_sanitize_gist_files(files_to_upload))
    refreshed = Github(GIST_TOKEN).get_gist(GIST_ID)

    existing_chapters.append({
        "chapter": next_index + 1,
        "act": act_num,
        "scene": scene_num,
        "filename": filename,
        "url": refreshed.files[filename].raw_url,
        "gist_url": f"https://gist.github.com/{GIST_ID}#{filename}",
        "chapter_name": f"Act {act_num}, Scene {scene_num}: {scene_title}",
        "published_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
    })

    new_meta = {
        "novel_title": "The Clockmaker's Alibi",
        "genre": "Drama",
        "subgenre": "Mystery Drama",
        "difficulty": "medium",
        "update_frequency": "Complete drama" if is_completed else f"Updated daily ({len(existing_chapters)} of {len(DRAMA_STRUCTURE)} scenes)",
        "total_chapters": len(existing_chapters),
        "planned_chapters": len(DRAMA_STRUCTURE),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": GIST_ID,
        "completed": is_completed,
        "chapters": existing_chapters,
    }
    out_json = json.dumps(new_meta, indent=2)
    save_file(chapters_path, out_json)
    refreshed.edit(files=_sanitize_gist_files({"chapters.json": out_json}))
    print(f"✓ Generated Act {act_num}, Scene {scene_num}: {scene_title} (completed={is_completed})")


if __name__ == "__main__":
    main()

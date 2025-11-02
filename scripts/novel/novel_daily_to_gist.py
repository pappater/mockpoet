#!/usr/bin/env python3
"""
Daily Gemini Novel Generator
Generates one chapter per day using Google Gemini AI in a Dostoevsky-like voice,
maintains continuity via series bible, outline, summaries, and a continuity log,
and publishes all outputs to a single public GitHub Gist.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

import google.generativeai as genai
from github import Github

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
GIST_ID = os.environ.get("GIST_ID")

DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "novel-gist"
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Theme for the novel
THEME = "Debt, mercy, and the burden of promises"


def load_file(filepath):
    """Load text content from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def save_file(filepath, content):
    """Save text content to a file."""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def _list_and_print_models():
    """List available Gemini models for debugging purposes."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("\nAvailable Gemini models:")
        for model in genai.list_models():
            print(f"  - {model.name}")
            if hasattr(model, 'supported_generation_methods'):
                print(f"    Supported methods: {model.supported_generation_methods}")
    except Exception as e:
        print(f"  Unable to list models: {e}")


def get_chapter_number():
    """Determine the next chapter number from the continuity log."""
    log_path = DOCS_DIR / "continuity_log.txt"
    log_content = load_file(log_path)
    
    if not log_content:
        return 1
    
    # Count chapter entries
    chapter_count = log_content.count("Chapter ")
    return chapter_count + 1


def generate_chapter(chapter_num, series_bible, outline, previous_summary):
    """Generate a new chapter using Gemini AI."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Load chapter prompt template
        chapter_prompt_template = load_file(PROMPTS_DIR / "chapter_prompt.txt")
        
        # Build the prompt
        prompt = chapter_prompt_template.format(
            chapter_num=chapter_num,
            theme=THEME,
            series_bible=series_bible,
            outline=outline,
            previous_summary=previous_summary or "This is the first chapter."
        )
        
        print(f"Generating Chapter {chapter_num}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate chapter using model '{GEMINI_MODEL}': {e}")
        print(f"Check if the model name is correct and available.")
        _list_and_print_models()
        sys.exit(1)


def generate_summary(chapter_text, chapter_num):
    """Generate a summary of the chapter for continuity."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Load summary prompt template
        summary_prompt_template = load_file(PROMPTS_DIR / "summary_prompt.txt")
        
        prompt = summary_prompt_template.format(
            chapter_num=chapter_num,
            chapter_text=chapter_text
        )
        
        print(f"Generating summary for Chapter {chapter_num}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate summary using model '{GEMINI_MODEL}': {e}")
        print(f"Check if the model name is correct and available.")
        _list_and_print_models()
        sys.exit(1)


def update_continuity_log(chapter_num, summary):
    """Update the continuity log with the new chapter summary."""
    log_path = DOCS_DIR / "continuity_log.txt"
    log_content = load_file(log_path) or ""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    new_entry = f"\n\n--- Chapter {chapter_num} ({timestamp}) ---\n{summary}"
    
    updated_log = log_content + new_entry
    save_file(log_path, updated_log)
    
    return updated_log


def update_gist(chapter_num, chapter_text, continuity_log):
    """Update the GitHub Gist with new chapter and continuity log."""
    g = Github(GIST_TOKEN)
    gist = g.get_gist(GIST_ID)
    
    # Prepare files for the gist
    # PyGithub expects: filename -> string content (not nested dicts)
    files = {}
    
    # Add the new chapter
    chapter_filename = f"chapter_{chapter_num:03d}.md"
    chapter_content = f"# Chapter {chapter_num}\n\n{chapter_text}"
    files[chapter_filename] = chapter_content
    
    # Update continuity log
    files["continuity_log.txt"] = continuity_log
    
    # Also update series bible, outline, and summaries if they exist
    series_bible = load_file(DOCS_DIR / "series_bible.md")
    if series_bible:
        files["series_bible.md"] = series_bible
    
    outline = load_file(DOCS_DIR / "outline.md")
    if outline:
        files["outline.md"] = outline
    
    summaries = load_file(DOCS_DIR / "summaries.md")
    if summaries:
        files["summaries.md"] = summaries
    
    print(f"Updating Gist {GIST_ID}...")
    gist.edit(
        description=f"Daily Dostoevsky-style Novel - {chapter_num} Chapters",
        files=files
    )
    
    print(f"✓ Gist updated successfully!")
    print(f"  View at: https://gist.github.com/{GIST_ID}")


def ensure_first_chapter_in_gist(gist, series_bible, outline, summaries):
    """
    Check if Chapter 1 exists in the Gist. If not, generate and publish it.
    
    Args:
        gist: PyGithub Gist object
        series_bible: Series bible content
        outline: Outline content
        summaries: Summaries content (may be None or empty)
    
    Returns:
        bool: True if Chapter 1 was created, False if it already existed
    """
    # Check if chapter_001.md exists in the Gist
    if "chapter_001.md" in gist.files:
        print("✓ Chapter 1 already exists in Gist")
        return False
    
    print("⚠ Chapter 1 not found in Gist. Generating initial chapter...")
    
    # Generate Chapter 1
    chapter_text = generate_chapter(1, series_bible, outline, summaries)
    
    # Generate summary for Chapter 1
    summary = generate_summary(chapter_text, 1)
    
    # Update continuity log locally
    continuity_log = update_continuity_log(1, summary)
    
    # Update summaries file locally
    summaries_content = summaries or "# Chapter Summaries\n"
    summaries_content += f"\n\n## Chapter 1\n\n{summary}"
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    
    # Prepare files for Gist update (using correct format: filename -> string)
    files = {}
    files["chapter_001.md"] = f"# Chapter 1\n\n{chapter_text}"
    files["continuity_log.txt"] = continuity_log
    files["summaries.md"] = summaries_content
    
    # Also include canon files if they exist
    if series_bible:
        files["series_bible.md"] = series_bible
    if outline:
        files["outline.md"] = outline
    
    print(f"Publishing Chapter 1 to Gist {GIST_ID}...")
    gist.edit(
        description="Daily Dostoevsky-style Novel - 1 Chapter",
        files=files
    )
    
    print("✓ Chapter 1 created and published successfully!")
    return True


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not GIST_TOKEN:
        print("ERROR: GIST_TOKEN environment variable not set")
        sys.exit(1)
    
    if not GIST_ID:
        print("ERROR: GIST_ID environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Daily Gemini Novel Generator")
    print("=" * 60)
    
    # Load canon files
    series_bible = load_file(DOCS_DIR / "series_bible.md")
    outline = load_file(DOCS_DIR / "outline.md")
    summaries = load_file(DOCS_DIR / "summaries.md")
    
    if not series_bible or not outline:
        print("ERROR: Missing required canon files (series_bible.md, outline.md)")
        sys.exit(1)
    
    # Get Gist object for initial check
    g = Github(GIST_TOKEN)
    gist = g.get_gist(GIST_ID)
    print(f"✓ Connected to Gist {GIST_ID}")
    
    # Ensure Chapter 1 exists in Gist (generate if missing)
    chapter1_created = ensure_first_chapter_in_gist(gist, series_bible, outline, summaries)
    
    if chapter1_created:
        # If we just created Chapter 1, we're done for this run
        print("\n" + "=" * 60)
        print("✓ Initial Chapter 1 generation complete!")
        print("=" * 60)
        return
    
    # Determine chapter number
    chapter_num = get_chapter_number()
    print(f"\nGenerating Chapter {chapter_num}")
    print(f"Theme: {THEME}")
    
    # Generate the chapter
    chapter_text = generate_chapter(chapter_num, series_bible, outline, summaries)
    
    # Generate summary
    summary = generate_summary(chapter_text, chapter_num)
    
    # Update continuity log
    continuity_log = update_continuity_log(chapter_num, summary)
    
    # Update summary file
    summaries_content = load_file(DOCS_DIR / "summaries.md") or "# Chapter Summaries\n"
    summaries_content += f"\n\n## Chapter {chapter_num}\n\n{summary}"
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    
    # Update Gist
    update_gist(chapter_num, chapter_text, continuity_log)
    
    print("\n" + "=" * 60)
    print("✓ Daily chapter generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

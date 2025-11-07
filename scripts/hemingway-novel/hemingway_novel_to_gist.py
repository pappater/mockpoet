#!/usr/bin/env python3
"""
Complete Hemingway-style Novel Generator
Generates all chapters at once using Google Gemini AI in a Hemingway-like voice,
and publishes all outputs to a single public GitHub Gist.
"""

import os
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

import google.generativeai as genai
from github import Github, InputFileContent

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
HEMINGWAY_GIST_ID = os.environ.get("HEMINGWAY_GIST_ID")

DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "hemingway-novel"
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Novel configuration
NOVEL_TITLE = "The Sun Also Rises Again"
TOTAL_CHAPTERS = 25  # Can be adjusted - aim for ~200 pages (8-10 pages per chapter)
THEME = "Love, loss, and the search for meaning in post-war America"


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


def _sanitize_gist_files(files: dict) -> dict:
    """
    Ensure values passed to gist.edit are either None or InputFileContent instances.
    """
    sanitized = {}
    for name, value in (files or {}).items():
        if value is None:
            sanitized[name] = None
        elif isinstance(value, InputFileContent):
            sanitized[name] = value
        elif isinstance(value, dict):
            content = value.get('content', str(value))
            sanitized[name] = InputFileContent(content)
        else:
            sanitized[name] = InputFileContent(str(value))
    return sanitized


def generate_series_bible():
    """Generate the series bible with characters, setting, and themes."""
    print("Generating series bible...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        bible_prompt = load_file(PROMPTS_DIR / "bible_prompt.txt")
        
        prompt = bible_prompt.format(
            novel_title=NOVEL_TITLE,
            theme=THEME
        )
        
        response = model.generate_content(prompt)
        series_bible = response.text.strip()
        
        print(f"Generated series bible ({len(series_bible)} characters)")
        return series_bible
    except Exception as e:
        print(f"ERROR generating series bible: {e}")
        sys.exit(1)


def generate_outline(series_bible):
    """Generate the complete outline for all chapters."""
    print("Generating novel outline...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        outline_prompt = load_file(PROMPTS_DIR / "outline_prompt.txt")
        
        prompt = outline_prompt.format(
            novel_title=NOVEL_TITLE,
            theme=THEME,
            total_chapters=TOTAL_CHAPTERS,
            series_bible=series_bible
        )
        
        response = model.generate_content(prompt)
        outline = response.text.strip()
        
        print(f"Generated outline ({len(outline)} characters)")
        return outline
    except Exception as e:
        print(f"ERROR generating outline: {e}")
        sys.exit(1)


def generate_chapter(chapter_num, series_bible, outline, previous_summaries):
    """Generate a single chapter using Gemini AI in Hemingway style."""
    print(f"Generating Chapter {chapter_num}...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        chapter_prompt_template = load_file(PROMPTS_DIR / "chapter_prompt.txt")
        
        prompt = chapter_prompt_template.format(
            chapter_number=chapter_num,
            novel_title=NOVEL_TITLE,
            theme=THEME,
            series_bible=series_bible,
            outline=outline,
            previous_summaries=previous_summaries or "This is the first chapter."
        )
        
        response = model.generate_content(prompt)
        chapter_text = response.text.strip()
        
        print(f"Generated Chapter {chapter_num} ({len(chapter_text)} characters)")
        return chapter_text
    except Exception as e:
        print(f"ERROR generating chapter {chapter_num}: {e}")
        return None


def generate_summary(chapter_num, chapter_text):
    """Generate a summary of the chapter for continuity."""
    print(f"Generating summary for Chapter {chapter_num}...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        summary_prompt_template = load_file(PROMPTS_DIR / "summary_prompt.txt")
        
        prompt = summary_prompt_template.format(
            chapter_number=chapter_num,
            chapter_text=chapter_text
        )
        
        response = model.generate_content(prompt)
        summary = response.text.strip()
        
        print(f"Generated summary for Chapter {chapter_num}")
        return summary
    except Exception as e:
        print(f"ERROR generating summary for chapter {chapter_num}: {e}")
        return f"Chapter {chapter_num}: Summary generation failed."


def extract_chapter_title(chapter_text):
    """Extract the chapter title from the generated text."""
    # Look for the first heading after "# Chapter N"
    lines = chapter_text.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('# Chapter'):
            # Check next few lines for a title
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                if next_line and not next_line.startswith('#'):
                    # Remove any markdown formatting
                    title = next_line.replace('**', '').replace('*', '').strip()
                    if title and len(title) < 100:
                        return title
    return f"Chapter {chapter_text.split()[1] if len(chapter_text.split()) > 1 else ''}"


def main():
    """Main execution function."""
    print("=" * 60)
    print("Complete Hemingway-style Novel Generator")
    print("=" * 60)
    
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    if not GIST_TOKEN:
        print("ERROR: GIST_TOKEN environment variable not set")
        sys.exit(1)
    if not HEMINGWAY_GIST_ID:
        print("ERROR: HEMINGWAY_GIST_ID environment variable not set")
        sys.exit(1)
    
    print(f"Novel: {NOVEL_TITLE}")
    print(f"Chapters: {TOTAL_CHAPTERS}")
    print(f"Model: {GEMINI_MODEL}")
    print(f"Gist ID: {HEMINGWAY_GIST_ID}")
    print()
    
    # Connect to GitHub
    try:
        gh = Github(GIST_TOKEN)
        gist = gh.get_gist(HEMINGWAY_GIST_ID)
        print(f"Connected to Gist: {gist.html_url}")
    except Exception as e:
        print(f"ERROR: Failed to connect to Gist: {e}")
        sys.exit(1)
    
    # Generate series bible
    series_bible = generate_series_bible()
    save_file(DOCS_DIR / "series_bible.md", series_bible)
    
    # Generate outline
    outline = generate_outline(series_bible)
    save_file(DOCS_DIR / "outline.md", outline)
    
    # Initialize tracking structures
    all_summaries = []
    continuity_log = []
    chapters_data = []
    gist_files = {
        "README.md": InputFileContent(f"# {NOVEL_TITLE}\n\nA complete novel in the style of Ernest Hemingway.\n\nGenerated by the rabbit platform."),
        "series_bible.md": InputFileContent(series_bible),
        "outline.md": InputFileContent(outline)
    }
    
    # Generate all chapters
    for chapter_num in range(1, TOTAL_CHAPTERS + 1):
        try:
            print(f"\n{'='*60}")
            print(f"Processing Chapter {chapter_num} of {TOTAL_CHAPTERS}")
            print(f"{'='*60}")
            
            # Generate chapter
            previous_summaries = "\n\n".join(all_summaries) if all_summaries else None
            chapter_text = generate_chapter(chapter_num, series_bible, outline, previous_summaries)
            
            if not chapter_text:
                print(f"ERROR: Failed to generate chapter {chapter_num}.")
                print(f"Successfully generated {chapter_num - 1} chapters so far.")
                print("Saving progress and stopping...")
                break
            
            # Extract chapter title
            chapter_title = extract_chapter_title(chapter_text)
            
            # Save chapter locally immediately (checkpoint)
            chapter_filename = f"chapter_{chapter_num:03d}.md"
            save_file(DOCS_DIR / chapter_filename, chapter_text)
            print(f"✓ Saved chapter locally: {chapter_filename}")
            
            # Generate summary
            summary = generate_summary(chapter_num, chapter_text)
            all_summaries.append(f"**Chapter {chapter_num}: {chapter_title}**\n{summary}")
            
            # Update continuity log
            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            continuity_log.append(f"[{timestamp}] Chapter {chapter_num}: {chapter_title}")
            
            # Add to chapters data
            chapters_data.append({
                "chapter": chapter_num,
                "filename": chapter_filename,
                "chapter_name": chapter_title
            })
            
            # Add to gist files
            gist_files[chapter_filename] = InputFileContent(chapter_text)
            
            print(f"✓ Completed Chapter {chapter_num}: {chapter_title}")
            
            # Save progress periodically (every 5 chapters)
            if chapter_num % 5 == 0:
                print(f"\n--- Checkpoint: Saving progress after {chapter_num} chapters ---")
                # Save summaries so far
                summaries_content = "\n\n---\n\n".join(all_summaries)
                save_file(DOCS_DIR / "summaries.md", summaries_content)
                # Save continuity log so far
                continuity_content = "\n".join(continuity_log)
                save_file(DOCS_DIR / "continuity_log.txt", continuity_content)
                print(f"--- Checkpoint saved ---\n")
            
        except Exception as e:
            print(f"\n{'!'*60}")
            print(f"ERROR: Exception occurred while processing chapter {chapter_num}")
            print(f"Error: {e}")
            print(f"Successfully generated {chapter_num - 1} chapters so far.")
            print(f"{'!'*60}")
            print("Saving progress and stopping...")
            import traceback
            traceback.print_exc()
            break
    
    # Save summaries
    summaries_content = "\n\n---\n\n".join(all_summaries)
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    gist_files["summaries.md"] = InputFileContent(summaries_content)
    
    # Save continuity log
    continuity_content = "\n".join(continuity_log)
    save_file(DOCS_DIR / "continuity_log.txt", continuity_content)
    gist_files["continuity_log.txt"] = InputFileContent(continuity_content)
    
    # Create chapters.json
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    chapters_json = {
        "novel_title": NOVEL_TITLE,
        "total_chapters": len(chapters_data),
        "last_updated": timestamp,
        "gist_id": HEMINGWAY_GIST_ID,
        "completed": True,
        "chapters": []
    }
    
    # Update chapter URLs after gist update
    for chapter_info in chapters_data:
        chapters_json["chapters"].append({
            "chapter": chapter_info["chapter"],
            "filename": chapter_info["filename"],
            "url": f"https://gist.githubusercontent.com/pappater/{HEMINGWAY_GIST_ID}/raw/{chapter_info['filename']}",
            "gist_url": f"https://gist.github.com/{HEMINGWAY_GIST_ID}#{chapter_info['filename']}",
            "chapter_name": chapter_info["chapter_name"]
        })
    
    # Save chapters.json locally
    chapters_json_str = json.dumps(chapters_json, indent=2)
    save_file(DOCS_DIR / "chapters.json", chapters_json_str)
    gist_files["chapters.json"] = InputFileContent(chapters_json_str)
    
    # Also save to public directory
    public_chapters_dir = Path(__file__).parent.parent.parent / "public" / "docs" / "hemingway-novel"
    public_chapters_dir.mkdir(parents=True, exist_ok=True)
    save_file(public_chapters_dir / "chapters.json", chapters_json_str)
    
    # Upload all files to Gist
    print("Uploading all files to Gist...")
    try:
        sanitized_files = _sanitize_gist_files(gist_files)
        gist.edit(files=sanitized_files)
        print(f"Successfully uploaded {len(gist_files)} files to Gist")
        print(f"Gist URL: {gist.html_url}")
    except Exception as e:
        print(f"ERROR uploading to Gist: {e}")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print(f"Novel generation complete!")
    print(f"Total chapters generated: {len(chapters_data)}")
    print(f"Gist URL: {gist.html_url}")
    print("=" * 60)


if __name__ == "__main__":
    main()

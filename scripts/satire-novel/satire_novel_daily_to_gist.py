#!/usr/bin/env python3
"""
Daily Gemini Satire Novel Generator
Generates one chapter per day using Google Gemini AI in a satirical fiction style,
maintains continuity via series bible, outline, summaries, and a continuity log,
and publishes all outputs to a single public GitHub Gist.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

import google.generativeai as genai
from github import Github, InputFileContent

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
SATIRE_GIST_ID = os.environ.get("SATIRE_GIST_ID")

DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "satire-novel"
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Theme for the novel
THEME = "Bureaucratic absurdity, corporate culture satire, and finding human connection in dehumanizing systems"


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
    Accepts:
      - string -> InputFileContent(string)
      - dict with 'content' key -> InputFileContent(content)
      - InputFileContent -> left as-is
      - None -> left as-is (used to delete files)
    """
    sanitized = {}
    for name, value in (files or {}).items():
        if value is None:
            sanitized[name] = None
        elif isinstance(value, InputFileContent):
            sanitized[name] = value
        elif isinstance(value, dict):
            # Extract content from dict
            content = value.get('content', str(value))
            sanitized[name] = InputFileContent(content)
        else:
            # Convert to string and wrap in InputFileContent
            sanitized[name] = InputFileContent(str(value))
    return sanitized


def get_chapter_number(gist):
    """
    Determine the next chapter number by checking what chapters exist in the Gist.
    Also checks for missing chapters and returns the first missing one.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        int: The next chapter number to generate (including filling gaps)
    """
    # Get all chapter files from the Gist
    chapter_files = [f for f in gist.files.keys() if f.startswith("chapter_") and f.endswith(".md")]
    
    if not chapter_files:
        return 1
    
    # Extract chapter numbers from filenames (e.g., "chapter_001.md" -> 1)
    chapter_numbers = []
    for filename in chapter_files:
        try:
            # Extract the number part between "chapter_" and ".md"
            num_str = filename.replace("chapter_", "").replace(".md", "")
            chapter_numbers.append(int(num_str))
        except ValueError:
            continue
    
    if not chapter_numbers:
        return 1
    
    # Sort the chapter numbers
    chapter_numbers.sort()
    
    # Check for gaps in the sequence
    for i in range(1, max(chapter_numbers) + 1):
        if i not in chapter_numbers:
            print(f"⚠ Found missing Chapter {i} in sequence. Will generate it.")
            return i
    
    # If no gaps, return the next sequential chapter number
    return max(chapter_numbers) + 1


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


def parse_chapter_names_from_outline(outline_content):
    """
    Parse chapter names from outline.md.
    
    Args:
        outline_content: Content of the outline.md file
    
    Returns:
        dict: Mapping of chapter number to chapter name
    """
    chapter_names = {}
    if not outline_content:
        return chapter_names
    
    lines = outline_content.split('\n')
    for line in lines:
        # Look for lines like "### Chapter 1: The Morning Ritual"
        if line.strip().startswith('### Chapter '):
            try:
                # Extract the chapter number and name
                # Format: "### Chapter 1: The Morning Ritual"
                parts = line.strip().replace('### Chapter ', '').split(':', 1)
                if len(parts) == 2:
                    chapter_num = int(parts[0].strip())
                    chapter_name = parts[1].strip()
                    chapter_names[chapter_num] = chapter_name
            except (ValueError, IndexError):
                continue
    
    return chapter_names


def update_chapters_json(gist):
    """
    Create/update chapters.json with all chapter mappings and their Gist URLs.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        str: JSON string of chapters mapping
    """
    # Get all chapter files from the Gist
    chapter_files = sorted([f for f in gist.files.keys() if f.startswith("chapter_") and f.endswith(".md")])
    
    # Load outline to get chapter names
    outline = load_file(DOCS_DIR / "outline.md")
    chapter_names = parse_chapter_names_from_outline(outline)
    
    chapters = []
    for filename in chapter_files:
        try:
            # Extract the number part between "chapter_" and ".md"
            num_str = filename.replace("chapter_", "").replace(".md", "")
            chapter_num = int(num_str)
            
            # Build the raw content URL for this chapter
            raw_url = gist.files[filename].raw_url
            
            chapter_data = {
                "chapter": chapter_num,
                "filename": filename,
                "url": raw_url,
                "gist_url": f"https://gist.github.com/{SATIRE_GIST_ID}#{filename}"
            }
            
            # Add chapter name if available
            if chapter_num in chapter_names:
                chapter_data["chapter_name"] = chapter_names[chapter_num]
            
            chapters.append(chapter_data)
        except (ValueError, KeyError):
            continue
    
    chapters_data = {
        "novel_title": "The Bureaucratic Odyssey",
        "genre": "Fiction",
        "subgenre": "Satire",
        "total_chapters": len(chapters),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": SATIRE_GIST_ID,
        "completed": False,
        "chapters": chapters
    }
    
    return json.dumps(chapters_data, indent=2)


def update_gist(chapter_num, chapter_text, continuity_log, gist):
    """
    Update the GitHub Gist with new chapter, continuity log, and chapters.json.
    
    Args:
        chapter_num: Chapter number being added
        chapter_text: Chapter content
        continuity_log: Updated continuity log content
        gist: PyGithub Gist object (reused to avoid extra API calls)
    """
    # Prepare files for the gist
    # PyGithub expects: filename -> string content (not nested dicts)
    files = {}
    
    # Add the new chapter
    chapter_filename = f"chapter_{chapter_num:03d}.md"
    chapter_content = f"# Chapter {chapter_num}\n\n{chapter_text}"
    files[chapter_filename] = chapter_content
    
    # Update continuity log
    files["continuity_log.txt"] = continuity_log
    
    # Also update series bible, outline, summaries, and README if they exist
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme
    
    series_bible = load_file(DOCS_DIR / "series_bible.md")
    if series_bible:
        files["series_bible.md"] = series_bible
    
    outline = load_file(DOCS_DIR / "outline.md")
    if outline:
        files["outline.md"] = outline
    
    summaries = load_file(DOCS_DIR / "summaries.md")
    if summaries:
        files["summaries.md"] = summaries
    
    print(f"Updating Gist {SATIRE_GIST_ID}...")

    sanitized_files = _sanitize_gist_files(files)

    try:
        gist.edit(
            description=f"The Bureaucratic Odyssey - Satirical Fiction Novel - {chapter_num} Chapters",
            files=sanitized_files
        )
    except AssertionError as exc:
        # Defensive fallback: convert any remaining malformed values into {'content': ...} and retry once
        print("Warning: gist.edit rejected the files payload. Attempting coercion and retry...")
        print(f"Original files keys: {list(files.keys())}")
        print(f"Sanitized files keys: {list(sanitized_files.keys())}")
        gist.edit(
            description=f"The Bureaucratic Odyssey - Satirical Fiction Novel - {chapter_num} Chapters",
            files=sanitized_files
        )
    
    # Refresh gist to get updated file information after the edit
    # PyGithub doesn't auto-update file URLs after edit(), but we need the
    # fresh raw_url values for chapters.json. This requires a new API call.
    g = Github(GIST_TOKEN)
    refreshed_gist = g.get_gist(SATIRE_GIST_ID)
    
    # Update chapters.json with all chapter mappings (including the newly added chapter)
    chapters_json = update_chapters_json(refreshed_gist)
    chapters_data = json.loads(chapters_json)
    files_json = {"chapters.json": chapters_json}
    sanitized_json = _sanitize_gist_files(files_json)
    refreshed_gist.edit(files=sanitized_json)
    
    # Also save chapters.json locally
    save_file(DOCS_DIR / "chapters.json", chapters_json)

    print(f"✓ Gist updated successfully!")
    print(f"✓ chapters.json updated (total: {chapters_data['total_chapters']} chapters)")
    print(f"  View at: https://gist.github.com/{SATIRE_GIST_ID}")


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
    
    # Generate Chapter 1 (no previous summaries for first chapter)
    chapter_text = generate_chapter(1, series_bible, outline, None)
    
    # Generate summary for Chapter 1
    summary = generate_summary(chapter_text, 1)
    
    # Update continuity log locally
    continuity_log = update_continuity_log(1, summary)
    
    # Update summaries file locally
    summaries_content = summaries or "# Chapter Summaries: The Bureaucratic Odyssey\n"
    summaries_content += f"\n\n## Chapter 1\n\n{summary}"
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    
    # Prepare files for Gist update (using correct format: filename -> string)
    files = {}
    files["chapter_001.md"] = f"# Chapter 1\n\n{chapter_text}"
    files["continuity_log.txt"] = continuity_log
    files["summaries.md"] = summaries_content
    
    # Also include canon files if they exist
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme
    
    if series_bible:
        files["series_bible.md"] = series_bible
    if outline:
        files["outline.md"] = outline
    
    print(f"Publishing Chapter 1 to Gist {SATIRE_GIST_ID}...")

    sanitized_files = _sanitize_gist_files(files)

    try:
        gist.edit(
            description="The Bureaucratic Odyssey - Satirical Fiction Novel - 1 Chapter",
            files=sanitized_files
        )
    except AssertionError as exc:
        # Defensive fallback: convert any remaining malformed values into {'content': ...} and retry once
        print("Warning: gist.edit rejected the files payload. Attempting coercion and retry...")
        print(f"Original files keys: {list(files.keys())}")
        print(f"Sanitized files keys: {list(sanitized_files.keys())}")
        gist.edit(
            description="The Bureaucratic Odyssey - Satirical Fiction Novel - 1 Chapter",
            files=sanitized_files
        )
    
    # Refresh gist to get updated file information after the edit
    # PyGithub doesn't auto-update file URLs after edit(), but we need the
    # fresh raw_url values for chapters.json. This requires a new API call.
    g = Github(GIST_TOKEN)
    refreshed_gist = g.get_gist(SATIRE_GIST_ID)
    
    # Create initial chapters.json
    chapters_json = update_chapters_json(refreshed_gist)
    files_json = {"chapters.json": chapters_json}
    sanitized_json = _sanitize_gist_files(files_json)
    refreshed_gist.edit(files=sanitized_json)
    
    # Also save chapters.json locally
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    
    print("✓ Chapter 1 created and published successfully!")
    print("✓ chapters.json initialized")
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
    
    if not SATIRE_GIST_ID:
        print("ERROR: SATIRE_GIST_ID environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Daily Gemini Satire Fiction Novel Generator")
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
    gist = g.get_gist(SATIRE_GIST_ID)
    print(f"✓ Connected to Gist {SATIRE_GIST_ID}")
    
    # Ensure Chapter 1 exists in Gist (generate if missing)
    chapter1_created = ensure_first_chapter_in_gist(gist, series_bible, outline, summaries)
    
    if chapter1_created:
        # If we just created Chapter 1, we're done for this run
        print("\n" + "=" * 60)
        print("✓ Initial Chapter 1 generation complete!")
        print("=" * 60)
        return
    
    # Determine chapter number by checking what's already in the Gist (includes gap checking)
    chapter_num = get_chapter_number(gist)
    print(f"\nGenerating Chapter {chapter_num}")
    print(f"Theme: {THEME}")
    
    # Generate the chapter
    chapter_text = generate_chapter(chapter_num, series_bible, outline, summaries)
    
    # Generate summary
    summary = generate_summary(chapter_text, chapter_num)
    
    # Update continuity log
    continuity_log = update_continuity_log(chapter_num, summary)
    
    # Update summary file
    summaries_content = load_file(DOCS_DIR / "summaries.md") or "# Chapter Summaries: The Bureaucratic Odyssey\n"
    summaries_content += f"\n\n## Chapter {chapter_num}\n\n{summary}"
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    
    # Update Gist with new chapter and chapters.json
    update_gist(chapter_num, chapter_text, continuity_log, gist)
    
    print("\n" + "=" * 60)
    print("✓ Daily chapter generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

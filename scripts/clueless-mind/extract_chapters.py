#!/usr/bin/env python3
"""
Extract chapters from Clueless Mind PDF and create necessary files.
Creates chapter files, chapters.json, and README similar to the Hemingway novel structure.
Uploads all files to GitHub Gist.
"""

import os
import json
import pdfplumber
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from github import Github, InputFileContent

# Paths
SCRIPT_DIR = Path(__file__).parent
PDF_PATH = SCRIPT_DIR.parent.parent / "docs" / "archive" / "Aoasm.pdf"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "docs" / "clueless-mind"
PUBLIC_DIR = SCRIPT_DIR.parent.parent / "public" / "docs" / "clueless-mind"

# Book configuration
NOVEL_TITLE = "Clueless Mind"
GIST_ID_ENV_VAR = "CLUELESS_MIND_GIST_ID"
GIST_TOKEN_ENV_VAR = "GIST_TOKEN"


def detect_chapter_pages(pdf):
    """Detect pages where chapters start based on large font size (72pt)."""
    chapter_pages = []
    
    for page_num in range(len(pdf.pages)):
        page = pdf.pages[page_num]
        chars = page.chars
        
        if not chars:
            continue
        
        # Group characters by line (y-position)
        lines = defaultdict(list)
        for char in chars:
            y = round(char['top'])
            lines[y].append(char)
        
        # Check first few lines for large text
        for y in sorted(lines.keys())[:5]:
            line_chars = lines[y]
            if not line_chars:
                continue
            
            # Get average font size for this line
            avg_size = sum(c.get('size', 0) for c in line_chars) / len(line_chars)
            
            # Get the text content
            line_text = ''.join(c.get('text', '') for c in line_chars).strip()
            
            # Look for 72pt text (chapter starts)
            if avg_size >= 70 and len(line_text) > 2:
                # Skip page numbers and very short text
                if not line_text.isdigit() and len(line_text.split()) >= 2:
                    chapter_pages.append({
                        'page': page_num,
                        'start_text': line_text[:100]
                    })
                    break
    
    return chapter_pages


def extract_chapter_text(pdf, start_page, end_page):
    """Extract text from a range of pages."""
    chapter_text = []
    
    for page_num in range(start_page, end_page):
        if page_num >= len(pdf.pages):
            break
        
        page = pdf.pages[page_num]
        text = page.extract_text()
        
        if text:
            chapter_text.append(text)
    
    return '\n\n'.join(chapter_text)


def clean_chapter_text(text):
    """Clean chapter text by removing standalone numbers at the beginning."""
    lines = text.split('\n')
    cleaned_lines = []
    
    # Skip initial standalone numbers (lines that contain only digits and whitespace)
    skip_mode = True
    for line in lines:
        stripped = line.strip()
        if skip_mode:
            # Skip lines that are only numbers or whitespace
            if stripped and not stripped.isdigit():
                skip_mode = False
                cleaned_lines.append(line)
        else:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def extract_first_three_words(text):
    """Extract the first three words from the text to use as chapter title."""
    # Clean the text and split into words
    cleaned = text.strip()
    words = []
    
    # Extract words (alphanumeric sequences)
    for line in cleaned.split('\n'):
        line_words = line.split()
        for word in line_words:
            # Remove punctuation from start/end but keep the word
            clean_word = word.strip('.,!?;:()[]{}""\'')
            if clean_word:
                words.append(clean_word)
            if len(words) >= 3:
                break
        if len(words) >= 3:
            break
    
    # Return first three words, or whatever we got
    return ' '.join(words[:3]) if words else "Untitled"


def save_file(filepath, content):
    """Save text content to a file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


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


def main():
    """Main execution function."""
    print("=" * 80)
    print("Clueless Mind - Chapter Extraction")
    print("=" * 80)
    print(f"PDF: {PDF_PATH}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    # Ensure output directories exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    
    # Open PDF and detect chapters
    print("Opening PDF and detecting chapters...")
    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        # Detect chapter boundaries
        chapter_pages = detect_chapter_pages(pdf)
        print(f"Detected {len(chapter_pages)} chapters\n")
        
        # Process each chapter
        chapters_data = []
        
        for i, chapter_info in enumerate(chapter_pages, 1):
            start_page = chapter_info['page']
            # End page is start of next chapter (or end of book)
            end_page = chapter_pages[i]['page'] if i < len(chapter_pages) else total_pages
            
            print(f"Processing Chapter {i}...")
            print(f"  Pages: {start_page + 1} to {end_page}")
            print(f"  Start text: {chapter_info['start_text']}")
            
            # Extract chapter text
            chapter_text = extract_chapter_text(pdf, start_page, end_page)
            
            # Clean the chapter text (remove standalone numbers)
            cleaned_text = clean_chapter_text(chapter_text)
            
            # Extract first three words for chapter title
            first_three_words = extract_first_three_words(cleaned_text)
            
            # Create chapter markdown with first three words as title
            chapter_md = f"# {first_three_words}\n\n{cleaned_text}"
            
            # Save chapter file
            chapter_filename = f"chapter_{i:03d}.md"
            chapter_path = OUTPUT_DIR / chapter_filename
            save_file(chapter_path, chapter_md)
            
            print(f"  Saved: {chapter_filename} ({len(cleaned_text)} characters)")
            print(f"  Title: {first_three_words}")
            
            # Add to chapters data
            chapters_data.append({
                "chapter": i,
                "filename": chapter_filename,
                "chapter_name": first_three_words
            })
    
    print(f"\n✓ Extracted {len(chapters_data)} chapters")
    
    # Create README.md
    readme_content = f"""# {NOVEL_TITLE}

A novel extracted from PDF.

Generated by the mockpoet platform.

## About

This book contains {len(chapters_data)} chapters.

"""
    save_file(OUTPUT_DIR / "README.md", readme_content)
    print("✓ Created README.md")
    
    # Create chapters.json
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Get gist ID from environment (or use placeholder)
    gist_id = os.environ.get(GIST_ID_ENV_VAR, "PLACEHOLDER_GIST_ID")
    
    chapters_json = {
        "novel_title": NOVEL_TITLE,
        "total_chapters": len(chapters_data),
        "last_updated": timestamp,
        "gist_id": gist_id,
        "completed": True,
        "chapters": []
    }
    
    # Add chapter details with URLs
    for chapter_info in chapters_data:
        chapters_json["chapters"].append({
            "chapter": chapter_info["chapter"],
            "filename": chapter_info["filename"],
            "url": f"https://gist.githubusercontent.com/pappater/{gist_id}/raw/{chapter_info['filename']}",
            "gist_url": f"https://gist.github.com/{gist_id}#{chapter_info['filename']}",
            "chapter_name": chapter_info["chapter_name"]
        })
    
    # Save chapters.json
    chapters_json_str = json.dumps(chapters_json, indent=2)
    save_file(OUTPUT_DIR / "chapters.json", chapters_json_str)
    save_file(PUBLIC_DIR / "chapters.json", chapters_json_str)
    print("✓ Created chapters.json")
    
    # Upload to Gist if credentials are available
    gist_token = os.environ.get(GIST_TOKEN_ENV_VAR)
    if gist_token and gist_id != "PLACEHOLDER_GIST_ID":
        print()
        print("=" * 80)
        print("Uploading files to GitHub Gist...")
        print("=" * 80)
        
        try:
            # Connect to GitHub
            gh = Github(gist_token)
            gist = gh.get_gist(gist_id)
            print(f"Connected to Gist: {gist.html_url}")
            
            # Prepare files for upload
            gist_files = {
                "README.md": InputFileContent(readme_content)
            }
            
            # Add all chapter files
            for chapter_info in chapters_data:
                chapter_filename = chapter_info["filename"]
                chapter_path = OUTPUT_DIR / chapter_filename
                with open(chapter_path, 'r', encoding='utf-8') as f:
                    chapter_content = f.read()
                gist_files[chapter_filename] = InputFileContent(chapter_content)
            
            # Add chapters.json
            gist_files["chapters.json"] = InputFileContent(chapters_json_str)
            
            # Upload all files to Gist
            print(f"Uploading {len(gist_files)} files to Gist...")
            sanitized_files = _sanitize_gist_files(gist_files)
            gist.edit(files=sanitized_files)
            print(f"✓ Successfully uploaded {len(gist_files)} files to Gist")
            print(f"✓ Gist URL: {gist.html_url}")
            
        except Exception as e:
            print(f"ERROR uploading to Gist: {e}")
            print("Files were saved locally but not uploaded to Gist.")
    else:
        print()
        print("=" * 80)
        print("Skipping Gist upload (credentials not provided)")
        if not gist_token:
            print(f"Note: Set the {GIST_TOKEN_ENV_VAR} environment variable to enable upload")
        if gist_id == "PLACEHOLDER_GIST_ID":
            print(f"Note: Set the {GIST_ID_ENV_VAR} environment variable to enable upload")
        print("=" * 80)
    
    print()
    print("=" * 80)
    print(f"Extraction complete!")
    print(f"Total chapters: {len(chapters_data)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Public directory: {PUBLIC_DIR}")
    print("=" * 80)


if __name__ == "__main__":
    main()

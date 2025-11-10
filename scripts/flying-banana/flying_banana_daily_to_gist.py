#!/usr/bin/env python3
"""
Daily Flying Banana Short Story Generator
Generates one short story per day using Google Gemini AI in the style of a randomly selected
modern classic author, and publishes all outputs to a single public GitHub Gist.
"""

import os
import sys
import json
import random
from datetime import datetime
from pathlib import Path

import google.generativeai as genai
from github import Github, InputFileContent

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GIST_TOKEN = os.environ.get("GIST_TOKEN")
FLYING_BANANA_GIST_ID = os.environ.get("FLYING_BANANA_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "flying-banana"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

# Configuration files
AUTHORS_FILE = SCRIPTS_DIR / "authors.json"
CONFIG_FILE = SCRIPTS_DIR / "config.json"


def load_file(filepath):
    """Load text content from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def save_file(filepath, content):
    """Save text content to a file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def load_json(filepath):
    """Load JSON content from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


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


def get_story_number(gist):
    """
    Determine the next story number by checking what stories exist in the Gist.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        int: The next story number to generate
    """
    story_files = [f for f in gist.files.keys() if f.startswith("story_") and f.endswith(".md")]
    
    if not story_files:
        return 1
    
    story_numbers = []
    for filename in story_files:
        try:
            num_str = filename.replace("story_", "").replace(".md", "")
            story_numbers.append(int(num_str))
        except ValueError:
            continue
    
    if not story_numbers:
        return 1
    
    return max(story_numbers) + 1


def select_random_author():
    """
    Select a random author from the authors.json file.
    
    Returns:
        str: Name of the selected author
    """
    authors_data = load_json(AUTHORS_FILE)
    if not authors_data or "authors" not in authors_data:
        print("ERROR: Could not load authors list from authors.json")
        sys.exit(1)
    
    authors = authors_data["authors"]
    if not authors:
        print("ERROR: Authors list is empty")
        sys.exit(1)
    
    selected = random.choice(authors)
    print(f"Selected author: {selected}")
    return selected


def generate_short_story(story_num, author, min_words, max_words):
    """Generate a new short story using Gemini AI in the style of the selected author."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        story_prompt_template = load_file(PROMPTS_DIR / "story_prompt.txt")
        
        prompt = story_prompt_template.format(
            author=author,
            min_words=min_words,
            max_words=max_words
        )
        
        print(f"Generating Short Story #{story_num} in the style of {author}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate story using model '{GEMINI_MODEL}': {e}")
        print(f"Check if the model name is correct and available.")
        _list_and_print_models()
        sys.exit(1)


def extract_story_title(story_text):
    """
    Extract the story title from the generated text.
    Assumes the title is on the first line in markdown heading format.
    
    Args:
        story_text: The complete story text
    
    Returns:
        str: The story title (without # prefix)
    """
    lines = story_text.strip().split('\n')
    if lines and lines[0].startswith('# '):
        return lines[0].replace('# ', '').strip()
    return f"Story {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist):
    """
    Create/update chapters.json with all story mappings and their Gist URLs.
    Note: Using 'chapters' key for compatibility with existing reader UI.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        str: JSON string of stories mapping
    """
    story_files = sorted([f for f in gist.files.keys() if f.startswith("story_") and f.endswith(".md")])
    
    stories = []
    for filename in story_files:
        try:
            num_str = filename.replace("story_", "").replace(".md", "")
            story_num = int(num_str)
            
            raw_url = gist.files[filename].raw_url
            
            # Try to extract story metadata from tracking file
            story_data = {
                "chapter": story_num,  # Using 'chapter' for compatibility with UI
                "filename": filename,
                "url": raw_url,
                "gist_url": f"https://gist.github.com/{FLYING_BANANA_GIST_ID}#{filename}"
            }
            
            # Try to get story title and metadata from the file content
            try:
                file_content = gist.files[filename].content
                title = extract_story_title(file_content)
                if title:
                    story_data["chapter_name"] = title
                
                # Look for publish date in metadata comment at end of file
                lines = file_content.split('\n')
                for line in reversed(lines[-5:]):  # Check last 5 lines
                    if line.startswith('<!-- Published: ') and line.endswith(' -->'):
                        date_str = line.replace('<!-- Published: ', '').replace(' -->', '').strip()
                        story_data["published_date"] = date_str
                        break
            except Exception:
                pass
            
            stories.append(story_data)
        except (ValueError, KeyError):
            continue
    
    chapters_data = {
        "novel_title": "Flying Banana",
        "total_chapters": len(stories),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": FLYING_BANANA_GIST_ID,
        "completed": False,  # Short stories never complete - they continue indefinitely
        "chapters": stories
    }
    
    return json.dumps(chapters_data, indent=2)


def update_gist(story_num, story_text, author, gist):
    """
    Update the GitHub Gist with new short story and chapters.json.
    
    Args:
        story_num: Story number being added
        story_text: Story content
        author: Author whose style was emulated
        gist: PyGithub Gist object
    """
    files = {}
    
    # Add the new story with metadata
    story_filename = f"story_{story_num:03d}.md"
    publish_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Add metadata comment at the end for tracking
    story_content = f"{story_text}\n\n<!-- Author Style: {author} -->\n<!-- Published: {publish_datetime} -->"
    files[story_filename] = story_content
    
    # Also update README if it exists
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme
    
    print(f"Updating Gist {FLYING_BANANA_GIST_ID}...")
    
    sanitized_files = _sanitize_gist_files(files)
    
    gist.edit(
        description=f"Flying Banana - Short Story Collection - {story_num} Stories",
        files=sanitized_files
    )
    
    # Refresh gist to get updated file information
    g = Github(GIST_TOKEN)
    refreshed_gist = g.get_gist(FLYING_BANANA_GIST_ID)
    
    # Update chapters.json with all story mappings
    chapters_json = update_chapters_json(refreshed_gist)
    chapters_data = json.loads(chapters_json)
    files_json = {"chapters.json": chapters_json}
    sanitized_json = _sanitize_gist_files(files_json)
    refreshed_gist.edit(files=sanitized_json)
    
    # Save chapters.json locally
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    
    print(f"✓ Gist updated successfully!")
    print(f"✓ chapters.json updated (total: {chapters_data['total_chapters']} stories)")
    print(f"  View at: https://gist.github.com/{FLYING_BANANA_GIST_ID}")


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not GIST_TOKEN:
        print("ERROR: GIST_TOKEN environment variable not set")
        sys.exit(1)
    
    if not FLYING_BANANA_GIST_ID:
        print("ERROR: FLYING_BANANA_GIST_ID environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Flying Banana Daily Short Story Generator")
    print("=" * 60)
    
    # Load configuration
    config_data = load_json(CONFIG_FILE)
    if not config_data:
        print("ERROR: Could not load config.json")
        sys.exit(1)
    
    min_words = config_data.get("min_word_count", 5000)
    max_words = config_data.get("max_word_count", 7500)
    print(f"Word count range: {min_words} - {max_words}")
    
    # Get Gist object
    g = Github(GIST_TOKEN)
    gist = g.get_gist(FLYING_BANANA_GIST_ID)
    print(f"✓ Connected to Gist {FLYING_BANANA_GIST_ID}")
    
    # Determine story number
    story_num = get_story_number(gist)
    print(f"\nGenerating Short Story #{story_num}")
    
    # Select random author
    author = select_random_author()
    
    # Generate the story
    story_text = generate_short_story(story_num, author, min_words, max_words)
    
    # Update Gist with new story and chapters.json
    update_gist(story_num, story_text, author, gist)
    
    print("\n" + "=" * 60)
    print("✓ Daily short story generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Hourly Of Old Man Poem Generator
Generates one poem per hour using Google Gemini AI in a randomly selected
poetry type style, and publishes all outputs to a single public GitHub Gist.
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
OF_OLD_MAN_GIST_ID = os.environ.get("OF_OLD_MAN_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "of-old-man"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

# Configuration files
POETRY_TYPES_FILE = SCRIPTS_DIR / "poetry_types.json"
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


def get_poem_number(gist):
    """
    Determine the next poem number by checking what poems exist in the Gist.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        int: The next poem number to generate
    """
    poem_files = [f for f in gist.files.keys() if f.startswith("poem_") and f.endswith(".md")]
    
    if not poem_files:
        return 1
    
    poem_numbers = []
    for filename in poem_files:
        try:
            num_str = filename.replace("poem_", "").replace(".md", "")
            poem_numbers.append(int(num_str))
        except ValueError:
            continue
    
    if not poem_numbers:
        return 1
    
    return max(poem_numbers) + 1


def select_random_poetry_type():
    """
    Select a random poetry type from the poetry_types.json file.
    
    Returns:
        str: Name of the selected poetry type
    """
    poetry_types_data = load_json(POETRY_TYPES_FILE)
    if not poetry_types_data or "poetry_types" not in poetry_types_data:
        print("ERROR: Could not load poetry types list from poetry_types.json")
        sys.exit(1)
    
    poetry_types = poetry_types_data["poetry_types"]
    if not poetry_types:
        print("ERROR: Poetry types list is empty")
        sys.exit(1)
    
    selected = random.choice(poetry_types)
    print(f"Selected poetry type: {selected}")
    return selected


def generate_poem(poem_num, poetry_type):
    """Generate a new poem using Gemini AI in the selected poetry type style."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        poem_prompt_template = load_file(PROMPTS_DIR / "poem_prompt.txt")
        
        prompt = poem_prompt_template.format(poetry_type=poetry_type)
        
        print(f"Generating Poem #{poem_num} in the style of {poetry_type}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate poem using model '{GEMINI_MODEL}': {e}")
        print(f"Check if the model name is correct and available.")
        _list_and_print_models()
        sys.exit(1)


def extract_poem_title(poem_text):
    """
    Extract the poem title from the generated text.
    Assumes the title is on the first line in markdown heading format.
    
    Args:
        poem_text: The complete poem text
    
    Returns:
        str: The poem title (without # prefix)
    """
    lines = poem_text.strip().split('\n')
    if lines and lines[0].startswith('# '):
        return lines[0].replace('# ', '').strip()
    return f"Poem {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist):
    """
    Create/update chapters.json with all poem mappings and their Gist URLs.
    Note: Using 'chapters' key for compatibility with existing reader UI,
    but we'll add metadata to indicate these are poems.
    
    Args:
        gist: PyGithub Gist object
    
    Returns:
        str: JSON string of poems mapping
    """
    poem_files = sorted([f for f in gist.files.keys() if f.startswith("poem_") and f.endswith(".md")])
    
    poems = []
    for filename in poem_files:
        try:
            num_str = filename.replace("poem_", "").replace(".md", "")
            poem_num = int(num_str)
            
            raw_url = gist.files[filename].raw_url
            
            # Try to extract poem metadata from file
            poem_data = {
                "chapter": poem_num,  # Using 'chapter' for compatibility with UI
                "filename": filename,
                "url": raw_url,
                "gist_url": f"https://gist.github.com/{OF_OLD_MAN_GIST_ID}#{filename}"
            }
            
            # Try to get poem title and metadata from the file content
            try:
                file_content = gist.files[filename].content
                title = extract_poem_title(file_content)
                if title:
                    poem_data["chapter_name"] = title
                
                # Look for publish date and poetry type in metadata comment at end of file
                lines = file_content.split('\n')
                for line in reversed(lines[-5:]):  # Check last 5 lines
                    if line.startswith('<!-- Published: ') and line.endswith(' -->'):
                        date_str = line.replace('<!-- Published: ', '').replace(' -->', '').strip()
                        poem_data["published_date"] = date_str
                    if line.startswith('<!-- Poetry Type: ') and line.endswith(' -->'):
                        type_str = line.replace('<!-- Poetry Type: ', '').replace(' -->', '').strip()
                        poem_data["poetry_type"] = type_str
            except Exception:
                pass
            
            poems.append(poem_data)
        except (ValueError, KeyError):
            continue
    
    chapters_data = {
        "novel_title": "Of Old Man",
        "total_chapters": len(poems),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": OF_OLD_MAN_GIST_ID,
        "completed": False,  # Poems never complete - they continue indefinitely
        "chapters": poems
    }
    
    return json.dumps(chapters_data, indent=2)


def update_gist(poem_num, poem_text, poetry_type, gist):
    """
    Update the GitHub Gist with new poem and chapters.json.
    
    Args:
        poem_num: Poem number being added
        poem_text: Poem content
        poetry_type: Poetry type used for this poem
        gist: PyGithub Gist object
    """
    files = {}
    
    # Add the new poem with metadata
    poem_filename = f"poem_{poem_num:03d}.md"
    publish_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Add metadata comment at the end for tracking
    poem_content = f"{poem_text}\n\n<!-- Poetry Type: {poetry_type} -->\n<!-- Published: {publish_datetime} -->"
    files[poem_filename] = poem_content
    
    print(f"Updating Gist {OF_OLD_MAN_GIST_ID}...")
    
    sanitized_files = _sanitize_gist_files(files)
    
    gist.edit(
        description=f"Of Old Man - Poem Collection - {poem_num} Poems",
        files=sanitized_files
    )
    
    # Refresh gist to get updated file information
    g = Github(GIST_TOKEN)
    refreshed_gist = g.get_gist(OF_OLD_MAN_GIST_ID)
    
    # Update chapters.json with all poem mappings
    chapters_json = update_chapters_json(refreshed_gist)
    chapters_data = json.loads(chapters_json)
    files_json = {"chapters.json": chapters_json}
    sanitized_json = _sanitize_gist_files(files_json)
    refreshed_gist.edit(files=sanitized_json)
    
    # Save chapters.json locally
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    
    print(f"✓ Gist updated successfully!")
    print(f"✓ chapters.json updated (total: {chapters_data['total_chapters']} poems)")
    print(f"  View at: https://gist.github.com/{OF_OLD_MAN_GIST_ID}")


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not GIST_TOKEN:
        print("ERROR: GIST_TOKEN environment variable not set")
        sys.exit(1)
    
    if not OF_OLD_MAN_GIST_ID:
        print("ERROR: OF_OLD_MAN_GIST_ID environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Of Old Man Hourly Poem Generator")
    print("=" * 60)
    
    # Load configuration (for future use if needed)
    config_data = load_json(CONFIG_FILE)
    if config_data:
        print(f"Configuration: {config_data.get('note', 'No constraints')}")
    
    # Get Gist object
    g = Github(GIST_TOKEN)
    gist = g.get_gist(OF_OLD_MAN_GIST_ID)
    print(f"✓ Connected to Gist {OF_OLD_MAN_GIST_ID}")
    
    # Determine poem number
    poem_num = get_poem_number(gist)
    print(f"\nGenerating Poem #{poem_num}")
    
    # Select random poetry type
    poetry_type = select_random_poetry_type()
    
    # Generate the poem
    poem_text = generate_poem(poem_num, poetry_type)
    
    # Update Gist with new poem and chapters.json
    update_gist(poem_num, poem_text, poetry_type, gist)
    
    print("\n" + "=" * 60)
    print("✓ Hourly poem generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

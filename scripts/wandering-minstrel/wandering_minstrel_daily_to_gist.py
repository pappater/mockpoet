#!/usr/bin/env python3
"""
Daily Wandering Minstrel Ballad Generator
Generates one ballad poem per day using Google Gemini AI in a randomly selected
ballad poetry type style, and publishes all outputs to a single public GitHub Gist.
Runs for 300 days, then marks the collection as complete.
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
WANDERING_MINSTREL_GIST_ID = os.environ.get("WANDERING_MINSTREL_GIST_ID")

SCRIPTS_DIR = Path(__file__).parent
DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "wandering-minstrel"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

# Configuration files
POETRY_TYPES_FILE = SCRIPTS_DIR / "poetry_types.json"
CONFIG_FILE = SCRIPTS_DIR / "config.json"

# Maximum number of poems before completion
MAX_POEMS = 300


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


def check_completion_status():
    """
    Check if the collection has already been marked as complete.
    
    Returns:
        bool: True if completed, False otherwise
    """
    chapters_file = DOCS_DIR / "chapters.json"
    chapters_data = load_json(chapters_file)
    
    if chapters_data and chapters_data.get("completed", False):
        return True
    
    return False


def select_random_poetry_type():
    """
    Select a random ballad poetry type from the poetry_types.json file.
    
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
    """Generate a new ballad poem using Gemini AI in the selected poetry type style."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        poem_prompt_template = load_file(PROMPTS_DIR / "poem_prompt.txt")
        
        prompt = poem_prompt_template.format(poetry_type=poetry_type)
        
        print(f"Generating Ballad #{poem_num} in the style of {poetry_type}...")
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
    return f"Ballad {datetime.now().strftime('%Y-%m-%d')}"


def update_chapters_json(gist, poem_num):
    """
    Create/update chapters.json with all poem mappings and their Gist URLs.
    Set completed flag to true if this is the 300th poem.
    
    Args:
        gist: PyGithub Gist object
        poem_num: Current poem number
    
    Returns:
        str: JSON string of poems mapping
    """
    poem_files = sorted([f for f in gist.files.keys() if f.startswith("poem_") and f.endswith(".md")])
    
    poems = []
    for filename in poem_files:
        try:
            num_str = filename.replace("poem_", "").replace(".md", "")
            file_poem_num = int(num_str)
            
            raw_url = gist.files[filename].raw_url
            
            # Try to extract poem metadata from file
            poem_data = {
                "chapter": file_poem_num,  # Using 'chapter' for compatibility with UI
                "filename": filename,
                "url": raw_url,
                "gist_url": f"https://gist.github.com/{WANDERING_MINSTREL_GIST_ID}#{filename}"
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
    
    # Determine if collection is complete (300 poems reached)
    is_completed = poem_num >= MAX_POEMS
    
    chapters_data = {
        "novel_title": "Wandering Minstrel",
        "genre": "Poetry",
        "subgenre": "Ballad",
        "total_chapters": len(poems),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": WANDERING_MINSTREL_GIST_ID,
        "completed": is_completed,
        "max_poems": MAX_POEMS,
        "chapters": poems
    }
    
    if is_completed:
        print(f"\n{'='*60}")
        print("🎉 COLLECTION COMPLETE! 🎉")
        print(f"Wandering Minstrel has reached {MAX_POEMS} ballad poems!")
        print("The collection is now marked as complete.")
        print(f"{'='*60}\n")
    
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
    
    # Also update README if it exists
    readme = load_file(DOCS_DIR / "README.md")
    if readme:
        files["README.md"] = readme
    
    print(f"Updating Gist {WANDERING_MINSTREL_GIST_ID}...")
    
    sanitized_files = _sanitize_gist_files(files)
    
    gist.edit(
        description=f"Wandering Minstrel - Ballad Collection - {poem_num} Poems",
        files=sanitized_files
    )
    
    # Refresh gist to get updated file information
    g = Github(GIST_TOKEN)
    refreshed_gist = g.get_gist(WANDERING_MINSTREL_GIST_ID)
    
    # Update chapters.json with all poem mappings
    chapters_json = update_chapters_json(refreshed_gist, poem_num)
    chapters_data = json.loads(chapters_json)
    files_json = {"chapters.json": chapters_json}
    sanitized_json = _sanitize_gist_files(files_json)
    refreshed_gist.edit(files=sanitized_json)
    
    # Save chapters.json locally
    save_file(DOCS_DIR / "chapters.json", chapters_json)
    
    print(f"✓ Gist updated successfully!")
    print(f"✓ chapters.json updated (total: {chapters_data['total_chapters']} poems)")
    print(f"  View at: https://gist.github.com/{WANDERING_MINSTREL_GIST_ID}")
    
    if chapters_data.get("completed"):
        print(f"\n✓ Collection marked as COMPLETE ({MAX_POEMS} poems)")


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not GIST_TOKEN:
        print("ERROR: GIST_TOKEN environment variable not set")
        sys.exit(1)
    
    if not WANDERING_MINSTREL_GIST_ID:
        print("ERROR: WANDERING_MINSTREL_GIST_ID environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Wandering Minstrel Daily Ballad Generator")
    print("=" * 60)
    
    # Check if collection is already complete
    if check_completion_status():
        print("\n✓ Collection is already marked as COMPLETE")
        print(f"  No more poems will be generated (limit: {MAX_POEMS} poems)")
        print("=" * 60)
        sys.exit(0)
    
    # Load configuration
    config_data = load_json(CONFIG_FILE)
    if config_data:
        print(f"Configuration: {config_data.get('note', 'No constraints')}")
        print(f"Max poems: {config_data.get('max_poems', MAX_POEMS)}")
    
    # Get Gist object
    g = Github(GIST_TOKEN)
    gist = g.get_gist(WANDERING_MINSTREL_GIST_ID)
    print(f"✓ Connected to Gist {WANDERING_MINSTREL_GIST_ID}")
    
    # Determine poem number
    poem_num = get_poem_number(gist)
    
    # Check if we've reached the limit
    if poem_num > MAX_POEMS:
        print(f"\n✓ Maximum number of poems ({MAX_POEMS}) has been reached")
        print("  Collection is complete. Marking as completed...")
        
        # Update chapters.json to mark as complete
        chapters_json = update_chapters_json(gist, poem_num - 1)
        files_json = {"chapters.json": chapters_json}
        sanitized_json = _sanitize_gist_files(files_json)
        gist.edit(files=sanitized_json)
        
        # Save locally
        save_file(DOCS_DIR / "chapters.json", chapters_json)
        
        print("=" * 60)
        sys.exit(0)
    
    print(f"\nGenerating Ballad #{poem_num} of {MAX_POEMS}")
    
    # Select random ballad poetry type
    poetry_type = select_random_poetry_type()
    
    # Generate the ballad poem
    poem_text = generate_poem(poem_num, poetry_type)
    
    # Update Gist with new poem and chapters.json
    update_gist(poem_num, poem_text, poetry_type, gist)
    
    print("\n" + "=" * 60)
    print("✓ Ballad generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

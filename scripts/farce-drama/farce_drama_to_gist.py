#!/usr/bin/env python3
"""
Farce Drama Generator
Generates a complete farce drama using Google Gemini AI,
structured as acts and scenes, and publishes to a GitHub Gist.
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
GIST_ID = os.environ.get("FARCE_DRAMA_GIST_ID")

DOCS_DIR = Path(__file__).parent.parent.parent / "docs" / "farce-drama"
PROMPTS_DIR = Path(__file__).parent / "prompts"

# Theme for the drama
THEME = "A satirical farce exploring the absurdities of human ambition and social pretension"


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


def generate_scene(act_num, scene_num, series_bible, outline, previous_summary):
    """Generate a scene using Gemini AI."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Load scene prompt template
        scene_prompt_template = load_file(PROMPTS_DIR / "scene_prompt.txt")
        
        # Build the prompt
        prompt = scene_prompt_template.format(
            act_num=act_num,
            scene_num=scene_num,
            theme=THEME,
            series_bible=series_bible,
            outline=outline,
            previous_summary=previous_summary or "This is the opening scene."
        )
        
        print(f"Generating Act {act_num}, Scene {scene_num}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate scene: {e}")
        sys.exit(1)


def generate_summary(scene_text, act_num, scene_num):
    """Generate a summary of the scene for continuity."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Load summary prompt template
        summary_prompt_template = load_file(PROMPTS_DIR / "summary_prompt.txt")
        
        prompt = summary_prompt_template.format(
            act_num=act_num,
            scene_num=scene_num,
            scene_text=scene_text
        )
        
        print(f"Generating summary for Act {act_num}, Scene {scene_num}...")
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate summary: {e}")
        sys.exit(1)


def parse_scene_names_from_outline(outline_content):
    """
    Parse scene names from outline.md.
    
    Returns:
        dict: Mapping of (act, scene) tuple to scene name
    """
    scene_names = {}
    if not outline_content:
        return scene_names
    
    lines = outline_content.split('\n')
    for line in lines:
        # Match patterns like "Act 1, Scene 1: Scene Name" or "1.1: Scene Name"
        if ':' in line and ('Act' in line or '.' in line[:10]):
            try:
                parts = line.split(':', 1)
                name = parts[1].strip()
                
                # Extract act and scene numbers
                if 'Act' in parts[0]:
                    # Format: "Act 1, Scene 2"
                    nums = [int(s) for s in parts[0].split() if s.isdigit()]
                    if len(nums) >= 2:
                        scene_names[(nums[0], nums[1])] = name
                else:
                    # Format: "1.2"
                    nums = parts[0].strip().split('.')
                    if len(nums) == 2:
                        act = int(nums[0])
                        scene = int(nums[1])
                        scene_names[(act, scene)] = name
            except (ValueError, IndexError):
                continue
    
    return scene_names


def update_chapters_json(scenes_data):
    """Update chapters.json with scene information."""
    chapters_json_path = DOCS_DIR / "chapters.json"
    
    chapters_data = {
        "novel_title": "The Absurd Ascent",  # Drama title
        "genre": "Drama",
        "subgenre": "Farce",
        "total_chapters": len(scenes_data),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "gist_id": GIST_ID or "",
        "completed": True,
        "chapters": scenes_data
    }
    
    save_file(chapters_json_path, json.dumps(chapters_data, indent=2))
    return chapters_data


def check_existing_scenes(drama_structure):
    """
    Check if all scenes already exist locally.
    
    Args:
        drama_structure: List of (act_num, num_scenes) tuples
    
    Returns:
        tuple: (bool indicating all scenes exist, dict of existing scenes)
    """
    all_scenes = {}
    all_exist = True
    
    for act_num, num_scenes in drama_structure:
        for scene_num in range(1, num_scenes + 1):
            scene_filename = f"act_{act_num}_scene_{scene_num:02d}.md"
            scene_path = DOCS_DIR / scene_filename
            
            scene_text = load_file(scene_path)
            if scene_text:
                all_scenes[scene_filename] = scene_text
            else:
                all_exist = False
                break
        
        if not all_exist:
            break
    
    return all_exist, all_scenes


def load_existing_drama_data(drama_structure, scene_names):
    """
    Load existing scene data and build chapters data from local files.
    
    Args:
        drama_structure: List of (act_num, num_scenes) tuples
        scene_names: Dict mapping (act, scene) to scene names
    
    Returns:
        tuple: (dict of scenes, chapters_data dict)
    """
    all_scenes = {}
    scene_counter = 1
    scenes_data = []
    
    for act_num, num_scenes in drama_structure:
        for scene_num in range(1, num_scenes + 1):
            scene_filename = f"act_{act_num}_scene_{scene_num:02d}.md"
            scene_path = DOCS_DIR / scene_filename
            
            scene_text = load_file(scene_path)
            if not scene_text:
                print(f"ERROR: Missing scene file: {scene_filename}")
                sys.exit(1)
            
            all_scenes[scene_filename] = scene_text
            
            # Get scene name
            scene_name = scene_names.get((act_num, scene_num), f"Scene {scene_num}")
            
            # Add to chapters data
            if GIST_ID:
                gist_url_base = f"https://gist.github.com/{GIST_ID}#{scene_filename}"
                raw_url = f"https://gist.githubusercontent.com/pappater/{GIST_ID}/raw/{scene_filename}"
            else:
                gist_url_base = ""
                raw_url = ""
            
            scenes_data.append({
                "chapter": scene_counter,
                "act": act_num,
                "scene": scene_num,
                "filename": scene_filename,
                "url": raw_url,
                "gist_url": gist_url_base,
                "chapter_name": scene_name
            })
            
            scene_counter += 1
    
    # Update chapters.json
    chapters_data = update_chapters_json(scenes_data)
    
    return all_scenes, chapters_data


def generate_complete_drama():
    """Generate the complete drama with all acts and scenes."""
    print("Starting drama processing...")
    
    # Load seed files
    series_bible = load_file(DOCS_DIR / "series_bible.md") or ""
    outline = load_file(DOCS_DIR / "outline.md") or ""
    
    # Parse scene names from outline
    scene_names = parse_scene_names_from_outline(outline)
    
    # Define the structure: 3 acts with multiple scenes
    # Approximately 100 pages = ~25,000-30,000 words
    # Let's structure it as 3 acts with 4-5 scenes each (total ~12-15 scenes)
    drama_structure = [
        (1, 5),  # Act 1: 5 scenes (setup)
        (2, 5),  # Act 2: 5 scenes (complications)
        (3, 4)   # Act 3: 4 scenes (resolution)
    ]
    
    # Check if all scenes already exist
    all_exist, existing_scenes = check_existing_scenes(drama_structure)
    
    if all_exist:
        print("\n✓ All scenes already exist locally. Skipping generation (0 API calls).")
        print("  Loading existing scenes for republishing to gist...")
        return load_existing_drama_data(drama_structure, scene_names)
    
    # If scenes don't all exist, generate them
    print("\n⚠ Some scenes are missing. Generating all scenes...")
    
    all_scenes = {}
    summaries_content = "# Scene Summaries\n\n"
    continuity_log = "# Continuity Log\n\n"
    previous_summary = None
    scene_counter = 1
    scenes_data = []
    
    for act_num, num_scenes in drama_structure:
        print(f"\n=== Generating Act {act_num} ===")
        
        for scene_num in range(1, num_scenes + 1):
            # Generate scene
            scene_text = generate_scene(act_num, scene_num, series_bible, outline, previous_summary)
            
            # Generate summary
            summary = generate_summary(scene_text, act_num, scene_num)
            
            # Save scene locally
            scene_filename = f"act_{act_num}_scene_{scene_num:02d}.md"
            scene_path = DOCS_DIR / scene_filename
            save_file(scene_path, scene_text)
            
            # Get scene name
            scene_name = scene_names.get((act_num, scene_num), f"Scene {scene_num}")
            
            # Store for gist upload
            all_scenes[scene_filename] = scene_text
            
            # Update summaries
            summaries_content += f"## Act {act_num}, Scene {scene_num}: {scene_name}\n\n{summary}\n\n"
            
            # Update continuity log
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            continuity_log += f"--- Act {act_num}, Scene {scene_num} ({timestamp}) ---\n{summary}\n\n"
            
            # Add to chapters data
            if GIST_ID:
                gist_url_base = f"https://gist.github.com/{GIST_ID}#{scene_filename}"
                raw_url = f"https://gist.githubusercontent.com/pappater/{GIST_ID}/raw/{scene_filename}"
            else:
                gist_url_base = ""
                raw_url = ""
            
            scenes_data.append({
                "chapter": scene_counter,
                "act": act_num,
                "scene": scene_num,
                "filename": scene_filename,
                "url": raw_url,
                "gist_url": gist_url_base,
                "chapter_name": scene_name
            })
            
            previous_summary = summary
            scene_counter += 1
    
    # Save summaries and continuity log
    save_file(DOCS_DIR / "summaries.md", summaries_content)
    save_file(DOCS_DIR / "continuity_log.txt", continuity_log)
    
    # Update chapters.json
    chapters_data = update_chapters_json(scenes_data)
    
    return all_scenes, chapters_data


def publish_to_gist(all_scenes, chapters_data):
    """Publish all drama content to GitHub Gist."""
    if not GIST_TOKEN:
        print("WARNING: GIST_TOKEN not set. Skipping gist publication.")
        return
    
    if not GIST_ID:
        print("WARNING: FARCE_DRAMA_GIST_ID not set. Skipping gist publication.")
        return
    
    try:
        g = Github(GIST_TOKEN)
        gist = g.get_gist(GIST_ID)
        
        # Prepare files for upload
        files_to_upload = {}
        
        # Add all scenes
        for filename, content in all_scenes.items():
            files_to_upload[filename] = content
        
        # Add support files
        files_to_upload["README.md"] = load_file(DOCS_DIR / "README.md") or "# The Absurd Ascent - A Farce Drama"
        files_to_upload["series_bible.md"] = load_file(DOCS_DIR / "series_bible.md") or ""
        files_to_upload["outline.md"] = load_file(DOCS_DIR / "outline.md") or ""
        files_to_upload["summaries.md"] = load_file(DOCS_DIR / "summaries.md") or ""
        files_to_upload["continuity_log.txt"] = load_file(DOCS_DIR / "continuity_log.txt") or ""
        files_to_upload["chapters.json"] = json.dumps(chapters_data, indent=2)
        
        # Sanitize and upload
        sanitized_files = _sanitize_gist_files(files_to_upload)
        gist.edit(files=sanitized_files)
        
        print(f"\n✓ Drama published to gist: https://gist.github.com/{GIST_ID}")
        
    except Exception as e:
        print(f"ERROR: Failed to publish to gist: {e}")
        sys.exit(1)


def main():
    """Main execution function."""
    print("=" * 60)
    print("Farce Drama Generator")
    print("=" * 60)
    
    # Validate environment
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    # Ensure docs directory exists
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate complete drama
    all_scenes, chapters_data = generate_complete_drama()
    
    print(f"\n✓ Generated {len(all_scenes)} scenes successfully!")
    
    # Publish to gist
    publish_to_gist(all_scenes, chapters_data)
    
    print("\n" + "=" * 60)
    print("Drama generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

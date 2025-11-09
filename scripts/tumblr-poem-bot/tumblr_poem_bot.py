#!/usr/bin/env python3
"""
Tumblr Poem Bot
Posts a poem to Tumblr every 10 minutes.
Randomly selects a poetry type from a configurable list and generates
a poem in that style with relevant hashtags.
"""

import os
import sys
import json
import random
from datetime import datetime
from pathlib import Path

import google.generativeai as genai
import pytumblr

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# Tumblr API credentials
TUMBLR_CONSUMER_KEY = os.environ.get("TUMBLR_CONSUMER_KEY")
TUMBLR_CONSUMER_SECRET = os.environ.get("TUMBLR_CONSUMER_SECRET")
TUMBLR_OAUTH_TOKEN = os.environ.get("TUMBLR_OAUTH_TOKEN")
TUMBLR_OAUTH_SECRET = os.environ.get("TUMBLR_OAUTH_SECRET")
TUMBLR_BLOG_NAME = os.environ.get("TUMBLR_BLOG_NAME")

SCRIPTS_DIR = Path(__file__).parent
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

# Configuration files
POETRY_TYPES_FILE = SCRIPTS_DIR / "poetry_types.json"
CONFIG_FILE = SCRIPTS_DIR / "config.json"

# Popular poetry-related hashtags for better reach
POETRY_HASHTAGS = [
    "poetry",
    "poem",
    "poet",
    "writing",
    "writersofinstagram",
    "poetsofinstagram",
    "poetrycommunity",
    "writerscommunity",
    "creativewriting",
    "spilledink",
    "wordporn",
    "poetryisnotdead",
    "instapoetry",
    "instapoet",
    "modernpoetry"
]


def load_file(filepath):
    """Load text content from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def load_json(filepath):
    """Load JSON content from a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


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


def generate_poem(poetry_type):
    """
    Generate a new poem using Gemini AI in the selected poetry type style.
    
    Args:
        poetry_type: The type of poetry to generate
        
    Returns:
        str: The generated poem text
    """
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        poem_prompt_template = load_file(PROMPTS_DIR / "poem_prompt.txt")
        prompt = poem_prompt_template.format(poetry_type=poetry_type)
        
        print(f"Generating poem in the style of {poetry_type}...")
        response = model.generate_content(prompt)
        poem_text = response.text.strip()
        
        print(f"✓ Poem generated successfully")
        return poem_text
        
    except Exception as e:
        print(f"ERROR: Failed to generate poem using model '{GEMINI_MODEL}': {e}")
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


def generate_hashtags(poetry_type):
    """
    Generate relevant hashtags for the poem.
    
    Args:
        poetry_type: The type of poetry
        
    Returns:
        list: List of hashtags
    """
    # Start with general poetry hashtags (select a subset)
    hashtags = random.sample(POETRY_HASHTAGS, min(5, len(POETRY_HASHTAGS)))
    
    # Add poetry type as hashtag if it's simple (one or two words)
    poetry_type_clean = poetry_type.lower().replace(" (concrete poem)", "").replace(" (letter poem)", "")
    words = poetry_type_clean.split()
    if len(words) <= 2:
        type_hashtag = "".join(words)
        hashtags.append(type_hashtag)
    
    return hashtags


def post_to_tumblr(poem_text, poetry_type):
    """
    Post the generated poem to Tumblr.
    
    Args:
        poem_text: The poem to post
        poetry_type: The type of poetry (for title and tags)
    """
    try:
        # Authenticate with Tumblr
        client = pytumblr.TumblrRestClient(
            TUMBLR_CONSUMER_KEY,
            TUMBLR_CONSUMER_SECRET,
            TUMBLR_OAUTH_TOKEN,
            TUMBLR_OAUTH_SECRET
        )
        
        # Generate hashtags
        hashtags = generate_hashtags(poetry_type)
        
        # Extract title from poem content (first line with # prefix)
        title = extract_poem_title(poem_text)
        
        # Format poem body
        body = f"{poem_text}"
        
        print(f"\nPosting to Tumblr...")
        print(f"Title: {title}")
        print(f"Tags: {', '.join(hashtags)}")
        print("-" * 60)
        print(body)
        print("-" * 60)
        
        # Post to Tumblr as a text post
        response = client.create_text(
            TUMBLR_BLOG_NAME,
            state="published",
            title=title,
            body=body,
            tags=hashtags
        )
        
        if "id" in response:
            post_id = response["id"]
            print(f"✓ Successfully posted to Tumblr!")
            print(f"  Post ID: {post_id}")
            print(f"  View at: https://{TUMBLR_BLOG_NAME}.tumblr.com/post/{post_id}")
        else:
            print(f"ERROR: Unexpected response from Tumblr: {response}")
            sys.exit(1)
        
    except Exception as e:
        print(f"ERROR: Failed to post to Tumblr: {e}")
        sys.exit(1)


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not TUMBLR_CONSUMER_KEY:
        print("ERROR: TUMBLR_CONSUMER_KEY environment variable not set")
        sys.exit(1)
    
    if not TUMBLR_CONSUMER_SECRET:
        print("ERROR: TUMBLR_CONSUMER_SECRET environment variable not set")
        sys.exit(1)
    
    if not TUMBLR_OAUTH_TOKEN:
        print("ERROR: TUMBLR_OAUTH_TOKEN environment variable not set")
        sys.exit(1)
    
    if not TUMBLR_OAUTH_SECRET:
        print("ERROR: TUMBLR_OAUTH_SECRET environment variable not set")
        sys.exit(1)
    
    if not TUMBLR_BLOG_NAME:
        print("ERROR: TUMBLR_BLOG_NAME environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Tumblr Poem Bot")
    print("=" * 60)
    
    # Load configuration
    config_data = load_json(CONFIG_FILE)
    if config_data:
        print(f"Configuration: {config_data.get('note', 'Default settings')}")
    
    # Select random poetry type
    poetry_type = select_random_poetry_type()
    
    # Generate the poem
    poem_text = generate_poem(poetry_type)
    
    # Post to Tumblr
    post_to_tumblr(poem_text, poetry_type)
    
    print("\n" + "=" * 60)
    print("✓ Poem posted successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()

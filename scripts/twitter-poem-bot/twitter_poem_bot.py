#!/usr/bin/env python3
"""
Twitter Poem Bot
Posts a short poem (max 280 characters) to Twitter/X every 15 minutes.
Randomly selects a poetry type from a configurable list and generates
a poem in that style.
"""

import os
import sys
import json
import random
from pathlib import Path

import google.generativeai as genai
import tweepy

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# Twitter API credentials
TWITTER_API_KEY = os.environ.get("TWITTER_API_KEY")
TWITTER_API_SECRET = os.environ.get("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")
TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN")

SCRIPTS_DIR = Path(__file__).parent
PROMPTS_DIR = SCRIPTS_DIR / "prompts"

# Configuration files
POETRY_TYPES_FILE = SCRIPTS_DIR / "poetry_types.json"
CONFIG_FILE = SCRIPTS_DIR / "config.json"

# Character limit for Twitter
TWITTER_CHAR_LIMIT = 280


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


def generate_poem(poetry_type, max_attempts=5):
    """
    Generate a new poem using Gemini AI in the selected poetry type style.
    Ensures the poem is under the Twitter character limit.
    
    Args:
        poetry_type: The type of poetry to generate
        max_attempts: Maximum number of attempts to generate a poem under the limit
        
    Returns:
        str: The generated poem text
    """
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        poem_prompt_template = load_file(PROMPTS_DIR / "poem_prompt.txt")
        prompt = poem_prompt_template.format(poetry_type=poetry_type)
        
        for attempt in range(1, max_attempts + 1):
            print(f"Generating poem in the style of {poetry_type} (attempt {attempt}/{max_attempts})...")
            response = model.generate_content(prompt)
            poem_text = response.text.strip()
            
            # Count characters
            char_count = len(poem_text)
            print(f"Generated poem length: {char_count} characters")
            
            if char_count <= TWITTER_CHAR_LIMIT:
                print(f"✓ Poem fits within Twitter's {TWITTER_CHAR_LIMIT} character limit")
                return poem_text
            else:
                print(f"⚠ Poem exceeds limit by {char_count - TWITTER_CHAR_LIMIT} characters, regenerating...")
        
        # If we couldn't generate a short enough poem, truncate it
        print(f"⚠ Could not generate poem under {TWITTER_CHAR_LIMIT} characters after {max_attempts} attempts")
        print(f"Truncating poem to fit...")
        truncated = poem_text[:TWITTER_CHAR_LIMIT - 3] + "..."
        return truncated
        
    except Exception as e:
        print(f"ERROR: Failed to generate poem using model '{GEMINI_MODEL}': {e}")
        sys.exit(1)


def post_to_twitter(poem_text, poetry_type):
    """
    Post the generated poem to Twitter/X.
    
    Args:
        poem_text: The poem to post
        poetry_type: The type of poetry (for logging)
    """
    try:
        # Authenticate using OAuth 1.0a (for v2 API with user context)
        client = tweepy.Client(
            bearer_token=TWITTER_BEARER_TOKEN,
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_TOKEN_SECRET
        )
        
        # Post the tweet
        print(f"\nPosting to Twitter/X...")
        print(f"Tweet content ({len(poem_text)} characters):")
        print("-" * 60)
        print(poem_text)
        print("-" * 60)
        
        response = client.create_tweet(text=poem_text)
        
        tweet_id = response.data['id']
        print(f"✓ Successfully posted to Twitter!")
        print(f"  Tweet ID: {tweet_id}")
        print(f"  View at: https://twitter.com/i/web/status/{tweet_id}")
        
    except Exception as e:
        print(f"ERROR: Failed to post to Twitter: {e}")
        sys.exit(1)


def main():
    """Main execution flow."""
    # Validate environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    if not TWITTER_API_KEY:
        print("ERROR: TWITTER_API_KEY environment variable not set")
        sys.exit(1)
    
    if not TWITTER_API_SECRET:
        print("ERROR: TWITTER_API_SECRET environment variable not set")
        sys.exit(1)
    
    if not TWITTER_ACCESS_TOKEN:
        print("ERROR: TWITTER_ACCESS_TOKEN environment variable not set")
        sys.exit(1)
    
    if not TWITTER_ACCESS_TOKEN_SECRET:
        print("ERROR: TWITTER_ACCESS_TOKEN_SECRET environment variable not set")
        sys.exit(1)
    
    if not TWITTER_BEARER_TOKEN:
        print("ERROR: TWITTER_BEARER_TOKEN environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("Twitter Poem Bot")
    print("=" * 60)
    
    # Load configuration
    config_data = load_json(CONFIG_FILE)
    if config_data:
        print(f"Configuration: {config_data.get('note', 'Default settings')}")
    
    # Select random poetry type
    poetry_type = select_random_poetry_type()
    
    # Generate the poem
    poem_text = generate_poem(poetry_type)
    
    # Post to Twitter
    post_to_twitter(poem_text, poetry_type)
    
    print("\n" + "=" * 60)
    print("✓ Poem posted successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()

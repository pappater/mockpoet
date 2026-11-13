#!/usr/bin/env python3
"""
Free Daily Email Digest Sender
Reads opted-in subscribers from a GitHub Gist (`subscribers.json`), fetches the latest
short story gist (with Gemini 4 Hydrogen summary if available) and daily quote in
English/Tamil, and sends a free daily digest using Gmail SMTP.
"""

import os
import json
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from github import Github

GIST_TOKEN = os.environ.get("GIST_TOKEN")
SUBSCRIBERS_GIST_ID = os.environ.get("SUBSCRIBERS_GIST_ID")
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
SITE_URL = os.environ.get("SITE_URL", "https://pappater.github.io/mockpoet/")

DOCS_ROOT = Path(__file__).parent.parent.parent / "docs"


def read_latest_entry(folder):
    meta_path = DOCS_ROOT / folder / "chapters.json"
    if not meta_path.exists():
        return None, ""
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    chapters = meta.get("chapters", [])
    if not chapters:
        return None, ""
    latest = chapters[-1]
    md_path = DOCS_ROOT / folder / latest["filename"]
    body = md_path.read_text(encoding="utf-8") if md_path.exists() else ""
    clean_lines = [
        line.strip()
        for line in body.splitlines()
        if line.strip() and not line.strip().startswith("#") and not line.strip().startswith("<!--")
    ]
    excerpt = " ".join(clean_lines)[:420].strip()
    if len(" ".join(clean_lines)) > 420:
        excerpt += "…"
    return latest, excerpt


def load_subscribers():
    if not GIST_TOKEN or not SUBSCRIBERS_GIST_ID:
        return []
    gist = Github(GIST_TOKEN).get_gist(SUBSCRIBERS_GIST_ID)
    if "subscribers.json" not in gist.files:
        return []
    data = json.loads(gist.files["subscribers.json"].content or "{}")
    return [s for s in data.get("subscribers", []) if s.get("emailDigest", {}).get("optedIn")]


def build_email_html(story, story_gist, quote_entry, quote_text):
    story_title = (story or {}).get("chapter_name", "Daily Short Fiction")
    quote_title = (quote_entry or {}).get("chapter_name", "Daily Reflection")
    return f"""
    <html>
      <body style="font-family: Georgia, serif; background:#FBF9F5; color:#1C1917; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #E3DDD3; border-radius:8px; padding:24px;">
          <p style="font-family:monospace; font-size:12px; color:#9A3412; text-transform:uppercase; margin:0 0 8px;">
            mockpoet · Daily Literary Digest
          </p>
          <h2 style="margin:0 0 12px; font-size:22px;">Short Story Gist: {story_title}</h2>
          <p style="line-height:1.65; color:#292524;">{story_gist}</p>
          <hr style="border:none; border-top:1px solid #E3DDD3; margin:20px 0;" />
          <p style="font-family:monospace; font-size:11px; color:#6B655E; text-transform:uppercase; margin:0 0 6px;">
            Today's Quote · {quote_title}
          </p>
          <blockquote style="margin:0 0 16px; padding-left:14px; border-left:2px solid #9A3412; font-style:italic;">
            {quote_text}
          </blockquote>
          <p style="margin-top:20px;">
            <a href="{SITE_URL}" style="color:#9A3412; font-weight:bold;">Read full editions on mockpoet →</a>
          </p>
        </div>
      </body>
    </html>
    """


def main():
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("Gmail SMTP secrets not configured; skipping automated email digest.")
        return

    subscribers = load_subscribers()
    if not subscribers:
        print("No opted-in subscribers found in Gist.")
        return

    story, story_gist = read_latest_entry("paper-lantern")
    quote_entry, quote_text = read_latest_entry("pocket-wisdom")
    html_body = build_email_html(story, story_gist, quote_entry, quote_text)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        for sub in subscribers:
            recipient = sub.get("email")
            if not recipient:
                continue
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"mockpoet Daily Gist & Quote ({datetime.now().strftime('%b %d')})"
            msg["From"] = GMAIL_ADDRESS
            msg["To"] = recipient
            msg.attach(MIMEText(f"Short Story Gist: {story_gist}\n\nQuote: {quote_text}\n\nRead more: {SITE_URL}", "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))
            server.sendmail(GMAIL_ADDRESS, recipient, msg.as_string())
            print(f"Sent digest to {recipient}")


if __name__ == "__main__":
    main()

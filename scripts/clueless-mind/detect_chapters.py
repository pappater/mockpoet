#!/usr/bin/env python3
"""
Script to detect chapter boundaries in the PDF based on font size changes.
Bold/big text indicates new chapter start.
"""

import pdfplumber
from pathlib import Path
from collections import defaultdict

PDF_PATH = Path(__file__).parent.parent.parent / "docs" / "archive" / "Aoasm.pdf"

def detect_chapters():
    """Detect chapters based on font size patterns."""
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}\n")
        
        chapter_starts = []
        
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
            
            # Analyze each line
            for y in sorted(lines.keys()):
                line_chars = lines[y]
                if not line_chars:
                    continue
                
                # Get average font size for this line
                avg_size = sum(c.get('size', 0) for c in line_chars) / len(line_chars)
                
                # Get the text content
                line_text = ''.join(c.get('text', '') for c in line_chars).strip()
                
                # Look for larger text (potential chapter starts)
                # Based on exploration, normal text is ~11-12pt, bigger text could be 14+
                if avg_size > 13 and len(line_text) > 2:
                    # Check if it's meaningful text (not just page numbers)
                    if not line_text.isdigit() and len(line_text.split()) >= 2:
                        chapter_starts.append({
                            'page': page_num + 1,
                            'text': line_text[:100],
                            'font_size': avg_size
                        })
                        break  # Only capture first large text per page
        
        print(f"Detected {len(chapter_starts)} potential chapter starts:\n")
        for i, chapter in enumerate(chapter_starts, 1):
            print(f"Chapter {i}:")
            print(f"  Page: {chapter['page']}")
            print(f"  Font size: {chapter['font_size']:.1f}")
            print(f"  Text: {chapter['text']}")
            print()
        
        return chapter_starts

if __name__ == "__main__":
    detect_chapters()

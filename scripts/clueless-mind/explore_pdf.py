#!/usr/bin/env python3
"""
Exploration script to understand the structure of the Clueless Mind PDF.
"""

import pdfplumber
from pathlib import Path

PDF_PATH = Path(__file__).parent.parent.parent / "docs" / "archive" / "Aoasm.pdf"

def explore_pdf():
    """Explore the PDF structure to understand chapter organization."""
    print(f"Opening PDF: {PDF_PATH}")
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        print("\n" + "="*80)
        
        # Look at first few pages to understand the structure
        for page_num in range(min(5, len(pdf.pages))):
            page = pdf.pages[page_num]
            print(f"\nPAGE {page_num + 1}")
            print("-"*80)
            
            # Extract text
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                print(f"Lines on this page: {len(lines)}")
                
                # Show first 30 lines
                for i, line in enumerate(lines[:30], 1):
                    # Show font size if available (indicates bold/big text)
                    print(f"{i:3d}: {line}")
            else:
                print("No text extracted")
            
            print("-"*80)
            
            # Try to get character details to detect font sizes
            chars = page.chars
            if chars:
                print(f"\nCharacter details (first 10 unique font sizes):")
                font_sizes = {}
                for char in chars[:100]:  # Sample first 100 chars
                    size = char.get('size', 0)
                    if size not in font_sizes:
                        font_sizes[size] = char.get('text', '')
                
                for size in sorted(font_sizes.keys(), reverse=True)[:10]:
                    print(f"  Size {size:.1f}: '{font_sizes[size]}'")

if __name__ == "__main__":
    explore_pdf()

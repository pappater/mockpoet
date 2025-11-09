# Clueless Mind - Chapter Extraction

This directory contains scripts to extract chapters from the "Clueless Mind" PDF and generate necessary files for the mockpoet platform.

## Files

- `extract_chapters.py` - Main script to extract chapters from PDF
- `explore_pdf.py` - Utility script to explore PDF structure
- `detect_chapters.py` - Utility script to detect chapter boundaries
- `requirements.txt` - Python dependencies

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure the PDF file is in the correct location:
```
docs/archive/Aoasm.pdf
```

## Usage

Run the extraction script:

```bash
python3 extract_chapters.py
```

This will:
1. Extract 67 chapters from the PDF
2. Create chapter files (chapter_001.md to chapter_067.md) in `docs/clueless-mind/`
3. Generate `chapters.json` with metadata
4. Create a README.md for the book
5. Copy chapters.json to `public/docs/clueless-mind/`

## Output

The script generates:
- `docs/clueless-mind/chapter_XXX.md` - Individual chapter files
- `docs/clueless-mind/chapters.json` - Metadata file with chapter information
- `docs/clueless-mind/README.md` - Book description
- `public/docs/clueless-mind/chapters.json` - Public copy of metadata

## Environment Variables

- `CLUELESS_MIND_GIST_ID` - (Optional) The GitHub Gist ID for hosting the chapters

If the Gist ID is not set, the script uses "PLACEHOLDER_GIST_ID" which can be replaced later.

## Book Information

- **Title**: Clueless Mind
- **Type**: Novel
- **Chapters**: 67
- **Format**: Markdown files with "Chapter N" titles

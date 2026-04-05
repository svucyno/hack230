"""
Handles multi-page PDFs and preserves layout for NLP extraction.
"""

import fitz  # PyMuPDF
from pathlib import Path


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text from a PDF file, preserving line breaks.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        A single string containing all extracted text.

    Raises:
        FileNotFoundError: If the file doesn't exist. 
        RuntimeError: If PyMuPDF fails to open or parse the file.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    try:
        doc = fitz.open(str(path))
    except Exception as exc:
        raise RuntimeError(f"Failed to open PDF '{file_path}': {exc}") from exc

    pages_text = []
    for page_num, page in enumerate(doc, start=1):
        try:
            text = page.get_text("text")  # plain text with newlines
            pages_text.append(text)
        except Exception as exc:
            # Log and skip bad pages instead of failing the whole file
            print(f"[pdf_parser] Warning: Could not extract page {page_num}: {exc}")

    doc.close()
    full_text = "\n".join(pages_text)
    return full_text.strip()


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str = "upload.pdf") -> str:
    """
    Extract text directly from PDF bytes (for FastAPI UploadFile usage).

    Args:
        file_bytes: Raw bytes of the PDF file.
        filename:   Name used only for error messages.

    Returns:
        Extracted text string.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise RuntimeError(f"Failed to parse PDF bytes for '{filename}': {exc}") from exc

    pages_text = []
    for page_num, page in enumerate(doc, start=1):
        try:
            text = page.get_text("text")
            pages_text.append(text)
        except Exception as exc:
            print(f"[pdf_parser] Warning: Could not extract page {page_num} of '{filename}': {exc}")

    doc.close()
    return "\n".join(pages_text).strip()

#!/usr/bin/env python3
"""Extract lesson-aware text chunks from the Assimil French PDF.

The output is intentionally provider-neutral JSON. It can be searched locally or
uploaded to Azure AI Search Free without invoking a paid Azure vectorizer.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pdfplumber


FRENCH_LESSON = re.compile(r"(?im)^\s*(\d{1,3})\s*/\s*[^\n]{0,55}le[cç]on\b")
ENGLISH_LESSON = re.compile(r"(?im)^\s*(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\w+[- ]\w+)\s+lesson\s*/\s*(\d{1,3})\b")
TITLE = re.compile(r"(?im)^\s*[0o]\s+([^\n]{2,90})$")
OCR_FALLBACKS = {
    6: re.compile(r"(?im)^\s*(?:sixième\s+leçon|sixth\s+lesson)\s*$"),
    9: re.compile(r"(?im)^\s*(?:neuvième\s+leçon|ninth\s+lesson)\s*$"),
    11: re.compile(r"(?im)^\s*(?:onzième\s+leçon|eleventh\s+lesson)\s*$"),
    70: re.compile(r"(?im)^\s*(?:soixante[- ]dixième\s+leçon|seventieth\s+lesson)\s*$"),
}


def clean(text: str) -> str:
    text = text.replace("\u00ad", "").replace("�", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def lesson_number(text: str) -> int | None:
    for pattern in (FRENCH_LESSON, ENGLISH_LESSON):
        match = pattern.search(text[:700])
        if match:
            number = int(match.group(1))
            if 1 <= number <= 100:
                return number
    for number, pattern in OCR_FALLBACKS.items():
        if pattern.search(text[:900]):
            return number
    return None


def content_type(text: str) -> str:
    lower = text.lower()
    if "answers to exercise" in lower or "réponses" in lower:
        return "answers"
    if "exercice" in lower or "exercise" in lower:
        return "exercise"
    if "pronunciation" in lower:
        return "pronunciation"
    if "notes" in lower or "note" in lower:
        return "notes"
    return "lesson"


def extract(pdf_path: Path) -> list[dict[str, object]]:
    chunks: list[dict[str, object]] = []
    current_lesson: int | None = None
    titles: dict[int, str] = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = clean(page.extract_text() or "")
            detected = lesson_number(text)
            if detected is not None:
                current_lesson = detected
                title_match = TITLE.search(text[:1200])
                if title_match:
                    titles[detected] = clean(title_match.group(1))
            if current_lesson is None or not text:
                continue
            # Stop before the grammar overview and lexicons.
            if current_lesson == 100 and re.search(
                r"(?im)^\s*Grammar(?:tical)? Overview\s*$", text
            ):
                break
            chunks.append(
                {
                    "id": f"lesson-{current_lesson}-page-{page_index}",
                    "lesson": current_lesson,
                    "title": titles.get(current_lesson, f"Lesson {current_lesson}"),
                    "pdfPage": page_index,
                    "contentType": content_type(text),
                    "text": text,
                }
            )
    return chunks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    chunks = extract(args.pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps({"version": 1, "chunks": chunks}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    lessons = sorted({chunk["lesson"] for chunk in chunks})
    print(f"Wrote {len(chunks)} page chunks across {len(lessons)} lessons to {args.output}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Validate build output for the dependency-free static GigitekAI site."""
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs: list[str] = []
        self.descriptions: list[str] = []
        self.titles: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "a" and "href" in data:
            self.hrefs.append(data["href"])
        if tag == "meta" and data.get("name") == "description":
            self.descriptions.append(data.get("content", ""))
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.titles.append(data.strip())


def internal_target(href: str) -> Path | None:
    if href.startswith(("#", "mailto:", "tel:", "http:", "https:")):
        return None
    route = href.split("?", 1)[0]
    if route == "/":
        return DIST / "index.html"
    target = DIST / route.lstrip("/")
    if route.endswith("/") or not target.suffix:
        target = target / "index.html"
    return target


def main() -> None:
    required = [
        DIST / "index.html",
        DIST / "robots.txt",
        DIST / "sitemap.xml",
        DIST / "_headers",
        DIST / "_redirects",
        DIST / "404.html",
    ]
    issues: list[str] = []
    for path in required:
        if not path.is_file() or path.stat().st_size == 0:
            issues.append(f"missing or empty file: {path.relative_to(ROOT)}")

    pages = sorted(DIST.rglob("*.html"))
    if not pages:
        issues.append("no HTML pages generated")

    for page in pages:
        parser = LinkParser()
        parser.feed(page.read_text(encoding="utf-8"))
        relative = page.relative_to(ROOT)
        if not parser.titles or not "".join(parser.titles):
            issues.append(f"missing title: {relative}")
        if not parser.descriptions or not parser.descriptions[0]:
            issues.append(f"missing meta description: {relative}")
        for href in parser.hrefs:
            target = internal_target(href)
            if target and not target.is_file():
                issues.append(f"broken internal link in {relative}: {href} -> {target.relative_to(ROOT)}")

    if issues:
        print("Static-site validation failed:")
        for issue in issues:
            print(f"- {issue}")
        raise SystemExit(1)

    print(f"PASS: {len(pages)} HTML pages parsed; titles, descriptions, and internal links are valid.")

if __name__ == "__main__":
    main()

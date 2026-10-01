import json
import os
import re
import time
import urllib.parse
import urllib.request
import urllib.error
from typing import Dict, Tuple

import requests


def validate_sources(linkedin_url: str, instagram_url: str) -> Tuple[bool, str]:
    """Validate that the supplied URLs are strictly public LinkedIn and Instagram endpoints."""
    if not linkedin_url or not instagram_url:
        return False, "Both LinkedIn and Instagram public URLs are required."

    li_pattern = r"^https?:\/\/([a-zA-Z0-9\-]+\.)?linkedin\.com\/(in\/[\w\-\%]+|pub\/[\w\-\%]+|[\w\-\%]+)\/?.*$"
    ig_pattern = r"^https?:\/\/([a-zA-Z0-9\-]+\.)?instagram\.com\/[\w\.\_\-\%]+(\/.*|\?.*)?$"

    if not re.match(li_pattern, linkedin_url.strip(), re.IGNORECASE):
        return False, "Invalid LinkedIn profile URL. Must be in format https://linkedin.com/in/username"

    if not re.match(ig_pattern, instagram_url.strip(), re.IGNORECASE):
        return False, "Invalid Instagram profile URL. Must be in format https://instagram.com/username"

    return True, "Valid"


def _extract_page_content(html: str, url: str) -> str:
    """Parse HTML extracting meta tags, JSON-LD, and visible text."""
    import html as html_lib
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    extracted_parts = []

    # 1. Page Title
    if soup.title and soup.title.string:
        title_clean = soup.title.string.strip()
        if "login" not in title_clean.lower() and "sign in" not in title_clean.lower() and "sign up" not in title_clean.lower():
            extracted_parts.append(f"Title: {title_clean}")

    # 2. Meta tags (og:title, og:description, description, keywords)
    for m in soup.find_all("meta"):
        prop = (m.get("property") or m.get("name") or "").lower()
        content = m.get("content", "").strip()
        if not content:
            continue
        content = html_lib.unescape(content)
        if prop in ["og:title", "title"]:
            if "login" not in content.lower() and "sign up" not in content.lower():
                extracted_parts.append(f"Profile Title: {content}")
        elif prop in ["og:description", "description"]:
            if "join linkedin" not in content.lower() and "sign in" not in content.lower():
                extracted_parts.append(f"Summary / Bio: {content}")

    # 3. JSON-LD Structured Data
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw = script.string or script.get_text()
            if raw:
                data = json.loads(raw)
                # If list of graphs or person object
                items = data.get("@graph", [data]) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                for item in items:
                    if isinstance(item, dict):
                        if item.get("@type") == "Person":
                            p_name = item.get("name")
                            p_job = item.get("jobTitle")
                            if p_name:
                                extracted_parts.append(f"Name: {p_name}")
                            if p_job:
                                extracted_parts.append(f"Role/Job: {p_job}")
        except Exception:
            pass

    # 4. Visible Text (excluding nav/footer/login prompts)
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "svg"]):
        tag.decompose()

    body_text = soup.get_text(separator="\n", strip=True)
    body_lines = []
    ignored_phrases = [
        "sign in", "join now", "log in", "sign up", "cookie policy",
        "privacy policy", "user agreement", "forgot password",
        "continue with google", "agree & join", "open the app",
        "get the app", "terms of use", "see photos, videos and more",
        "already on linkedin", "by clicking", "don't have the app"
    ]
    for line in body_text.splitlines():
        line_clean = line.strip()
        if len(line_clean) < 3:
            continue
        if any(ign in line_clean.lower() for ign in ignored_phrases):
            continue
        body_lines.append(line_clean)

    is_private_ig = "instagram.com" in url.lower() and (
        "this profile is private" in html.lower() or
        "this account is private" in html.lower() or
        "already follow" in html.lower()
    )

    if is_private_ig:
        extracted_parts.append("[PRIVACY NOTICE: Instagram Account is PRIVATE. Only the public bio, follower metrics, and link were retrieved. Photos/posts are protected.]")

    combined = "\n\n".join(extracted_parts).strip()
    return combined


def _fetch_with_playwright(url: str, wait_selector: str = None, timeout: int = 20000) -> str:
    """
    Fetch a page using Playwright headless Chromium.
    Extracts meta tags, OpenGraph data, JSON-LD, and visible text.
    """
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    except ImportError:
        raise RuntimeError("Playwright is not installed. Run: pip install playwright && python -m playwright install chromium")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="en-US",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.google.com/"
            }
        )
        page = context.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            page.wait_for_timeout(2000)
            html = page.content()
            content = _extract_page_content(html, url)
            
            if len(content) < 30:
                raise RuntimeError(
                    f"Insufficient public content found at {url}. "
                    "The profile may be private, empty, or restricted."
                )

            return content

        except RuntimeError:
            raise
        except PlaywrightTimeout:
            raise RuntimeError(f"Timed out loading {url}. The page may be slow or blocked.")
        except Exception as e:
            raise RuntimeError(f"Failed to load {url}: {str(e)}")
        finally:
            browser.close()


def _fetch_with_requests(url: str) -> str:
    """
    Lightweight fallback using urllib.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.google.com/"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status != 200:
                raise RuntimeError(f"HTTP {resp.status} from {url}")
            html = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} error loading {url}: {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error loading {url}: {e.reason}")

    content = _extract_page_content(html, url)
    if len(content) < 30:
        raise RuntimeError(
            f"Insufficient public content retrieved from {url}. "
            "The profile may be private or restricted."
        )

    return content


def _run_apify_actor(actor_id: str, url: str, platform: str) -> str:
    """Run a configured Apify Actor against exactly one supplied public profile URL."""
    token = os.getenv("APIFY_API_TOKEN", "").strip()
    if not token:
        raise RuntimeError("APIFY_API_TOKEN is not configured.")

    if platform == "instagram":
        actor_input = {"directUrls": [url], "resultsLimit": 50}
    else:
        actor_input = {"profileUrls": [url]}

    endpoint = "https://api.apify.com/v2/acts/{}/run-sync-get-dataset-items".format(
        urllib.parse.quote(actor_id, safe="")
    )
    try:
        response = requests.post(
            endpoint,
            json=actor_input,
            headers={"Authorization": f"Bearer {token}"},
            timeout=120,
        )
        response.raise_for_status()
        items = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Apify {platform} extraction failed: {exc}") from exc
    except ValueError as exc:
        raise RuntimeError(f"Apify {platform} returned invalid JSON.") from exc

    if not items:
        raise RuntimeError(
            f"Apify {platform} Actor returned no public data for the supplied URL."
        )

    content = json.dumps(items, ensure_ascii=False, indent=2)
    if len(content) < 30:
        raise RuntimeError(
            f"Apify {platform} Actor returned insufficient public data for the supplied URL."
        )
    return content


def extract_public_content(linkedin_url: str, instagram_url: str, name_hint: str = None) -> Dict[str, str]:
    """
    Extract public text STRICTLY from the two provided URLs.
    Tries Playwright first (full JS rendering), falls back to urllib+BeautifulSoup.
    
    Raises RuntimeError with a user-friendly message if a profile is private,
    inaccessible, or behind a login wall.
    
    Does NOT use Google, Wikipedia, or any third-party data source.
    """
    apify_token = os.getenv("APIFY_API_TOKEN", "").strip()
    linkedin_actor_id = os.getenv("APIFY_LINKEDIN_ACTOR_ID", "").strip()
    instagram_actor_id = os.getenv("APIFY_INSTAGRAM_ACTOR_ID", "").strip()

    if apify_token or linkedin_actor_id or instagram_actor_id:
        if not apify_token or not linkedin_actor_id or not instagram_actor_id:
            raise RuntimeError(
                "Apify is partially configured. Set APIFY_API_TOKEN, "
                "APIFY_LINKEDIN_ACTOR_ID, and APIFY_INSTAGRAM_ACTOR_ID."
            )

        linkedin_text = _run_apify_actor(linkedin_actor_id, linkedin_url, "linkedin")
        instagram_text = _run_apify_actor(instagram_actor_id, instagram_url, "instagram")
    else:
        # --- LinkedIn ---
        try:
            linkedin_text = _fetch_with_playwright(linkedin_url)
        except RuntimeError as e:
            if "Playwright is not installed" in str(e):
                # Playwright unavailable, try requests fallback
                try:
                    linkedin_text = _fetch_with_requests(linkedin_url)
                except RuntimeError:
                    raise  # Re-raise the requests error
            else:
                raise  # Re-raise Playwright error (private profile, timeout, etc.)

        # --- Instagram ---
        try:
            instagram_text = _fetch_with_playwright(instagram_url)
        except RuntimeError as e:
            if "Playwright is not installed" in str(e):
                try:
                    instagram_text = _fetch_with_requests(instagram_url)
                except RuntimeError:
                    raise
            else:
                raise

    # Derive name from URL slug if not provided
    if not name_hint:
        li_match = re.search(r"linkedin\.com\/in\/([\w\-]+)", linkedin_url)
        name_hint = li_match.group(1).replace("-", " ").title() if li_match else "Unknown"

    return {
        "name": name_hint,
        "linkedin_content": linkedin_text,
        "instagram_content": instagram_text,
    }

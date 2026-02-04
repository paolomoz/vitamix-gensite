#!/usr/bin/env python3
"""Generate voiceover audio for generative websites video using ElevenLabs TTS."""

import os
import sys
import tempfile
import subprocess
from pathlib import Path

import requests
from dotenv import load_dotenv

# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
# Try multiple .env locations
for env_candidate in [
    BASE_DIR / ".env",
    BASE_DIR.parent / ".env",
    Path.home() / "playground/playground/.env",
]:
    if env_candidate.exists():
        load_dotenv(env_candidate)
        break

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
if not API_KEY:
    print("ERROR: ELEVENLABS_API_KEY not found in .env")
    sys.exit(1)

AUDIO_DIR = BASE_DIR / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

# Single narrator voice — Roger: clear, resonant, authoritative
VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
MODEL_ID = "eleven_multilingual_v2"
TTS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

# ── Voiceover Scripts ──────────────────────────────────────────────────────────
# Clear, descriptive narration — single narrator, documentary style

SECTIONS = [
    {
        "name": "01-what-are-generative-websites",
        "paragraphs": [
            "Generative Websites are a new category of web experience where pages "
            "are composed in real time by AI for each individual visitor.",

            "Unlike traditional personalization, which swaps pre-built content "
            "blocks between audience segments, Generative Websites produce page "
            "elements that didn't exist until the moment they were needed.",

            "A product page for a parent of four highlights capacity, noise level, "
            "and ease of cleaning. The same page for a fitness enthusiast emphasizes "
            "nutrient preservation and single-serve capability. Neither version was "
            "authored in advance.",

            "This is not a chatbot. The browse experience is fully preserved — "
            "navigation, images, editorial structure — everything visitors expect "
            "from a website.",

            "Every visitor sees the same intent of a page. But the expression of "
            "that intent adapts to make it maximally helpful for that specific person.",
        ],
    },
    {
        "name": "02-why-now-three-breakthroughs",
        "paragraphs": [
            "For twenty years, one-to-one personalization was the stated goal of "
            "digital marketing. The vision was simple — show each customer exactly "
            "the content that matters to them. But it was technically impossible. "
            "You can't pre-author millions of page variants.",

            "Three breakthroughs changed this.",

            "First, AI inference moved to the edge. Models now run on servers in "
            "every major city, delivering sub-second response times globally.",

            "Second, the cost of AI generation dropped by orders of magnitude. "
            "What cost dollars per page view in twenty twenty-three now costs "
            "fractions of a cent.",

            "Third, modern language models produce content that's on-brand, "
            "contextually appropriate, and consistent — without needing human "
            "review for every variant.",

            "The shift is fundamental. Personalization moves from a content "
            "management problem to an infrastructure problem. And infrastructure "
            "scales.",
        ],
    },
    {
        "name": "03-value-to-visitors",
        "paragraphs": [
            "Traditional product pages force visitors to decode feature matrices, "
            "filter irrelevant information, and figure out which specifications "
            "matter for their situation.",

            "A parent comparing blenders doesn't care about commercial R-P-M "
            "specifications. They care about — can it handle frozen fruit? And — "
            "will it wake up the baby?",

            "Generative Websites eliminate this translation layer. The page the "
            "visitor sees is already the best version for them.",

            "Context accumulates across the session. The first query reveals "
            "intent. Each subsequent interaction adds signal. By the third page, "
            "the system understands the underlying need — not just what was "
            "searched for, but why.",

            "The implementation also includes reasoning transparency. Visitors "
            "can see why the system recommended what it did. This isn't a "
            "black-box recommendation engine. The AI's reasoning is surfaced, "
            "building trust through openness.",
        ],
    },
    {
        "name": "04-the-ai-pipeline",
        "paragraphs": [
            "The system runs a three-stage AI pipeline at the edge.",

            "Stage one is intent classification, powered by Cerebras for speed "
            "and cost efficiency. It identifies the visitor's intent type, journey "
            "stage, and specific entities — products, features, and use cases.",

            "Stage two is deep reasoning, powered by Claude for high-quality "
            "judgment. This is the AI content strategist. It analyzes the query "
            "in full context, selects from seventy-two pre-designed block types, "
            "picks products with explicit rationale, and generates content guidance.",

            "Stage three is parallel content generation, again on Cerebras for "
            "throughput. Each selected block generates simultaneously and streams "
            "to the browser. The hero section appears in under three seconds. "
            "Remaining blocks fill in progressively below the fold.",

            "The block system is the key architectural decision. The brand "
            "controls every block's visual design. The AI controls which blocks "
            "appear and what content fills them. This separation ensures brand "
            "consistency with infinite personalization.",
        ],
    },
    {
        "name": "05-explicit-and-implicit",
        "paragraphs": [
            "The Vitamix implementation supports two complementary approaches.",

            "In explicit mode, a visitor types a natural-language query. For "
            "example: compare blenders for a family of four — my kids have "
            "different needs. The system generates a complete page: the right "
            "products compared on the right dimensions, recipes matching their "
            "family situation, and a recommendation with clear reasoning.",

            "In implicit mode, no typing is needed. The system observes behavior "
            "— which pages are visited, what's clicked, scroll depth, time spent, "
            "what the visitor returns to. From pure behavior, it infers intent.",

            "It then personalizes the next page the visitor sees — or injects "
            "relevant content below the fold of the current page — all without "
            "the visitor typing a single word.",

            "Both approaches share the same AI pipeline, the same block library, "
            "and the same reasoning engine. A visitor can move fluidly between "
            "asking and browsing — just like a real conversation.",
        ],
    },
    {
        "name": "06-the-shift",
        "paragraphs": [
            "This is the fundamental shift.",

            "From one page that serves many visitors — to many pages, each "
            "composed for one visitor.",

            "The brand stays in control, defining voice, boundaries, product "
            "data, and the block library. The AI works within those constraints, "
            "optimizing for each individual.",

            "Personalization is no longer a content management challenge "
            "requiring teams of authors to produce variants. It's an "
            "infrastructure capability that scales automatically.",

            "Every visitor sees the same intent of a page. But the expression "
            "adapts to make it maximally helpful for that specific person. The "
            "technology is here. The cost structure works. The question is no "
            "longer whether one-to-one personalization is possible — it's how "
            "quickly brands will adopt it.",
        ],
    },
]


# ── TTS Generation ─────────────────────────────────────────────────────────────
def generate_speech(text: str, output_path: Path) -> None:
    """Call ElevenLabs TTS and save audio."""
    resp = requests.post(
        TTS_URL,
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": text,
            "model_id": MODEL_ID,
            "voice_settings": {
                "stability": 0.65,
                "similarity_boost": 0.75,
                "style": 0.15,
            },
        },
        timeout=60,
    )
    resp.raise_for_status()
    output_path.write_bytes(resp.content)
    print(f"    Generated: {output_path.name} ({len(resp.content) / 1024:.1f} KB)")


def generate_silence(path: Path, duration_ms: int) -> None:
    """Generate a silent MP3 of given duration."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", "anullsrc=r=44100:cl=stereo",
            "-t", str(duration_ms / 1000),
            "-c:a", "libmp3lame", "-q:a", "2",
            str(path),
        ],
        capture_output=True, check=True,
    )


def concatenate_audio(parts: list, silence_path: Path, output: Path) -> None:
    """Concatenate audio files with silence gaps using ffmpeg."""
    list_path = output.parent / f"_concat_{output.stem}.txt"
    with open(list_path, "w") as f:
        for i, part in enumerate(parts):
            f.write(f"file '{part}'\n")
            if i < len(parts) - 1:
                f.write(f"file '{silence_path}'\n")

    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-ar", "44100", "-ac", "2",
            "-c:a", "libmp3lame", "-q:a", "2",
            str(output),
        ],
        capture_output=True, check=True,
    )
    list_path.unlink(missing_ok=True)


def get_duration(audio_path: Path) -> float:
    """Get audio duration in seconds."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(audio_path)],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip()) if result.stdout.strip() else 0.0


def main():
    print("=" * 60)
    print("  Generative Websites — Voiceover Generator")
    print("=" * 60)

    silence_path = AUDIO_DIR / "_silence.mp3"
    generate_silence(silence_path, 500)  # 500ms between paragraphs

    total_duration = 0.0

    for section in SECTIONS:
        name = section["name"]
        paragraphs = section["paragraphs"]
        output_path = AUDIO_DIR / f"{name}.mp3"

        print(f"\n  Section: {name}")
        print(f"  {'─' * 40}")

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            parts = []

            for i, text in enumerate(paragraphs):
                part_path = tmp / f"{i:02d}.mp3"
                generate_speech(text, part_path)
                parts.append(part_path)

            concatenate_audio(parts, silence_path, output_path)

        duration = get_duration(output_path)
        total_duration += duration
        print(f"    Output: {output_path.name} ({duration:.1f}s)")

    silence_path.unlink(missing_ok=True)

    print(f"\n{'=' * 60}")
    print(f"  All done! Total audio duration: {total_duration:.1f}s")
    print(f"  Files in: {AUDIO_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

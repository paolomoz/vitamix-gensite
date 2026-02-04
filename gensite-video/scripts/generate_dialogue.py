#!/usr/bin/env python3
"""Generate two-host dialogue audio for generative websites video.

Uses ElevenLabs Text-to-Dialogue API to produce natural conversational audio
with two hosts (Alex and Jordan) discussing each section topic.
"""

import os
import subprocess
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
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

# ── Voice Configuration ───────────────────────────────────────────────────────
# Two-host conversational voices
VOICES = {
    "Alex": "L0Dsvb3SLTyegXwtm47J",    # Archer — conversational, warm male guide
    "Jordan": "kdmDKE6EkgrWrrykO9Qt",   # Alexandra — realistic, chatty female reactor
}

DIALOGUE_URL = "https://api.elevenlabs.io/v1/text-to-dialogue"
MODEL_ID = "eleven_v3"

# ── Dialogue Scripts ──────────────────────────────────────────────────────────
# Two-host casual podcast tone. Alex introduces/explains, Jordan reacts/questions.
# Each section: 5-9 turns, ~130-160 words. Bridge lines preview next topic.

SECTIONS = [
    {
        "name": "01-what-are-generative-websites",
        "dialogue": [
            {"speaker": "Alex", "text": "So here's the big idea. Generative websites are pages that get composed in real time by AI, uniquely for each visitor."},
            {"speaker": "Jordan", "text": "Wait, so it's not just swapping out a banner or showing different recommendations? The page itself is different?"},
            {"speaker": "Alex", "text": "Exactly. A parent shopping for a blender sees content about capacity, noise levels, easy cleaning. A fitness person sees nutrient preservation and single-serve smoothies. Neither version existed before that visitor arrived."},
            {"speaker": "Jordan", "text": "And this isn't a chatbot, right? It still looks and feels like a normal website?"},
            {"speaker": "Alex", "text": "One hundred percent. Navigation, images, editorial layout, all preserved. Every visitor sees the same intent of the page. But the expression adapts to be maximally helpful for that specific person."},
            {"speaker": "Jordan", "text": "That's a pretty fundamental change from how websites work today."},
            {"speaker": "Alex", "text": "So how did we get here? Three breakthroughs made this possible."},
        ],
    },
    {
        "name": "02-why-now-three-breakthroughs",
        "dialogue": [
            {"speaker": "Alex", "text": "For twenty years, one-to-one personalization was the dream of digital marketing. Show each customer exactly what matters to them. But you can't pre-author millions of page variants. It was technically impossible."},
            {"speaker": "Jordan", "text": "So what changed?"},
            {"speaker": "Alex", "text": "Three things. First, AI inference moved to the edge. Models now run on servers in every major city, so response times are sub-second globally."},
            {"speaker": "Jordan", "text": "OK, so speed is there. What about cost?"},
            {"speaker": "Alex", "text": "That's number two. The cost of AI generation dropped by orders of magnitude. What cost dollars per page view in twenty twenty-three now costs fractions of a cent."},
            {"speaker": "Jordan", "text": "And the third breakthrough?"},
            {"speaker": "Alex", "text": "Quality. Modern language models produce content that's on-brand, contextually appropriate, and consistent without needing human review for every variant."},
            {"speaker": "Jordan", "text": "So personalization went from a content management problem to an infrastructure problem. And infrastructure scales."},
            {"speaker": "Alex", "text": "With the tech in place, let's see what this actually means for visitors."},
        ],
    },
    {
        "name": "03-value-to-visitors",
        "dialogue": [
            {"speaker": "Alex", "text": "Traditional product pages force visitors to decode feature matrices and figure out which specs matter for their situation."},
            {"speaker": "Jordan", "text": "Right, like a parent comparing blenders doesn't care about commercial RPM specs. They want to know, can it handle frozen fruit? Will it wake up the baby?"},
            {"speaker": "Alex", "text": "Exactly. Generative websites eliminate that translation layer. The page the visitor sees is already the best version for them."},
            {"speaker": "Jordan", "text": "And it gets smarter over the session, right?"},
            {"speaker": "Alex", "text": "It does. The first query reveals intent. Each interaction adds signal. By the third page, the system understands the underlying need, not just what was searched for, but why."},
            {"speaker": "Jordan", "text": "What about transparency though? People get nervous when AI is making decisions for them."},
            {"speaker": "Alex", "text": "Great question. The system includes reasoning transparency. Visitors can see why it recommended what it did. It's not a black box. The AI's reasoning is surfaced, which builds trust."},
            {"speaker": "Alex", "text": "Behind all of that is a three-stage AI pipeline. Let's break it down."},
        ],
    },
    {
        "name": "04-the-ai-pipeline",
        "dialogue": [
            {"speaker": "Alex", "text": "The system runs a three-stage pipeline at the edge. Stage one is intent classification, powered by Cerebras for speed. It identifies the visitor's intent type, journey stage, and specific entities like products and use cases."},
            {"speaker": "Jordan", "text": "So that's the fast triage. What happens next?"},
            {"speaker": "Alex", "text": "Stage two is deep reasoning, powered by Claude. This is the AI content strategist. It analyzes the query in full context, selects from seventy-two pre-designed block types, picks products with explicit rationale, and generates content guidance."},
            {"speaker": "Jordan", "text": "Seventy-two block types? That's a lot of variety."},
            {"speaker": "Alex", "text": "And that's the key architectural decision. The brand controls every block's visual design. The AI controls which blocks appear and what fills them. Brand consistency with infinite personalization."},
            {"speaker": "Jordan", "text": "And stage three?"},
            {"speaker": "Alex", "text": "Parallel content generation, back on Cerebras for throughput. Each block generates simultaneously and streams to the browser. Hero section appears in under three seconds, remaining blocks fill in below the fold."},
            {"speaker": "Jordan", "text": "So the visitor sees results almost instantly. That's impressive."},
            {"speaker": "Alex", "text": "The system supports two ways visitors interact, explicit and implicit."},
        ],
    },
    {
        "name": "05-explicit-and-implicit",
        "dialogue": [
            {"speaker": "Alex", "text": "In explicit mode, a visitor types a natural-language query. Something like, compare blenders for a family of four, my kids have different needs."},
            {"speaker": "Jordan", "text": "And the system just builds a whole page from that?"},
            {"speaker": "Alex", "text": "A complete page. The right products compared on the right dimensions, recipes matching their family situation, and a recommendation with clear reasoning."},
            {"speaker": "Jordan", "text": "OK, what about implicit mode?"},
            {"speaker": "Alex", "text": "No typing needed. The system observes behavior, which pages are visited, what's clicked, scroll depth, time spent. From pure behavior, it infers intent and personalizes the next page automatically."},
            {"speaker": "Jordan", "text": "So you don't even have to ask. It just figures it out from how you browse."},
            {"speaker": "Alex", "text": "And both approaches share the same pipeline, same block library, same reasoning engine. A visitor can move fluidly between asking and browsing, just like a real conversation."},
            {"speaker": "Alex", "text": "Both paths lead to the same fundamental shift in how websites work."},
        ],
    },
    {
        "name": "06-the-shift",
        "dialogue": [
            {"speaker": "Alex", "text": "This is the fundamental shift. From one page that serves many visitors, to many pages, each composed for one visitor."},
            {"speaker": "Jordan", "text": "And the brand still stays in control?"},
            {"speaker": "Alex", "text": "Completely. The brand defines voice, boundaries, product data, and the block library. The AI works within those constraints, optimizing for each individual."},
            {"speaker": "Jordan", "text": "So personalization is no longer about content teams producing variants manually?"},
            {"speaker": "Alex", "text": "Right. It's an infrastructure capability that scales automatically. Every visitor sees the same intent of a page, but the expression adapts for that specific person."},
            {"speaker": "Jordan", "text": "And the technology is here now. It's not theoretical."},
            {"speaker": "Alex", "text": "The technology is here. The cost structure works. The question is no longer whether one-to-one personalization is possible. It's how quickly brands will adopt it."},
            {"speaker": "Jordan", "text": "That's a pretty compelling conclusion."},
        ],
    },
]


# ── Audio Generation ──────────────────────────────────────────────────────────
def generate_dialogue_audio(dialogue: list, output_path: Path) -> None:
    """Call ElevenLabs Text-to-Dialogue API for a section's dialogue."""
    inputs = []
    for turn in dialogue:
        voice_id = VOICES.get(turn["speaker"])
        if not voice_id:
            print(f"    WARNING: No voice for '{turn['speaker']}', skipping turn")
            continue
        inputs.append({
            "text": turn["text"],
            "voice_id": voice_id,
        })

    resp = requests.post(
        DIALOGUE_URL,
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "inputs": inputs,
            "model_id": MODEL_ID,
        },
        timeout=120,
    )
    resp.raise_for_status()
    output_path.write_bytes(resp.content)
    print(f"    Generated: {output_path.name} ({len(resp.content) / 1024:.1f} KB)")


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
    print("  Generative Websites — Dialogue Generator")
    print("  Two-host conversation (Alex & Jordan)")
    print("=" * 60)

    total_duration = 0.0

    for section in SECTIONS:
        name = section["name"]
        dialogue = section["dialogue"]
        output_path = AUDIO_DIR / f"{name}.mp3"

        print(f"\n  Section: {name}")
        print(f"  Turns: {len(dialogue)}")
        print(f"  {'─' * 40}")

        generate_dialogue_audio(dialogue, output_path)

        duration = get_duration(output_path)
        total_duration += duration
        print(f"    Duration: {duration:.1f}s")

    print(f"\n{'=' * 60}")
    print(f"  All done! Total audio: {total_duration:.1f}s")
    print(f"  Files in: {AUDIO_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

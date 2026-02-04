#!/usr/bin/env python3
"""Assemble generative websites video from infographics and voiceover audio."""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    ImageClip,
    AudioFileClip,
    concatenate_videoclips,
    CompositeVideoClip,
    vfx,
)

BASE_DIR = Path(__file__).resolve().parent.parent
INFOGRAPHIC_DIR = BASE_DIR / "infographic"
AUDIO_DIR = BASE_DIR / "audio"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

WIDTH, HEIGHT = 1920, 1080
FPS = 24
CROSSFADE = 0.5

SECTIONS = [
    "01-what-are-generative-websites",
    "02-why-now-three-breakthroughs",
    "03-value-to-visitors",
    "04-the-ai-pipeline",
    "05-explicit-and-implicit",
    "06-the-shift",
]


def _find_font(bold=False):
    candidates = (
        [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial Bold.ttf",
        ]
        if bold
        else [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
        ]
    )
    for path in candidates:
        if Path(path).exists():
            return path
    return None


def _draw_centered_text(draw, text, y, font, fill, width):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def make_card_image(lines, output_path):
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(18, 18, 28))
    draw = ImageDraw.Draw(img)

    fonts = []
    heights = []
    for text, size, _color, bold in lines:
        font_path = _find_font(bold=bold)
        font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()
        fonts.append(font)
        bbox = draw.textbbox((0, 0), text, font=font)
        heights.append(bbox[3] - bbox[1])

    line_spacing = 24
    total_h = sum(heights) + line_spacing * (len(lines) - 1)
    y = (HEIGHT - total_h) // 2

    for i, (text, _size, color, _bold) in enumerate(lines):
        _draw_centered_text(draw, text, y, fonts[i], color, WIDTH)
        y += heights[i] + line_spacing

    img.save(str(output_path))
    return output_path


def generate_title_card():
    path = OUTPUT_DIR / "_title_card.png"
    make_card_image(
        [
            ("Generative Websites", 72, (255, 255, 255), True),
            ("1:1 Personalization at Web Scale", 44, (180, 180, 200), False),
        ],
        path,
    )
    return path


def generate_outro_card():
    path = OUTPUT_DIR / "_outro_card.png"
    make_card_image(
        [
            ("From one page, many visitors", 44, (140, 140, 160), False),
            ("to many pages, each for one visitor.", 48, (255, 255, 255), True),
            ("", 20, (0, 0, 0), False),
            ("The brand stays in control.", 36, (160, 160, 180), False),
            ("The AI works within its boundaries.", 36, (160, 160, 180), False),
        ],
        path,
    )
    return path


def make_image_clip(image_path, duration):
    clip = ImageClip(str(image_path)).with_duration(duration)
    w, h = clip.size
    if (w, h) != (WIDTH, HEIGHT):
        clip = clip.resized((WIDTH, HEIGHT))
    return clip


def make_section_clip(section_name):
    infographic = INFOGRAPHIC_DIR / f"{section_name}.png"
    audio_path = AUDIO_DIR / f"{section_name}.mp3"

    if not infographic.exists():
        print(f"  WARNING: Missing {infographic}")
        return None
    if not audio_path.exists():
        print(f"  WARNING: Missing {audio_path}")
        return None

    audio = AudioFileClip(str(audio_path))
    clip = make_image_clip(infographic, audio.duration).with_audio(audio)
    return clip


def main():
    print("=" * 60)
    print("  Video Assembler — Generative Websites")
    print("=" * 60)

    clips = []

    print("\n  Creating title card...")
    title_path = generate_title_card()
    title_clip = make_image_clip(title_path, 3.0).with_effects(
        [vfx.CrossFadeIn(0.5), vfx.CrossFadeOut(0.5)]
    )
    clips.append(title_clip)

    for name in SECTIONS:
        print(f"  Adding section: {name}")
        clip = make_section_clip(name)
        if clip is None:
            print(f"  SKIPPING {name} — missing files")
            continue
        clips.append(clip)

    print("  Creating outro card...")
    outro_path = generate_outro_card()
    outro_clip = make_image_clip(outro_path, 3.0).with_effects(
        [vfx.CrossFadeIn(0.5), vfx.CrossFadeOut(0.5)]
    )
    clips.append(outro_clip)

    if len(clips) < 3:
        print("\n  ERROR: Not enough clips to assemble video.")
        sys.exit(1)

    print(f"\n  Concatenating {len(clips)} clips with {CROSSFADE}s crossfade...")
    final = concatenate_videoclips(clips, padding=-CROSSFADE, method="compose")

    output_path = OUTPUT_DIR / "generative-websites.mp4"
    print(f"  Exporting to: {output_path}")
    final.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="5000k",
        audio_bitrate="192k",
        logger="bar",
    )

    title_path.unlink(missing_ok=True)
    outro_path.unlink(missing_ok=True)

    print(f"\n{'=' * 60}")
    print(f"  Done! Video: {output_path}")
    print(f"  Duration: {final.duration:.1f}s")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Assemble generative websites video from infographics and voiceover audio."""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    ImageClip,
    AudioFileClip,
    CompositeAudioClip,
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


def make_card_image(lines, output_path, bg_color=(18, 18, 28)):
    img = Image.new("RGB", (WIDTH, HEIGHT), color=bg_color)
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
            ("1:1 Personalization at Web Scale", 44, (255, 230, 230), False),
        ],
        path,
        bg_color=(235, 16, 0),
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


def load_background_music(duration, title_dur=3.0, outro_dur=3.0):
    """Load and prepare background music with volume envelope.

    Volume envelope:
    - Title card: full volume
    - Sections: 15% volume (subtle bed under dialogue)
    - Outro card: full volume, then fade out over last 1.5s
    """
    bgm_path = AUDIO_DIR / "bgm.mp3"
    if not bgm_path.exists():
        print("  No bgm.mp3 found — skipping background music")
        return None

    from moviepy import concatenate_audioclips
    from moviepy.audio.fx import MultiplyVolume, AudioFadeOut

    music = AudioFileClip(str(bgm_path))

    # Loop if shorter than video
    if music.duration < duration:
        loops = int(duration / music.duration) + 1
        music = concatenate_audioclips([music] * loops)
    music = music.subclipped(0, duration)

    # Split into three zones with different volume levels
    section_start = title_dur
    outro_start = duration - outro_dur

    title_seg = music.subclipped(0, section_start)
    body_seg = music.subclipped(section_start, outro_start).with_effects(
        [MultiplyVolume(0.15)]
    )
    outro_seg = music.subclipped(outro_start, duration).with_effects(
        [AudioFadeOut(1.5)]
    )

    return concatenate_audioclips([title_seg, body_seg, outro_seg])


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

    # Layer background music
    bgm = load_background_music(final.duration)
    if bgm is not None:
        print("  Mixing background music...")
        original_audio = final.audio
        if original_audio is not None:
            final = final.with_audio(CompositeAudioClip([original_audio, bgm]))
        else:
            final = final.with_audio(bgm)

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

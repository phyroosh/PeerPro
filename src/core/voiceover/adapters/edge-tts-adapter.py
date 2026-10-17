#!/usr/bin/env python3
"""
PeerPro Microsoft Edge Neural TTS Adapter Bridge
Provides isolated, robust execution of edge-tts for dynamic voice discovery and synthesis.
"""

import sys
import json
import argparse
import asyncio
import os

try:
    import edge_tts
except ImportError:
    sys.stderr.write(json.dumps({
        "status": "error",
        "error": "The 'edge-tts' Python package is not installed. Please install it with 'pip install edge-tts'.",
        "type": "MissingDependencyError"
    }) + "\n")
    sys.exit(2)


async def list_voices_async():
    try:
        raw_voices = await edge_tts.list_voices()
        formatted_voices = []
        for v in raw_voices:
            formatted_voices.append({
                "id": v.get("ShortName", ""),
                "displayName": v.get("FriendlyName", v.get("Name", "")),
                "locale": v.get("Locale", ""),
                "localeName": v.get("LocaleName", ""),
                "gender": v.get("Gender", "Unknown"),
                "provider": "edge-tts",
                "suggestedCodec": v.get("SuggestedCodec", ""),
                "categories": v.get("VoiceTag", {}).get("ContentCategories", []),
                "personalities": v.get("VoiceTag", {}).get("VoicePersonalities", []),
            })
        print(json.dumps(formatted_voices))
    except Exception as e:
        sys.stderr.write(json.dumps({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }) + "\n")
        sys.exit(1)


async def synthesize_async(text, voice, output_path, rate="+0%", pitch="+0Hz", volume="+0%"):
    try:
        # Ensure parent directory exists
        out_dir = os.path.dirname(os.path.abspath(output_path))
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir, exist_ok=True)

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume
        )
        await communicate.save(output_path)

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(f"Output audio file was not generated or is empty: {output_path}")

        result = {
            "status": "ok",
            "outputPath": output_path,
            "voice": voice,
            "rate": rate,
            "pitch": pitch,
            "volume": volume,
            "fileSizeBytes": os.path.getsize(output_path)
        }
        print(json.dumps(result))
    except Exception as e:
        sys.stderr.write(json.dumps({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }) + "\n")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="PeerPro Edge TTS Adapter Bridge")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: list-voices
    subparsers.add_parser("list-voices", help="List all available Edge TTS neural voices")

    # Subcommand: synthesize
    synth_parser = subparsers.add_parser("synthesize", help="Synthesize text to speech")
    synth_parser.add_argument("--text", required=True, help="Narration text")
    synth_parser.add_argument("--voice", required=True, help="Voice ShortName ID (e.g. en-US-JennyNeural)")
    synth_parser.add_argument("--out", required=True, help="Output file path (.mp3)")
    synth_parser.add_argument("--rate", default="+0%", help="Speaking rate (e.g. +0%%, -10%%, +15%%)")
    synth_parser.add_argument("--pitch", default="+0Hz", help="Speech pitch (e.g. +0Hz, -5Hz, +10Hz)")
    synth_parser.add_argument("--volume", default="+0%", help="Speech volume (e.g. +0%%, -10%%, +5%%)")

    args = parser.parse_args()

    if args.command == "list-voices":
        asyncio.run(list_voices_async())
    elif args.command == "synthesize":
        asyncio.run(synthesize_async(
            text=args.text,
            voice=args.voice,
            output_path=args.out,
            rate=args.rate,
            pitch=args.pitch,
            volume=args.volume
        ))


if __name__ == "__main__":
    main()

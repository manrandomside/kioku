#!/usr/bin/env python3
"""Generate TTS audio for MNN vocabulary and kana using edge-tts, upload to Supabase Storage."""

import argparse
import asyncio
import io
import json
import os
import sys
import tempfile
import time
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import edge_tts
import psycopg2
import urllib.request
import urllib.error

# Load env from .env.local
def load_env():
    env_path = Path(__file__).parent.parent / ".env.local"
    if not env_path.exists():
        print(f"ERROR: {env_path} not found")
        sys.exit(1)
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, value = line.partition("=")
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key.strip(), value)

load_env()

DATABASE_URL = os.environ["DATABASE_URL"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

VOICE = "ja-JP-NanamiNeural"
BUCKET = "audio"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1"


def supabase_request(method, path, data=None, content_type="application/json", file_bytes=None):
    url = f"{STORAGE_BASE}{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }
    if file_bytes is not None:
        headers["Content-Type"] = content_type
        body = file_bytes
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode()
    else:
        body = None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)


def ensure_bucket():
    status, _ = supabase_request("GET", f"/bucket/{BUCKET}")
    if status == 200:
        return
    status, body = supabase_request("POST", "/bucket", {"id": BUCKET, "name": BUCKET, "public": True})
    if status in (200, 201):
        print(f"Bucket '{BUCKET}' created (public).")
    else:
        print(f"WARNING: Failed to create bucket: {status} {body}")


def get_db():
    return psycopg2.connect(DATABASE_URL)


def get_vocabulary(chapter_number):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT v.id, v.hiragana, v.kanji, v.audio_url
        FROM vocabulary v
        JOIN chapter c ON v.chapter_id = c.id
        WHERE c.chapter_number = %s AND v.is_published = true
        ORDER BY v.sort_order ASC
    """, (chapter_number,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "hiragana": r[1], "kanji": r[2], "audio_url": r[3]} for r in rows]


def get_all_kana():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, character, romaji, audio_url
        FROM kana
        ORDER BY id ASC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "character": r[1], "romaji": r[2], "audio_url": r[3]} for r in rows]


async def generate_audio(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)


def upload_to_supabase(local_path, storage_path):
    with open(local_path, "rb") as f:
        file_bytes = f.read()
    status, body = supabase_request("POST", f"/object/{BUCKET}/{storage_path}",
                                     file_bytes=file_bytes, content_type="audio/mpeg")
    if status == 400 and "Duplicate" in body:
        status, body = supabase_request("PUT", f"/object/{BUCKET}/{storage_path}",
                                         file_bytes=file_bytes, content_type="audio/mpeg")
    if status in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
    else:
        print(f"    Upload error ({status}): {body[:200]}")
        return None


def update_db_url(table, id_val, url):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"UPDATE {table} SET audio_url = %s WHERE id = %s", (url, id_val))
    conn.commit()
    cur.close()
    conn.close()


async def process_chapter(chapter_number, skip_existing=True):
    """Process a single chapter. Returns (generated, uploaded, errors, total)."""
    vocab_list = get_vocabulary(chapter_number)
    if not vocab_list:
        return 0, 0, 0, 0

    if skip_existing:
        vocab_list = [v for v in vocab_list if not v["audio_url"]]
    if not vocab_list:
        return 0, 0, 0, 0

    total = len(vocab_list)
    generated = 0
    uploaded = 0
    errors = 0

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, vocab in enumerate(vocab_list):
            vid = vocab["id"]
            text = vocab["hiragana"]
            kanji_info = f" ({vocab['kanji']})" if vocab["kanji"] else ""
            storage_path = f"vocabulary/{chapter_number}/{vid}.mp3"
            local_path = os.path.join(tmpdir, f"{vid}.mp3")

            try:
                await generate_audio(text, local_path)
                generated += 1
            except Exception as e:
                print(f"    ERROR gen {text}{kanji_info}: {e}")
                errors += 1
                continue

            public_url = upload_to_supabase(local_path, storage_path)
            if public_url:
                uploaded += 1
                update_db_url("vocabulary", vid, public_url)
            else:
                errors += 1

            # Progress every 10 items or last item
            if (i + 1) % 10 == 0 or i + 1 == total:
                print(f"    Bab {chapter_number}: {i + 1}/{total}")

    return generated, uploaded, errors, total


async def process_kana(skip_existing=True):
    """Process all kana characters. Returns (generated, uploaded, errors, total)."""
    kana_list = get_all_kana()
    if not kana_list:
        return 0, 0, 0, 0

    if skip_existing:
        kana_list = [k for k in kana_list if not k["audio_url"]]
    if not kana_list:
        return 0, 0, 0, 0

    total = len(kana_list)
    generated = 0
    uploaded = 0
    errors = 0

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, kana in enumerate(kana_list):
            kid = kana["id"]
            text = kana["character"]
            storage_path = f"kana/{kid}.mp3"
            local_path = os.path.join(tmpdir, f"{kid}.mp3")

            try:
                await generate_audio(text, local_path)
                generated += 1
            except Exception as e:
                print(f"    ERROR gen kana '{text}' ({kana['romaji']}): {e}")
                errors += 1
                continue

            public_url = upload_to_supabase(local_path, storage_path)
            if public_url:
                uploaded += 1
                update_db_url("kana", kid, public_url)
            else:
                errors += 1

            if (i + 1) % 20 == 0 or i + 1 == total:
                print(f"    Kana: {i + 1}/{total}")

    return generated, uploaded, errors, total


async def main():
    parser = argparse.ArgumentParser(description="Generate TTS audio for MNN vocabulary and kana")
    parser.add_argument("--chapter", type=int, help="Single chapter number")
    parser.add_argument("--chapter-range", type=str, help="Chapter range, e.g. 2-50")
    parser.add_argument("--kana", action="store_true", help="Generate kana audio")
    parser.add_argument("--all", action="store_true", help="All chapters (1-50) + kana")
    parser.add_argument("--no-skip", action="store_true", help="Regenerate even if audio_url exists")
    args = parser.parse_args()

    if not args.chapter and not args.chapter_range and not args.kana and not args.all:
        parser.print_help()
        return

    skip_existing = not args.no_skip
    start_time = time.time()

    ensure_bucket()

    total_gen = 0
    total_up = 0
    total_err = 0
    total_items = 0

    # Determine chapters to process
    chapters = []
    if args.all:
        chapters = list(range(1, 51))
    elif args.chapter_range:
        lo, hi = args.chapter_range.split("-")
        chapters = list(range(int(lo), int(hi) + 1))
    elif args.chapter:
        chapters = [args.chapter]

    do_kana = args.kana or args.all

    # Process chapters
    if chapters:
        print(f"\n=== Vocabulary: Bab {chapters[0]}-{chapters[-1]} ({len(chapters)} bab) ===\n")
        for ch in chapters:
            gen, up, err, tot = await process_chapter(ch, skip_existing)
            total_gen += gen
            total_up += up
            total_err += err
            total_items += tot
            if tot > 0:
                print(f"  Bab {ch:2d}: {up}/{tot} uploaded" + (f", {err} errors" if err else ""))
            else:
                print(f"  Bab {ch:2d}: skip (sudah ada/kosong)")

        elapsed_vocab = time.time() - start_time
        print(f"\n  Vocabulary total: {total_up}/{total_items} uploaded, {total_err} errors, {elapsed_vocab:.0f}s")

    # Process kana
    if do_kana:
        print(f"\n=== Kana ===\n")
        kana_start = time.time()
        gen, up, err, tot = await process_kana(skip_existing)
        total_gen += gen
        total_up += up
        total_err += err
        total_items += tot
        kana_elapsed = time.time() - kana_start
        print(f"\n  Kana total: {up}/{tot} uploaded, {err} errors, {kana_elapsed:.0f}s")

    # Summary
    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"  SUMMARY")
    print(f"{'='*50}")
    print(f"  Total generated: {total_gen}")
    print(f"  Total uploaded:  {total_up}")
    print(f"  Total errors:    {total_err}")
    print(f"  Total time:      {elapsed:.0f}s ({elapsed/60:.1f}m)")
    print(f"{'='*50}")


if __name__ == "__main__":
    asyncio.run(main())

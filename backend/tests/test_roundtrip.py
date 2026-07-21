"""
End-to-end sanity test for the crypto + steganography core, with no FastAPI/DB
involved yet. Run directly: python3 tests/test_roundtrip.py

Generates a synthetic secret image and a synthetic cover video (since no real
video is available in this sandbox), then runs the full pipeline:

    image -> AES-256 encrypt -> LSB-embed into video -> extract -> AES decrypt
        -> compare bytes + SHA-256 to the original image
"""

import os
import sys
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
import numpy as np

from encryption.aes_encrypt import encrypt_bytes, key_to_hex
from encryption.aes_decrypt import decrypt_image
from steganography.embed import embed_data_in_video, get_video_capacity_bits
from steganography.extract import extract_data_from_video

WORKDIR = os.path.dirname(os.path.abspath(__file__))
SECRET_IMAGE = os.path.join(WORKDIR, "sample_secret.png")
COVER_VIDEO = os.path.join(WORKDIR, "sample_cover.avi")
STEGO_VIDEO = os.path.join(WORKDIR, "sample_stego.avi")
RECOVERED_IMAGE = os.path.join(WORKDIR, "sample_recovered.png")


def make_sample_image(path, w=160, h=120):
    """A synthetic 'secret' image with a gradient + noise so it's not trivially empty."""
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            img[y, x] = [(x * 255) // w, (y * 255) // h, 128]
    rng = np.random.default_rng(42)
    noise = rng.integers(0, 40, size=img.shape, dtype=np.uint8)
    img = cv2.add(img, noise)
    cv2.imwrite(path, img)


def make_sample_cover_video(path, w=320, h=240, frames=90, fps=30):
    """A synthetic cover video with enough capacity for the secret image payload."""
    fourcc = cv2.VideoWriter_fourcc(*"FFV1")
    out = cv2.VideoWriter(path, fourcc, fps, (w, h))
    if not out.isOpened():
        raise RuntimeError("Could not open FFV1 VideoWriter for the cover video")
    rng = np.random.default_rng(7)
    for i in range(frames):
        frame = rng.integers(0, 255, size=(h, w, 3), dtype=np.uint8)
        # add a moving shape so it visually resembles real footage
        cv2.circle(frame, (int(w / 2 + 50 * np.sin(i / 10)), int(h / 2)), 20, (0, 0, 255), -1)
        out.write(frame)
    out.release()


def main():
    print("1. Generating synthetic secret image and cover video...")
    make_sample_image(SECRET_IMAGE)
    make_sample_cover_video(COVER_VIDEO)

    cap_info = get_video_capacity_bits(COVER_VIDEO)
    secret_size = os.path.getsize(SECRET_IMAGE)
    print(f"   Secret image: {secret_size} bytes")
    print(f"   Cover video capacity: {cap_info['capacity_bytes']} bytes "
          f"({cap_info['frame_count']} frames @ {cap_info['width']}x{cap_info['height']})")

    print("2. AES-256 encrypting the secret image...")
    enc = encrypt_bytes(open(SECRET_IMAGE, "rb").read())
    key = enc["key"]
    iv = enc["iv"]
    sha256_hex = enc["sha256"]
    print(f"   Key (hex): {key_to_hex(key)}")
    print(f"   Ciphertext size: {len(enc['encrypted_data'])} bytes")
    print(f"   SHA-256 of original: {sha256_hex}")

    print("3. Embedding encrypted image into cover video (LSB)...")
    embed_result = embed_data_in_video(
        COVER_VIDEO, iv, sha256_hex, enc["encrypted_data"], STEGO_VIDEO
    )
    print(f"   Embedded {embed_result['bytes_embedded']} bytes across "
          f"{embed_result['frames_used']}/{embed_result['total_frames']} frames")
    print(f"   Stego video size: {os.path.getsize(STEGO_VIDEO)} bytes")

    print("4. Extracting hidden payload from stego video...")
    extracted = extract_data_from_video(STEGO_VIDEO)
    assert extracted["iv"] == iv, "IV mismatch after extraction!"
    assert extracted["sha256"] == sha256_hex, "SHA-256 header mismatch after extraction!"
    assert extracted["encrypted_data"] == enc["encrypted_data"], "Ciphertext mismatch after extraction!"
    print("   Extracted IV, SHA-256 header, and ciphertext all match what was embedded.")

    print("5. AES decrypting recovered ciphertext...")
    result = decrypt_image(extracted["encrypted_data"], key, extracted["iv"],
                            expected_sha256_hex=extracted["sha256"])
    with open(RECOVERED_IMAGE, "wb") as f:
        f.write(result["data"])

    original_bytes = open(SECRET_IMAGE, "rb").read()
    bytes_match = result["data"] == original_bytes
    recovered_sha256 = hashlib.sha256(result["data"]).hexdigest()

    print(f"   Integrity check (SHA-256 verify): {result['integrity_ok']}")
    print(f"   Recovered bytes == original bytes: {bytes_match}")
    print(f"   Recovered SHA-256: {recovered_sha256}")

    assert result["integrity_ok"] is True
    assert bytes_match, "Recovered image bytes do not match the original!"

    print("\nROUND TRIP PASSED: image -> AES encrypt -> LSB embed -> extract -> AES decrypt "
          "reproduced the original image exactly, with integrity verified.")


if __name__ == "__main__":
    main()

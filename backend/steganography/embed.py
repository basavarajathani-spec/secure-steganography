"""
LSB (Least Significant Bit) video steganography - embedding.

IMPORTANT: this writes the output with the FFV1 *lossless* codec into an
.avi container. Standard delivery codecs (H.264/MP4 etc.) are lossy and will
destroy LSB data on re-compression, so the "stego video" this produces is
not meant to be re-compressed or re-encoded downstream - treat it as a
lossless archival/transport format between encrypt and decrypt.

One bit is hidden per color channel (B, G, R) of every pixel, in raster
order, spanning as many frames as needed.
"""

import cv2
import numpy as np

from .payload import build_payload, HEADER_BITS


def _bytes_to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def get_video_capacity_bits(video_path: str) -> dict:
    """Return capacity info (in bits/bytes) for a given cover video."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cap.release()

    capacity_bits_per_frame = width * height * 3
    capacity_bits = capacity_bits_per_frame * frame_count
    return {
        "width": width,
        "height": height,
        "frame_count": frame_count,
        "fps": fps,
        "capacity_bits": capacity_bits,
        "capacity_bytes": capacity_bits // 8,
    }


def embed_data_in_video(video_path: str, iv: bytes, sha256_hex: str,
                         encrypted_data: bytes, output_path: str) -> dict:
    """
    Embed AES-encrypted image data into a cover video using LSB steganography.

    Raises ValueError if the cover video doesn't have enough capacity.
    Returns stats about the embedding operation.
    """
    payload = build_payload(iv, sha256_hex, encrypted_data)
    bits = _bytes_to_bits(payload)
    total_bits = len(bits)
    assert total_bits >= HEADER_BITS  # sanity check on payload.py framing

    info = get_video_capacity_bits(video_path)
    if total_bits > info["capacity_bits"]:
        raise ValueError(
            f"Cover video too small for this payload: need {total_bits} bits "
            f"({-(-total_bits // 8)} bytes), video capacity is "
            f"{info['capacity_bits']} bits ({info['capacity_bytes']} bytes) "
            f"across {info['frame_count']} frames at {info['width']}x{info['height']}. "
            f"Use a longer/larger-resolution cover video."
        )

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fourcc = cv2.VideoWriter_fourcc(*"FFV1")
    out = cv2.VideoWriter(output_path, fourcc, info["fps"], (info["width"], info["height"]))
    if not out.isOpened():
        cap.release()
        raise RuntimeError(
            "Failed to open lossless FFV1 VideoWriter. This OpenCV build may lack "
            "FFmpeg support for FFV1 - install a full opencv-python (not headless-only "
            "minimal) build with FFmpeg, or fall back to a PNG-frame-sequence approach."
        )

    bit_idx = 0
    frames_touched = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if bit_idx < total_bits:
            flat = frame.reshape(-1)
            n = min(total_bits - bit_idx, flat.size)
            flat[:n] = (flat[:n] & 0xFE) | bits[bit_idx:bit_idx + n]
            bit_idx += n
            frames_touched += 1
        out.write(frame)

    cap.release()
    out.release()

    return {
        "output_path": output_path,
        "bits_embedded": total_bits,
        "bytes_embedded": len(payload),
        "frames_used": frames_touched,
        "total_frames": info["frame_count"],
    }

"""
LSB video steganography - extraction.
Reads the same lossless stego video produced by embed.py and recovers the
AES-encrypted payload (IV, expected SHA-256, ciphertext).
"""

import cv2
import numpy as np

from .payload import parse_header, MAGIC, HEADER_SIZE, HEADER_BITS


class _BitReader:
    """Pulls LSBs frame-by-frame from a video, buffering as needed so callers
    can request an arbitrary number of bits without worrying about frame
    boundaries."""

    def __init__(self, video_path: str):
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        self._buffer = []

    def read_bits(self, n: int) -> np.ndarray:
        while len(self._buffer) < n:
            ret, frame = self.cap.read()
            if not ret:
                raise ValueError(
                    "Video ended before the expected payload could be fully read - "
                    "this is either not a stego video or the file was truncated/re-encoded."
                )
            self._buffer.extend((frame.reshape(-1) & 1).tolist())
        bits = np.array(self._buffer[:n], dtype=np.uint8)
        del self._buffer[:n]
        return bits

    def close(self):
        self.cap.release()


def extract_data_from_video(stego_video_path: str) -> dict:
    """
    Extract the hidden AES-encrypted payload from a stego video.
    Returns {"encrypted_data": bytes, "iv": bytes, "sha256": hex str}.
    """
    reader = _BitReader(stego_video_path)
    try:
        header_bits = reader.read_bits(HEADER_BITS)
        header_bytes = np.packbits(header_bits).tobytes()[:HEADER_SIZE]
        header = parse_header(header_bytes)  # raises ValueError on bad magic

        data_bits_needed = header["data_len"] * 8
        data_bits = reader.read_bits(data_bits_needed)
        encrypted_data = np.packbits(data_bits).tobytes()
    finally:
        reader.close()

    return {
        "encrypted_data": encrypted_data,
        "iv": header["iv"],
        "sha256": header["sha256"],
    }

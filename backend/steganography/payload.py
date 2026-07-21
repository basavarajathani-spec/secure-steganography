"""
Shared payload framing for LSB video steganography.

Wire format (all fields concatenated, then bit-packed into video LSBs):

    MAGIC     4 bytes   b'STEG'
    IV        16 bytes  AES CBC IV
    SHA256    32 bytes  SHA-256 of the *original plaintext* image (raw digest)
    DATA_LEN  4 bytes   big-endian uint32, length of AES ciphertext in bytes
    DATA      variable  AES ciphertext (the encrypted image)

Header size is fixed at 56 bytes (448 bits), so the extractor always knows
exactly how many bits to read before it can compute how many more bits (DATA)
to read.
"""

import struct

MAGIC = b"STEG"
HEADER_SIZE = 4 + 16 + 32 + 4  # = 56 bytes
HEADER_BITS = HEADER_SIZE * 8


def build_payload(iv: bytes, sha256_hex: str, encrypted_data: bytes) -> bytes:
    if len(iv) != 16:
        raise ValueError(f"IV must be 16 bytes, got {len(iv)}")
    sha256_raw = bytes.fromhex(sha256_hex)
    if len(sha256_raw) != 32:
        raise ValueError("sha256_hex must decode to 32 bytes")

    header = MAGIC + iv + sha256_raw + struct.pack(">I", len(encrypted_data))
    return header + encrypted_data


def parse_header(header_bytes: bytes) -> dict:
    if len(header_bytes) != HEADER_SIZE:
        raise ValueError(f"Header must be exactly {HEADER_SIZE} bytes, got {len(header_bytes)}")
    magic = header_bytes[0:4]
    if magic != MAGIC:
        raise ValueError(
            "No valid steganography payload found in this video "
            "(magic bytes mismatch - wrong video or not a stego file)"
        )
    iv = header_bytes[4:20]
    sha256_raw = header_bytes[20:52]
    data_len = struct.unpack(">I", header_bytes[52:56])[0]
    return {"iv": iv, "sha256": sha256_raw.hex(), "data_len": data_len}

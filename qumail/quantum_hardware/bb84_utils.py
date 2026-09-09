import random
import hashlib


def generate_bits(n):
    """
    Generate n random classical bits for Alice.
    """
    return [
        random.randint(0, 1)
        for _ in range(n)
    ]


def generate_bases(n):
    """
    Generate n random BB84 bases.

    '+' = computational/Z basis
    'x' = diagonal/X basis
    """
    return [
        random.choice(["+", "x"])
        for _ in range(n)
    ]


def sift_key(alice_bits, alice_bases, bob_bases, bob_results):
    """
    Perform BB84 basis sifting.

    Only positions where Alice and Bob selected
    the same basis are retained.
    """

    alice_key = []
    bob_key = []

    for i in range(len(alice_bits)):

        if alice_bases[i] == bob_bases[i]:

            alice_key.append(
                alice_bits[i]
            )

            bob_key.append(
                bob_results[i]
            )

    return alice_key, bob_key


def derive_aes_key(shared_bits):
    """
    Derive a 256-bit AES key from the
    sifted BB84 shared key using SHA-256.
    """

    if not shared_bits:
        raise ValueError(
            "No shared BB84 key bits available."
        )

    bit_string = "".join(
        map(str, shared_bits)
    )

    return hashlib.sha256(
        bit_string.encode()
    ).digest()
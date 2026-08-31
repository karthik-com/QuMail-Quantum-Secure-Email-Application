import random
import hashlib
import uuid

from Crypto.Cipher import AES


# Step 1: Generate bits
def generate_bits(n):
    return [random.randint(0, 1) for _ in range(n)]


# Step 2: Generate bases
def generate_bases(n):
    return [random.choice(['+', 'x']) for _ in range(n)]


# Step 3: Simulate measurement
def measure(bits, alice_bases, bob_bases):

    measured = []

    for i in range(len(bits)):

        if alice_bases[i] == bob_bases[i]:
            measured.append(bits[i])

        else:
            measured.append(random.randint(0, 1))

    return measured


# Step 4: Extract shared key
def extract_key(bits, alice_bases, bob_bases):

    key = []

    for i in range(len(bits)):

        if alice_bases[i] == bob_bases[i]:
            key.append(bits[i])

    return key


# Step 5: Convert shared bits to AES key
def derive_aes_key(shared_bits):

    bit_string = ''.join(map(str, shared_bits))

    return hashlib.sha256(bit_string.encode()).digest()


# 🔐 ENCRYPTION
def encrypt_message(message):

    n = 256

    # QKD Simulation
    alice_bits = generate_bits(n)
    alice_bases = generate_bases(n)
    bob_bases = generate_bases(n)

    measured_bits = measure(
        alice_bits,
        alice_bases,
        bob_bases
    )

    shared_key_bits = extract_key(
        measured_bits,
        alice_bases,
        bob_bases
    )

    # 🔥 IMPORTANT FIX
    if len(shared_key_bits) == 0:
        shared_key_bits = generate_bits(128)

    # AES Key
    key = derive_aes_key(shared_key_bits)

    # AES Encryption
    cipher = AES.new(key, AES.MODE_GCM)

    ciphertext, tag = cipher.encrypt_and_digest(
        message.encode()
    )

    return {

        "encrypted": ciphertext.hex(),

        "iv": cipher.nonce.hex(),

        "auth_tag": tag.hex(),

        "key_id": str(uuid.uuid4()),

        "key": key.hex()   # 🔥 IMPORTANT
    }

from Crypto.Cipher import AES

def encrypt_file(file_data, key):

    cipher = AES.new(key, AES.MODE_GCM)

    ciphertext, tag = cipher.encrypt_and_digest(
        file_data
    )

    return {
        "encrypted_file": ciphertext,
        "iv": cipher.nonce,
        "tag": tag
    }


def decrypt_file(
    encrypted_data,
    iv,
    tag,
    key
):

    cipher = AES.new(
        key,
        AES.MODE_GCM,
        nonce=iv
    )

    decrypted_data = cipher.decrypt_and_verify(
        encrypted_data,
        tag
    )

    return decrypted_data

# 🔓 DECRYPTION
def decrypt_message(
    encrypted_hex,
    iv_hex,
    tag_hex,
    key_hex
):

    key = bytes.fromhex(key_hex)

    ciphertext = bytes.fromhex(encrypted_hex)

    iv = bytes.fromhex(iv_hex)

    tag = bytes.fromhex(tag_hex)

    cipher = AES.new(
        key,
        AES.MODE_GCM,
        nonce=iv
    )

    decrypted = cipher.decrypt_and_verify(
        ciphertext,
        tag
    )

    return decrypted.decode()
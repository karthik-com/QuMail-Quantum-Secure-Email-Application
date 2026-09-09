

import random
import hashlib
import uuid

from Crypto.Cipher import AES

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


# ============================================================
# QKD - BB84 USING QISKIT
# ============================================================

# Step 1: Generate Alice's random bits
def generate_bits(n):
    return [random.randint(0, 1) for _ in range(n)]


# Step 2: Generate random bases
# + = computational/Z basis
# x = Hadamard/X basis
def generate_bases(n):
    return [random.choice(['+', 'x']) for _ in range(n)]


# Step 3: Prepare Alice's quantum states using Qiskit
def prepare_quantum_state(bit, basis):

    qc = QuantumCircuit(1, 1)

    # Encode bit
    if bit == 1:
        qc.x(0)

    # Encode X basis
    if basis == 'x':
        qc.h(0)

    return qc


# Step 4: Bob measures using his selected basis
def measure_qubit(qc, bob_basis):

    # If Bob uses X basis, apply H before
    # measurement to rotate back to Z basis
    if bob_basis == 'x':
        qc.h(0)

    qc.measure(0, 0)

    simulator = AerSimulator()

    result = simulator.run(
        qc,
        shots=1
    ).result()

    counts = result.get_counts()

    measured_bit = int(
        list(counts.keys())[0]
    )

    return measured_bit


# Step 5: Perform BB84 measurement
def qiskit_measure(
    alice_bits,
    alice_bases,
    bob_bases
):

    bob_results = []

    for i in range(len(alice_bits)):

        # Alice prepares one quantum state
        qc = prepare_quantum_state(
            alice_bits[i],
            alice_bases[i]
        )

        # Bob measures it
        measured_bit = measure_qubit(
            qc,
            bob_bases[i]
        )

        bob_results.append(measured_bit)

    return bob_results


# Step 6: Extract sifted key
def extract_key(
    bob_bits,
    alice_bases,
    bob_bases
):

    key = []

    for i in range(len(bob_bits)):

        if alice_bases[i] == bob_bases[i]:

            key.append(bob_bits[i])

    return key


# Step 7: Convert QKD bits into AES key
def derive_aes_key(shared_bits):

    bit_string = ''.join(
        map(str, shared_bits)
    )

    return hashlib.sha256(
        bit_string.encode()
    ).digest()



def encrypt_message(message):

    n = 256

    # ==========================================
    # QKD / BB84
    # ==========================================

    # Alice generates random bits
    alice_bits = generate_bits(n)

    # Alice chooses random bases
    alice_bases = generate_bases(n)

    # Bob chooses random bases
    bob_bases = generate_bases(n)

    # Qiskit performs quantum preparation
    # and Bob's measurement
    measured_bits = qiskit_measure(
        alice_bits,
        alice_bases,
        bob_bases
    )

    # Keep only positions where
    # Alice and Bob used the same basis
    shared_key_bits = extract_key(
        measured_bits,
        alice_bases,
        bob_bases
    )

    # Safety check
    
    if len(shared_key_bits) == 0:
        raise ValueError(
        "BB84 key generation failed: no shared key bits available."
    )

    # ==========================================
    # Convert QKD key to AES key
    # ==========================================

    key = derive_aes_key(
        shared_key_bits
    )

    # ==========================================
    # AES-GCM Encryption
    # ==========================================

    cipher = AES.new(
        key,
        AES.MODE_GCM
    )

    ciphertext, tag = cipher.encrypt_and_digest(
        message.encode()
    )

    return {

        "encrypted":
            ciphertext.hex(),

        "iv":
            cipher.nonce.hex(),

        "auth_tag":
            tag.hex(),

        "key_id":
            str(uuid.uuid4()),

        "key":
            key.hex()
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


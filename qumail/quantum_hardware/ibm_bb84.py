from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import (
    QiskitRuntimeService,
    SamplerV2
)

from quantum_hardware.bb84_utils import (
    generate_bits,
    generate_bases,
    sift_key,
    derive_aes_key
)


# ============================================================
# CONFIGURATION
# ============================================================

N = 8

IBM_INSTANCE = "qumail-instance"


# ============================================================
# IBM QUANTUM BB84
# ============================================================

def run_ibm_bb84():

    print("=" * 60)
    print("        QUMAIL - IBM QUANTUM BB84 DEMONSTRATION")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. CONNECT TO IBM QUANTUM
    # --------------------------------------------------------

    print("\nConnecting to IBM Quantum...")

    service = QiskitRuntimeService(
        instance=IBM_INSTANCE
    )

    print("Connected successfully.")

    # --------------------------------------------------------
    # 2. SELECT IBM QUANTUM BACKEND
    # --------------------------------------------------------

    print("\nSelecting IBM Quantum backend...")

    backend = service.least_busy(
        simulator=False,
        operational=True
    )

    print("Selected backend:")
    print(backend.name)

    # --------------------------------------------------------
    # 3. GENERATE BB84 PARAMETERS
    # --------------------------------------------------------

    print(f"\nNumber of BB84 bits: {N}")

    alice_bits = generate_bits(N)

    alice_bases = generate_bases(N)

    bob_bases = generate_bases(N)

    print("\nAlice bits:")
    print(alice_bits)

    print("\nAlice bases:")
    print(alice_bases)

    print("\nBob bases:")
    print(bob_bases)

    # --------------------------------------------------------
    # 4. CREATE BB84 QUANTUM CIRCUITS
    # --------------------------------------------------------

    print("\nCreating BB84 quantum circuits...")

    circuits = []

    for i in range(N):

        qc = QuantumCircuit(1)

        # Alice encodes the bit
        if alice_bits[i] == 1:
            qc.x(0)

        # Alice selects X basis
        if alice_bases[i] == "x":
            qc.h(0)

        # Bob selects X basis
        if bob_bases[i] == "x":
            qc.h(0)

        # Bob measures
        qc.measure_all()

        circuits.append(qc)

    print(
        f"Created {len(circuits)} BB84 circuits."
    )

    # --------------------------------------------------------
    # 5. TRANSPile FOR IBM HARDWARE
    # --------------------------------------------------------

    print("\nTranspiling circuits for IBM hardware...")

    isa_circuits = [
        transpile(
            qc,
            backend=backend
        )
        for qc in circuits
    ]

    print("Transpilation completed.")

    # --------------------------------------------------------
    # 6. SUBMIT CIRCUITS
    # --------------------------------------------------------

    print("\nSubmitting BB84 circuits to IBM Quantum...")

    sampler = SamplerV2(
        mode=backend
    )

    job = sampler.run(
        isa_circuits,
        shots=1
    )

    print("Job submitted.")

    job_id = job.job_id()

    print("Job ID:")
    print(job_id)

    # --------------------------------------------------------
    # 7. WAIT FOR RESULT
    # --------------------------------------------------------

    print("\nWaiting for IBM Quantum result...")

    result = job.result()

    print("Job completed successfully.")

    # --------------------------------------------------------
    # 8. EXTRACT BOB RESULTS
    # --------------------------------------------------------

    print("\nExtracting Bob's measurement results...")

    bob_results = []

    for i in range(N):

        pub_result = result[i]

        counts = (
            pub_result
            .data
            .meas
            .get_counts()
        )

        measured_string = list(
            counts.keys()
        )[0]

        measured_bit = int(
            measured_string[-1]
        )

        bob_results.append(
            measured_bit
        )

    print("\nBob measurement results:")
    print(bob_results)

    # --------------------------------------------------------
    # 9. BB84 BASIS SIFTING
    # --------------------------------------------------------

    print("\nBB84 Sifting:")
    print("-" * 70)

    print(
        f"{'Pos':<6}"
        f"{'Alice Bit':<12}"
        f"{'Alice Basis':<14}"
        f"{'Bob Basis':<12}"
        f"{'Bob Result':<12}"
        f"{'Keep':<8}"
    )

    print("-" * 70)

    for i in range(N):

        keep = (
            alice_bases[i]
            == bob_bases[i]
        )

        print(
            f"{i:<6}"
            f"{alice_bits[i]:<12}"
            f"{alice_bases[i]:<14}"
            f"{bob_bases[i]:<12}"
            f"{bob_results[i]:<12}"
            f"{'YES' if keep else 'NO':<8}"
        )

    print("-" * 70)

    # --------------------------------------------------------
    # 10. GENERATE SIFTED KEYS
    # --------------------------------------------------------

    alice_sifted_key, bob_sifted_key = sift_key(
        alice_bits,
        alice_bases,
        bob_bases,
        bob_results
    )

    print("\nAlice's sifted key:")
    print(alice_sifted_key)

    print("\nBob's sifted key:")
    print(bob_sifted_key)

    # --------------------------------------------------------
    # 11. VERIFY KEY AGREEMENT
    # --------------------------------------------------------

    key_agreement = (
        alice_sifted_key
        == bob_sifted_key
    )

    print("\nKey agreement:")

    if key_agreement:

        print(
            "SUCCESS - Alice and Bob obtained "
            "the same sifted key."
        )

    else:

        print(
            "WARNING - Alice and Bob's sifted "
            "keys do not completely match."
        )

    # --------------------------------------------------------
    # 12. DERIVE AES KEY
    # --------------------------------------------------------

    if not bob_sifted_key:

        raise ValueError(
            "BB84 failed: no shared key bits were generated."
        )

    print("\nDeriving AES-256 key...")

    aes_key = derive_aes_key(
        bob_sifted_key
    )

    print("\nShared BB84 key:")
    print(
        "".join(
            map(str, bob_sifted_key)
        )
    )

    print("\nDerived AES-256 key:")
    print(
        aes_key.hex()
    )

    print("\nAES key length:")
    print(
        len(aes_key) * 8,
        "bits"
    )

    # --------------------------------------------------------
    # 13. RETURN STRUCTURED RESULT
    # --------------------------------------------------------

    print("\n" + "=" * 60)

    print(
        "IBM Quantum BB84 experiment completed."
    )

    print("=" * 60)

    return {
        "backend": backend.name,
        "job_id": job_id,
        "alice_bits": alice_bits,
        "alice_bases": alice_bases,
        "bob_bases": bob_bases,
        "bob_results": bob_results,
        "alice_sifted_key": alice_sifted_key,
        "bob_sifted_key": bob_sifted_key,
        "key_agreement": key_agreement,
        "aes_key": aes_key.hex(),
        "aes_key_length": len(aes_key) * 8,
    }


# ============================================================
# STANDALONE EXECUTION
# ============================================================

if __name__ == "__main__":

    run_ibm_bb84()
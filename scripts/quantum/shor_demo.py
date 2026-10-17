"""Small, local Shor order-finding experiment. No IBM account or real keys.

Reference: https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm
Unlike a circuit specialized to known factors, the modular multiplication
permutation is constructed from N and a. Dense unitaries are educational and
exponential in size; this implementation deliberately caps N at 31.
"""
import argparse
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
from math import gcd
from pathlib import Path
import platform
import secrets

import numpy as np
import qiskit
from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister
from qiskit.circuit.library import QFTGate, UnitaryGate
from qiskit.primitives import StatevectorSampler


def modular_multiply(multiplier, number):
    """Permutation |x> -> |a*x mod N>, identity outside the residue space."""
    if gcd(multiplier, number) != 1:
        raise ValueError('The modular multiplier must be coprime to N')
    size = 1 << (number - 1).bit_length()
    matrix = np.zeros((size, size), dtype=complex)
    for value in range(size):
        target = multiplier * value % number if value < number else value
        matrix[target, value] = 1
    return matrix


def run_experiment(number=15, base=2, shots=4096, seed=None):
    if not (3 < number <= 31 and number % 2 and 1 < base < number):
        raise ValueError('Educational odd integers only: 5 <= N <= 31')
    if gcd(base, number) != 1 or not (64 <= shots <= 65536):
        raise ValueError('Use a coprime base and 64..65536 shots')
    seed = secrets.randbits(32) if seed is None else seed
    work_bits = (number - 1).bit_length()
    phase_bits = 2 * work_bits
    phase = QuantumRegister(phase_bits, 'phase')
    work = QuantumRegister(work_bits, 'work')
    measured = ClassicalRegister(phase_bits, 'measured')
    circuit = QuantumCircuit(phase, work, measured)
    circuit.x(work[0])
    circuit.h(phase)
    powers = []
    for bit in range(phase_bits):
        multiplier = pow(base, 1 << bit, number)
        powers.append(multiplier)
        if multiplier != 1:
            controlled = UnitaryGate(modular_multiply(multiplier, number), label=f'x{multiplier} mod {number}').control(1)
            circuit.append(controlled, [phase[bit], *work])
    circuit.append(QFTGate(phase_bits).inverse(), phase)
    circuit.measure(phase, measured)
    sampler = StatevectorSampler(seed=seed)
    counts = dict(sorted(sampler.run([circuit], shots=shots).result()[0].data.measured.get_counts().items()))
    postprocessing = []
    factors = None
    order = None
    for bitstring, count in counts.items():
        value = int(bitstring, 2)
        rational = Fraction(value, 1 << phase_bits).limit_denominator(number)
        row = {'bitstring': bitstring, 'count': count, 'phase': value / (1 << phase_bits), 'fraction': str(rational), 'candidateOrder': None, 'factors': None}
        if value:
            denominator = rational.denominator
            for multiple in range(1, number // denominator + 1):
                candidate = denominator * multiple
                if candidate % 2 or pow(base, candidate, number) != 1:
                    continue
                middle = pow(base, candidate // 2, number)
                left, right = gcd(middle - 1, number), gcd(middle + 1, number)
                row['candidateOrder'] = candidate
                if 1 < left < number and 1 < right < number and left * right == number:
                    row['factors'] = sorted([left, right])
                    factors, order = row['factors'], candidate
                    break
        postprocessing.append(row)
    if factors is None:
        raise ValueError('No nontrivial factors recovered from measured phases; try another base/seed')
    # RSA miniature, only when the recovered factors are distinct primes.
    is_prime = lambda n: n > 1 and all(n % divisor for divisor in range(2, int(n ** 0.5) + 1))
    toy_rsa = None
    if factors[0] != factors[1] and all(is_prime(n) for n in factors):
        phi = (factors[0] - 1) * (factors[1] - 1)
        exponent = next(e for e in range(3, phi, 2) if gcd(e, phi) == 1)
        private_exponent = pow(exponent, -1, phi)
        encrypted = pow(2, exponent, number)
        toy_rsa = {'message': 2, 'publicExponent': exponent, 'recoveredPrivateExponent': private_exponent, 'ciphertext': encrypted, 'recoveredMessage': pow(encrypted, private_exponent, number)}
    return {
        'schemaVersion': 1, 'algorithm': 'Shor order finding + classical postprocessing',
        'execution': 'local-statevector-simulator', 'quantumHardware': False,
        'generatedAt': datetime.now(timezone.utc).isoformat(), 'qiskitVersion': qiskit.__version__, 'pythonVersion': platform.python_version(),
        'number': number, 'base': base, 'shots': shots, 'seed': seed,
        'phaseQubits': phase_bits, 'workQubits': work_bits, 'totalQubits': circuit.num_qubits,
        'logicalCircuitDepth': circuit.depth(), 'powers': powers, 'counts': counts,
        'postprocessing': postprocessing, 'factors': factors, 'order': order, 'toyRsa': toy_rsa,
        'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'circuitText': str(circuit.draw(output='text', fold=100)),
        'limitations': ['Ideal local simulation, not IBM quantum hardware', 'Toy factorization, not an attack on production RSA or Ed25519', 'Dense-unitary implementation is not scalable', 'This circuit does not test or prove ML-KEM/ML-DSA security'],
        'reference': 'https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--number', type=int, default=15)
    parser.add_argument('--base', type=int, default=2)
    parser.add_argument('--shots', type=int, default=4096)
    parser.add_argument('--seed', type=int)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run_experiment(args.number, args.base, args.shots, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ['execution', 'number', 'base', 'shots', 'seed', 'totalQubits', 'counts', 'order', 'factors', 'toyRsa']}, indent=2))

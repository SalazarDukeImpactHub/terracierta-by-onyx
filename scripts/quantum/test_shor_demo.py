"""Tests offline: no IBM account, credentials or real cryptographic keys."""
import unittest
import numpy as np
from shor_demo import modular_multiply, run_experiment


class ShorDemoTest(unittest.TestCase):
    def test_operator_is_unitary_and_computed_from_input(self):
        matrix = modular_multiply(2, 15)
        np.testing.assert_allclose(matrix.conj().T @ matrix, np.eye(16))
        self.assertEqual(int(np.argmax(matrix[:, 7])), 14)

    def test_factorization_comes_from_measured_phases(self):
        result = run_experiment(15, 2, shots=1024, seed=43)
        self.assertEqual(sum(result['counts'].values()), 1024)
        self.assertEqual(result['factors'], [3, 5])
        self.assertEqual(result['order'], 4)
        self.assertTrue(any(row['candidateOrder'] == 4 for row in result['postprocessing']))
        self.assertEqual(result['execution'], 'local-statevector-simulator')
        self.assertFalse(result['quantumHardware'])
        self.assertEqual(result['toyRsa']['recoveredMessage'], result['toyRsa']['message'])

    def test_prime_or_non_coprime_inputs_are_rejected(self):
        for number, base in [(13, 2), (15, 3), (2048, 2)]:
            with self.assertRaises(ValueError):
                run_experiment(number, base, shots=64, seed=1)


if __name__ == '__main__':
    unittest.main()

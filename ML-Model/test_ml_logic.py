import pytest
from predict import preprocess_text, fix_spelling, normalize, softmax
import numpy as np

def test_normalize():
    assert normalize("  TeSt  ") == "test"
    assert normalize(None) == ""

def test_softmax():
    scores = np.array([0.5, 0.3, 0.1])
    probs = softmax(scores)
    assert np.isclose(np.sum(probs), 1.0)
    assert probs[0] > probs[1] > probs[2]

def test_preprocess():
    assert "fever" in preprocess_text("high temperature")
    assert "headache" in preprocess_text("cephalgia")

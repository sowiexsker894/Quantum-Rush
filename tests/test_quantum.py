"""Pruebas del motor cuántico: verifican la física que enseña cada nivel."""
import math

import pytest

from quantum_rush.quantum import balance, l2_data, l3_data, swap_test, vqc_eval, vqc_train
from quantum_rush.quantum.level2_swap_test import L2_FIRST_GRAY, L2_HEALTHY, fidelity

BLIND_PARAMS = [1.6, 1.6, 0.9, -0.9]


# ---------- Nivel 1 ----------

def test_hadamard_gives_50_50():
    r = balance([{"gate": "h", "q": 0}])
    assert r["theory"] == {"A": 0.5, "B": 0.5}
    assert sum(r["counts"].values()) == r["shots"]


def test_ry_53_degrees_gives_80_20():
    r = balance([{"gate": "ry", "q": 0, "theta": math.radians(53)}])
    assert r["theory"]["A"] == pytest.approx(0.8, abs=0.01)


def test_unknown_gate_is_rejected():
    with pytest.raises(ValueError):
        balance([{"gate": "magia", "q": 0}])


# ---------- Nivel 2 ----------

def test_swap_test_identical_states_reads_100():
    p = {"x": 0.3, "y": 0.7}
    assert swap_test(["h", "cswap", "h"], p, p)["theory"] == pytest.approx(1.0)


def test_swap_test_matches_fidelity_formula():
    r = swap_test(["h", "cswap", "h"], L2_HEALTHY, L2_FIRST_GRAY)
    assert r["theory"] == pytest.approx((1 + fidelity(L2_HEALTHY, L2_FIRST_GRAY)) / 2, abs=1e-3)
    assert r["theory"] < 0.55  # el primer escuadrón gris es "totalmente distinto": exhausto


@pytest.mark.parametrize("gates, expected", [(["cswap"], 1.0), (["h", "cswap"], 0.5)])
def test_wrong_radar_gives_meaningless_reading(gates, expected):
    assert swap_test(gates, L2_HEALTHY, L2_FIRST_GRAY)["theory"] == pytest.approx(expected)


def test_each_gray_has_three_nearest_neighbours():
    for gray in l2_data()["grays"]:
        assert len(gray["nearest"]) == 3
        assert gray["label"] in (0, 1)


# ---------- Nivel 3 ----------

def test_untrained_model_is_not_good_enough():
    assert vqc_eval(["ry", "rx", "cx"], BLIND_PARAMS)["accuracy"] < 0.9


def test_training_reaches_goal():
    history = vqc_train(["ry", "rx", "cx"], BLIND_PARAMS)["history"]
    assert history[-1]["accuracy"] >= 0.9
    assert history[-1]["loss"] < history[0]["loss"]


def test_decision_grid_has_one_value_per_cell():
    n = l3_data()["grid_n"]
    assert len(vqc_eval(["ry", "rx", "cx"], BLIND_PARAMS)["grid"]) == n * n

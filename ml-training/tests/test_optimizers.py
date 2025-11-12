import os
import sys
import pytest

# Ensure ml-training modules importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

import tensorflow as tf  # noqa: E402
from model_unet import build_and_compile_from_config  # noqa: E402


def _base_cfg():
    # Minimal model to construct quickly on CPU
    return {
        "data": {"tile": {"size": 16}},
        "model": {"input_channels": 3, "output_channels": 1, "base_filters": 4, "depth": 2, "dropout": 0.0},
        "metrics": {"threshold": 0.5},
        "train": {
            "epochs": 1,
            "batch_size": 1,
            "learning_rate": 1e-3,
            "bce_weight": 0.5,
            "dice_weight": 0.5,
            "loss_smooth": 1.0,
        },
    }


def _get_lr(opt):
    try:
        return float(tf.keras.backend.get_value(opt.learning_rate))
    except Exception:
        try:
            return float(opt.learning_rate.numpy())
        except Exception:
            return float(opt.learning_rate)


def _conv2d_regularizers(model):
    conv_layers = [l for l in model.layers if l.__class__.__name__ == "Conv2D"]
    regs = [(l.kernel_regularizer, getattr(l, "bias_regularizer", None)) for l in conv_layers]
    return regs


def test_optimizer_adam_legacy():
    cfg = _base_cfg()
    cfg["train"]["optimizer"] = "adam"  # legacy string path
    cfg["train"]["learning_rate"] = 2e-3
    model = build_and_compile_from_config(cfg)
    opt = model.optimizer
    assert isinstance(opt, tf.keras.optimizers.Adam)
    assert abs(_get_lr(opt) - 2e-3) < 1e-12
    # No L2 regularizers expected by default
    regs = _conv2d_regularizers(model)
    assert all(k is None for k, b in regs)


def test_optimizer_sgd_legacy_defaults():
    cfg = _base_cfg()
    cfg["train"]["optimizer"] = "sgd"  # legacy string path
    cfg["train"]["learning_rate"] = 1e-2
    model = build_and_compile_from_config(cfg)
    opt = model.optimizer
    assert isinstance(opt, tf.keras.optimizers.SGD)
    assert abs(_get_lr(opt) - 1e-2) < 1e-12
    # Default momentum=0.9, nesterov=False per implementation
    assert abs(float(getattr(opt, "momentum", 0.0)) - 0.9) < 1e-12
    assert bool(getattr(opt, "nesterov", False)) is True  # legacy default kept for back-compat
    regs = _conv2d_regularizers(model)
    assert all(k is None for k, b in regs)


def test_adamw_tfa_or_fallback_l2():
    # Prefer new optimizer schema
    cfg = _base_cfg()
    cfg["train"]["optimizer"] = {
        "name": "adamw",
        "lr": 1e-3,
        "weight_decay": 1e-4,
        # decoupled_wd defaults to True for adamw
    }
    model = build_and_compile_from_config(cfg)
    opt = model.optimizer

    # Try to import tfa to decide expectations
    tfa = None
    try:
        import tensorflow_addons as _tfa  # type: ignore

        tfa = _tfa
    except Exception:
        tfa = None

    regs = _conv2d_regularizers(model)

    if tfa is not None:
        # When TFA is installed, decoupled AdamW should be used
        assert isinstance(opt, tfa.optimizers.AdamW)
        # Weight decay attribute should exist and be positive
        wd = getattr(opt, "weight_decay", None)
        assert wd is not None
        wd_val = float(tf.keras.backend.get_value(wd)) if hasattr(wd, "numpy") or hasattr(wd, "__call__") else float(wd)
        assert wd_val > 0.0
        # No L2 kernel regularizers should be set
        assert all(k is None for k, b in regs)
    else:
        # Fallback path: standard Adam and L2 kernel regularizers applied
        assert isinstance(opt, tf.keras.optimizers.Adam)
        assert any(k is not None for k, b in regs), "Conv2D kernels should have L2 in fallback"
        # Biases should remain unregularized
        assert all(b is None for k, b in regs)


def test_sgdw_tfa_or_fallback_l2_and_params():
    cfg = _base_cfg()
    cfg["train"]["optimizer"] = {
        "name": "sgdw",
        "lr": 5e-3,
        "weight_decay": 1e-4,
        "momentum": 0.8,
        "nesterov": True,
    }
    model = build_and_compile_from_config(cfg)
    opt = model.optimizer

    tfa = None
    try:
        import tensorflow_addons as _tfa  # type: ignore

        tfa = _tfa
    except Exception:
        tfa = None

    regs = _conv2d_regularizers(model)

    if tfa is not None:
        assert isinstance(opt, tfa.optimizers.SGDW)
        wd = getattr(opt, "weight_decay", None)
        assert wd is not None
        wd_val = float(tf.keras.backend.get_value(wd)) if hasattr(wd, "numpy") or hasattr(wd, "__call__") else float(wd)
        assert wd_val > 0.0
        # momentum/nesterov should be wired
        assert abs(float(getattr(opt, "momentum", 0.0)) - 0.8) < 1e-12
        assert bool(getattr(opt, "nesterov", False)) is True
        # No L2 kernel regularizers should be set
        assert all(k is None for k, b in regs)
    else:
        # Fallback: standard SGD with momentum/nesterov and L2 kernel regularizers applied
        assert isinstance(opt, tf.keras.optimizers.SGD)
        assert abs(float(getattr(opt, "momentum", 0.0)) - 0.8) < 1e-12
        assert bool(getattr(opt, "nesterov", False)) is True
        assert any(k is not None for k, b in regs), "Conv2D kernels should have L2 in fallback"
        assert all(b is None for k, b in regs)

import numpy as np
import tensorflow as tf
from metrics import focal_loss, tversky_loss


def _to_logits(p):
    p = tf.clip_by_value(tf.constant(p, dtype=tf.float32), 1e-4, 1.0 - 1e-4)
    return tf.math.log(p / (1.0 - p))


def test_focal_loss_monotonic_probs():
    y_true = tf.constant([[0.0, 0.0, 1.0, 1.0]], dtype=tf.float32)
    y_bad = tf.constant([[0.8, 0.7, 0.2, 0.1]], dtype=tf.float32)   # wrong-ish
    y_good = tf.constant([[0.05, 0.1, 0.9, 0.95]], dtype=tf.float32)  # closer to target

    loss = focal_loss(alpha=0.25, gamma=2.0, from_logits=False)

    l_bad = float(loss(y_true, y_bad).numpy())
    l_good = float(loss(y_true, y_good).numpy())

    assert np.isfinite(l_bad) and np.isfinite(l_good)
    assert l_good < l_bad, "Focal loss should be lower for better predictions"


def test_focal_loss_logits_and_grad():
    y_true = tf.constant([[0.0, 1.0]], dtype=tf.float32)
    p_bad = [0.8, 0.2]
    p_good = [0.05, 0.95]

    y_bad_logits = _to_logits(p_bad)
    y_good_logits = _to_logits(p_good)

    loss = focal_loss(alpha=0.25, gamma=2.0, from_logits=True)

    l_bad = float(loss(y_true, y_bad_logits).numpy())
    l_good = float(loss(y_true, y_good_logits).numpy())
    assert l_good < l_bad

    var = tf.Variable(y_bad_logits)
    with tf.GradientTape() as tape:
        tape.watch(var)
        val = loss(y_true, var)
    g = tape.gradient(val, var)
    assert g is not None
    assert np.all(np.isfinite(g.numpy()))


def test_tversky_basic_and_grad():
    y_true = tf.constant([[0.0, 0.0, 1.0, 1.0]], dtype=tf.float32)
    y_bad = tf.constant([[0.8, 0.7, 0.2, 0.1]], dtype=tf.float32)
    y_good = tf.constant([[0.05, 0.1, 0.9, 0.95]], dtype=tf.float32)

    loss = tversky_loss(alpha=0.5, beta=0.5, smooth=1.0)

    l_bad = float(loss(y_true, y_bad).numpy())
    l_good = float(loss(y_true, y_good).numpy())
    assert l_good < l_bad

    zeros = tf.zeros_like(y_true)
    l_zeros = float(loss(zeros, zeros).numpy())
    assert 0.0 <= l_zeros <= 1e-6, "All-zero inputs should yield near-zero Tversky loss"

    var = tf.Variable(y_bad)
    with tf.GradientTape() as tape:
        tape.watch(var)
        val = loss(y_true, var)
    g = tape.gradient(val, var)
    assert g is not None
    assert np.all(np.isfinite(g.numpy()))


def test_focal_class_imbalance_stability():
    # Heavily imbalanced: 1 positive, many negatives
    y_true = tf.concat([tf.ones([1, 1]), tf.zeros([1, 15])], axis=1)
    y_pred = tf.concat([tf.ones([1, 1]) * 0.9, tf.zeros([1, 15]) + 0.1], axis=1)

    loss = focal_loss(alpha=0.25, gamma=2.0, from_logits=False)
    v = float(loss(y_true, y_pred).numpy())
    assert np.isfinite(v)

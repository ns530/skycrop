from typing import Callable, Optional

try:
    import tensorflow as tf
except Exception:  # pragma: no cover - allow import without TF in some environments
    tf = None  # type: ignore


def _assert_tf():
    assert tf is not None, "TensorFlow is required for metrics and losses"


def iou_metric(threshold: float = 0.5, smooth: float = 1e-6, name: str = "iou") -> "Callable":
    """
    Returns a Keras metric function computing IoU for binary segmentation with threshold.
    y_true, y_pred in [0,1], y_pred thresholded at 'threshold' to 0/1.
    """
    _assert_tf()

    def _iou(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)
        y_pred_bin = tf.cast(y_pred >= threshold, tf.float32)
        intersection = tf.reduce_sum(y_true * y_pred_bin)
        union = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred_bin) - intersection
        return (intersection + smooth) / (union + smooth)

    _iou.__name__ = name
    return _iou


def dice_metric(threshold: float = 0.5, smooth: float = 1e-6, name: str = "dice") -> "Callable":
    """
    Returns a Keras metric function computing Dice score for binary segmentation with threshold.
    """
    _assert_tf()

    def _dice(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)
        y_pred_bin = tf.cast(y_pred >= threshold, tf.float32)
        intersection = tf.reduce_sum(y_true * y_pred_bin)
        denom = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred_bin)
        return (2.0 * intersection + smooth) / (denom + smooth)

    _dice.__name__ = name
    return _dice


def dice_loss(y_true, y_pred, smooth: float = 1.0):
    """
    Differentiable soft dice loss (without thresholding).
    """
    _assert_tf()
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.cast(y_pred, tf.float32)
    intersection = tf.reduce_sum(y_true * y_pred)
    denom = tf.reduce_sum(y_true) + tf.reduce_sum(y_pred)
    dice = (2.0 * intersection + smooth) / (denom + smooth)
    return 1.0 - dice


def bce_dice_loss(bce_weight: float = 0.5, dice_weight: float = 0.5, smooth: float = 1.0) -> "Callable":
    """
    Weighted sum of binary cross-entropy and dice loss.
    """
    _assert_tf()
    bce = tf.keras.losses.BinaryCrossentropy(from_logits=False)

    def _loss(y_true, y_pred):
        return bce_weight * bce(y_true, y_pred) + dice_weight * dice_loss(y_true, y_pred, smooth=smooth)

    _loss.__name__ = "bce_dice_loss"
    return _loss


def pr_auc_metric(name: str = "pr_auc") -> "Callable":
    """
    Precision-Recall AUC metric using TF's built-in AUC(curve='PR').
    Works on probabilities directly.
    """
    _assert_tf()
    auc = tf.keras.metrics.AUC(curve="PR", name=name)

    def _metric(y_true, y_pred):
        auc.update_state(y_true, y_pred)
        return auc.result()

    _metric.__name__ = name
    return _metric
def focal_loss(alpha: float = 0.25, gamma: float = 2.0, from_logits: bool = False) -> "Callable":
    """
    Binary focal loss for segmentation.

    Args:
        alpha: balancing factor for positive class
        gamma: focusing parameter to down-weight easy examples
        from_logits: if True, y_pred are raw logits; else probabilities in [0,1]
    Returns:
        Callable loss(y_true, y_pred) -> scalar
    """
    _assert_tf()

    def _loss(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)

        # Elementwise BCE to apply focal weighting
        bce_elem = tf.keras.backend.binary_crossentropy(y_true, y_pred, from_logits=from_logits)

        # Convert predictions to probabilities for p_t computation
        p = tf.sigmoid(y_pred) if from_logits else tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        p_t = y_true * p + (1.0 - y_true) * (1.0 - p)
        alpha_t = y_true * alpha + (1.0 - y_true) * (1.0 - alpha)
        weights = alpha_t * tf.pow(1.0 - p_t, gamma)

        loss = weights * bce_elem
        return tf.reduce_mean(loss)

    _loss.__name__ = "focal_loss"
    return _loss


def tversky_loss(alpha: float = 0.5, beta: float = 0.5, smooth: float = 1.0) -> "Callable":
    """
    Tversky loss (1 - Tversky index), generalizing Dice/Jaccard.

    Args:
        alpha: weight on false positives
        beta: weight on false negatives
        smooth: numerical stability term
    Returns:
        Callable loss(y_true, y_pred) -> scalar
    """
    _assert_tf()

    def _loss(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)

        # Soft counts (no thresholding)
        tp = tf.reduce_sum(y_true * y_pred)
        fp = tf.reduce_sum((1.0 - y_true) * y_pred)
        fn = tf.reduce_sum(y_true * (1.0 - y_pred))

        t = (tp + smooth) / (tp + alpha * fp + beta * fn + smooth)
        return 1.0 - t

    _loss.__name__ = "tversky_loss"
    return _loss
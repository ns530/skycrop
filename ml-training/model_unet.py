import os
from typing import Tuple, Optional, Dict

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers
except Exception as e:  # pragma: no cover - optional in CI without TF
    tf = None  # type: ignore

from metrics import (
    iou_metric,
    dice_metric,
    dice_loss,
    bce_dice_loss,
    focal_loss,
    tversky_loss,
)


def conv_block(
    x,
    filters: int,
    dropout: float = 0.0,
    name: Optional[str] = None,
    kernel_regularizer=None,
):
    """
    Two Conv2D + optional SpatialDropout2D block.
    kernel_regularizer, when provided (e.g., L2), is applied to Conv2D kernels only.
    """
    x = layers.Conv2D(
        filters,
        (3, 3),
        padding="same",
        activation="relu",
        kernel_regularizer=kernel_regularizer,
        name=None if name is None else f"{name}_conv1",
    )(x)
    x = layers.Conv2D(
        filters,
        (3, 3),
        padding="same",
        activation="relu",
        kernel_regularizer=kernel_regularizer,
        name=None if name is None else f"{name}_conv2",
    )(x)
    if dropout and dropout > 0.0:
        x = layers.SpatialDropout2D(dropout, name=None if name is None else f"{name}_drop")(x)
    return x


def build_unet(
    input_shape: Tuple[int, int, int] = (512, 512, 3),
    base_filters: int = 32,
    depth: int = 4,
    dropout: float = 0.0,
    output_channels: int = 1,
    kernel_regularizer=None,
) -> "tf.keras.Model":
    """
    Build a lightweight U-Net with vanilla conv blocks, suitable for CPU training.

    Args:
        input_shape: HW(C) input, typically (tile, tile, 3)
        base_filters: number of filters at the first level
        depth: number of down/up levels (>= 2)
        dropout: SpatialDropout2D p after each block
        output_channels: 1 for binary mask
        kernel_regularizer: optional regularizer (e.g., L2) for Conv2D kernels. Biases/BN remain unregularized.

    Returns:
        tf.keras.Model
    """
    assert tf is not None, "TensorFlow is required to build the model"
    assert depth >= 2, "depth must be >= 2"

    inputs = layers.Input(shape=input_shape, name="input")

    # Encoder
    skips = []
    x = inputs
    filters = base_filters
    for d in range(depth):
        x = conv_block(x, filters, dropout=dropout, name=f"enc{d}", kernel_regularizer=kernel_regularizer)
        skips.append(x)
        if d < depth - 1:
            x = layers.MaxPooling2D((2, 2), name=f"enc{d}_pool")(x)
            filters *= 2

    # Bottleneck (no pooling after last encoder block)
    # x already computed as last encoder block output

    # Decoder
    for d in reversed(range(depth - 1)):
        filters //= 2
        x = layers.UpSampling2D((2, 2), interpolation="bilinear", name=f"dec{d}_up")(x)
        x = layers.Concatenate(name=f"dec{d}_concat")([x, skips[d]])
        x = conv_block(x, filters, dropout=dropout, name=f"dec{d}", kernel_regularizer=kernel_regularizer)

    # Output
    activation = "sigmoid" if output_channels == 1 else "softmax"
    outputs = layers.Conv2D(output_channels, (1, 1), activation=activation, name="logits")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="unet")
    return model


def compile_unet(
    model: "tf.keras.Model",
    learning_rate: float = 1e-3,
    bce_weight: float = 0.5,
    dice_weight: float = 0.5,
    loss_smooth: float = 1.0,
    metric_threshold: float = 0.5,
    optimizer: str = "adam",
    weight_decay: float = 0.0,
) -> "tf.keras.Model":
    """
    Compile U-Net with BCE+Dice loss and IoU/Dice metrics.

    Args:
        model: keras model
        learning_rate: optimizer LR
        bce_weight: BCE component weight
        dice_weight: Dice component weight
        loss_smooth: smoothing for dice component
        metric_threshold: probability threshold for IoU/Dice metrics
        optimizer: 'adam' or 'sgd'
        weight_decay: optional weight decay (decoupled) if supported

    Returns:
        compiled model
    """
    assert tf is not None, "TensorFlow is required to compile the model"

    if optimizer.lower() == "adam":
        opt = optimizers.Adam(learning_rate=learning_rate)
    elif optimizer.lower() == "sgd":
        opt = optimizers.SGD(learning_rate=learning_rate, momentum=0.9, nesterov=True)
    else:
        opt = optimizers.Adam(learning_rate=learning_rate)

    loss_fn = bce_dice_loss(bce_weight=bce_weight, dice_weight=dice_weight, smooth=loss_smooth)

    iou_fn = iou_metric(threshold=metric_threshold, smooth=1e-6, name="iou")
    dice_fn = dice_metric(threshold=metric_threshold, smooth=1e-6, name="dice")

    model.compile(optimizer=opt, loss=loss_fn, metrics=[iou_fn, dice_fn])
    return model


def build_and_compile_from_config(cfg: Dict) -> "tf.keras.Model":
    """
    Build and compile the model from YAML config, supporting:
    - Optimizers: adam, sgd, adamw, sgdw
    - Decoupled weight decay via tensorflow-addons (preferred). If unavailable and weight_decay > 0,
      falls back to L2 kernel regularization on Conv layers (bias/BN excluded).
    - Losses: bce, dice, bce_dice (default/back-compat), focal, tversky
    """
    assert tf is not None, "TensorFlow is required"

    # --- Model shape ---
    tile = int(cfg.get("data", {}).get("tile", {}).get("size", 512))
    in_ch = int(cfg.get("model", {}).get("input_channels", 3))
    out_ch = int(cfg.get("model", {}).get("output_channels", 1))
    base_filters = int(cfg.get("model", {}).get("base_filters", 32))
    depth = int(cfg.get("model", {}).get("depth", 4))
    dropout = float(cfg.get("model", {}).get("dropout", 0.0))

    # --- Train config (legacy + new schema) ---
    train_cfg = cfg.get("train", {}) or {}

    # Legacy fallbacks
    legacy_lr = float(train_cfg.get("learning_rate", 1e-3))
    legacy_opt_name = str(train_cfg.get("optimizer", "adam"))
    legacy_weight_decay = float(train_cfg.get("weight_decay", 0.0))
    legacy_bce_w = float(train_cfg.get("bce_weight", 0.5))
    legacy_dice_w = float(train_cfg.get("dice_weight", 0.5))
    legacy_smooth = float(train_cfg.get("loss_smooth", 1.0))

    # New optimizer schema (train.optimizer: dict)
    opt_cfg_raw = train_cfg.get("optimizer", None)
    if isinstance(opt_cfg_raw, dict):
        opt_name = str(opt_cfg_raw.get("name", legacy_opt_name)).lower()
        lr = float(opt_cfg_raw.get("lr", legacy_lr))
        weight_decay = float(opt_cfg_raw.get("weight_decay", legacy_weight_decay))
        # Default: decoupled true when using W variants, else false
        decoupled_wd = bool(opt_cfg_raw.get("decoupled_wd", opt_name in ("adamw", "sgdw")))
        exclude_substrings = list(opt_cfg_raw.get("exclude_from_weight_decay", ["bias", "bn", "batchnorm"]))
        betas = opt_cfg_raw.get("betas", [0.9, 0.999])
        if isinstance(betas, (tuple, list)) and len(betas) == 2:
            beta1, beta2 = float(betas[0]), float(betas[1])
        else:
            beta1, beta2 = 0.9, 0.999
        eps = float(opt_cfg_raw.get("eps", 1e-8))
        momentum = float(opt_cfg_raw.get("momentum", 0.9))
        nesterov = bool(opt_cfg_raw.get("nesterov", False))
    else:
        opt_name = str(legacy_opt_name).lower()
        lr = float(legacy_lr)
        weight_decay = float(legacy_weight_decay)
        decoupled_wd = opt_name in ("adamw", "sgdw")
        exclude_substrings = ["bias", "bn", "batchnorm"]
        beta1, beta2 = 0.9, 0.999
        eps = 1e-8
        momentum = 0.9
        nesterov = True if opt_name == "sgd" else False

    # Try to import tensorflow-addons
    tfa = None
    try:
        import tensorflow_addons as _tfa  # type: ignore
        tfa = _tfa
    except Exception:
        tfa = None

    # Determine if we can use true decoupled WD via TFA
    use_tfa_decoupled = (
        tfa is not None and weight_decay > 0.0 and decoupled_wd and opt_name in ("adamw", "sgdw")
    )

    # Fallback minimal semantics: apply L2 kernel regularizer when we cannot do real decoupled WD
    if weight_decay > 0.0 and not use_tfa_decoupled:
        try:
            l2_reg = tf.keras.regularizers.L2(weight_decay)
        except Exception:
            l2_reg = None
        kernel_regularizer = l2_reg
        if l2_reg is not None:
            print(
                f"[optimizer] Using fallback L2(kernel) regularization (weight_decay={weight_decay}); "
                f"decoupled_wd={decoupled_wd} opt={opt_name} tfa_available={tfa is not None}"
            )
    else:
        kernel_regularizer = None

    # --- Build model (apply L2 to Conv kernels only in fallback path). Biases/BN remain unregularized (excluded). ---
    model = build_unet(
        input_shape=(tile, tile, in_ch),
        base_filters=base_filters,
        depth=depth,
        dropout=dropout,
        output_channels=out_ch,
        kernel_regularizer=kernel_regularizer,
    )

    # --- Optimizer selection ---
    if use_tfa_decoupled:
        if opt_name == "adamw":
            opt = tfa.optimizers.AdamW(
                learning_rate=lr, weight_decay=weight_decay, beta_1=beta1, beta_2=beta2, epsilon=eps
            )
        else:  # sgdw
            opt = tfa.optimizers.SGDW(
                learning_rate=lr, weight_decay=weight_decay, momentum=momentum, nesterov=nesterov
            )
        print(f"[optimizer] Using TFA decoupled WD: {opt.__class__.__name__} lr={lr} wd={weight_decay}")
        if exclude_substrings:
            # Note: tfa.*W classes do not natively support exclude_from_weight_decay. If needed,
            # a custom wrapper with extend_with_decoupled_weight_decay could be implemented.
            print(f"[optimizer] Note: exclude_from_weight_decay patterns not applied in TFA mode: {exclude_substrings}")
    else:
        if opt_name in ("adam", "adamw"):
            opt = optimizers.Adam(learning_rate=lr, beta_1=beta1, beta_2=beta2, epsilon=eps)
            chosen = "Adam"
        elif opt_name in ("sgd", "sgdw"):
            opt = optimizers.SGD(learning_rate=lr, momentum=momentum, nesterov=nesterov)
            chosen = "SGD"
        else:
            opt = optimizers.Adam(learning_rate=lr, beta_1=beta1, beta_2=beta2, epsilon=eps)
            chosen = "Adam"
        print(
            f"[optimizer] Using {chosen} (no decoupled WD). lr={lr} "
            f"weight_decay={weight_decay} (handled via L2 fallback={kernel_regularizer is not None})"
        )

    # --- Loss selection ---
    loss_cfg = train_cfg.get("loss", None)
    if isinstance(loss_cfg, dict) and "name" in loss_cfg:
        lname = str(loss_cfg.get("name", "bce_dice")).lower()
        params = loss_cfg.get("params", {}) or {}
        if lname == "bce":
            loss_fn = tf.keras.losses.BinaryCrossentropy(from_logits=bool(params.get("logits", False)))
        elif lname == "dice":
            loss_fn = lambda y_true, y_pred: dice_loss(y_true, y_pred, smooth=float(params.get("smooth", 1.0)))  # noqa: E731
        elif lname == "bce_dice":
            loss_fn = bce_dice_loss(
                bce_weight=float(params.get("bce_weight", legacy_bce_w)),
                dice_weight=float(params.get("dice_weight", legacy_dice_w)),
                smooth=float(params.get("smooth", legacy_smooth)),
            )
        elif lname == "focal":
            loss_fn = focal_loss(
                alpha=float(params.get("alpha", 0.25)),
                gamma=float(params.get("gamma", 2.0)),
                from_logits=bool(params.get("logits", False)),
            )
        elif lname == "tversky":
            loss_fn = tversky_loss(
                alpha=float(params.get("alpha", 0.5)),
                beta=float(params.get("beta", 0.5)),
                smooth=float(params.get("smooth", 1.0)),
            )
        else:
            # Fallback to legacy BCE+Dice
            loss_fn = bce_dice_loss(bce_weight=legacy_bce_w, dice_weight=legacy_dice_w, smooth=legacy_smooth)
            print(f"[loss] Unknown loss '{lname}', falling back to bce_dice")
        print(f"[loss] Using '{lname}'")
    else:
        # Backward compatibility: default to BCE+Dice using legacy weights
        loss_fn = bce_dice_loss(bce_weight=legacy_bce_w, dice_weight=legacy_dice_w, smooth=legacy_smooth)
        print(f"[loss] Using default bce_dice (bce_weight={legacy_bce_w}, dice_weight={legacy_dice_w}, smooth={legacy_smooth})")

    # --- Metrics ---
    metric_threshold = float(cfg.get("metrics", {}).get("threshold", 0.5))
    iou_fn = iou_metric(threshold=metric_threshold, smooth=1e-6, name="iou")
    dice_fn = dice_metric(threshold=metric_threshold, smooth=1e-6, name="dice")

    model.compile(optimizer=opt, loss=loss_fn, metrics=[iou_fn, dice_fn])
    return model
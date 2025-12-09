import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

# Add path for local imports
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

# Import from yield module
sys.path.insert(0, os.path.join(CURRENT_DIR, "yield"))
from model_rf import model_to_onnx, sha256_of_file

# Generate synthetic data
def generate_synthetic_data():
    np.random.seed(1337)
    n_samples = 100
    n_features = 10

    # Generate features
    X = np.random.randn(n_samples, n_features)
    # Generate target
    y = X.sum(axis=1) + np.random.randn(n_samples) * 0.1

    return X, y

# Train RF model
def train_rf():
    X, y = generate_synthetic_data()

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1337)

    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=1337)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"MSE: {mse:.4f}, MAE: {mae:.4f}, R2: {r2:.4f}")

    return model, mse, mae, r2

# Save model
def save_model(model, mse, mae, r2):
    # Save to ml-service location
    base_dir = os.path.join(ML_TRAINING_ROOT, 'ml-service/ml-training/models/yield_rf/1.0.0')
    os.makedirs(base_dir, exist_ok=True)

    joblib_path = os.path.join(base_dir, 'model.joblib')
    onnx_path = os.path.join(base_dir, 'model.onnx')
    metrics_path = os.path.join(base_dir, 'metrics.json')
    sha_path = os.path.join(base_dir, 'sha256.txt')

    # Save joblib
    joblib.dump(model, joblib_path)
    print(f"Model saved to {joblib_path}")

    # Convert to ONNX
    model_to_onnx(model, n_features=10, out_path=onnx_path)
    print(f"ONNX model saved to {onnx_path}")

    # Save metrics
    metrics = {
        "rmse": float(np.sqrt(mse)),
        "mae": float(mae),
        "r2": float(r2),
        "n_features": 10,
        "feature_names": [f"feature_{i}" for i in range(10)]
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    # Save SHA256
    sha_lines = []
    sha_joblib = sha256_of_file(joblib_path)
    sha_lines.append(f"model.joblib {sha_joblib}")
    sha_onnx = sha256_of_file(onnx_path)
    sha_lines.append(f"model.onnx {sha_onnx}")
    with open(sha_path, "w") as f:
        f.write("\n".join(sha_lines) + "\n")

    return joblib_path, onnx_path, metrics_path, sha_path, sha_onnx

if __name__ == "__main__":
    model, mse, mae, r2 = train_rf()
    save_model(model, mse, mae, r2)
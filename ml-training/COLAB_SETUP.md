# Google Colab Setup for U-Net Training

This guide explains how to train the U-Net segmentation model on Google Colab using your Google Drive dataset.

## Dataset Preparation

Ensure your dataset is organized in Google Drive as follows:

```
MyDrive/
└── sentinel2_datasets/
    ├── train/
    │   ├── train_images/
    │   └── train_masks/
    ├── val/
    │   ├── val_images/
    │   └── val_masks/
    └── test/
        ├── test_images/
        └── test_masks/
```

- Images should be in PNG/JPG/TIFF format
- Masks should be binary (0/255) PNG images
- All images and masks should be paired (same filenames)

## Colab Setup Steps

1. **Open Colab**: Go to [colab.research.google.com](https://colab.research.google.com)

2. **Get Training Files** (Choose one option):

   **Option A: Clone Repository (Recommended)**:
   ```bash
   !git clone https://github.com/ns530/skycrop.git
   %cd skycrop/ml-training
   ```

   **Option B: Upload Notebook (Alternative)**:
   Upload the `colab_train_unet.ipynb` file to Colab

3. **Run Setup Cells**:
   - Mount Google Drive
   - Install dependencies (skip navigation if using Option A)
   - Set environment variables

4. **Verify Dataset**: Check that the dataset path exists and contains the expected folders

5. **Run Training**: Execute the training cell

## Configuration

The training uses `config.yaml` with the following key settings:

- `sentinel2.enabled: true` - Uses Sentinel-2 dataset loader
- `sentinel2.download.enabled: false` - Skips download since data is in Drive
- `data.data_dir: ${DATA_DIR:-./data}` - Set via `DATA_DIR` env var to `/content/drive/MyDrive`

## Tips

- Use GPU runtime for faster training: Runtime > Change runtime type > GPU
- Monitor memory usage; reduce `batch_size` if needed
- Training checkpoints are saved to `runs/` directory in Drive
- Logs are available in TensorBoard format

## Troubleshooting

- **Dataset not found**: Ensure the path `/content/drive/MyDrive/sentinel2_datasets` exists
- **Memory errors**: Reduce batch_size in config.yaml
- **Import errors**: Ensure all dependencies are installed
- **Permission errors**: Make sure Drive is properly mounted

## Output

After training completes:
- Best model saved as `runs/unet_baseline/checkpoints/best.keras`
- Training summary in `runs/unet_baseline/train_summary.json`
- TensorBoard logs in `runs/unet_baseline/tb/`
import h5py
import numpy as np
import os
from collections import Counter

def analyze_nc_file(filepath):
    """Analyze a single .nc file and return metadata."""
    try:
        with h5py.File(filepath, 'r') as f:
            metadata = {
                'filename': os.path.basename(filepath),
                'keys': list(f.keys()),
                'attrs': dict(f.attrs),
                'shape': {},
                'dtype': {}
            }

            # Get shape and dtype of datasets
            def visit_items(name, obj):
                if isinstance(obj, h5py.Dataset):
                    metadata['shape'][name] = obj.shape
                    metadata['dtype'][name] = str(obj.dtype)

            f.visititems(visit_items)
            return metadata
    except Exception as e:
        return {'error': str(e), 'filename': os.path.basename(filepath)}

def analyze_dataset_structure(root_path):
    """Analyze the overall dataset structure."""
    structure = {
        'folders': [],
        'file_counts': {},
        'file_types': Counter(),
        'total_size': 0
    }

    for root, dirs, files in os.walk(root_path):
        if dirs:
            structure['folders'].extend([os.path.join(root, d) for d in dirs])

        for file in files:
            filepath = os.path.join(root, file)
            _, ext = os.path.splitext(file)
            structure['file_types'][ext] += 1
            structure['total_size'] += os.path.getsize(filepath)

    structure['file_counts'] = dict(structure['file_types'])
    return structure

def sample_analysis(root_path, sample_size=3):
    """Analyze a sample of .nc files."""
    nc_files = []
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith('.nc'):
                nc_files.append(os.path.join(root, file))

    # Analyze sample files
    sample_analyses = []
    for i, filepath in enumerate(nc_files[:sample_size]):
        analysis = analyze_nc_file(filepath)
        sample_analyses.append(analysis)

    return {
        'total_nc_files': len(nc_files),
        'sample_analyses': sample_analyses
    }

if __name__ == "__main__":
    dataset_path = "sentinel2_datasets"

    print("=== Dataset Structure Analysis ===")
    structure = analyze_dataset_structure(dataset_path)
    print(f"Folders: {structure['folders']}")
    print(f"File types: {structure['file_types']}")
    print(f"Total size: {structure['total_size'] / (1024**3):.2f} GB")

    print("\n=== Sample .nc File Analysis ===")
    sample = sample_analysis(dataset_path)
    print(f"Total .nc files: {sample['total_nc_files']}")

    for i, analysis in enumerate(sample['sample_analyses']):
        print(f"\n--- Sample {i+1}: {analysis['filename']} ---")
        if 'error' in analysis:
            print(f"Error: {analysis['error']}")
        else:
            print(f"Keys: {analysis['keys']}")
            print(f"Shape: {analysis['shape']}")
            print(f"Dtype: {analysis['dtype']}")
            print(f"Attributes: {analysis['attrs']}")
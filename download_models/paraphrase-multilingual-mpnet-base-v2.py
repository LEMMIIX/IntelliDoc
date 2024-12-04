import os
import requests
from typing import Optional
import json
import sys
from huggingface_hub import snapshot_download

# Exactly match the path structure expected by the JS code
MODEL_NAME = "Xenova/paraphrase-multilingual-mpnet-base-v2"
BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                        "node_modules", "@xenova", "transformers", "models",
                        "Xenova", "paraphrase-multilingual-mpnet-base-v2")
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Required files - simplified to just what's needed
REQUIRED_FILES = [
    "config.json",
    "tokenizer.json",
    "special_tokens_map.json",
    "tokenizer_config.json"
]

ONNX_FILES = [
    "model.onnx",
    "model_quantized.onnx"  # This is the one your JS code tries to use by default
]

def ensure_dirs():
    """Create necessary directories if they don't exist"""
    os.makedirs(ONNX_PATH, exist_ok=True)
    os.makedirs(BASE_PATH, exist_ok=True)
    print(f"Created directories at: {BASE_PATH}")

def download_file(url: str, dest_path: str, chunk_size: int = 8192) -> bool:
    """Download a file with progress indication"""
    try:
        headers = {}
        if 'HF_TOKEN' in os.environ:
            headers['Authorization'] = f"Bearer {os.environ['HF_TOKEN']}"
        
        response = requests.get(url, stream=True, headers=headers)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        print(f"Downloading {os.path.basename(dest_path)}")
        print(f"Size: {total_size / (1024*1024):.1f} MB")
        
        with open(dest_path, 'wb') as file:
            for data in response.iter_content(chunk_size):
                downloaded += len(data)
                file.write(data)
                if total_size:
                    percentage = (downloaded / total_size) * 100
                    print(f"Progress: {percentage:.1f}%", end='\r')
        
        print(f"\nCompleted downloading {os.path.basename(dest_path)}")
        return True
        
    except Exception as e:
        print(f"Error downloading {url}: {str(e)}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False

def download_model():
    """Download the model files"""
    print(f"Starting download to {BASE_PATH}")
    
    try:
        ensure_dirs()
        
        # Step 1: Download base model files
        print("\nStep 1: Downloading base model files...")
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=BASE_PATH,
            token=os.environ.get('HF_TOKEN'),
            local_dir_use_symlinks=False,
            ignore_patterns=[".*", "*.bin", "*.h5", "*.msgpack"],
            allow_patterns=REQUIRED_FILES,
            force_download=True
        )
        
        # Step 2: Download ONNX files
        print("\nStep 2: Downloading ONNX files...")
        for model_file in ONNX_FILES:
            onnx_url = f"https://huggingface.co/{MODEL_NAME}/resolve/main/onnx/{model_file}"
            dest_path = os.path.join(ONNX_PATH, model_file)
            
            if os.path.exists(dest_path):
                print(f"ONNX file already exists: {model_file}")
                continue
                
            print(f"\nDownloading {model_file}...")
            success = download_file(onnx_url, dest_path)
            
            if not success:
                raise Exception(f"Failed to download {model_file}")
        
        # Verify structure
        print("\nVerifying files...")
        print("\nBase files:")
        base_files = os.listdir(BASE_PATH)
        for file in [f for f in base_files if os.path.isfile(os.path.join(BASE_PATH, f))]:
            size_mb = os.path.getsize(os.path.join(BASE_PATH, file)) / (1024 * 1024)
            print(f"  - {file} ({size_mb:.1f} MB)")
        
        print("\nONNX files:")
        if os.path.exists(ONNX_PATH):
            onnx_files = os.listdir(ONNX_PATH)
            for file in onnx_files:
                size_mb = os.path.getsize(os.path.join(ONNX_PATH, file)) / (1024 * 1024)
                print(f"  - {file} ({size_mb:.1f} MB)")
        
        print("\nDownload complete!")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        download_model()
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)
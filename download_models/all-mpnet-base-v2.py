import os
import subprocess
import requests
from typing import Optional
import json
import sys
import shutil
from huggingface_hub import snapshot_download

MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                        "node_modules", "@xenova", "transformers", "models",
                        "sentence-transformers", "all-mpnet-base-v2")
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Available ONNX files
ONNX_FILES = [
    "model.onnx",
    "model_fp16.onnx",
    "model_quantized.onnx"
]

def ensure_dirs():
    os.makedirs(ONNX_PATH, exist_ok=True)
    os.makedirs(BASE_PATH, exist_ok=True)
    print(f"Ensuring directories exist at: {BASE_PATH}")

def download_file(url: str, dest_path: str, chunk_size: int = 8192) -> bool:
    try:
        headers = {}
        if 'HF_TOKEN' in os.environ:
            headers['Authorization'] = f"Bearer {os.environ['HF_TOKEN']}"
        
        response = requests.get(url, stream=True, headers=headers)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = chunk_size
        downloaded = 0
        
        print(f"Downloading {os.path.basename(dest_path)}")
        print(f"Size: {total_size / (1024*1024):.1f} MB")
        print(f"From: {url}")
        
        with open(dest_path, 'wb') as file:
            for data in response.iter_content(block_size):
                downloaded += len(data)
                file.write(data)
                if total_size:
                    percentage = (downloaded / total_size) * 100
                    print(f"Progress: {percentage:.1f}%", end='\r')
        
        print(f"\nCompleted downloading {os.path.basename(dest_path)}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {url}: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status code: {e.response.status_code}")
        return False

def download_model():
    print(f"Downloading complete model from {MODEL_NAME}")
    
    try:
        ensure_dirs()
        
        if 'HF_TOKEN' not in os.environ:
            print("Warning: HF_TOKEN environment variable not found. Downloads may be rate-limited.")
        else:
            print("Found HF_TOKEN in environment variables.")
        
        print("\nStep 1: Downloading base model files...")
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=BASE_PATH,
            token=os.environ.get('HF_TOKEN'),
            local_dir_use_symlinks=False,
            ignore_patterns=[".*"],
            force_download=True,
        )
        
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
                print(f"Failed to download {model_file}")
        
        print("\nVerifying model structure...")
        print("\nBase model files:")
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
        
        print("\nDownload complete! Model is ready to use.")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    requirements = ['requests', 'huggingface_hub']
    for package in requirements:
        try:
            __import__(package)
        except ImportError:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    download_model()
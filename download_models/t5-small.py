import os
import requests
from typing import Optional
import json
import sys
import shutil
from huggingface_hub import snapshot_download

# Adjust the path to be relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))  # Go up to project root
MODEL_NAME = "t5-small"
BASE_PATH = os.path.join(PROJECT_ROOT, "node_modules", "@xenova", "transformers", "models", "t5-small")
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Required model files for T5
REQUIRED_FILES = [
    "config.json",
    "tokenizer.json",
    "special_tokens_map.json",
    "spiece.model",
    "generation_config.json"
]

# ONNX model variants
ONNX_FILES = [
    "encoder_model.onnx",
    "decoder_model.onnx",
    "encoder_model_quantized.onnx",
    "decoder_model_quantized.onnx"
]

def ensure_dirs():
    """Create necessary directories if they don't exist"""
    os.makedirs(ONNX_PATH, exist_ok=True)
    os.makedirs(BASE_PATH, exist_ok=True)
    print(f"Created directories:")
    print(f"Base path: {BASE_PATH}")
    print(f"ONNX path: {ONNX_PATH}")

def download_file(url: str, dest_path: str, chunk_size: int = 8192) -> bool:
    """Download a file with progress indication"""
    try:
        # Use token from environment variable if available
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
    """Download complete T5-small model including base files and ONNX files"""
    print(f"Starting download of T5-small model")
    print(f"Project root: {PROJECT_ROOT}")
    
    try:
        ensure_dirs()
        
        # Check for HF_TOKEN
        if 'HF_TOKEN' not in os.environ:
            print("Warning: HF_TOKEN environment variable not found. Downloads may be rate-limited.")
        else:
            print("Found HF_TOKEN in environment variables.")
        
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
        
        # Step 2: Download ONNX files from Xenova's repository
        print("\nStep 2: Downloading ONNX files...")
        xenova_model = "Xenova/t5-small"
        
        for model_file in ONNX_FILES:
            onnx_url = f"https://huggingface.co/{xenova_model}/resolve/main/onnx/{model_file}"
            dest_path = os.path.join(ONNX_PATH, model_file)
            
            if os.path.exists(dest_path):
                print(f"ONNX file already exists: {model_file}")
                continue
                
            print(f"\nDownloading {model_file}...")
            success = download_file(onnx_url, dest_path)
            
            if not success:
                print(f"Failed to download {model_file}")
        
        # Create model_paths.json for the generator script
        model_paths = {
            "base_path": BASE_PATH,
            "onnx_path": ONNX_PATH,
            "model_name": MODEL_NAME
        }
        
        with open(os.path.join(BASE_PATH, "model_paths.json"), "w") as f:
            json.dump(model_paths, f, indent=2)
        
        # Verify the complete model structure
        print("\nVerifying model structure...")
        
        missing_files = []
        for file in REQUIRED_FILES:
            file_path = os.path.join(BASE_PATH, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        for file in ONNX_FILES:
            file_path = os.path.join(ONNX_PATH, file)
            if not os.path.exists(file_path):
                missing_files.append(f"onnx/{file}")
        
        if missing_files:
            print("\nWarning: Some files are missing:")
            for file in missing_files:
                print(f"  - {file}")
        else:
            print("\nAll required files are present!")
        
        print("\nModel structure:")
        print("\nBase files:")
        for file in os.listdir(BASE_PATH):
            size = os.path.getsize(os.path.join(BASE_PATH, file)) / (1024 * 1024)
            print(f"  - {file} ({size:.1f} MB)")
        
        print("\nONNX files:")
        for file in os.listdir(ONNX_PATH):
            size = os.path.getsize(os.path.join(ONNX_PATH, file)) / (1024 * 1024)
            print(f"  - {file} ({size:.1f} MB)")
        
    except Exception as e:
        print(f"Error during model download: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        download_model()
        print("\nModel download completed successfully!")
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)
import os
import requests
from typing import Optional
import json
import sys
import shutil
from huggingface_hub import snapshot_download

def find_project_root():
    """Find the project root by looking for package.json or .git"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Go up until we find package.json or .git or hit the root
    while current_dir != os.path.dirname(current_dir):  # Stop at root directory
        if os.path.exists(os.path.join(current_dir, 'package.json')) or \
           os.path.exists(os.path.join(current_dir, '.git')):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    
    raise Exception("Could not find project root (no package.json or .git found)")

# Project structure constants
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
try:
    PROJECT_ROOT = find_project_root()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

# Model constants
MODEL_NAME = "google/flan-t5-base"
MODEL_DIR = "flan-t5-base"
BASE_PATH = os.path.join(PROJECT_ROOT, "node_modules", "@xenova", "transformers", "models", MODEL_DIR)
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Required files
REQUIRED_FILES = [
    "config.json",
    "tokenizer.json",
    "special_tokens_map.json",
    "spiece.model",
    "generation_config.json"
]

ONNX_FILES = [
    "encoder_model.onnx",
    "decoder_model.onnx",
    "encoder_model_quantized.onnx",
    "decoder_model_quantized.onnx"
]

def ensure_dirs():
    """Create necessary directories if they don't exist"""
    # Create full path structure
    model_path = os.path.join(PROJECT_ROOT, "node_modules", "@xenova", "transformers", "models")
    os.makedirs(model_path, exist_ok=True)
    os.makedirs(ONNX_PATH, exist_ok=True)
    
    print("\nDirectory structure:")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Model path: {BASE_PATH}")
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
    """Download complete Flan-T5-base model including base files and ONNX files"""
    print(f"Starting download of Flan-T5-base model")
    
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
        xenova_model = "Xenova/flan-t5-base"
        
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
        base_files = [f for f in os.listdir(BASE_PATH) if os.path.isfile(os.path.join(BASE_PATH, f))]
        for file in base_files:
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
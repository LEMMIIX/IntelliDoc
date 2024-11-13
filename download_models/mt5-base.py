import os
import requests
from typing import Optional
import json
import sys
import shutil
from huggingface_hub import snapshot_download
import hashlib

def find_project_root():
    """Find the project root by looking for package.json or .git"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):
        if os.path.exists(os.path.join(current_dir, 'package.json')) or \
           os.path.exists(os.path.join(current_dir, '.git')):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    raise Exception("Could not find project root (no package.json or .git found)")

# Project structure constants
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = find_project_root()

# Model constants for mT5-base
MODEL_NAME = "google/mt5-base"
XENOVA_MODEL = "Xenova/mt5-base"
MODEL_DIR = "mt5-base"
BASE_PATH = os.path.join(PROJECT_ROOT, "node_modules", "@xenova", "transformers", "models", MODEL_DIR)
ONNX_PATH = os.path.join(BASE_PATH, "onnx")
CACHE_PATH = os.path.join(BASE_PATH, ".cache", "huggingface")

# Required model files and their expected locations
REQUIRED_FILES = {
    "base": [
        {"file": "config.json", "source": "google"},
        {"file": "tokenizer.json", "source": "xenova"},
        {"file": "special_tokens_map.json", "source": "google"},
        {"file": "spiece.model", "source": "google"},
        {"file": "generation_config.json", "source": "google"}
    ],
    "onnx": [
        "encoder_model.onnx",
        "decoder_model.onnx",
        "encoder_model_quantized.onnx",
        "decoder_model_quantized.onnx"
    ]
}

def create_directory_structure():
    """Create the complete directory structure"""
    directories = [
        BASE_PATH,
        ONNX_PATH,
        CACHE_PATH,
        os.path.join(BASE_PATH, ".metadata")
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def verify_file_integrity(file_path: str) -> bool:
    """Verify if a file exists and is not empty"""
    if not os.path.exists(file_path):
        return False
    return os.path.getsize(file_path) > 0

def download_file(url: str, dest_path: str, chunk_size: int = 8192, timeout: int = 60) -> bool:
    """Download a file with progress indication and validation"""
    try:
        headers = {'Authorization': f"Bearer {os.getenv('HF_TOKEN', '')}"}
        response = requests.get(url, stream=True, headers=headers, timeout=timeout)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(dest_path, 'wb') as file:
            for data in response.iter_content(chunk_size):
                downloaded += len(data)
                file.write(data)
                if total_size:
                    progress = (downloaded / total_size) * 100
                    print(f"Downloading {os.path.basename(dest_path)}: {progress:.1f}%", end='\r')
        
        print(f"\nCompleted downloading {os.path.basename(dest_path)}")
        return verify_file_integrity(dest_path)

    except requests.exceptions.RequestException as e:
        print(f"Error downloading {url}: {str(e)}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False

def download_model():
    """Download and verify mT5-base model files"""
    print("Starting mT5-base model download and verification")
    create_directory_structure()

    if 'HF_TOKEN' not in os.environ:
        print("Warning: HF_TOKEN not found. Downloads may be rate-limited.")

    try:
        # Step 1: Download base model files
        print("\nDownloading base model files...")
        for file_info in REQUIRED_FILES["base"]:
            file_name = file_info["file"]
            source = file_info["source"]
            dest_path = os.path.join(BASE_PATH, file_name)
            
            if verify_file_integrity(dest_path):
                print(f"Base file already exists and verified: {file_name}")
                continue
                
            # Choose source URL based on file source
            if source == "google":
                url = f"https://huggingface.co/{MODEL_NAME}/resolve/main/{file_name}"
            else:  # xenova
                url = f"https://huggingface.co/{XENOVA_MODEL}/resolve/main/{file_name}"
                
            success = download_file(url, dest_path)
            if not success:
                # If google source fails, try xenova as fallback
                if source == "google":
                    print(f"Trying fallback source for {file_name}")
                    fallback_url = f"https://huggingface.co/{XENOVA_MODEL}/resolve/main/{file_name}"
                    success = download_file(fallback_url, dest_path)
                
                if not success:
                    raise Exception(f"Failed to download {file_name}")

        # Step 2: Download ONNX files
        print("\nDownloading ONNX model files...")
        for file_name in REQUIRED_FILES["onnx"]:
            dest_path = os.path.join(ONNX_PATH, file_name)
            
            if verify_file_integrity(dest_path):
                print(f"ONNX file already exists and verified: {file_name}")
                continue

            onnx_url = f"https://huggingface.co/{XENOVA_MODEL}/resolve/main/onnx/{file_name}"
            success = download_file(onnx_url, dest_path, timeout=300)
            
            if not success:
                raise Exception(f"Failed to download {file_name}")

        # Step 3: Generate metadata files
        print("\nGenerating metadata files...")
        metadata_dir = os.path.join(BASE_PATH, ".metadata")
        os.makedirs(metadata_dir, exist_ok=True)
        
        for file_info in REQUIRED_FILES["base"]:
            source_file = os.path.join(BASE_PATH, file_info["file"])
            metadata_file = os.path.join(metadata_dir, f"{file_info['file']}.metadata")
            
            if os.path.exists(source_file):
                with open(source_file, 'rb') as f:
                    content = f.read()
                    metadata = {
                        "size": len(content),
                        "hash": hashlib.sha256(content).hexdigest()
                    }
                    with open(metadata_file, 'w') as mf:
                        json.dump(metadata, mf, indent=2)

        # Step 4: Final verification
        print("\nVerifying complete model structure...")
        all_files = [os.path.join(BASE_PATH, f["file"]) for f in REQUIRED_FILES["base"]]
        all_files.extend([os.path.join(ONNX_PATH, f) for f in REQUIRED_FILES["onnx"]])
        
        missing_files = [f for f in all_files if not verify_file_integrity(f)]
        
        if missing_files:
            raise Exception(f"Missing or invalid files: {', '.join(missing_files)}")

        print("\nModel download and verification completed successfully!")
        print(f"Model location: {BASE_PATH}")

    except Exception as e:
        print(f"\nError during model download: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        download_model()
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)
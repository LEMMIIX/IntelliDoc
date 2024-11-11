import os
import subprocess
import requests
from typing import Optional
import json
import sys
import shutil
from huggingface_hub import snapshot_download

MODEL_NAME = "facebook/mbart-large-50"
BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                        "node_modules", "@xenova", "transformers", "models",
                        "facebook", "mbart-large-50")
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Essential files needed for the model
ESSENTIAL_FILES = {
    'model_files': [
        "config.json",
        "generation_config.json",
        "pytorch_model.bin",
        "special_tokens_map.json",
        "tokenizer_config.json",
        "sentencepiece.bpe.model"
    ],
    'tokenizer_files': [
        "sentencepiece.bpe.model",
        "special_tokens_map.json",
        "tokenizer_config.json"
    ]
}

def ensure_dirs():
    """Create necessary directories if they don't exist"""
    os.makedirs(ONNX_PATH, exist_ok=True)
    os.makedirs(BASE_PATH, exist_ok=True)
    os.makedirs(os.path.join(BASE_PATH, "tokenizer"), exist_ok=True)
    print(f"Ensuring directories exist at: {BASE_PATH}")

def download_file(url: str, dest_path: str, chunk_size: int = 8192) -> bool:
    """Download a file with progress indication"""
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
    """Download complete model including base files and organize directory structure"""
    print(f"Downloading model {MODEL_NAME} to {BASE_PATH}")
    
    try:
        ensure_dirs()
        
        if 'HF_TOKEN' not in os.environ:
            print("Warning: HF_TOKEN environment variable not found. Downloads may be rate-limited.")
        else:
            print("Found HF_TOKEN in environment variables.")
        
        # Download to temporary location first
        temp_path = os.path.join(BASE_PATH, "_temp")
        os.makedirs(temp_path, exist_ok=True)
        
        print("\nStep 1: Downloading base model files...")
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=temp_path,
            token=os.environ.get('HF_TOKEN'),
            local_dir_use_symlinks=False,
            ignore_patterns=[".*"],
            force_download=True,
        )
        
        # Organize files
        print("\nStep 2: Organizing files...")
        for file in os.listdir(temp_path):
            src = os.path.join(temp_path, file)
            if os.path.isfile(src):
                # Handle ONNX files
                if file.endswith('.onnx'):
                    dst = os.path.join(ONNX_PATH, file)
                    shutil.move(src, dst)
                    print(f"Moved {file} to onnx directory")
                
                # Handle tokenizer files
                elif file in ESSENTIAL_FILES['tokenizer_files']:
                    dst_tokenizer = os.path.join(BASE_PATH, "tokenizer", file)
                    shutil.copy2(src, dst_tokenizer)
                    print(f"Copied {file} to tokenizer directory")
                
                # Move model files to base directory
                if file in ESSENTIAL_FILES['model_files']:
                    dst = os.path.join(BASE_PATH, file)
                    shutil.move(src, dst)
                    print(f"Moved {file} to base directory")
        
        # Clean up temp directory
        shutil.rmtree(temp_path)
        
        # Verify files and structure
        print("\nVerifying model structure...")
        
        missing_files = []
        for file in ESSENTIAL_FILES['model_files']:
            if not os.path.exists(os.path.join(BASE_PATH, file)):
                missing_files.append(f"model/{file}")
                
        for file in ESSENTIAL_FILES['tokenizer_files']:
            if not os.path.exists(os.path.join(BASE_PATH, "tokenizer", file)):
                missing_files.append(f"tokenizer/{file}")
        
        if missing_files:
            print("\nWarning: Some essential files are missing:")
            for file in missing_files:
                print(f"  - {file}")
        
        # Print sizes
        print("\nBase model files:")
        base_files = os.listdir(BASE_PATH)
        for file in [f for f in base_files if os.path.isfile(os.path.join(BASE_PATH, f))]:
            size_mb = os.path.getsize(os.path.join(BASE_PATH, file)) / (1024 * 1024)
            print(f"  - {file} ({size_mb:.1f} MB)")
        
        print("\nTokenizer files:")
        tokenizer_path = os.path.join(BASE_PATH, "tokenizer")
        if os.path.exists(tokenizer_path):
            tokenizer_files = os.listdir(tokenizer_path)
            for file in tokenizer_files:
                size_mb = os.path.getsize(os.path.join(tokenizer_path, file)) / (1024 * 1024)
                print(f"  - {file} ({size_mb:.1f} MB)")
        
        print("\nONNX files:")
        if os.path.exists(ONNX_PATH):
            onnx_files = os.listdir(ONNX_PATH)
            for file in onnx_files:
                size_mb = os.path.getsize(os.path.join(ONNX_PATH, file)) / (1024 * 1024)
                print(f"  - {file} ({size_mb:.1f} MB)")
        
        # Calculate total size
        total_size = 0
        for dirpath, _, filenames in os.walk(BASE_PATH):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
        print(f"\nTotal model size: {total_size / (1024*1024*1024):.2f} GB")
        
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
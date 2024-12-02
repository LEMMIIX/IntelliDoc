import os
import requests
import sys
from huggingface_hub import snapshot_download

def find_project_root():
    """Find the project root by looking for node_modules"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    while current_dir != os.path.dirname(current_dir):  # Stop at root
        if os.path.exists(os.path.join(current_dir, 'node_modules')):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    
    # If no node_modules found, use the script's location as fallback
    return os.path.dirname(os.path.abspath(__file__))

# Model constants
MODEL_NAME = "Xenova/paraphrase-multilingual-mpnet-base-v2"  # Direct Xenova model
BASE_PATH = os.path.join(find_project_root(), 
                        "node_modules", "@xenova", "transformers", "models",
                        "Xenova", "paraphrase-multilingual-mpnet-base-v2")
ONNX_PATH = os.path.join(BASE_PATH, "onnx")

# Required files - minimal set needed for transformers.js
REQUIRED_FILES = [
    "config.json",
    "tokenizer.json",
    "special_tokens_map.json",
    "tokenizer_config.json"
]

# ONNX files needed for inference
ONNX_FILES = [
    "model.onnx",
    "model_quantized.onnx"  # Used by transformers.js when quantized=true
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
            os.remove(dest_path)  # Cleanup failed downloads
        return False

def download_model():
    """Download the model files"""
    print(f"Starting download to {BASE_PATH}")
    
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
        
        missing_files = []
        for file in REQUIRED_FILES:
            if not os.path.exists(os.path.join(BASE_PATH, file)):
                missing_files.append(file)
        
        for file in ONNX_FILES:
            if not os.path.exists(os.path.join(ONNX_PATH, file)):
                missing_files.append(f"onnx/{file}")
        
        if missing_files:
            print("\nWarning: Missing files:")
            for file in missing_files:
                print(f"  - {file}")
        
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
        # Install required packages if missing
        requirements = ['requests', 'huggingface_hub']
        for package in requirements:
            try:
                __import__(package)
            except ImportError:
                print(f"Installing {package}...")
                import subprocess
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        
        download_model()
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)
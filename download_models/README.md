# Model Download Scripts

Scripts for downloading transformer models required for IntelliDoc's keyword extraction and semantic search features. Uses @xenova/transformers.js for inference.

## Required Models

- `Xenova/all-mpnet-base-v2` - For keyword generation
- `Xenova/paraphrase-multilingual-mpnet-base-v2` - For multilingual document embeddings and semantic search

## Prerequisites

- Python 3.7+
- Hugging Face token (recommended for reliable downloads)
- Node.js with @xenova/transformers installed

## Setup

Set up your Hugging Face token:

```bash
# Windows PowerShell
$env:HF_TOKEN="your_token_here"

# Windows Command Prompt
set HF_TOKEN=your_token_here
```

Required Python packages are installed automatically:
- requests
- huggingface_hub

## Usage

Download both required models:

```bash
python all-mpnet-base-v2.py
python paraphrase-multilingual-mpnet-base-v2.py
```

## Directory Structure

Models are downloaded to `node_modules/@xenova/transformers/models`:

```
models/
└── Xenova/
    ├── all-mpnet-base-v2/
    │   ├── onnx/
    │   │   ├── model.onnx
    │   │   └── model_quantized.onnx
    │   └── [config files]
    └── paraphrase-multilingual-mpnet-base-v2/
        ├── onnx/
        │   ├── model.onnx
        │   └── model_quantized.onnx
        └── [config files]
```

## Troubleshooting

If downloads fail:
1. Verify HF_TOKEN is set correctly
2. Check internet connection
3. Ensure sufficient disk space
4. Try running the script again

For more information:
- [@xenova/transformers Documentation](https://github.com/xenova/transformers.js)
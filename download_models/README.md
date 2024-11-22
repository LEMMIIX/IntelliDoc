# Model Download Scripts

This collection of scripts facilitates downloading and organizing various transformer models for use with @xenova/transformers.js. The scripts handle downloading model files and ONNX weights, and organize them in the correct directory structure.

## Available Models

Currently supported models:
- `facebook/mbart-large-50` - Multilingual translation model
- `sentence-transformers/all-mpnet-base-v2` - Sentence embeddings model
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` - Multilingual sentence embeddings model
- `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` - Multilingual paraphrase model

## Prerequisites

- Python 3.7 or higher
- Hugging Face account and access token (for better download reliability)
- Node.js project with @xenova/transformers installed

## Installation

1. Set up your Hugging Face token as an environment variable:

```bash
# Linux/MacOS
export HF_TOKEN=your_token_here

# Windows Command Prompt
set HF_TOKEN=your_token_here

# Windows PowerShell
$env:HF_TOKEN="your_token_here"
```

2. Required Python packages will be automatically installed when running the scripts:
- `requests`
- `huggingface_hub`

## Usage

Each model has its own download script. Run the appropriate script for the model you need:

```bash
# For mBART-50
python mbart-large-50.py

# For MPNet
python all-mpnet-base-v2.py

# For MiniLM
python paraphrase-multilingual-MiniLM-L12-v2.py

# For multilingual MPNet
python paraphrase-multilingual-mpnet-base-v2.py
```

## Directory Structure

The scripts will create and organize files in the following structure under your project's `node_modules/@xenova/transformers/models` directory:

```
models/
├── facebook/
│   └── mbart-large-50/
│       ├── tokenizer/
│       ├── onnx/
│       └── [model files]
│
└── sentence-transformers/
    ├── all-mpnet-base-v2/
    │   ├── onnx/
    │   └── [model files]
    ├── paraphrase-multilingual-MiniLM-L12-v2/
    │   ├── onnx/
    │   └── [model files]
    └── paraphrase-multilingual-mpnet-base-v2/
        ├── onnx/
        └── [model files]
```

## Verification

Each script includes verification steps to ensure all necessary files are downloaded correctly. After download, the scripts will:
1. List all downloaded files with their sizes
2. Report any missing essential files
3. Show the total model size
4. Verify the ONNX file downloads

## Troubleshooting

Common issues and solutions:

1. **Download Rate Limiting**
   - Make sure you've set the HF_TOKEN environment variable
   - Check that your token has the correct permissions

2. **Missing Files**
   - If files are missing, try running the script again
   - Check your internet connection stability

3. **Permission Errors**
   - Ensure you have write permissions in the node_modules directory
   - Run the terminal/command prompt with appropriate permissions

4. **Space Issues**
   - Check available disk space before downloading
   - Some models (especially mBART) require significant storage space

## Support

If you encounter any issues:
1. Check the error messages in the console output
2. Verify your Hugging Face token is valid
3. Ensure you have stable internet connection
4. Check disk space availability

For additional help, refer to:
- [Hugging Face Documentation](https://huggingface.co/docs)
- [@xenova/transformers Documentation](https://github.com/xenova/transformers.js)
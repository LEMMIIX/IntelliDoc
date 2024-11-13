import os
import sys
import json
import re
import numpy as np
from typing import Dict, List
import onnxruntime as ort
from transformers import AutoTokenizer, GPT2TokenizerFast

class FolderNameGenerator:
    def __init__(self):
        try:
            self.model_path = "node_modules/@xenova/transformers/models/gpt2-medium-cpu"
            
            # Initialize tokenizer with proper configuration for GPT-2
            self.tokenizer = GPT2TokenizerFast.from_pretrained(self.model_path)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Initialize ONNX Runtime with optimized settings
            provider = 'CPUExecutionProvider'
            model_path = os.path.join(self.model_path, "onnx", "model.onnx")
            
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            sess_options.intra_op_num_threads = 4
            sess_options.inter_op_num_threads = 2
            
            self.model = ort.InferenceSession(
                model_path,
                sess_options=sess_options,
                providers=[provider]
            )
            
            # Text cleaning patterns by language
            self.patterns_to_remove = {
                'en': [
                    r'\b\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}\b',  # dates
                    r'\b\d+\b',  # numbers
                    r'^(the|a|an)\s+',  # articles
                    r'[^a-zA-Z0-9\s\-]+'  # special characters
                ],
                'de': [
                    r'\b\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}\b',
                    r'\b\d+\b',
                    r'^(der|die|das|ein|eine)\s+',
                    r'[^a-zA-ZäöüßÄÖÜ0-9\s\-]+'
                ]
            }
            
        except Exception as e:
            sys.stderr.write(f"Error initializing model: {str(e)}\n")
            raise

    def prepare_past_key_values(self, batch_size: int, sequence_length: int):
        """Initialize past key values for GPT-2"""
        num_layers = 24  # GPT2-medium specification
        num_attention_heads = 16
        head_size = 64
        
        shape = (batch_size, num_attention_heads, sequence_length, head_size)
        
        past_key_values = {}
        for i in range(num_layers):
            past_key_values[f'past_key_values.{i}.key'] = np.zeros(shape, dtype=np.float32)
            past_key_values[f'past_key_values.{i}.value'] = np.zeros(shape, dtype=np.float32)
            
        return past_key_values

    def generate_sequence(self, input_ids, attention_mask, params):
        """Generate sequence using provided parameters"""
        try:
            batch_size = input_ids.shape[0]
            current_length = input_ids.shape[1]
            
            position_ids = np.arange(current_length, dtype=np.int64)[None, :]
            generated = input_ids[0].tolist()
            past_kvs = self.prepare_past_key_values(batch_size, 0)
            
            for _ in range(params['max_tokens']):
                inputs = {
                    'input_ids': input_ids.astype(np.int64),
                    'attention_mask': attention_mask.astype(np.int64),
                    'position_ids': position_ids.astype(np.int64),
                    **past_kvs
                }
                
                outputs = self.model.run(None, inputs)
                logits = outputs[0]
                presents = outputs[1:]
                
                next_token_logits = logits[0, -1, :]
                
                # Apply temperature
                next_token_logits = next_token_logits / params['temperature']
                
                # Apply presence penalty
                if params.get('presence_penalty', 0) > 0:
                    for id in set(generated):
                        next_token_logits[id] -= params['presence_penalty']
                
                # Apply frequency penalty
                if params.get('frequency_penalty', 0) > 0:
                    for id in generated:
                        next_token_logits[id] -= params['frequency_penalty']
                
                # Apply top-p (nucleus) sampling
                if params.get('top_p', 1.0) < 1.0:
                    sorted_logits, sorted_indices = np.sort(next_token_logits)[::-1], np.argsort(next_token_logits)[::-1]
                    cumulative_probs = np.cumsum(self.softmax(sorted_logits))
                    sorted_indices_to_remove = cumulative_probs > params['top_p']
                    sorted_indices_to_remove[1:] = sorted_indices_to_remove[:-1].copy()
                    sorted_indices_to_remove[0] = False
                    indices_to_remove = sorted_indices[sorted_indices_to_remove]
                    next_token_logits[indices_to_remove] = float('-inf')
                
                # Sample token
                probs = self.softmax(next_token_logits)
                next_token = np.random.choice(len(probs), p=probs)
                
                # Check stop sequences
                if next_token == self.tokenizer.eos_token_id or \
                   any(self.tokenizer.decode(generated + [next_token]).endswith(stop) 
                       for stop in params.get('stop_sequences', [])):
                    break
                
                generated.append(next_token)
                
                # Update inputs for next iteration
                input_ids = np.array([[next_token]], dtype=np.int64)
                attention_mask = np.ones((1, len(generated)), dtype=np.int64)
                position_ids = np.array([[len(generated) - 1]], dtype=np.int64)
                
                # Update past key values
                for i, (key, value) in enumerate(zip(presents[::2], presents[1::2])):
                    past_kvs[f'past_key_values.{i}.key'] = key
                    past_kvs[f'past_key_values.{i}.value'] = value
            
            return np.array(generated)
            
        except Exception as e:
            sys.stderr.write(f"Error in generate_sequence: {str(e)}\n")
            raise

    def softmax(self, x):
        """Compute softmax values"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()

    def clean_folder_name(self, name: str, language: str) -> str:
        """Clean and format folder name"""
        # Apply language-specific cleaning patterns
        for pattern in self.patterns_to_remove[language]:
            name = re.sub(pattern, ' ', name)
        
        # Split into words and apply capitalization
        words = name.split()
        words = [w.capitalize() for w in words if len(w) > 1][:4]  # Limit to 4 words
        
        return ' '.join(words)

    def generateFolderNames(self, input_data: Dict) -> Dict:
        """Generate folder names based on input parameters from Node.js"""
        try:
            text = input_data.get('text', '')
            existing_folders = input_data.get('existingFolders', [])
            params = input_data.get('params', {})
            language = params.get('language', 'en')
            
            if not text:
                return {
                    "suggestions": ["Untitled Document"] if language == 'en' else ["Unbenanntes Dokument"],
                    "error": "Empty input text"
                }
            
            # Encode input text
            inputs = self.tokenizer(
                text,
                return_tensors="np",
                max_length=512,
                truncation=True,
                padding=True
            )
            
            suggestions = set()
            max_attempts = params.get('num_suggestions', 3) * 2
            
            generation_params = {
                'temperature': params.get('temperature', 0.85),
                'top_p': params.get('top_p', 0.92),
                'max_tokens': params.get('max_tokens', 12),
                'stop_sequences': params.get('stop_sequences', ["\n", ".", ","]),
                'presence_penalty': params.get('presence_penalty', 0.6),
                'frequency_penalty': params.get('frequency_penalty', 0.7)
            }
            
            for _ in range(max_attempts):
                if len(suggestions) >= params.get('num_suggestions', 3):
                    break
                    
                try:
                    output_ids = self.generate_sequence(
                        inputs['input_ids'],
                        inputs['attention_mask'],
                        generation_params
                    )
                    
                    decoded = self.tokenizer.decode(output_ids, skip_special_tokens=True)
                    folder_name = decoded.split("name:")[-1].strip()
                    
                    # Clean and format the name
                    folder_name = self.clean_folder_name(folder_name, language)
                    
                    # Only add if it's not in existing folders and is valid
                    if folder_name and folder_name not in existing_folders and folder_name not in suggestions:
                        suggestions.add(folder_name)
                        
                except Exception as e:
                    sys.stderr.write(f"Error generating suggestion: {str(e)}\n")
                    continue
            
            if not suggestions:
                return {
                    "suggestions": ["Untitled Document"] if language == 'en' else ["Unbenanntes Dokument"],
                    "metadata": {
                        "model": "gpt2-medium-cpu",
                        "language": language,
                        "params": generation_params
                    }
                }
            
            return {
                "suggestions": list(suggestions),
                "metadata": {
                    "model": "gpt2-medium-cpu",
                    "language": language,
                    "params": generation_params
                }
            }
            
        except Exception as e:
            sys.stderr.write(f"Error in generateFolderNames: {str(e)}\n")
            return {
                "suggestions": ["Untitled Document"] if language == 'en' else ["Unbenanntes Dokument"],
                "error": str(e)
            }

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize generator
        generator = FolderNameGenerator()
        
        # Generate names
        result = generator.generateFolderNames(input_data)
        
        # Write result to stdout with proper formatting
        print(json.dumps(result, ensure_ascii=False), flush=True)
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "suggestions": ["Untitled Document"],
            "metadata": {
                "model": "gpt2-medium-cpu",
                "status": "error"
            }
        }
        print(json.dumps(error_response, ensure_ascii=False), flush=True)
        sys.exit(1)
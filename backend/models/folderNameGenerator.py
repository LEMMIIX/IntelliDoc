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
            # Model initialization
            self.model_path = "node_modules/@xenova/transformers/models/gpt2-medium-cpu"
            
            # Model generation parameters
            self.generation_params = {
                'temperature': 0.8,     # Higher temperature for more creative names
                'top_p': 0.92,          # Nucleus sampling for better diversity
                'max_tokens': 10,        # Reasonable length for folder names
                'stop_sequences': ["\n", ".", ","],  # Stop generating at these sequences
                'presence_penalty': 0.7,  # Encourage diverse word usage
                'frequency_penalty': 0.8  # Discourage repetitive patterns
            }
            
            self._initialize_tokenizer()
            self._initialize_model()
            self._setup_cleaning_patterns()
            
        except Exception as e:
            sys.stderr.write(f"Error initializing model: {str(e)}\n")
            raise

    def _initialize_tokenizer(self):
        """Initialize tokenizer with proper configuration for GPT-2"""
        self.tokenizer = GPT2TokenizerFast.from_pretrained(self.model_path)
        self.tokenizer.pad_token = self.tokenizer.eos_token

    def _initialize_model(self):
        """Initialize ONNX Runtime with optimized settings"""
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

    def _setup_cleaning_patterns(self):
        """Set up text cleaning patterns by language"""
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

    def _prepare_past_key_values(self, batch_size: int, sequence_length: int) -> Dict:
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

    def _generate_sequences(self, input_ids: np.ndarray, attention_mask: np.ndarray, num_sequences: int = 3) -> List[np.ndarray]:
        """Generate multiple sequences in parallel"""
        try:
            # Create batch of same input
            batch_size = num_sequences
            input_ids = np.repeat(input_ids, batch_size, axis=0)
            attention_mask = np.repeat(attention_mask, batch_size, axis=0)
            
            current_length = input_ids.shape[1]
            position_ids = np.arange(current_length, dtype=np.int64)[None, :]
            position_ids = np.repeat(position_ids, batch_size, axis=0)
            
            # Track generated sequences separately
            generated_sequences = [input_ids[i].tolist() for i in range(batch_size)]
            past_kvs = self._prepare_past_key_values(batch_size, 0)
            
            # Keep track of which sequences are completed
            completed = [False] * batch_size
            
            for _ in range(self.generation_params['max_tokens']):
                # Skip if all sequences are completed
                if all(completed):
                    break
                    
                inputs = {
                    'input_ids': input_ids.astype(np.int64),
                    'attention_mask': attention_mask.astype(np.int64),
                    'position_ids': position_ids.astype(np.int64),
                    **past_kvs
                }
                
                outputs = self.model.run(None, inputs)
                logits = outputs[0]  # Shape: [batch_size, 1, vocab_size]
                presents = outputs[1:]
                
                next_tokens = []
                for i in range(batch_size):
                    if completed[i]:
                        next_tokens.append(self.tokenizer.pad_token_id)
                        continue
                        
                    next_token_logits = logits[i, -1, :]
                    
                    # Apply temperature and penalties
                    next_token_logits = next_token_logits / self.generation_params['temperature']
                    
                    if self.generation_params['presence_penalty'] > 0:
                        for id in set(generated_sequences[i]):
                            next_token_logits[id] -= self.generation_params['presence_penalty']
                    
                    if self.generation_params['frequency_penalty'] > 0:
                        for id in generated_sequences[i]:
                            next_token_logits[id] -= self.generation_params['frequency_penalty']
                    
                    # Apply top-p sampling
                    if self.generation_params['top_p'] < 1.0:
                        sorted_logits, sorted_indices = np.sort(next_token_logits)[::-1], np.argsort(next_token_logits)[::-1]
                        cumulative_probs = np.cumsum(self._softmax(sorted_logits))
                        sorted_indices_to_remove = cumulative_probs > self.generation_params['top_p']
                        sorted_indices_to_remove[1:] = sorted_indices_to_remove[:-1].copy()
                        sorted_indices_to_remove[0] = False
                        indices_to_remove = sorted_indices[sorted_indices_to_remove]
                        next_token_logits[indices_to_remove] = float('-inf')
                    
                    # Sample token
                    probs = self._softmax(next_token_logits)
                    next_token = np.random.choice(len(probs), p=probs)
                    
                    # Check if sequence should be completed
                    sequence = generated_sequences[i] + [next_token]
                    decoded = self.tokenizer.decode(sequence)
                    if (next_token == self.tokenizer.eos_token_id or 
                        any(decoded.endswith(stop) for stop in self.generation_params['stop_sequences'])):
                        completed[i] = True
                        next_token = self.tokenizer.pad_token_id
                    
                    next_tokens.append(next_token)
                    if not completed[i]:
                        generated_sequences[i].append(next_token)
                
                # Update inputs for next iteration
                input_ids = np.array([[t] for t in next_tokens], dtype=np.int64)
                attention_mask = np.ones((batch_size, 1), dtype=np.int64)
                position_ids = np.array([[len(seq)] for seq in generated_sequences], dtype=np.int64)
                
                # Update past key values
                for i, (key, value) in enumerate(zip(presents[::2], presents[1::2])):
                    past_kvs[f'past_key_values.{i}.key'] = key
                    past_kvs[f'past_key_values.{i}.value'] = value
            
            return [np.array(seq) for seq in generated_sequences]
            
        except Exception as e:
            sys.stderr.write(f"Error in generate_sequences: {str(e)}\n")
            raise

    def _softmax(self, x: np.ndarray) -> np.ndarray:
        """Compute softmax values"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()

    def _clean_folder_name(self, name: str, language: str) -> str:
        """Clean and format folder name"""
        # Apply language-specific cleaning patterns
        for pattern in self.patterns_to_remove[language]:
            name = re.sub(pattern, ' ', name)
        
        # Split into words and apply capitalization
        words = name.split()
        words = [w.capitalize() for w in words if len(w) > 1][:4]  # Limit to 4 words
        
        return ' '.join(words)

    def generateFolderNames(self, input_data: Dict) -> Dict:
        """Generate folder names based on input text"""
        try:
            text = input_data.get('text', '')
            existing_folders = input_data.get('existingFolders', [])
            language = input_data.get('language', 'en')
            num_suggestions = input_data.get('num_suggestions', 3)
            
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
            
            # Generate multiple sequences at once
            output_sequences = self._generate_sequences(
                inputs['input_ids'],
                inputs['attention_mask'],
                num_sequences=num_suggestions
            )
            
            # Process and clean the generated names
            suggestions = set()
            for sequence in output_sequences:
                folder_name = self.tokenizer.decode(sequence, skip_special_tokens=True)
                folder_name = self._clean_folder_name(folder_name, language)
                
                if folder_name and folder_name not in existing_folders:
                    suggestions.add(folder_name)
            
            # If we didn't get enough valid suggestions, return what we have
            if not suggestions:
                return {
                    "suggestions": ["Untitled Document"] if language == 'en' else ["Unbenanntes Dokument"],
                    "metadata": {
                        "model": "gpt2-medium-cpu",
                        "language": language
                    }
                }
            
            return {
                "suggestions": list(suggestions),
                "metadata": {
                    "model": "gpt2-medium-cpu",
                    "language": language
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
        
        # Initialize generator and generate names
        generator = FolderNameGenerator()
        result = generator.generateFolderNames(input_data)
        
        # Write result to stdout
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
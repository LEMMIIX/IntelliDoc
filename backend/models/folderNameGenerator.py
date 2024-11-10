import argparse
import json
import sys
import torch
from transformers import MBartForConditionalGeneration as AutoModelForSeq2SeqGeneration, MBartTokenizer
import re
import gc
from contextlib import contextmanager
import resource
import logging
from typing import List, Dict, Generator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class MemoryTracker:
    @staticmethod
    def get_memory_usage():
        """Get current memory usage in MB"""
        usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return usage / 1024  # Convert KB to MB

    @staticmethod
    @contextmanager
    def track_memory():
        """Context manager to track memory usage"""
        start_mem = MemoryTracker.get_memory_usage()
        try:
            yield
        finally:
            end_mem = MemoryTracker.get_memory_usage()
            logger.info(f"Memory change: {end_mem - start_mem:.2f}MB")

class LanguageDetector:
    def __init__(self):
        self.german_markers = {
            'words': {'der', 'die', 'das', 'und', 'ist', 'von', 'für', 'mit', 'auf', 'im',
                     'bei', 'den', 'des', 'dem', 'ein', 'eine', 'einer', 'einen'},
            'chars': {'ä', 'ö', 'ü', 'ß'}
        }
        try:
            from langdetect import detect
            self.detect_fn = detect
        except ImportError:
            self.detect_fn = None
            logger.warning("langdetect not available, using basic detection")

    def detect(self, text: str) -> str:
        if self.detect_fn:
            try:
                return self.detect_fn(text)
            except:
                pass
        
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        german_indicators = (
            len(words.intersection(self.german_markers['words'])) +
            sum(1 for c in text_lower if c in self.german_markers['chars'])
        )
        return 'de' if german_indicators >= 2 else 'en'

class FolderNameGenerator:
    LANG_MAP = {
        'en': 'en_XX',
        'de': 'de_DE'
    }
    
    MODEL_CONFIG = {
        'use_cache': True,
        'low_cpu_mem_usage': True,
        'device_map': 'auto',
        'load_in_8bit': True
    }
    
    GENERATION_CONFIG = {
        'max_length': 32,
        'min_length': 2,
        'no_repeat_ngram_size': 2,
        'num_beams': 3,
        'temperature': 0.7,
        'do_sample': True,
        'top_k': 50,
        'top_p': 0.95,
        'early_stopping': True
    }

    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        self.model_name = "facebook/mbart-large-50"
        self.load_model()
        self.language_detector = LanguageDetector()
        
        self.templates = {
            'en': {
                'prompt': "Generate folder name for content: {text}",
                'validation': r'^[A-Za-z0-9\s-]{1,30}$'
            },
            'de': {
                'prompt': "Generiere Ordnername für Inhalt: {text}",
                'validation': r'^[A-Za-zÄäÖöÜüß0-9\s-]{1,30}$'
            }
        }

    def load_model(self):
        """Load model with memory tracking and optimization"""
        with MemoryTracker.track_memory():
            logger.info("Loading mBART model...")
            try:
                self.tokenizer = MBartTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSeq2SeqGeneration.from_pretrained(
                    self.model_name,
                    **self.MODEL_CONFIG
                )
                self.model.to(self.device)
                self.model.eval()
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.error(f"Error loading model: {str(e)}")
                raise

    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'model'):
            del self.model
        if hasattr(self, 'tokenizer'):
            del self.tokenizer
        gc.collect()
        logger.info("Resources cleaned up")

    def format_input(self, text: str, lang: str) -> str:
        """Format input text with language code"""
        template = self.templates[lang]['prompt']
        return template.format(text=text) + f" <2{self.LANG_MAP[lang]}>"

    def generate_name_candidates(self, prompt: str, lang: str) -> Generator[str, None, None]:
        """Generate name candidates with memory-efficient generator pattern"""
        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    forced_bos_token_id=self.tokenizer.lang_code_to_id[self.LANG_MAP[lang]],
                    **self.GENERATION_CONFIG
                )

            for output in outputs:
                name = self.tokenizer.decode(output, skip_special_tokens=True)
                name = self.clean_folder_name(name.strip(), lang)
                if name and self.validate_folder_name(name, lang):
                    yield name

        except Exception as e:
            logger.error(f"Error in name generation: {str(e)}")
            raise

    def clean_folder_name(self, name: str, lang: str) -> str:
        """Clean and format folder name"""
        if lang == 'de':
            name = re.sub(r'[^A-Za-zÄäÖöÜüß0-9\s-]', '', name)
        else:
            name = re.sub(r'[^A-Za-z0-9\s-]', '', name)
        
        words = name.split()[:3]  # Limit to 3 words
        return ' '.join(words) if words else ''

    def validate_folder_name(self, name: str, lang: str) -> bool:
        """Validate folder name against language-specific patterns"""
        if not name or len(name) < 2:
            return False
        pattern = self.templates[lang]['validation']
        return bool(re.match(pattern, name))

    def generate_names(self, text: str, existing_folders: List[str], num_suggestions: int = 3,
                      language: str = 'auto') -> Dict:
        """Main method to generate folder names"""
        with MemoryTracker.track_memory():
            try:
                # Detect language if auto
                if language == 'auto':
                    language = self.language_detector.detect(text)
                if language not in self.LANG_MAP:
                    language = 'en'

                # Prepare input
                text = text[:500]  # Limit input length
                prompt = self.format_input(text, language)
                
                # Generate and collect unique suggestions
                suggestions = set()
                max_attempts = 3
                
                for _ in range(max_attempts):
                    if len(suggestions) >= num_suggestions:
                        break
                        
                    for name in self.generate_name_candidates(prompt, language):
                        if (name.lower() not in [f.lower() for f in existing_folders] and
                            name.lower() not in [s.lower() for s in suggestions]):
                            suggestions.add(name)
                            if len(suggestions) >= num_suggestions:
                                break

                # Add fallback names if needed
                while len(suggestions) < num_suggestions:
                    fallback = f"{'Neuer_Ordner' if language == 'de' else 'New_Folder'}_{len(suggestions) + 1}"
                    if fallback not in suggestions:
                        suggestions.add(fallback)

                return {
                    'suggestions': list(suggestions),
                    'language': language
                }

            except Exception as e:
                logger.error(f"Error in generate_names: {str(e)}")
                # Provide fallback suggestions in case of error
                fallback_suggestions = [
                    f"{'Neuer_Ordner' if language == 'de' else 'New_Folder'}_{i+1}"
                    for i in range(num_suggestions)
                ]
                return {
                    'suggestions': fallback_suggestions,
                    'language': language,
                    'error': str(e)
                }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--language', default='auto')
    parser.add_argument('--num_suggestions', type=int, default=3)
    args = parser.parse_args()

    try:
        input_data = json.loads(sys.stdin.read())
        text = input_data['text']
        existing_folders = input_data.get('existing_folders', [])

        generator = FolderNameGenerator()
        result = generator.generate_names(
            text,
            existing_folders,
            num_suggestions=args.num_suggestions,
            language=args.language
        )
        
        print(json.dumps(result))

    except Exception as e:
        logger.error(f"Critical error in main: {str(e)}")
        print(json.dumps({
            'error': str(e),
            'suggestions': ['New_Folder_1', 'New_Folder_2', 'New_Folder_3'],
            'language': 'en'
        }))

if __name__ == "__main__":
    main()
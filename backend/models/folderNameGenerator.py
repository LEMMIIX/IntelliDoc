import argparse
import json
import sys
import re
import logging
from typing import List, Dict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class FolderNameGenerator:
    def __init__(self):
        self.templates = {
            'en': {
                'categories': {
                    'finance': ['financial', 'report', 'budget', 'expense', 'invoice'],
                    'tech': ['technical', 'software', 'system', 'data', 'documentation'],
                    'project': ['project', 'plan', 'timeline', 'milestone', 'task']
                }
            },
            'de': {
                'categories': {
                    'finance': ['finanzen', 'bericht', 'budget', 'ausgaben', 'rechnung'],
                    'tech': ['technisch', 'software', 'system', 'daten', 'dokumentation'],
                    'project': ['projekt', 'planung', 'zeitplan', 'meilenstein', 'aufgabe']
                }
            }
        }

    def generate_names(self, text: str, existing_folders: List[str], num_suggestions: int = 3,
                      language: str = 'auto') -> Dict:
        """Generate folder name suggestions"""
        try:
            if not text:
                raise ValueError("Empty text input")
                
            # Detect language if auto
            if language == 'auto':
                from langdetect import detect
                try:
                    language = detect(text)
                except:
                    language = 'en'
            
            if language not in ['en', 'de']:
                language = 'en'

            # Clean input text
            text = text.lower()
            suggestions = set()

            # Generate category-based names
            categories = self.templates[language]['categories']
            for category, keywords in categories.items():
                if any(keyword in text for keyword in keywords):
                    if language == 'de':
                        if category == 'finance':
                            suggestions.add('Finanzberichte')
                            suggestions.add('Buchhaltung')
                        elif category == 'tech':
                            suggestions.add('Technische_Dokumente')
                            suggestions.add('Systemdokumentation')
                        elif category == 'project':
                            suggestions.add('Projektübersicht')
                            suggestions.add('Projektmanagement')
                    else:
                        if category == 'finance':
                            suggestions.add('Financial_Reports')
                            suggestions.add('Accounting')
                        elif category == 'tech':
                            suggestions.add('Technical_Documents')
                            suggestions.add('System_Documentation')
                        elif category == 'project':
                            suggestions.add('Project_Overview')
                            suggestions.add('Project_Management')

            # Generate name from content
            words = [w for w in text.split() if len(w) > 3][:3]
            if words:
                name = ' '.join(words)
                clean_name = self._clean_folder_name(name, language)
                if clean_name:
                    suggestions.add(clean_name)

            # Filter existing folders
            suggestions = {s for s in suggestions 
                         if s.lower() not in [f.lower() for f in existing_folders]}

            # Add fallback names if needed
            while len(suggestions) < num_suggestions:
                fallback = f"{'Neuer_Ordner' if language == 'de' else 'New_Folder'}_{len(suggestions) + 1}"
                if fallback not in suggestions:
                    suggestions.add(fallback)

            return {
                'suggestions': list(suggestions)[:num_suggestions],
                'language': language
            }

        except Exception as e:
            logger.error(f"Error in generate_names: {str(e)}")
            fallback_suggestions = [
                f"{'Neuer_Ordner' if language == 'de' else 'New_Folder'}_{i+1}"
                for i in range(num_suggestions)
            ]
            return {
                'suggestions': fallback_suggestions,
                'language': language,
                'error': str(e)
            }

    def _clean_folder_name(self, name: str, language: str) -> str:
        """Clean and format folder name"""
        if language == 'de':
            name = re.sub(r'[^A-Za-zÄäÖöÜüß0-9\s-]', '', name)
        else:
            name = re.sub(r'[^A-Za-z0-9\s-]', '', name)
        
        words = name.split()[:3]  # Limit to 3 words
        return ' '.join(words) if words else ''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--language', default='auto')
    parser.add_argument('--num_suggestions', type=int, default=3)
    args = parser.parse_args()

    try:
        input_data = json.loads(sys.stdin.read())
        logger.info(f"Received input: {input_data}")  # Add this line
        text = input_data.get('text')
        existing_folders = input_data.get('existing_folders', [])

        if not text:
            raise ValueError("No text provided in input")

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
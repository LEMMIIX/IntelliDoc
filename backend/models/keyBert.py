# -*- coding: utf-8 -*-
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
import json

# Funktion zur Schlagwort-Generierung
def generate_keywords(text, max_keywords=3):
    # Lade das MiniLM-Modell mit sentence-transformers
    minilm_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    model = KeyBERT(minilm_model)  
    
    # Extrahiere die Keywords
    keywords = model.extract_keywords(text, keyphrase_ngram_range=(1, 1), stop_words='english', top_n=max_keywords)
    
    return json.dumps([keyword[0] for keyword in keywords])  

if __name__ == "__main__":
    import sys
    text_input = sys.stdin.read()  #Eingabetext
    print(generate_keywords(text_input))  # Gibt die Keywords zurück

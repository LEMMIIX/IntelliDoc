import sys
import io
import base64
from keybert import keyBERT
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

def extract_text_from_pdf(pdf_base64):
    pdf_buffer = io.BytesIO(base64.b64decode(pdf_base64))
    output_buffer = io.StringIO()
    
    laparams = LAParams(line_margin=0.5, word_margin=0.1)
    extract_text_to_fp(pdf_buffer, output_buffer, laparams=laparams, codec='utf-8')
    
    return output_buffer.getvalue()
# Funktion zur Schlagwort-Generierung
def generate_keywords(text, max_keywords=4):
    model = KeyBERT()  # Initialisiere KeyBERT
    keywords = model.extract_keywords(text, keyphrase_ngram_range=(1, 1), stop_words='english', top_n=max_keywords)
    
    # Gib nur die Schlagwörter ohne die Score-Werte zurück
    return [keyword[0] for keyword in keywords]

if __name__ == "__main__":
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    
    pdf_base64 = sys.stdin.read()
    extracted_text = extract_text_from_pdf(pdf_base64)
    
    sys.stdout.write(extracted_text)

     # Generiert Schlagwörter aus dem extrahierten Text
    keywords = generate_keywords(extracted_text)
    
    # Gib die Schlagwörter als kommaseparierte aus
    print(",".join(keywords))

    sys.stdout.flush()

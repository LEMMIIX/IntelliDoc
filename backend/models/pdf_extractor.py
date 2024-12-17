"""
Diese Datei enthält Funktionen zum Extrahieren von Text aus PDF-Dokumenten.
Sie ermöglicht die Dekodierung von Base64-kodierten PDF-Dateien und die Textextraktion mithilfe von pdfminer.

@autor Miray. 
Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
"""

import sys
import io
import base64
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

def extract_text_from_pdf(pdf_base64):
    pdf_buffer = io.BytesIO(base64.b64decode(pdf_base64))
    output_buffer = io.StringIO()
    
    laparams = LAParams(line_margin=0.5, word_margin=0.1)
    extract_text_to_fp(pdf_buffer, output_buffer, laparams=laparams, codec='utf-8')
    
    return output_buffer.getvalue()

if __name__ == "__main__":
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    
    pdf_base64 = sys.stdin.read()
    extracted_text = extract_text_from_pdf(pdf_base64)
    
    sys.stdout.write(extracted_text)
    sys.stdout.flush()

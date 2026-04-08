import asyncio
import httpx
import os
from pathlib import Path

os.chdir("/Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/backend")
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

# Test with a simple PDF
try:
    from app.services.cv_parser import extract_text_from_bytes
    from app.services.cv_structurer import structure_cv
    
    # Create a simple test PDF
    import io
    from reportlab.pdfgen import canvas
    
    pdf_bytes = io.BytesIO()
    c = canvas.Canvas(pdf_bytes)
    c.drawString(100, 750, "John Doe")
    c.drawString(100, 730, "Software Engineer")
    c.drawString(100, 710, "Skills: Python, JavaScript")
    c.save()
    pdf_bytes.seek(0)
    pdf_data = pdf_bytes.getvalue()
    
    print("Extracting text...")
    raw_text = extract_text_from_bytes(pdf_data, "test.pdf")
    print(f"Raw text: {raw_text}")
    
    print("\nStructuring CV...")
    profile = asyncio.run(structure_cv(raw_text))
    print(f"Profile: {profile}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

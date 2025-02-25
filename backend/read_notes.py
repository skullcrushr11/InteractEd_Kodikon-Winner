import pdfplumber

def pdf_to_text(file_stream):
    with pdfplumber.open(file_stream) as pdf:
        extracted_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    return extracted_text

if __name__ == "__main__":
    notes_path = r"C:\Users\gpshr\Desktop\example_notes.pdf"

    something = open(notes_path, 'rb')
    print(pdf_to_text(something))
    something.close()
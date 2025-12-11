import os
from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions, 
    smolvlm_picture_description,
    RapidOcrOptions
)
from docling.datamodel.base_models import InputFormat


def convert_document(file_path) :

    source = file_path

    pipeline_options = PdfPipelineOptions(
        generate_page_images=True,
        images_scale=1.00,
        do_ocr=True,
        do_picture_description=True,
        ocr_options=RapidOcrOptions(lang=['ara', 'fra']),
        picture_description_options=smolvlm_picture_description,
    )

    converter = DocumentConverter(
        format_options={InputFormat.PDF: PdfPipelineOptions(pipeline_options = pipeline_options)},
    )
    result = converter.convert(source)

    # convert markdown to text
    text = result.document.export_to_text()

    return text

def get_category_from_path(file_path):
    """Détecte la catégorie du fichier basé sur son chemin"""
    file_path_lower = file_path.lower()
    
    if "convention" in file_path_lower:
        return "Convention"
    elif "depot" in file_path_lower or "vente" in file_path_lower:
        return "Depot_Vente"
    elif "offre" in file_path_lower and "ar" in file_path_lower:
        return "Offres_Arabe"
    elif "offre" in file_path_lower:
        return "Offres"
    else:
        return "Autres"

input_folder = "AgenticAi/data/input"
output_base_folder = "AgenticAi/data/processed"

# Create base output folder
if not os.path.exists(output_base_folder):
    os.makedirs(output_base_folder)

for root, dirs, files in os.walk(input_folder):
    for file_name in files:
        if file_name.endswith((".pdf", ".docx", ".doc")):
            # Skip Guide NGBSS files
            if "Guide NGBSS" in file_name or "guide ngbss" in file_name.lower():
                print(f"⏭️  Skipping: {file_name}")
                continue
            
            file_path = os.path.join(root, file_name)
            
            # Determine category
            category = get_category_from_path(file_path)
            
            # Create category folder
            category_folder = os.path.join(output_base_folder, category)
            if not os.path.exists(category_folder):
                os.makedirs(category_folder)
            
            print(f" Processing: {file_name} → {category}")
            
            try:
                # Convert document
                text = convert_document(file_path)
                
                # Save to category folder
                output_file_path = os.path.join(category_folder, file_name + ".txt")
                with open(output_file_path, "w", encoding="utf-8") as f:
                    f.write(text)
                
                print(f" Saved: {output_file_path}")
                
            except Exception as e:
                print(f" Error processing {file_name}: {e}")

print("\n🎉 All files processed!")
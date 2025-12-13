import os
from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions, 
    smolvlm_picture_description,
    RapidOcrOptions
)
from docling.datamodel.base_models import InputFormat
import requests
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import time


def convert_document(file_path):
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
        format_options={InputFormat.PDF: PdfPipelineOptions(pipeline_options=pipeline_options)},
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


def detect_language(text):
    """Détecte si le texte est en arabe ou français"""
    # Count Arabic characters
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    total_chars = len([c for c in text if c.isalpha()])
    
    if total_chars == 0:
        return "fr"
    
    # Si plus de 30% de caractères arabes, c'est un document arabe
    return "ar" if (arabic_chars / total_chars) > 0.3 else "fr"


def chat_with_deepseek(messages, api_key="01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA", model="deepseek-v3.1"):
    """Send chat messages to DeepSeek API"""
    
    url = "https://api.modelarts-maas.com/v2/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    data = {
        "messages": messages,
        "model": model,
        "stream": False,
        "temperature": 0.2
    }
    
    response = requests.post(url, headers=headers, json=data, timeout=60)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API Error {response.status_code}: {response.json()}")


def process_single_file(file_path, file_name, max_retries=5):
    """Process a single file with DeepSeek with retry logic"""
    
    retry_count = 0
    base_delay = 2  # Start with 2 seconds delay
    
    while retry_count < max_retries:
        try:
            # Read text content
            with open(file_path, 'r', encoding='utf-8') as f:
                original_text = f.read()
            
            # Detect language
            language = detect_language(original_text)
            
            # Adapt prompt based on language
            if language == "ar":
                user_prompt = f"""أنت خبير في معالجة الوثائق التقنية لاتصالات الجزائر بخبرة 10 سنوات.

المهمة 1 - تنظيف النص (مهم جداً):
- احذف جميع أخطاء OCR (الحروف المعترف بها بشكل خاطئ، المسافات غير الصحيحة)
- صحح الكلمات العربية المكتوبة بشكل خاطئ
- احذف التكرارات في الجمل أو الفقرات
- نظم المسافات: مسافة واحدة بين الكلمات، سطرين كحد أقصى بين الأقسام
- احذف الرموز الخاصة الطفيلية (*, _, #, إلخ.)
- احتفظ بجميع الأرقام، التعريفات، السرعات، التواريخ، المراجع
- احتفظ بالبنية المنطقية للوثيقة (العناوين، الفقرات، القوائم)
- يجب أن يكون النص النظيف سلساً ومهنياً

المهمة 2 - الملخص (3-5 جمل كحد أقصى بالعربية):
- الجملة الأولى: ما هو نوع الوثيقة (اتفاقية، عرض، دليل، إلخ.)
- الجملة الثانية: من هم الفاعلون الرئيسيون (اتصالات الجزائر، الشركاء، العملاء)
- الجملة الثالثة: ما هو الهدف الرئيسي للوثيقة
- الجمل التالية: المعلومات الرئيسية (التعريفات، الإجراءات، التواريخ المهمة)
- كن موجزاً ودقيقاً، بدون تفاصيل غير ضرورية

المهمة 3 - التصنيف:
- Convention: اتفاقيات بين AT والشركات، العقود، الشراكات
- Depot_Vente: إدارة نقاط البيع، إجراءات المتاجر، المخزون
- Guide_NGBSS: أدلة تقنية، إجراءات النظام، دلائل
- Offres: عروض تجارية، حجج البيع، تعريفات العملاء، الحزم

المهمة 4 - الاستخراج:
- Partner: الاسم الدقيق للشريك المذكور (سوناطراك، سونلغاز، المؤسسة X/Y/Z، إلخ.)
- Offer_type: Gamers، Fibre، ADSL، 4G LTE، Locataire، Propriétaire، Professionnel، إلخ.

---

الوثيقة المراد تحليلها:
اسم الملف: {file_name}

المحتوى (أول 4000 حرف):
{original_text[:4000]}

---

أرجع فقط هذا JSON (بدون markdown، بدون backticks):
{{
  "cleaned_text": "النص الكامل المنظف هنا",
  "summary": "ملخص من 3-5 جمل دقيقة وموجزة بالعربية",
  "category": "Convention أو Depot_Vente أو Guide_NGBSS أو Offres",
  "partner": "الاسم الدقيق للشريك أو Inconnu",
  "offer_type": "النوع الدقيق للعرض أو N/A"
}}"""
            else:
                user_prompt = f"""Tu es un expert en traitement de documents techniques Algérie Télécom avec 10 ans d'expérience.

TÂCHE 1 - NETTOYAGE DU TEXTE (TRÈS IMPORTANT):
- Supprime TOUTES les erreurs d'OCR (lettres mal reconnues, espaces incorrects)
- Corrige les mots arabes mal transcrits
- Élimine les répétitions de phrases ou paragraphes
- Normalise les espaces: un seul espace entre mots, deux retours à la ligne maximum entre sections
- Supprime les caractères spéciaux parasites (*, _, #, etc.)
- Conserve ABSOLUMENT tous les chiffres, tarifs, débits, dates, références
- Garde la structure logique du document (titres, paragraphes, listes)
- Le texte nettoyé doit être fluide et professionnel

TÂCHE 2 - RÉSUMÉ (3-5 PHRASES MAXIMUM):
- Première phrase: Quel est le type de document (convention, offre, guide, etc.)
- Deuxième phrase: Qui sont les acteurs principaux (Algérie Télécom, partenaires, clients)
- Troisième phrase: Quel est l'objectif principal du document
- Phrases suivantes: Informations clés (tarifs, procédures, dates importantes)
- Sois CONCIS et PRÉCIS, pas de détails inutiles

TÂCHE 3 - CATÉGORISATION:
- Convention: accords entre AT et entreprises, contrats, partenariats
- Depot_Vente: gestion points de vente, procédures magasins, stocks
- Guide_NGBSS: guides techniques, procédures système, manuels
- Offres: offres commerciales, argumentaires, tarifs clients, packs

TÂCHE 4 - EXTRACTION:
- Partner: nom exact du partenaire mentionné (Sonatrach, Sonelgaz, Établissement X/Y/Z, etc.)
- Offer_type: Gamers, Fibre, ADSL, 4G LTE, Locataire, Propriétaire, Professionnel, etc.

---

DOCUMENT À ANALYSER:
Nom du fichier: {file_name}

Contenu (premiers 4000 caractères):
{original_text[:4000]}

---

RETOURNE UNIQUEMENT CE JSON (PAS DE MARKDOWN, PAS DE BACKTICKS):
{{
  "cleaned_text": "le texte complet nettoyé ici",
  "summary": "résumé de 3-5 phrases précises et concises",
  "category": "Convention OU Depot_Vente OU Guide_NGBSS OU Offres",
  "partner": "nom exact du partenaire OU Inconnu",
  "offer_type": "type exact de l'offre OU N/A"
}}"""

            # Prepare messages for DeepSeek
            messages = [
                {
                    "role": "system",
                    "content": "Tu es un expert en traitement de documents. Retourne UNIQUEMENT du JSON valide sans markdown."
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]

            # Call DeepSeek API
            api_response = chat_with_deepseek(messages)
            
            # Parse response
            result_text = api_response['choices'][0]['message']['content'].strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith("```"):
                lines = result_text.split("\n")
                result_text = "\n".join(lines[1:-1])
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()
            
            result = json.loads(result_text)
            result["source_file"] = file_name
            result["language"] = language
            
            print(f"SUCCESS: {file_name} (lang: {language})")
            return result
            
        except json.JSONDecodeError as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"JSON ERROR: {file_name} - Max retries reached")
                if 'result_text' in locals():
                    print(f"Raw response: {result_text[:200]}...")
                return {
                    "source_file": file_name,
                    "cleaned_text": original_text if 'original_text' in locals() else "",
                    "summary": "JSON parsing error after retries",
                    "category": "Unknown",
                    "partner": "Unknown",
                    "offer_type": "N/A",
                    "error": f"JSON decode error: {str(e)}"
                }
            else:
                wait_time = base_delay * retry_count
                print(f"JSON ERROR: {file_name} - Retry {retry_count}/{max_retries} in {wait_time}s")
                time.sleep(wait_time)
                continue
                
        except requests.exceptions.Timeout:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"TIMEOUT ERROR: {file_name} - Max retries reached")
                return {
                    "source_file": file_name,
                    "cleaned_text": original_text if 'original_text' in locals() else "",
                    "summary": "Timeout error after retries",
                    "category": "Unknown",
                    "partner": "Unknown",
                    "offer_type": "N/A",
                    "error": "Request timeout"
                }
            else:
                wait_time = base_delay * retry_count
                print(f"TIMEOUT: {file_name} - Retry {retry_count}/{max_retries} in {wait_time}s")
                time.sleep(wait_time)
                continue
                
        except Exception as e:
            # Check for rate limit
            error_str = str(e)
            if "429" in error_str or "rate limit" in error_str.lower():
                retry_count += 1
                wait_time = base_delay * (2 ** retry_count)  # Exponential backoff
                print(f"RATE LIMIT: {file_name} - Retry {retry_count}/{max_retries} in {wait_time}s")
                time.sleep(wait_time)
                continue
            
            retry_count += 1
            if retry_count >= max_retries:
                print(f"ERROR: {file_name} - Max retries reached - {str(e)}")
                return {
                    "source_file": file_name,
                    "cleaned_text": original_text if 'original_text' in locals() else "",
                    "summary": "Error during processing after retries",
                    "category": "Unknown",
                    "partner": "Unknown",
                    "offer_type": "N/A",
                    "error": str(e)
                }
            else:
                wait_time = base_delay * retry_count
                print(f"ERROR: {file_name} - Retry {retry_count}/{max_retries} in {wait_time}s - {str(e)}")
                time.sleep(wait_time)
                continue
    
    # If we reach here, max retries exceeded
    return {
        "source_file": file_name,
        "cleaned_text": "",
        "summary": "Max retries exceeded",
        "category": "Unknown",
        "partner": "Unknown",
        "offer_type": "N/A",
        "error": "Max retries exceeded"
    }


def summarize_all_documents():
    """Summarize all text files in processed folder with DeepSeek (PARALLEL)"""
    
    processed_folder = "AgenticAi/data/processed"
    output_file = "AgenticAi/data/summaries.json"
    
    # Collect all files to process
    files_to_process = []
    for root, dirs, files in os.walk(processed_folder):
        for file_name in files:
            if file_name.endswith(".txt"):
                file_path = os.path.join(root, file_name)
                files_to_process.append((file_path, file_name))
    
    total_files = len(files_to_process)
    print(f"Found {total_files} files to process")
    
    all_summaries = []
    
    # Process files in parallel (3 threads to reduce rate limit issues)
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Submit all tasks
        future_to_file = {
            executor.submit(process_single_file, file_path, file_name): file_name
            for file_path, file_name in files_to_process
        }
        
        # Collect results as they complete
        completed = 0
        for future in as_completed(future_to_file):
            result = future.result()
            all_summaries.append(result)
            completed += 1
            print(f"Progress: {completed}/{total_files} ({completed*100//total_files}%)")
            
            # Save incrementally every 5 files
            if completed % 5 == 0:
                os.makedirs(os.path.dirname(output_file), exist_ok=True)
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(all_summaries, f, ensure_ascii=False, indent=2)
                print(f"  Checkpoint saved at {completed} files")
            
            # Small delay to avoid rate limits
            time.sleep(1)
    
    # Save all summaries to JSON
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_summaries, f, ensure_ascii=False, indent=2)
    
    print(f"\nTotal processed: {len(all_summaries)}")
    print(f"Saved to: {output_file}")
    
    # Print statistics
    success_count = sum(1 for s in all_summaries if "error" not in s)
    error_count = total_files - success_count
    
    print(f"\nStatistics:")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")
    
    # Language statistics
    arabic_count = sum(1 for s in all_summaries if s.get("language") == "ar")
    french_count = sum(1 for s in all_summaries if s.get("language") == "fr")
    print(f"  Arabic documents: {arabic_count}")
    print(f"  French documents: {french_count}")
    
    if error_count > 0:
        print(f"\nFiles with errors:")
        for s in all_summaries:
            if "error" in s:
                print(f"  - {s['source_file']}: {s.get('error', 'Unknown error')}")
    
    return all_summaries


# Summarize all processed documents
print("\n" + "="*70)
print("Starting PARALLEL summarization with DeepSeek v3.1...")
print("="*70)
summarize_all_documents()
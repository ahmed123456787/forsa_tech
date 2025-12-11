from typing import Dict, List
from openai import OpenAI
import os
import json
from pathlib import Path

FIXED_CATEGORIES = ["Convention", "Depot_Vente", "Guide_NGBSS", "Offres"]

def categorize_document(file_path: str) -> Dict[str, any]:
    """
    Catégorise un document PDF/DOCX en utilisant DeepSeek.
    
    Args:
        file_path: Chemin vers le fichier PDF ou DOCX
        
    Returns:
        Dict avec categories, categorie_principale, partenaire, etc.
    """
    
    file_path = Path(file_path)
    file_name = file_path.name
    
    # Extraire le contenu du fichier
    content = _extract_text(file_path)
    
    # Appel à DeepSeek
    client = OpenAI(
        api_key= "01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA",
        base_url="https://api.deepseek.com"
    )
    
    prompt = f"""Tu es un expert en classification de documents. Analyse attentivement ce document et détermine sa/ses catégorie(s).

CATÉGORIES DISPONIBLES (un document peut avoir plusieurs catégories):

1. **Convention**: 
   - Accords de partenariat entre entreprises
   - Conventions commerciales
   - Contrats de collaboration
   - Documents signés entre partenaires

2. **Depot_Vente**: 
   - Documents sur les points de vente physiques
   - Procédures de dépôt de vente
   - Gestion des magasins/boutiques
   - Inventaires, stocks de dépôts

3. **Guide_NGBSS**: 
   - Guides techniques et manuels
   - Procédures internes système NGBSS
   - Documentation technique
   - Instructions opérationnelles
   - Tutoriels et formations

4. **Offres**: 
   - Offres commerciales (packs, forfaits)
   - Tarifs et grilles tarifaires
   - Promotions clients
   - Fiches produits/services

---

**Nom du fichier**: {file_name}

**Contenu extrait** (premiers 800 caractères):
{content[:800] if content else "Pas de contenu extrait - analyse uniquement le nom du fichier"}

---

**INSTRUCTIONS IMPORTANTES**:
- Lis attentivement le CONTENU, pas seulement le nom du fichier
- Un document peut avoir PLUSIEURS catégories si pertinent
- Si c'est un guide/manuel technique → Guide_NGBSS
- Si ça parle de points de vente/magasins → Depot_Vente
- Si c'est un accord entre entreprises → Convention
- Si c'est une offre client/tarif → Offres

Retourne UNIQUEMENT ce JSON sans markdown:
{{
  "categories": ["categorie1", "categorie2"],
  "categorie_principale": "la_plus_pertinente",
  "partenaire": "nom_partenaire_si_trouve_sinon_Inconnu",
  "type_offre": "type_si_offre_sinon_N/A",
  "confidence": 0.95,
  "raison": "explication_detaillee_du_choix"
}}"""

    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "system", "content": "Tu es un expert en classification documentaire. Analyse le CONTENU en priorité, pas juste le nom du fichier. Sois précis et exhaustif."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Plus bas pour plus de cohérence
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Valider les catégories
        result["categories"] = [c for c in result.get("categories", []) if c in FIXED_CATEGORIES]
        if not result["categories"]:
            result["categories"] = [_fallback_category(file_name, content)]
        
        if result.get("categorie_principale") not in FIXED_CATEGORIES:
            result["categorie_principale"] = result["categories"][0]
        
        result["source_document"] = file_name
        return result
        
    except Exception as e:
        print(f"Erreur DeepSeek: {e}")
        return _fallback_metadata(file_name, content)


def _extract_text(file_path: Path) -> str:
    """Extrait texte d'un PDF ou DOCX avec meilleure gestion"""
    try:
        if file_path.suffix.lower() == '.pdf':
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                # Extraire plus de pages pour meilleure analyse
                text = ""
                for page in reader.pages[:5]:  # 5 premières pages
                    text += page.extract_text() + "\n"
                return text.strip()
        
        elif file_path.suffix.lower() in ['.docx', '.doc']:
            import docx
            doc = docx.Document(file_path)
            # Extraire plus de paragraphes
            return "\n".join([p.text for p in doc.paragraphs[:30]])
    except Exception as e:
        print(f"Erreur extraction: {e}")
    return ""


def _fallback_category(file_name: str, content: str = "") -> str:
    """Catégorie par défaut améliorée basée sur nom ET contenu"""
    name = file_name.lower()
    content_lower = content.lower() if content else ""
    
    # Analyse du nom de fichier
    if "guide" in name or "ngbss" in name or "manuel" in name or "procedure" in name or "tutoriel" in name:
        return "Guide_NGBSS"
    if "depot" in name or "vente" in name or "magasin" in name or "boutique" in name:
        return "Depot_Vente"
    if "convention" in name or "accord" in name or "partenariat" in name:
        return "Convention"
    if "offre" in name or "tarif" in name or "pack" in name or "promotion" in name:
        return "Offres"
    
    # Analyse du contenu si disponible
    if content_lower:
        if any(word in content_lower for word in ["guide", "procédure", "manuel", "instruction", "étape", "tutoriel"]):
            return "Guide_NGBSS"
        if any(word in content_lower for word in ["dépôt", "point de vente", "magasin", "boutique", "stock"]):
            return "Depot_Vente"
        if any(word in content_lower for word in ["convention", "accord", "partenaire", "entre", "signé"]):
            return "Convention"
        if any(word in content_lower for word in ["offre", "tarif", "prix", "forfait", "pack", "promotion"]):
            return "Offres"
    
    # Par défaut
    return "Offres"


def _fallback_metadata(file_name: str, content: str = "") -> Dict:
    """Métadonnées par défaut améliorées"""
    cat = _fallback_category(file_name, content)
    return {
        "source_document": file_name,
        "categories": [cat],
        "categorie_principale": cat,
        "partenaire": "Inconnu",
        "type_offre": "N/A",
        "confidence": 0.4,
        "raison": "Catégorisation par fallback (erreur LLM)"
    }


# Test
if __name__ == "__main__":
    # Test avec plusieurs types de fichiers
    test_files = [
        "Depot_Vente_Alger.docx",
        "Convention_Sonatrach_2025.pdf",
        "Guide NGBSS Vente par Lot_V2",
        "Offre_Fibre_PME.pdf",
        "~$gumentaire EKOTEB V2 AR.docx",
        "Argu nouveaux avantages liés au paiement électronique - finish -.pdf"
    ]
    
    print("=== Tests de Catégorisation ===\n")
    for test_file in test_files:
        try:
            result = categorize_document(test_file)
            print(f"{test_file}")
            print(f"   Catégories: {result['categories']}")
            print(f"   Principale: {result['categorie_principale']}")
            print(f"   Confidence: {result['confidence']}")
            print(f"   Raison: {result.get('raison', 'N/A')}")
            print()
        except Exception as e:
            print(f"Erreur pour {test_file}: {e}\n")
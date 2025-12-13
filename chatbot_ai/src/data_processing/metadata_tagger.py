from typing import Dict, List
from openai import OpenAI
import os
import json
from pathlib import Path

FIXED_CATEGORIES = ["Convention", "Depot_Vente", "Guide_NGBSS", "Offres"]


def categorize_text_document(text_file_path: str) -> Dict[str, any]:
    """
    Catégorise un document texte en utilisant DeepSeek.
    
    Args:
        text_file_path: Chemin vers le fichier .txt (issu du preprocessing)
        
    Returns:
        Dict avec categories, categorie_principale, partenaire, etc.
    """
    
    text_file_path = Path(text_file_path)
    file_name = text_file_path.name
    
    # Lire le contenu du fichier texte
    try:
        with open(text_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f" Erreur lecture fichier {file_name}: {e}")
        return _fallback_metadata(file_name, "")
    
    # Appel à DeepSeek pour catégorisation
    client = OpenAI(
        api_key="01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA",
        base_url="https://api.deepseek.com"
    )
    
    prompt = f"""Tu es un expert en classification de documents Algérie Télécom. Analyse attentivement ce document et détermine sa/ses catégorie(s).

CATÉGORIES DISPONIBLES (un document peut avoir plusieurs catégories):

1. **Convention**: 
   - Accords de partenariat entre Algérie Télécom et entreprises
   - Conventions commerciales
   - Contrats de collaboration
   - Documents signés entre partenaires (ex: Convention AT & Établissement X)

2. **Depot_Vente**: 
   - Documents sur les points de vente physiques
   - Procédures de dépôt de vente
   - Gestion des magasins/boutiques AT
   - Inventaires, stocks de dépôts

3. **Guide_NGBSS**: 
   - Guides techniques système NGBSS (New Generation Business Support System)
   - Procédures internes opérationnelles
   - Documentation technique
   - Instructions étape par étape
   - Tutoriels et formations
   - Manuels d'utilisation

4. **Offres**: 
   - Offres commerciales (packs, forfaits)
   - Argumentaires de vente
   - Tarifs et grilles tarifaires
   - Promotions clients
   - Fiches produits/services (Idoom Fibre, 4G LTE, Gamers, etc.)

---

**Nom du fichier**: {file_name}

**Contenu du document** (premiers 1200 caractères):
{content[:1200] if content else "Pas de contenu disponible"}

---

**INSTRUCTIONS IMPORTANTES**:
- Lis ATTENTIVEMENT le CONTENU, pas seulement le nom du fichier
- Un document peut avoir PLUSIEURS catégories si pertinent
- Identifie le partenaire mentionné (Sonatrach, Sonelgaz, Établissement X/Y/Z, etc.)
- Pour les offres, identifie le type (Gamers, Fibre, ADSL, 4G LTE, Locataire, Propriétaire, etc.)
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
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "Tu es un expert en classification documentaire Algérie Télécom. Analyse le CONTENU en priorité. Sois précis et exhaustif."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
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
        
        print(f"✅ {file_name}")
        print(f"   Catégories: {result['categories']}")
        print(f"   Principale: {result['categorie_principale']}")
        print(f"   Partenaire: {result['partenaire']}")
        print(f"   Type Offre: {result['type_offre']}")
        print(f"   Confidence: {result['confidence']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Erreur DeepSeek pour {file_name}: {e}")
        return _fallback_metadata(file_name, content)


def _fallback_category(file_name: str, content: str = "") -> str:
    """Catégorie par défaut basée sur nom ET contenu"""
    name = file_name.lower()
    content_lower = content.lower() if content else ""
    
    # Analyse du nom de fichier
    if "guide" in name or "ngbss" in name or "manuel" in name or "procedure" in name or "tutoriel" in name:
        return "Guide_NGBSS"
    if "depot" in name or "vente" in name or "magasin" in name or "boutique" in name:
        return "Depot_Vente"
    if "convention" in name or "accord" in name or "partenariat" in name:
        return "Convention"
    if "offre" in name or "tarif" in name or "pack" in name or "promotion" in name or "argumentaire" in name:
        return "Offres"
    
    # Analyse du contenu si disponible
    if content_lower:
        if any(word in content_lower for word in ["guide", "procédure", "manuel", "instruction", "étape", "tutoriel", "ngbss"]):
            return "Guide_NGBSS"
        if any(word in content_lower for word in ["dépôt", "point de vente", "magasin", "boutique", "stock"]):
            return "Depot_Vente"
        if any(word in content_lower for word in ["convention", "accord", "partenaire", "entre", "signé", "établissement"]):
            return "Convention"
        if any(word in content_lower for word in ["offre", "tarif", "prix", "forfait", "pack", "promotion", "argumentaire", "idoom", "fibre", "gamers"]):
            return "Offres"
    
    # Par défaut
    return "Offres"


def _fallback_metadata(file_name: str, content: str = "") -> Dict:
    """Métadonnées par défaut en cas d'erreur LLM"""
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


def process_all_text_files(
    input_folder: str = "AgenticAi/data/processed",
    output_folder: str = "AgenticAi/data/metadata"
):
    """
    Traite tous les fichiers texte et génère les métadonnées via LLM.
    
    Args:
        input_folder: Dossier contenant les fichiers .txt par catégorie
        output_folder: Dossier de sortie pour les métadonnées
        
    Returns:
        Liste de tous les documents avec métadonnées
    """
    os.makedirs(output_folder, exist_ok=True)
    
    categories = ["Convention", "Depot_Vente", "Offres", "Offres_Arabe", "Autres", "Guide_NGBSS"]
    
    all_documents = []
    
    for category in categories:
        category_path = os.path.join(input_folder, category)
        if not os.path.exists(category_path):
            print(f"⏭️  Catégorie ignorée (dossier inexistant): {category}")
            continue
        
        print(f"\n{'='*70}")
        print(f"📂 Processing category: {category}")
        print(f"{'='*70}")
        
        text_files = [f for f in os.listdir(category_path) if f.endswith(".txt")]
        
        if not text_files:
            print(f"⚠️  Aucun fichier .txt trouvé dans {category}")
            continue
        
        for file_name in text_files:
            file_path = os.path.join(category_path, file_name)
            
            # Catégoriser avec DeepSeek
            metadata = categorize_text_document(file_path)
            
            # Lire le contenu pour l'ajouter au document
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            document = {
                "metadata": metadata,
                "content": content
            }
            
            all_documents.append(document)
    
    # Sauvegarder toutes les métadonnées
    output_path = os.path.join(output_folder, "llm_metadata.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_documents, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*70}")
    print(f"🎉 Total documents processed: {len(all_documents)}")
    print(f"💾 Metadata saved to: {output_path}")
    print(f"{'='*70}")
    
    # Générer statistiques
    stats = {
        "total": len(all_documents),
        "by_category": {},
        "by_partner": {},
        "by_offer_type": {},
        "avg_confidence": 0
    }
    
    total_confidence = 0
    
    for doc in all_documents:
        meta = doc["metadata"]
        
        # Stats par catégorie
        cat = meta["categorie_principale"]
        stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
        
        # Stats par partenaire
        partner = meta["partenaire"]
        stats["by_partner"][partner] = stats["by_partner"].get(partner, 0) + 1
        
        # Stats par type d'offre
        if meta["type_offre"] != "N/A":
            offer_type = meta["type_offre"]
            stats["by_offer_type"][offer_type] = stats["by_offer_type"].get(offer_type, 0) + 1
        
        # Confidence moyenne
        total_confidence += meta.get("confidence", 0)
    
    stats["avg_confidence"] = round(total_confidence / len(all_documents), 2) if all_documents else 0
    
    # Sauvegarder les stats
    stats_path = os.path.join(output_folder, "llm_stats.json")
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 STATISTICS:")
    print(f"   Total: {stats['total']}")
    print(f"   Avg Confidence: {stats['avg_confidence']}")
    print(f"\n   By Category:")
    for cat, count in stats["by_category"].items():
        print(f"      {cat}: {count}")
    print(f"\n   By Partner:")
    for partner, count in stats["by_partner"].items():
        print(f"      {partner}: {count}")
    if stats["by_offer_type"]:
        print(f"\n   By Offer Type:")
        for offer_type, count in stats["by_offer_type"].items():
            print(f"      {offer_type}: {count}")
    
    print(f"\n📊 Stats saved to: {stats_path}")
    
    return all_documents


# Test
if __name__ == "__main__":
    print("="*70)
    print("LLM METADATA GENERATION FROM TEXT FILES")
    print("="*70)
    
    documents = process_all_text_files()
    
    # Afficher un exemple
    if documents:
        print("\n" + "="*70)
        print("EXAMPLE DOCUMENT WITH LLM METADATA")
        print("="*70)
        example = documents[0]
        print(json.dumps(example["metadata"], ensure_ascii=False, indent=2))
        print(f"\nContent preview:")
        print(example["content"][:300] + "...")
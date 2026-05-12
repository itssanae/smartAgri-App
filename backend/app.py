# =========================================================
# SMART AGRICULTURE - BACKEND API
# Flask + YOLOv8 + Groq AI Chatbot
# =========================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
import os

# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

# =========================================================
# CHARGEMENT DU MODÈLE YOLO
# =========================================================

MODEL_PATH = "models/best.pt"

print("🔄 Chargement du modèle YOLO...")
try:
    model = YOLO(MODEL_PATH)
    print("✅ Modèle YOLO chargé avec succès")
except Exception as e:
    print(f"❌ Erreur chargement modèle : {e}")
    model = None

# =========================================================
# CONFIGURATION GROQ (CHATBOT)
# =========================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None

if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq configuré avec succès")
    except Exception as e:
        print(f"❌ Erreur configuration Groq : {e}")
else:
    print("⚠️  Aucune clé Groq trouvée dans .env")

# =========================================================
# BASE DE DONNÉES TEMPORAIRE
# =========================================================

predictions_db = []

# =========================================================
# PROMPT SYSTÈME CHATBOT
# =========================================================

SYSTEM_PROMPT = """Tu es un assistant agricole intelligent spécialisé dans les maladies des plantes.

**LANGUES :**
- Tu dois répondre dans la langue utilisée par l'agriculteur.
- S'il te parle en français, réponds en français.
- S'il te parle en arabe standard, réponds en arabe.
- S'il te parle en Darija marocaine (ex: "fih lk7oliya f lwra9", "wash hadi mrada", "kifach n3alj had lmard"), réponds en Darija marocain.
- Pour la Darija, tu peux utiliser des lettres arabes ou latines selon ce qu'il utilise.
- Utilise un langage simple, pas de termes trop techniques.

**Plantes supportées :**
- Tomate (طماطم / maticha)
- Pomme de terre (بطاطس / batata)
- Poivron (فلفل / felfla)

**Maladies courantes :**
- Mildiou (Early blight, Late blight / مرض اللفحة)
- Taches bactériennes (Bacterial spot / البقع البكتيرية)
- Moisissures (Leaf Mold / العفن)
- Virus (Mosaic virus, YellowLeaf Curl)
- Acariens (Spider mites / العث)

**Ton rôle :**
- Donner des conseils pratiques de traitement
- Expliquer les symptômes simplement
- Suggérer des préventions accessibles
- Être encourageant et positif

**Exemples de réponses en Darija :**
- "had lmard smito mildiou, kayban f lwra9 bli kay9albo s-hmar"
- "khaskترش lma9 mzyane w ma t5lihoumch fl rtoba bzaf"
- "ستعمل had ddwa (copper fungicide) wla chi 7aja tabi3iya"

Adapte-toi toujours à la langue de l'utilisateur."""

# =========================================================
# ROUTE : HEALTH CHECK
# =========================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérifier que l'API fonctionne"""
    
    return jsonify({
        "success": True,
        "message": "✅ Backend opérationnel",
        "services": {
            "model": model is not None,
            "chatbot": groq_client is not None
        }
    })

# =========================================================
# ROUTE : PRÉDICTION DE MALADIE
# =========================================================

@app.route('/api/predict', methods=['POST'])
def predict():
    """Analyser une image de plante"""
    
    try:
        # Vérifier que le modèle est chargé
        if model is None:
            return jsonify({
                "success": False,
                "error": "Modèle non chargé"
            }), 500
        
        # Vérifier qu'une image est envoyée
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "error": "Aucune image fournie"
            }), 400
        
        file = request.files['image']
        
        # Ouvrir l'image
        image = Image.open(file.stream)
        
        # Faire la prédiction
        results = model.predict(source=image, conf=0.5)
        result = results[0]
        
        # Extraire les résultats
        class_id = result.probs.top1
        confidence = result.probs.top1conf.item()
        disease_name = result.names[class_id]
        
        # Déterminer le type de plante
        plant_type = "Inconnue"
        if "Tomato" in disease_name:
            plant_type = "Tomate"
        elif "Potato" in disease_name:
            plant_type = "Pomme de terre"
        elif "Pepper" in disease_name:
            plant_type = "Poivron"
        
        # Vérifier si la plante est saine
        is_healthy = "healthy" in disease_name.lower()
        
        # Créer l'objet de prédiction
        prediction = {
            "id": len(predictions_db) + 1,
            "timestamp": datetime.now().isoformat(),
            "plant_type": plant_type,
            "disease": disease_name,
            "confidence": round(confidence * 100, 2),
            "is_healthy": is_healthy
        }
        
        # Sauvegarder dans la base
        predictions_db.append(prediction)
        
        return jsonify({
            "success": True,
            "prediction": prediction
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# ROUTE : HISTORIQUE DES PRÉDICTIONS
# =========================================================

@app.route('/api/history', methods=['GET'])
def get_history():
    """Récupérer les 50 dernières prédictions"""
    
    return jsonify({
        "success": True,
        "history": predictions_db[-50:]
    })

# =========================================================
# ROUTE : STATISTIQUES
# =========================================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Calculer les statistiques du dashboard"""
    
    total = len(predictions_db)
    healthy = sum(1 for p in predictions_db if p['is_healthy'])
    diseased = total - healthy
    
    # Statistiques par type de plante
    plants = {}
    for p in predictions_db:
        pt = p['plant_type']
        if pt not in plants:
            plants[pt] = {"total": 0, "healthy": 0, "diseased": 0}
        
        plants[pt]["total"] += 1
        if p['is_healthy']:
            plants[pt]["healthy"] += 1
        else:
            plants[pt]["diseased"] += 1
    
    return jsonify({
        "success": True,
        "stats": {
            "total": total,
            "healthy": healthy,
            "diseased": diseased,
            "by_plant": plants
        }
    })

# =========================================================
# ROUTE : CHATBOT
# =========================================================

@app.route('/api/chat', methods=['POST'])
def chat():
    """Discuter avec l'assistant agricole"""
    
    try:
        # Vérifier que Groq est configuré
        if groq_client is None:
            return jsonify({
                "success": False,
                "error": "Chatbot non configuré (clé Groq manquante)"
            }), 500
        
        # Récupérer le message
        data = request.json
        user_message = data.get("message", "")
        history = data.get("history", [])
        
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Message vide"
            }), 400
        
        # Construire les messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Ajouter l'historique (max 10 messages)
        for msg in history[-10:]:
            messages.append(msg)
        
        # Ajouter le nouveau message
        messages.append({"role": "user", "content": user_message})
        
        # Appeler Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = completion.choices[0].message.content
        
        return jsonify({
            "success": True,
            "response": response_text
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# DÉMARRAGE DU SERVEUR
# =========================================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🌱 SMART AGRICULTURE - BACKEND API")
    print("="*50)
    print("📍 URL : http://localhost:5000")
    print("📊 Endpoints disponibles :")
    print("   - GET  /api/health")
    print("   - POST /api/predict")
    print("   - GET  /api/history")
    print("   - GET  /api/stats")
    print("   - POST /api/chat")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
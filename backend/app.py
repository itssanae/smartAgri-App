#///////////////////////////////////////////////
#//////////////////////////////////////////////////
# =========================================================
# SMART AGRICULTURE BACKEND
# Flask + YOLOv8 + Gemini AI
# =========================================================

# =========================================================
# IMPORTS
# =========================================================

from flask import Flask, request, jsonify
from flask_cors import CORS

from ultralytics import YOLO
from PIL import Image

from datetime import datetime

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("Module google.generativeai non trouvé. Gemini désactivé.")

from dotenv import load_dotenv

import os

# =========================================================
# LOAD ENV VARIABLES
# =========================================================

load_dotenv()

# =========================================================
# FLASK CONFIGURATION
# =========================================================

app = Flask(__name__)

CORS(app)

# =========================================================
# YOLO MODEL CONFIGURATION
# =========================================================

MODEL_PATH = "models/best.pt"

print("Chargement du modèle YOLO...")

model = YOLO(MODEL_PATH)

print("Modèle YOLO chargé avec succès")

# =========================================================
# GEMINI CONFIGURATION
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_model = None

if GEMINI_API_KEY:

    try:

        genai.configure(api_key=GEMINI_API_KEY)

        gemini_model = genai.GenerativeModel(
            "gemini-1.5-flash"
        )

        print("Gemini configuré avec succès")

    except Exception as e:

        print("Erreur Gemini :", e)

else:

    print("Aucune clé Gemini trouvée")

# =========================================================
# GROQ CONFIGURATION (COMMENTÉE)
# =========================================================

# from groq import Groq
#
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
#
# groq_client = Groq(api_key=GROQ_API_KEY)

# =========================================================
# TEMP DATABASE
# =========================================================

predictions_db = []

# =========================================================
# CHATBOT SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
Tu es un assistant agricole intelligent spécialisé dans :

- les maladies des plantes
- la santé des cultures
- les conseils agricoles
- la prévention des maladies

Plantes principales :
- Tomate
- Pomme de terre
- Poivron

Tu dois :
- répondre en français
- être simple et clair
- donner des conseils utiles
- aider les agriculteurs débutants

Ne donne jamais de réponses dangereuses.
"""

# =========================================================
# HEALTH CHECK ROUTE
# =========================================================

@app.route('/api/health', methods=['GET'])
def health():

    return jsonify({
        "success": True,
        "message": "Backend actif",
        "model_loaded": True,
        "chatbot_loaded": gemini_model is not None
    })

# =========================================================
# PREDICTION ROUTE
# =========================================================

@app.route('/api/predict', methods=['POST'])
def predict():

    try:

        # Vérifier image
        if 'image' not in request.files:

            return jsonify({
                "success": False,
                "error": "Aucune image envoyée"
            }), 400

        file = request.files['image']

        # Ouvrir image
        image = Image.open(file.stream)

        # Prediction YOLO
        results = model.predict(
            source=image,
            conf=0.5
        )

        result = results[0]

        # Extraire résultat
        class_id = result.probs.top1

        confidence = result.probs.top1conf.item()

        disease_name = result.names[class_id]

        # Détection type plante
        plant_type = "Inconnue"

        if "Tomato" in disease_name:

            plant_type = "Tomate"

        elif "Potato" in disease_name:

            plant_type = "Pomme de terre"

        elif "Pepper" in disease_name:

            plant_type = "Poivron"

        # Healthy ?
        is_healthy = "healthy" in disease_name.lower()

        # Objet prediction
        prediction = {

            "id": len(predictions_db) + 1,

            "timestamp": datetime.now().isoformat(),

            "plant_type": plant_type,

            "disease": disease_name,

            "confidence": round(confidence * 100, 2),

            "is_healthy": is_healthy
        }

        # Sauvegarde mémoire
        predictions_db.append(prediction)

        # Retour résultat
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
# HISTORY ROUTE
# =========================================================

@app.route('/api/history', methods=['GET'])
def history():

    return jsonify({
        "success": True,
        "history": predictions_db[-50:]
    })

# =========================================================
# DASHBOARD STATS ROUTE
# =========================================================

@app.route('/api/stats', methods=['GET'])
def stats():

    total = len(predictions_db)

    healthy = sum(
        1 for p in predictions_db
        if p['is_healthy']
    )

    diseased = total - healthy

    # Stats plantes
    plants = {}

    for p in predictions_db:

        pt = p['plant_type']

        if pt not in plants:

            plants[pt] = {
                "total": 0,
                "healthy": 0,
                "diseased": 0
            }

        plants[pt]["total"] += 1

        if p['is_healthy']:

            plants[pt]["healthy"] += 1

        else:

            plants[pt]["diseased"] += 1

    return jsonify({

        "success": True,

        "stats": {

            "total_predictions": total,

            "healthy_predictions": healthy,

            "diseased_predictions": diseased,

            "plants": plants
        }
    })

# =========================================================
# CHATBOT ROUTE
# =========================================================

@app.route('/api/chat', methods=['POST'])
def chat():

    try:

        # Vérifier Gemini
        if gemini_model is None:

            return jsonify({
                "success": False,
                "error": "Gemini non configuré"
            }), 500

        # Données frontend
        data = request.json

        user_message = data.get("message", "")

        # Vérifier message
        if not user_message:

            return jsonify({
                "success": False,
                "error": "Message vide"
            }), 400

        # Prompt final
        final_prompt = f"""
{SYSTEM_PROMPT}

Utilisateur :
{user_message}

Assistant :
"""

        # Génération réponse
        response = gemini_model.generate_content(
            final_prompt
        )

        chatbot_response = response.text

        # Retour frontend
        return jsonify({

            "success": True,

            "response": chatbot_response
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# MAIN
# =========================================================

if __name__ == '__main__':

    print("======================================")
    print("SMART AGRICULTURE BACKEND")
    print("Flask + YOLOv8 + Gemini")
    print("http://localhost:5000")
    print("======================================")

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )
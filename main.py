import ast
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CONFIG & STATE ---
DATA_PATH = Path("datasets/Training.csv")
state = {
    "model": None,
    "label_encoder": LabelEncoder(),
    "valid_symptoms": []
}

# --- GLOBAL DATA LOADING ---
try:
    description = pd.read_csv("datasets/description.csv")
    precautions = pd.read_csv("datasets/precautions_df.csv")
    medications = pd.read_csv("datasets/medications.csv")
    diets = pd.read_csv("datasets/diets.csv")
    workout = pd.read_csv("datasets/workout_df.csv")
    logger.info("Knowledge base CSVs loaded successfully.")
except Exception as e:
    logger.error(f"Error loading CSV files: {e}")
    # Initialize empty dataframes with columns to prevent attribute errors
    description = precautions = medications = diets = workout = pd.DataFrame()

# --- HELPER FUNCTION (ROOT FIX APPLIED) ---
def helper(dis):
    """
    Standardizes the disease name and fetches ALL details from knowledge base.
    """
    dis_clean = str(dis).strip()

    # 1. Fetch Description
    desc_series = description[description['Disease'].str.lower() == dis_clean.lower()]['Description']
    desc = " ".join([w for w in desc_series]) if not desc_series.empty else "Description not available."

    # 2. Fetch Precautions
    pre_cols = ['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']
    pre_row = precautions[precautions['Disease'].str.lower() == dis_clean.lower()]
    if not pre_row.empty:
        available = [c for c in pre_cols if c in pre_row.columns]
        pre = pre_row[available].values.flatten().tolist()
        pre = [str(p) for p in pre if str(p) != 'nan']
    else:
        pre = []

    # 3. Fetch Medications
    med_series = medications[medications['Disease'].str.lower() == dis_clean.lower()]['Medication']
    if not med_series.empty:
        med_value = med_series.values[0]
        try:
            if isinstance(med_value, str) and med_value.startswith('['):
                med = ast.literal_eval(med_value)
            else:
                med = [m for m in med_series.values]
        except:
            med = [med_value]
    else:
        med = []

    # 4. Fetch Diet 
    diet_series = diets[diets['Disease'].str.lower() == dis_clean.lower()]['Diet']
    diet_val = diet_series.values[0] if not diet_series.empty else "[]"
    try: 
        diet_list = ast.literal_eval(diet_val)
    except: 
        diet_list = [diet_val] if diet_val != "[]" else []

    # 5. Fetch Workout
    # Check for both 'disease' and 'Disease' column naming conventions
    w_col = 'disease' if 'disease' in workout.columns else 'Disease'
    if not workout.empty and w_col in workout.columns:
        workout_series = workout[workout[w_col].str.lower() == dis_clean.lower()]['workout']
        work_val = workout_series.values[0] if not workout_series.empty else "General rest and hydration."
    else:
        work_val = "Maintain moderate physical activity as tolerated."

    # ROOT FIX: Single return at the very end to include all 5 variables
    return desc, pre, med, diet_list, work_val

# --- LIFESPAN (Startup Logic) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        if not DATA_PATH.exists():
            raise FileNotFoundError(f"Training.csv missing at {DATA_PATH}")

        df = pd.read_csv(DATA_PATH)
        df['prognosis'] = df['prognosis'].str.strip()
        
        # Symptoms are all columns except prognosis
        state["valid_symptoms"] = [c for c in df.columns if c != 'prognosis']
        
        X = df[state["valid_symptoms"]]
        y = state["label_encoder"].fit_transform(df['prognosis'])

        # Train Random Forest
        state["model"] = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y)
        logger.info("SYSTEM READY: Random Forest trained.")
    except Exception as e:
        logger.error(f"STARTUP ERROR: {e}")
        raise e
    yield

# --- APP SETUP ---
app = FastAPI(title="NeuroDiagnostic AI", lifespan=lifespan)

# CORS FIX: Essential for React communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    symptoms: List[str]

# --- ENDPOINTS ---
@app.get("/symptoms")
async def get_symptoms():
    return {"symptoms": state["valid_symptoms"]}

@app.post("/predict")
async def predict(data: PredictionRequest):
    if not data.symptoms or state["model"] is None:
        raise HTTPException(status_code=400, detail="Invalid request or model not ready")

    # 1. Vectorize input: 1 if user selected symptom, 0 otherwise
    input_vector = [1 if s in data.symptoms else 0 for s in state["valid_symptoms"]]
    
    # 2. Predict
    prediction_idx = state["model"].predict([input_vector])[0]
    disease = state["label_encoder"].inverse_transform([prediction_idx])[0]
    
    # 3. Call helper and unpack ALL 5 values
    desc, prec, meds, diet_list, work_val = helper(disease)
    
    # 4. Return data structured for the React UI
    return {
        "disease": disease,
        "description": desc,
        "precautions": prec,
        "medications": meds,
        "diets": diet_list,
        "workout": work_val
    }

if __name__ == "__main__":
    import uvicorn

    # Using 127.0.0.1 and port 8000 to match your frontend API_BASE
    uvicorn.run(app, host="127.0.0.1", port=8000)
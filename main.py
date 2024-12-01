import numpy as np
import pandas as pd
from flask import Flask, redirect, render_template, request, url_for
from sklearn import tree
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__, template_folder='templates')

# List of possible symptoms
l1 = [
    'back_pain', 'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever',
    'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload',
    'swelling_of_stomach', 'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision',
    'phlegm', 'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose',
    'congestion', 'chest_pain', 'weakness_in_limbs', 'fast_heart_rate',
    'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool',
    'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity',
    'swollen_legs', 'swollen_blood_vessels', 'puffy_face_and_eyes', 'enlarged_thyroid',
    'brittle_nails', 'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts',
    'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain',
    'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness',
    'spinning_movements', 'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side',
    'loss_of_smell', 'bladder_discomfort', 'foul_smell_of_urine', 'continuous_feel_of_urine',
    'passage_of_gases', 'internal_itching', 'toxic_look_(typhos)', 'depression',
    'irritability', 'muscle_pain', 'altered_sensorium', 'red_spots_over_body', 'belly_pain',
    'abnormal_menstruation', 'dischromic_patches', 'watering_from_eyes', 'increased_appetite',
    'polyuria', 'family_history', 'mucoid_sputum', 'rusty_sputum', 'lack_of_concentration',
    'visual_disturbances', 'receiving_blood_transfusion', 'receiving_unsterile_injections',
    'coma', 'stomach_bleeding', 'distention_of_abdomen', 'history_of_alcohol_consumption',
    'blood_in_sputum', 'prominent_veins_on_calf', 'palpitations',
    'painful_walking', 'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling',
    'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails', 'blister',
    'red_sore_around_nose', 'yellow_crust_ooze'
]

# Load training data
try:
    df = pd.read_csv("Training.csv")
except FileNotFoundError:
    raise FileNotFoundError("Training.csv file not found.")
except pd.errors.EmptyDataError:
    raise ValueError("No data in Training.csv.")

# Display the contents of the prognosis column for debugging
print("Prognosis column values:")
print(df['prognosis'].unique())

# Clean the prognosis column
df['prognosis'] = df['prognosis'].str.strip()  # Remove leading/trailing whitespace

# Filter valid symptoms
l1_valid = [symptom for symptom in l1 if symptom in df.columns]

if not l1_valid:
    raise ValueError("No valid symptoms found in the DataFrame.")

# Prepare input and output for training
X = df[l1_valid]

# Encode the prognosis labels to integers
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df['prognosis'])  # Encode the prognosis to integers

# Train classifiers
clf_tree = tree.DecisionTreeClassifier().fit(X, y)
clf_rf = RandomForestClassifier().fit(X, y)
clf_nb = GaussianNB().fit(X, y)

@app.route('/')
def index():
    return render_template('index.html', symptoms=l1_valid)

@app.route('/', methods=['POST'])
def predict():
    symptoms = [
        request.form.get('Symptom1'),
        request.form.get('Symptom2'),
        request.form.get('Symptom3'),
        request.form.get('Symptom4'),
        request.form.get('Symptom5')
    ]
    
    # Remove None values
    symptoms = [s for s in symptoms if s]

    if not symptoms:
        return redirect(url_for('index'))  # Redirect if no symptoms were provided

    result_tree = predict_disease(clf_tree, symptoms)
    result_rf = predict_disease(clf_rf, symptoms)
    result_nb = predict_disease(clf_nb, symptoms)

    return render_template('index.html', symptoms=l1_valid, result_tree=result_tree, result_rf=result_rf, result_nb=result_nb)

def predict_disease(classifier, symptoms):
    l2 = [1 if symptom in symptoms else 0 for symptom in l1_valid]
    inputtest = [l2]
    
    try:
        prediction = classifier.predict(inputtest)
        return label_encoder.inverse_transform([prediction[0]])[0]  # Decode the integer back to the disease name
    except IndexError:
        return "Not Found"

if __name__ == '__main__':
    app.run(debug=True)



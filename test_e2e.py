import urllib.request
import json
import uuid

API_URL = "http://localhost:8080/api"

# Helper to generate unique suffix
suffix = str(uuid.uuid4())[:8]

def post_json(url, payload, token=None):
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        response = urllib.request.urlopen(req)
        body = response.read().decode('utf-8')
        try:
            return response.getcode(), json.loads(body)
        except json.JSONDecodeError:
            return response.getcode(), body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body

# 1. Register Patient
print(f"[*] Registering test patient: patient_{suffix}...")
patient_email = f"patient_{suffix}@example.com"
patient_data = {
    "username": f"patient_{suffix}",
    "password": "password123",
    "name": "Test Patient",
    "email": patient_email,
    "role": "PATIENT"
}
code, patient_res = post_json(f"{API_URL}/auth/register", patient_data)
print("Patient Register Response:", code)
if isinstance(patient_res, dict):
    patient_id = patient_res.get("userId")
else:
    patient_id = json.loads(patient_res).get("userId") if patient_res else None
print(f"    -> Patient ID: {patient_id}")

# 2. Register Doctor
print(f"[*] Registering test doctor: doctor_{suffix}...")
doctor_email = f"doctor_{suffix}@example.com"
doctor_data = {
    "username": f"doctor_{suffix}",
    "password": "password123",
    "name": "Dr. Test",
    "email": doctor_email,
    "role": "DOCTOR"
}
code, _ = post_json(f"{API_URL}/auth/register", doctor_data)
print("Doctor Register Response:", code)

# 3. Login as Doctor
print(f"[*] Logging in as Doctor using email {doctor_email}...")
login_data = {
    "email": doctor_email,
    "password": "password123"
}
code, login_res = post_json(f"{API_URL}/auth/login", login_data)
token = None
if isinstance(login_res, dict):
    token = login_res.get("token")
print("Doctor Login Response Code:", code)
if not token:
    print("FAILED TO GET TOKEN! Body:", login_res)
    exit(1)
print("Doctor Login Token acquired.")

# 4. Make Diagnosis Request
print("[*] Submitting diagnosis request to Spring Boot backend...")
diagnosis_req = {
    "patientId": patient_id,
    "symptoms": "chest pain, shortness of breath, left arm pain, sweating",
    "diseaseInput": "heart attack",
    "language": "en"
}
code, response_data = post_json(f"{API_URL}/diagnoses", diagnosis_req, token)
print("Diagnosis Response Status:", code)

if isinstance(response_data, dict) and "mlPredictions" in response_data:
    print("\n[SUCCESS]: 'mlPredictions' array found in response with lengths:", len(response_data["mlPredictions"]))
    for i, pred in enumerate(response_data["mlPredictions"]):
        print(f"   #{i+1}: {pred['disease']} (Confidence: {pred['confidence']})")
else:
    print("\n[FAILURE]: 'mlPredictions' missing from response!")
    print("Diagnosis Response Body:")
    if isinstance(response_data, dict):
        print(json.dumps(response_data, indent=2))
    else:
        print(response_data)

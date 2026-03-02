"""
firebase_config.py
Initializes the Firebase Admin SDK using a service account key.

Setup:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key" → save as serviceAccountKey.json
  3. Set env var:  export FIREBASE_CREDENTIALS=./serviceAccountKey.json
"""

import os
import firebase_admin
from firebase_admin import credentials

_CRED_PATH = os.getenv("FIREBASE_CREDENTIALS", "./serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(_CRED_PATH)
    firebase_admin.initialize_app(cred)

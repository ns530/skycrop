"""
Quick test to verify Google Earth Engine authentication
"""
import ee
import os
import sys

print("Testing Google Earth Engine setup...")
print("=" * 50)

# Check if credentials exist
credentials_path = os.path.expanduser("~/.config/earthengine/credentials")
if os.path.exists(credentials_path):
    print(f"[OK] Found credentials file: {credentials_path}")
else:
    print(f"[MISSING] No credentials file found at: {credentials_path}")

# Project ID (required via env GEE_PROJECT_ID)
PROJECT_ID = os.getenv("GEE_PROJECT_ID")
if not PROJECT_ID:
    print("[ERROR] GEE_PROJECT_ID environment variable is required")
    print("Set it with: export GEE_PROJECT_ID=your-project-id")
    sys.exit(1)
print(f"\nUsing project: {PROJECT_ID}")

# Try to initialize
print("\nAttempting to initialize GEE...")
try:
    # Initialize with project
    ee.Initialize(project=PROJECT_ID)
    print("SUCCESS! Google Earth Engine is authenticated and ready!")
    print("You can now use GEE in your ML service!")
    
    # Test a simple operation
    print("\nTesting GEE connection...")
    test_collection = ee.ImageCollection('COPERNICUS/S2_SR').limit(1)
    count = test_collection.size().getInfo()
    print(f"[SUCCESS] Successfully connected! Found {count} test images.")
    
except ee.ee_exception.EEException as e:
    error_msg = str(e)
    print(f"\nGEE Error: {error_msg}")
    
    if "no project found" in error_msg.lower():
        print("\n" + "=" * 50)
        print("SOLUTION: You need to set up a GEE project.")
        print("\nOption 1: Use your Google Cloud Project")
        print("  1. Go to: https://console.cloud.google.com/")
        print("  2. Create or select a project")
        print("  3. Enable Earth Engine API")
        print("  4. Then run: py -c \"import ee; ee.Initialize(project='your-project-id')\"")
        print("\nOption 2: Complete web authentication")
        print("  1. Go to: https://code.earthengine.google.com/")
        print("  2. Sign in and accept terms")
        print("  3. This will set up your default project")
        print("\nOption 3: Try authentication again")
        print("  Run: py -c \"import ee; ee.Authenticate()\"")
        print("  Make sure to complete the browser flow")
        
    elif "auth" in error_msg.lower() or "credentials" in error_msg.lower():
        print("\n" + "=" * 50)
        print("SOLUTION: Authentication needed")
        print("\n1. Run: py -c \"import ee; ee.Authenticate()\"")
        print("2. A browser will open - sign in with your Google account")
        print("3. Grant permissions to Google Earth Engine")
        print("4. Complete the authentication flow")
        print("5. Run this test again")
    else:
        print(f"\nUnexpected error. Details: {error_msg}")
        
except Exception as e:
    print(f"\nUnexpected error: {type(e).__name__}: {e}")
    print("\nTry:")
    print("1. Verify GEE is installed: py -m pip show earthengine-api")
    print("2. Authenticate: py -c \"import ee; ee.Authenticate()\"")
    print("3. Or visit: https://code.earthengine.google.com/ to set up your account")

import os
from dotenv import load_dotenv

from app import create_app

def main():
    load_dotenv()
    app = create_app()
    host = os.getenv("ML_HOST", "0.0.0.0")
    port = int(os.getenv("ML_PORT", "80"))
    debug = os.getenv("FLASK_DEBUG", "0") in ("1", "true", "True")
    app.run(host=host, port=port, debug=debug)

if __name__ == "__main__":
    main()
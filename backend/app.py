# app.py
from flask import Flask
from flask_cors import CORS


from routes.predict import predict_bp
from routes.parking import parking_bp


def create_app():
    app = Flask(__name__)

    
    CORS(app, resources={r"/api/*": {"origins": "*"}})

   
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(parking_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return "Hello from Jessica!", 200

   
    @app.route("/api/health")
    def health():
        return "ok", 200

    return app


app = create_app()

if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=8080, debug=True)

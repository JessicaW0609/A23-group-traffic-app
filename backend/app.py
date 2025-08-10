from flask import Flask
from routes.Predict import predict_bp
from routes.Parking import parking_bp





app = Flask(__name__)

# ====================================================================================
# for backend-routes-Predict : predict for Epic 1 population and car amount
app.register_blueprint(predict_bp, url_prefix="/api")  # final route: POST /api/predict
app.register_blueprint(parking_bp, url_prefix="/api")



@app.route('/')
def hello():
    return 'Hello from Jessica!'

if __name__ == '__main__':
    print("Running Flask app...")
    
    # for local testing:
    app.run(host="0.0.0.0", port=8080, debug=True)


from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Jessica!'

if __name__ == '__main__':
    print("Running Flask app...")
    app.run(debug=True)

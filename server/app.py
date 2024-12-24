from flask import Flask, request, jsonify
from blueprints import blueprints
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

for bp in blueprints: 
    app.register_blueprint(bp)

@app.route('/')
def home():
    return jsonify('home')
 
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=2600) 
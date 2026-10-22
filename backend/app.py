from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from modules.devices.routes import device_bp
from modules.auth.route import auth_bp
from modules.plants.routes import plant_bp
from handler.ImgHandler import plant_image_bp



load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

# Register the device blueprint
app.register_blueprint(device_bp) 
app.register_blueprint(auth_bp)
app.register_blueprint(plant_bp)
app.register_blueprint(plant_image_bp)

@app.route("/")
def home():
    return "Flask Success installed!"


if __name__ == "__main__":
    app.run(debug=True, port=5700, host="0.0.0.0")



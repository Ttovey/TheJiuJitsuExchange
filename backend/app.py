from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from datetime import datetime
from models import db
from routes.auth import auth_bp
from routes.stripe import stripe_bp

app = Flask(__name__)
app.secret_key = 'secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///exchange.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

# Initialize SQLAlchemy and Flask-Migrate
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
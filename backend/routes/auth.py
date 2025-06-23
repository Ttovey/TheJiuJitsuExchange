from flask import Blueprint, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
import sys
import os
import uuid
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'Username, email and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Hash the password
        password_hash = generate_password_hash(password)
        
        # Create new user
        try:
            new_user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # Set session
            session['user_id'] = new_user.id
            session['username'] = new_user.username
            
            return jsonify({
                'message': 'User registered successfully',
                'user': new_user.to_dict()
            }), 201
            
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'Username or email already exists'}), 409
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            # Set session
            session['user_id'] = user.id
            session['username'] = user.username
            
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/user', methods=['GET'])
def get_current_user():
    """Get current user information"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Find user by ID
    user = User.query.get(session['user_id'])
    
    if user:
        return jsonify({
            'user': user.to_dict()
        }), 200
    else:
        return jsonify({'error': 'User not found'}), 404

# Profile picture configuration
UPLOAD_FOLDER = 'uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@auth_bp.route('/upload-profile-picture', methods=['POST'])
def upload_profile_picture():
    """Upload user profile picture"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Create uploads directory if it doesn't exist
            upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), UPLOAD_FOLDER)
            os.makedirs(upload_path, exist_ok=True)
            
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(upload_path, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Update user profile picture in database
            user = User.query.get(session['user_id'])
            if user:
                # Delete old profile picture if exists
                if user.profile_picture:
                    old_file_path = os.path.join(upload_path, user.profile_picture)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                
                user.profile_picture = unique_filename
                db.session.commit()
                
                return jsonify({
                    'message': 'Profile picture uploaded successfully',
                    'profile_picture': unique_filename
                }), 200
            else:
                return jsonify({'error': 'User not found'}), 404
        else:
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile-picture/<filename>', methods=['GET'])
def get_profile_picture(filename):
    """Serve profile picture"""
    try:
        upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), UPLOAD_FOLDER)
        return send_from_directory(upload_path, filename)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

@auth_bp.route('/delete-profile-picture', methods=['DELETE'])
def delete_profile_picture():
    """Delete user profile picture"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        user = User.query.get(session['user_id'])
        if user and user.profile_picture:
            # Delete file from filesystem
            upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), UPLOAD_FOLDER)
            file_path = os.path.join(upload_path, user.profile_picture)
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Remove from database
            user.profile_picture = None
            db.session.commit()
            
            return jsonify({'message': 'Profile picture deleted successfully'}), 200
        else:
            return jsonify({'error': 'No profile picture to delete'}), 404
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
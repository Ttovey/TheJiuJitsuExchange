# Exchange App - Full Stack Authentication

A complete full-stack web application with Python Flask backend, SQLite database, and React TypeScript frontend featuring user authentication.

## Features

- **Backend (Flask)**:
  - User registration and login
  - Session-based authentication
  - SQLite database for user storage
  - Password hashing with Werkzeug
  - CORS support for React frontend
  - RESTful API endpoints

- **Frontend (React + TypeScript)**:
  - Modern, responsive UI with TypeScript type safety
  - Login and registration forms with proper type definitions
  - Protected routes
  - Session persistence
  - Clean, gradient-based design
  - Comprehensive type checking for better development experience

## Project Structure

```
exchangeApp/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── users.db           # SQLite database (auto-created)
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx   # Login component
│   │   │   ├── Register.tsx # Registration component
│   │   │   └── Landing.tsx # Dashboard component
│   │   ├── types/
│   │   │   └── index.ts    # TypeScript type definitions
│   │   ├── App.tsx         # Main app with routing
│   │   ├── index.tsx       # React entry point
│   │   └── index.css       # Styles
│   ├── tsconfig.json       # TypeScript configuration
│   └── package.json       # React dependencies
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.7+ 
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Access the App**: Open your browser and go to `http://localhost:3000`

2. **Create an Account**: 
   - Click "Sign up here" on the login page
   - Fill in username, email, and password (minimum 6 characters)
   - Click "Create Account"

3. **Login**: 
   - Enter your username and password
   - Click "Sign In"

4. **Dashboard**: 
   - After successful authentication, you'll be redirected to the dashboard
   - View your user information
   - Use the logout button to end your session

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user info
- `GET /api/health` - Health check

## Security Features

- Passwords are hashed using Werkzeug's security functions
- Session-based authentication
- CORS properly configured
- Input validation on both frontend and backend
- Protection against SQL injection using parameterized queries

## Customization

- **Styling**: Modify `frontend/src/index.css` for visual changes
- **Backend Logic**: Extend `backend/app.py` for additional API endpoints
- **Database**: The SQLite database is automatically created; you can modify the schema in the `init_db()` function

## Development Notes

- The React development server proxies API requests to Flask
- Hot reloading is enabled for both frontend and backend during development
- Sessions are stored server-side and persist across browser refreshes

## Next Steps
- Email verification
- Password reset functionality
- User profiles
- Additional authentication methods (OAuth)
- Database migrations
- Unit tests
- Production deployment configuration 
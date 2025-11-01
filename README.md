# Notes App - Full Stack Authentication & Notes Management

A modern, full-featured web application built with Node.js, Express, MongoDB, and EJS for managing notes with comprehensive authentication and user management features.

## ✨ Features

### 🔐 Authentication & Security
- User registration and login
- Email verification (configurable)
- Password reset via email
- JWT-based session management
- Secure password hashing with bcrypt

### 📝 Notes Management
- Create, read, update, and delete notes
- Search notes by title and content
- Filter by category, tags, and priority
- Pin important notes
- Archive notes
- Color coding and organization
- Version history tracking
- Export notes (PDF, JSON, TXT)

### 👤 User Profile
- Profile picture upload
- Edit profile information
- Change password
- Theme preferences (Dark/Light)
- Notification settings

### 📊 Statistics Dashboard
- Total notes count
- Word count analytics
- Category distribution
- Activity log
- Pinned and archived counts

### 🎨 Modern UI
- Beautiful gradient design
- Glass-morphism effects
- Smooth animations
- Fully responsive design
- Mobile-friendly interface

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd auth_andd_autho_2
```

2. Install dependencies:
```bash
npm install
```

3. Configure MongoDB:
   - **Local MongoDB**: Make sure MongoDB is running on `127.0.0.1:27017`
   - **MongoDB Atlas**: Update connection string in `models/user.js`

4. Configure Email (Optional):
   - Edit `config/email.js` with your email credentials
   - For Gmail, use an App Password

5. Start the server:
```bash
npm start
# or for development with auto-reload
npx nodemon app.js
```

6. Open your browser:
   - Navigate to `http://localhost:3000`

## 📁 Project Structure

```
auth_andd_autho_2/
├── app.js                 # Main application file
├── models/               # Database models
│   ├── user.js          # User model
│   ├── note.js          # Note model
│   └── activity.js      # Activity log model
├── views/                # EJS templates
│   ├── index.ejs        # Login/Signup page
│   ├── dashboard.ejs    # User dashboard
│   ├── notes.ejs        # Notes management
│   ├── profile.ejs       # User profile
│   ├── settings.ejs     # Settings page
│   └── statistics.ejs   # Statistics dashboard
├── config/               # Configuration files
│   ├── email.js        # Email service config
│   └── upload.js       # File upload config
├── utils/                # Utility functions
│   ├── markdown.js     # Markdown processing
│   └── pdfExport.js    # PDF export
├── routes/               # Route handlers
│   └── auth.js         # Authentication routes
└── public/               # Static files
    └── uploads/         # User uploads
```

## 🗄️ Database Configuration

### Local MongoDB
The app is configured to use local MongoDB by default:
- Connection: `mongodb://127.0.0.1:27017/authtestapp`
- Database: `authtestapp`
- Collections: `users`, `notes`, `activities`

### MongoDB Atlas (Cloud)
To use MongoDB Atlas:

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `models/user.js`:
```javascript
mongoose.connect(`mongodb+srv://username:password@cluster.mongodb.net/authtestapp?retryWrites=true&w=majority`)
```

⚠️ **Important**: Make sure to add your IP address to MongoDB Atlas whitelist.

## 🔧 Environment Variables (Optional)

Create a `.env` file in the root directory:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
BASE_URL=http://localhost:3000
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **nodemailer** - Email service
- **multer** - File uploads
- **marked** - Markdown parsing
- **pdfkit** - PDF generation
- **ejs** - Template engine
- **cookie-parser** - Cookie handling

## 🎯 Features in Detail

### Notes Features
- **Categories**: Organize notes by category
- **Tags**: Add multiple tags to notes
- **Priority**: Set note priority (low, medium, high)
- **Colors**: Color-code your notes
- **Search**: Full-text search across notes
- **Export**: Export notes in multiple formats

### User Features
- **Profile Management**: Update username, email, age
- **Profile Pictures**: Upload and manage profile pictures
- **Password Security**: Change password securely
- **Settings**: Customize theme and notifications
- **Activity Tracking**: View your activity history

## 🌐 Deployment

### Deploying to Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set MONGODB_URI=your-mongodb-connection-string
heroku config:set EMAIL_USER=your-email
heroku config:set EMAIL_PASS=your-app-password
```

3. Deploy:
```bash
git push heroku main
```

### Deploying to Vercel/Railway/Other Platforms

- Make sure MongoDB Atlas is configured
- Set environment variables
- Update connection strings for production
- Configure email service for production domain

## ⚠️ Important Notes

1. **Database**: The current setup uses local MongoDB. For production, use MongoDB Atlas or another cloud database service.

2. **Email Configuration**: Email features require proper SMTP configuration. The app will work without email, but verification and password reset won't send emails.

3. **File Uploads**: Profile pictures and attachments are stored in `public/uploads/`. Make sure this directory exists and is writable.

4. **Security**: 
   - Change JWT secret in production
   - Use environment variables for sensitive data
   - Enable HTTPS in production

## 📝 License

ISC

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Built with Node.js and Express
- UI enhanced with Tailwind CSS
- Icons from Font Awesome


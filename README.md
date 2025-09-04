# HMS Backend - Hostel Management System API

A comprehensive backend API for managing hostel operations including student management, room allocation, complaints, visitor tracking, and more.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin, Warden, Security, and Student roles
- **Room Management**: Room allocation, availability tracking
- **Complaint System**: Submit and track complaints
- **Visitor Management**: Check-in/out system for visitors
- **Email System**: OTP-based authentication and notifications
- **Password Reset**: Secure OTP-based password reset system

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail SMTP
- **Security**: bcryptjs for password hashing
- **Environment**: dotenv for configuration

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/HMS-backend.git
cd HMS-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## 🌐 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

### Environment Variables

Required environment variables:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password
- `FRONTEND_URL`: Frontend domain for CORS
- `PORT`: Server port (default: 8008)

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/check-user` - Check if user exists
- `POST /auth/request-otp` - Request OTP for login
- `POST /auth/verify-otp` - Verify OTP and login

### Password Reset Endpoints

- `POST /password-reset/request-otp` - Request password reset OTP
- `POST /password-reset/verify-and-reset` - Verify OTP and reset password
- `GET /password-reset/history` - Get password reset history (Admin)

### Admin Endpoints

- `GET /admin/dashboard` - Get dashboard statistics
- `POST /admin/create` - Create new admin
- `GET /admin/list` - List all admins
- `PUT /admin/:id` - Update admin
- `DELETE /admin/:id` - Delete admin

### Room Management

- `GET /rooms` - Get all rooms
- `POST /rooms` - Create new room
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- OTP-based email verification
- CORS protection
- Input validation and sanitization

## 🧪 Testing

Run the OTP password reset test:
```bash
node test-otp-password-reset.js
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, email support@hms.com or create an issue in the repository.
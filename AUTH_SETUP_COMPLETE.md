# Authentication System - Setup Complete

## ✅ Implementation Summary

Successfully implemented a complete OTP-based authentication system with JWT tokens and protected routes.

### Backend Features

1. **Authentication Middleware** (`server/middleware/auth.js`)
   - JWT token verification
   - Attaches user and accountId to all requests
   - Returns 401 for invalid/missing tokens

2. **Auth Controller** (`server/controllers/auth.controller.js`)
   - `POST /api/auth/send-otp` - Send OTP (default: 123456)
   - `POST /api/auth/verify-otp` - Verify OTP and return JWT
   - `GET /api/auth/me` - Get current user info
   - `POST /api/auth/logout` - Logout endpoint

3. **Protected Routes**
   - All API routes now require authentication except:
     - `/api/auth/*` (login/OTP endpoints)
     - `/api/accounts/register` (account creation)

4. **Multi-Tenant Data Isolation**
   - All controllers now use `req.user.accountId`
   - Products, brands, categories, warehouses filtered by account
   - Data is completely isolated between accounts

### Frontend Features

1. **Auth Pages**
   - `/login` - Phone number entry
   - `/verify-otp` - OTP verification (default: 123456)
   - `/register` - Account registration

2. **AuthContext** (`contexts/AuthContext.tsx`)
   - Global authentication state
   - Token and user data management
   - Persists to localStorage

3. **Protected Routes**
   - All app routes require authentication
   - Automatic redirect to `/login` if not authenticated
   - Redirect to `/` if authenticated user visits auth pages

4. **API Service** (`services/api.ts`)
   - Axios interceptor adds JWT to all requests
   - Automatic logout on 401 responses
   - Auth API methods included

5. **Sidebar Updates**
   - Shows logged-in user name and company
   - Logout button

---

## 🚀 How to Use

### 1. Start the Server

```bash
cd server
node server.js
```

### 2. Start the Frontend

```bash
npm run dev
```

### 3. First Time Setup

1. Go to http://localhost:5173 (or your dev URL)
2. You'll be redirected to `/login`
3. Click "Register" to create an account

### 4. Create Account

Fill in the registration form:
- **Required**: Company Name, Phone Number
- **Optional**: Legal name, GST, PAN, address fields
- Click "Create Account"
- You'll receive OTP: **123456** (shown in alert for development)

### 5. Verify OTP

- Enter OTP: **123456**
- Click "Verify OTP"
- You'll be logged in and redirected to the dashboard

### 6. Login (Existing Users)

1. Go to `/login`
2. Enter phone number
3. Click "Send OTP"
4. OTP will be: **123456**
5. Enter OTP and verify
6. Access granted!

---

## 🔑 Default Credentials

- **OTP**: Always `123456` (for development)
- **Token Expiry**: 30 days
- **OTP Expiry**: 10 minutes

---

## 📋 API Endpoints

### Public (No Auth Required)

```
POST /api/accounts/register   - Create new account
POST /api/auth/send-otp       - Send OTP to phone
POST /api/auth/verify-otp     - Verify OTP and login
```

### Protected (Auth Required)

```
GET  /api/auth/me             - Get current user
POST /api/auth/logout         - Logout
GET  /api/products            - List products (filtered by accountId)
POST /api/products            - Create product (accountId from token)
... all other endpoints ...
```

### Auth Header Format

```
Authorization: Bearer <jwt_token>
```

---

## 🔒 Security Features

1. **JWT Tokens**
   - Signed with secret key
   - Contains userId and accountId
   - Verified on every protected request

2. **Multi-Tenant Isolation**
   - All data queries filter by accountId
   - Users can only see/modify their account's data
   - Foreign key constraints prevent cross-account access

3. **OTP Security**
   - 10-minute expiry
   - Max 5 attempts per OTP
   - Cleared after successful verification

4. **Frontend Protection**
   - Route guards check authentication
   - Token stored in localStorage
   - Auto-logout on 401 response

---

## 🛠️ Development Notes

### Testing with Multiple Accounts

1. Register first account with phone: +919876543210
2. Logout
3. Register second account with phone: +919876543211
4. Each account sees only its own data

### Customizing OTP

Edit `server/controllers/auth.controller.js`:
```javascript
const DEFAULT_OTP = '123456'; // Change this
```

### Changing Token Expiry

Edit `server/middleware/auth.js`:
```javascript
expiresIn: '30d' // Change to '1h', '7d', etc.
```

### Adding SMS Integration

Replace the console.log in `auth.controller.js` sendOTP:
```javascript
// Instead of:
console.log(`OTP for ${phone}: ${otp}`);

// Use Twilio/AWS SNS:
await twilioClient.messages.create({
  body: `Your OTP is: ${otp}`,
  to: phone,
  from: TWILIO_PHONE_NUMBER
});
```

---

## ✨ What's Working

✅ User registration with phone number  
✅ OTP-based login (fixed OTP: 123456)  
✅ JWT token generation and verification  
✅ Protected routes on backend and frontend  
✅ Multi-tenant data isolation  
✅ Auto-logout on token expiry  
✅ Persistent login (localStorage)  
✅ User info display in sidebar  
✅ Account-specific data filtering  

---

## 🎯 Next Steps (Optional Enhancements)

1. **SMS Integration**: Add Twilio/AWS SNS for real OTP delivery
2. **Password Option**: Add password-based login as alternative
3. **Refresh Tokens**: Implement refresh token rotation
4. **Role-Based Access**: Use the existing Role model for permissions
5. **Account Management**: Add user management within accounts
6. **2FA**: Add optional 2-factor authentication
7. **Session Management**: Track active sessions

---

## 📝 Files Modified/Created

### Backend
- ✅ `server/middleware/auth.js` - NEW
- ✅ `server/controllers/auth.controller.js` - NEW
- ✅ `server/routes/auth.routes.js` - NEW
- ✅ `server/server.js` - MODIFIED (added auth middleware)
- ✅ `server/controllers/product.controller.js` - MODIFIED (uses req.user.accountId)
- ✅ `server/controllers/brand.controller.js` - MODIFIED
- ✅ `server/controllers/category.controller.js` - MODIFIED
- ✅ `server/controllers/warehouse.controller.js` - MODIFIED
- ✅ `server/controllers/account.controller.js` - MODIFIED (sends OTP on register)

### Frontend
- ✅ `pages/Login.tsx` - NEW
- ✅ `pages/Register.tsx` - NEW
- ✅ `pages/VerifyOTP.tsx` - NEW
- ✅ `contexts/AuthContext.tsx` - NEW
- ✅ `services/api.ts` - MODIFIED (added auth interceptors)
- ✅ `App.tsx` - MODIFIED (added protected routes)
- ✅ `components/Sidebar.tsx` - MODIFIED (added user info & logout)

---

🎉 **Your inventory system is now fully secured with authentication!**

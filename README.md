# 🪑 SeatMate – Smart Seat Reservation System

SeatMate is a web-based seat reservation system designed to simplify the process of booking and managing seats. It allows students and teachers to view seat availability, reserve seats, manage bookings, and cancel reservations.

## 🚀 Features

### 👨‍🎓 Student Features
- Student registration and login
- View available tables and seats
- Select reservation date and time
- Book a seat
- View booking history
- Cancel reservations
- QR code generation for bookings
- Check-in and check-out
- Extend reservations
- Profile management

### 👨‍🏫 Teacher Features
- Teacher login
- View teacher-section seats
- Check seat availability
- Book available seats
- View personal reservations
- Cancel reservations

### 🛡️ Admin Features
- Admin dashboard
- Manage seats and tables
- Manage students
- Verify booking QR codes
- Manage complaints

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- QR Code Generation

## 📁 Project Structure

```text
SeatMate/
├── backend/
│   ├── controller/
│   ├── middleware/
│   ├── model/
│   ├── routes/
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites
- Node.js and npm
- MongoDB database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/chmcs2026abdulmehboobsayed-wq/SeatMate.git
```

### 2. Navigate to the Project Folder

```bash
cd SeatMate
```

### 3. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Add any other environment variables required by your project.

Start the backend:

```bash
npm run dev
```

### 4. Setup the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 📅 Reservation Rules

- Reservations are available Monday to Saturday.
- Library hours are 10:00 AM to 5:00 PM.
- Each reservation is for one hour.
- Reservations can be made up to seven days in advance.
- Students and teachers can book seats in their respective sections.
- Cancelled reservations do not count as active bookings.

## 🔐 Security

- Authentication middleware protects reservation routes.
- Users can view and cancel their own reservations.
- Role-based checks restrict access to student and teacher sections.
- Admin-only QR verification is supported.

## 🎯 Project Objective

The main objective of SeatMate is to make seat reservation easier, reduce manual work, improve seat availability tracking, and provide a convenient booking experience for students and teachers.

## 👨‍💻 Contributors

- **Abdul Mehboob Sayed**
- **Barkatali Hajratali Shaikh**

## 📌 Future Enhancements

- Improved real-time seat availability
- Enhanced admin reporting
- Better notification management
- Additional reservation analytics

---

**SeatMate – Smart and Simple Seat Reservation.**

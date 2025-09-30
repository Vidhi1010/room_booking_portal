# Kartik Jaipur Yatra 2025 – Registration Portal

A full-stack web application for managing **yatra registrations** with a React-based frontend and Google Sheets backend.  
Participants can register, select rooms, enter chanting rounds, and upload payment screenshots. Data is stored directly in Google Sheets via an Apps Script web API.

---

## ✨ Features

- 🎉 **Landing Page** with hero section, countdown timer, yatra poster, and event details.  
- 🛕 **About Section** describing temples and schedule.  
- 🖼️ **Gallery Slider** with lazy-loaded festival images.  
- 📝 **Registration Form** (RoomBookingPortal):
  - Name, contact, gender, age, facilitator
  - Room selection with pricing
  - Transport preferences
  - Chanting rounds (min 8, max 16)
  - Screenshot upload (payment proof)
  - Auto-calculated total price
- ✅ **Google Sheets Integration** – Form submissions are saved with timestamp.  
- 📱 **Responsive Design** – Works on mobile, tablet, and desktop.  

---

## 🛠️ Tech Stack

### Frontend
- [React](https://react.dev/) (with functional components + hooks)
- [React Router](https://reactrouter.com/) for navigation
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide Icons](https://lucide.dev/) for icons
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Swiper.js](https://swiperjs.com/) for image slider with lazy loading

### Backend
- [Google Apps Script](https://developers.google.com/apps-script) as a serverless API
- Data stored in **Google Sheets**

---



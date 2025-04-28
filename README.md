# Tokubetsu - Web Accessibility Testing Platform

A comprehensive web platform for real-time accessibility testing, impairment simulation, and accessibility improvement suggestions.

## 🚀 Features

- Live Accessibility Scanner
- Impairment Simulators
- Screen Reader Preview Mode
- Test Lab Mode
- Learning Hub
- Browser/IDE/Figma Integrations

## 🛠 Tech Stack

- Frontend: React + TypeScript
- Backend: Go
- Database: PostgreSQL
- Testing: Jest, React Testing Library, Go tests

## 📦 Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL 15+
- Docker & Docker Compose

## 🏗 Project Structure

```
/
├── frontend/                 # React + TypeScript frontend
├── backend/                 # Go backend
├── docker/                 # Docker configurations
└── docs/                   # Documentation
```

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/ug2454/tokubetsu.git
cd tokubetsu
```

2. Start the development environment
```bash
docker-compose up -d
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Start the frontend development server
```bash
npm run dev
```

5. Start the backend server
```bash
cd backend
go run cmd/server/main.go
```

## 📝 License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).  
You may share and adapt the material for non-commercial purposes, with proper attribution.

See the [LICENSE](./LICENSE) file for full details.


## 👥 Contributing

Contributions are welcome! Please read our contributing guidelines first. 

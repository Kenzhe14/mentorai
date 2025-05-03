# Mentor Backend (Go)

This is the Go backend for the Mentor application. It uses Gin framework for the API endpoints and GORM for database interactions with PostgreSQL.

## Features

- User authentication (register, login)
- Onboarding process for users
- Personalized content generation
- Learning roadmap generation
- Auto-migration of database models
- JSON Web Token (JWT) authentication

## Tech Stack

- [Go](https://golang.org/)
- [Gin](https://github.com/gin-gonic/gin) - Web framework
- [GORM](https://gorm.io/) - ORM library
- [PostgreSQL](https://www.postgresql.org/) - Database
- [JWT](https://github.com/golang-jwt/jwt) - JSON Web Tokens

## Project Structure

```
server-go/
├── config/         # Configuration files
├── controllers/    # API controllers
├── middleware/     # Middleware components
├── models/         # Database models
├── routes/         # API routes
├── .env            # Environment variables (create from env.example)
├── main.go         # Main application entry point
└── README.md       # This file
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-folder>/server-go
```

2. Install dependencies:

```bash
go mod download
```

3. Create an `.env` file based on the `.env.example` file:

```bash
cp config/env.example .env
```

4. Update the `.env` file with your database credentials and other configuration.

5. Run the application:

```bash
go run main.go
```

The server will start on the port specified in the `.env` file (default is 5000).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in an existing user

### Onboarding

- `POST /api/onboarding/save` - Save onboarding data
- `GET /api/onboarding/data` - Get onboarding data
- `GET /api/onboarding/status` - Check if onboarding is completed

### Web API (English)

- `POST /en/api/web/personalized-content` - Get personalized content
- `POST /en/api/web/roadmap` - Generate a learning roadmap

### Web API (Russian)

- `POST /ru/api/web/personalized-content` - Get personalized content in Russian
- `POST /ru/api/web/roadmap` - Generate a learning roadmap in Russian

## License

This project is licensed under the MIT License. 
# How to run

This guide assumes you have Node.js and npm installed and running on your machine.

```bash
npm install
```

```bash
npm run start
```

# How to deploy

This guide assumes you have Docker and Docker Compose installed and running on your machine.

## Windows

```bash
docker-compose build --no-cache; docker-compose up -d
```

## Linux

```bash
docker-compose build --no-cache && docker-compose up -d
```

# API Docs

Access [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/) after running the application.
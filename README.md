# Cloud Campus Backend

The backend API for **Cloud Campus**, a cloud-based learning management system built with NestJS, TypeScript, Drizzle ORM and PostgreSQL.

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **API Documentation:** Swagger

## AWS Architecture

Cloud Campus uses a serverless, three-tier architecture designed to run on AWS.

| Layer          | AWS Service        | Purpose                                                |
| -------------- | ------------------ | ------------------------------------------------------ |
| Frontend       | AWS Amplify        | Hosts and deploys the Next.js application              |
| API            | Amazon API Gateway | Exposes and manages REST APIs                          |
| Backend        | AWS Lambda         | Runs the NestJS backend                                |
| Database       | Amazon RDS         | Hosts the PostgreSQL database                          |
| Authentication | Amazon Cognito     | Handles user authentication                            |
| File Storage   | Amazon S3          | Stores uploaded files                                  |
| Monitoring     | Amazon CloudWatch  | Collects logs, metrics and application monitoring data |

_AWS deployment services are subject to implementation and deployment status._

## Prerequisites

- Node.js
- npm

## Installation

Clone the repository and install dependencies.

```bash
git clone https://github.com/Lyhab/cloud-campus-backend.git
cd cloud-campus-backend
npm install
```

## Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql://username:password@localhost:port/db_name

#Cloud Services
AWS_REGION=your_aws_region

# AWS Cognito
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
COGNITO_CLIENT_SECRET=your_client_secret

# Amazon S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
```

Replace the placeholders with your actual configuration.

## Database Setup

Cloud Campus uses PostgreSQL with Drizzle ORM for database management.

### Database Scripts

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `npm run db:generate` | Generate migration files from schema changes         |
| `npm run db:migrate`  | Apply pending migrations                             |
| `npm run db:seed`     | Populate the database with initial data              |
| `npm run db:reset`    | Drop and recreate the public schema                  |
| `npm run db:rebuild`  | Reset the database, run all migrations and seed data |

### Initial Setup

To initialize the database, run:

```bash
npm run db:migrate
npm run db:seed
```

Alternatively, use:

```bash
npm run db:rebuild
```

**Warning:** `db:reset` and `db:rebuild` permanently delete existing data in the public schema. Use them with caution.

### Updating the Database

After modifying the Drizzle schema, generate and apply a migration.

```bash
npm run db:generate
npm run db:migrate
```

## Running the Application

```bash
# Development
npm run start

# Watch mode
npm run dev

# Production
npm run start:prod
```

The application runs on `http://localhost:3001` by default.

## API Documentation

Cloud Campus uses Swagger for interactive API documentation.

Once the application is running, access:

**http://localhost:3001/api/docs**

Swagger allows developers to explore API endpoints, inspect request and response schemas and test API operations.

## Testing

Run the following commands to execute tests.

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```text
src/
├── auth/           # Authentication and authorization
├── courses/        # Course management
├── dashboard/      # Dashboard APIs
├── db/             # Database configuration and schema
├── homepage/       # Homepage APIs
├── reports/        # Reports management
├── resources/      # Resources management
├── s3/             # S3 cloud service
├── search/         # Global search
├── seeds/          # Database seed data
├── users/          # User management
└── main.ts         # Application entry point

drizzle/            # Database migration files
scripts/            # Database reset and rebuild scripts
```

## Development Workflow

1. Pull the latest changes from the development branch.
2. Install dependencies using `npm install`.
3. Configure the `.env` file.
4. Run database migrations if necessary.
5. Start the development server using `npm run dev`.
6. Test API endpoints using Swagger.

## Deployment

The application is designed for deployment on AWS.

- **AWS Amplify:** Frontend hosting and deployment.
- **Amazon API Gateway:** REST API management.
- **AWS Lambda:** Serverless backend execution.
- **Amazon RDS:** Managed PostgreSQL database.
- **Amazon Cognito:** Authentication.
- **Amazon S3:** File storage.
- **Amazon CloudWatch:** Logging, metrics and monitoring.

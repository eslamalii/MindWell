# Shezlong

This is the `Shezlong` project built with NestJS, a progressive Node.js framework for building efficient, reliable, and scalable server-side applications.

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
  - [Development](#development)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [End-to-End Tests](#end-to-end-tests)
- [Linting and Formatting](#linting-and-formatting)
- [Postman Documentation](postman-documentation)
- [License](#license)

## Description

This project aims to provide a robust backend system utilizing NestJS. It includes features such as user authentication, geolocation services, and a secure API layer.

## Installation

Follow these steps to install the project:

1. **Clone the repository**:

   ```sh
   git clone https://github.com/yourusername/shezlong.git
   cd shezlong
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

## Database Setup

This project uses MariaDB as the database. Follow these steps to set up MariaDB:

1. **Install MariaDB**:

   On macOS, you can use Homebrew to install MariaDB:

   ```sh
   brew install mariadb
   ```

   For other operating systems, refer to the [MariaDB installation guide](https://mariadb.com/kb/en/getting-installing-and-upgrading-mariadb/).

2. **Start MariaDB**:

   On macOS, you can start MariaDB with:

   ```sh
   brew services start mariadb
   ```

   Alternatively, you can start it using:

   ```sh
   mysql.server start
   ```

3. **Secure the Installation**:

   Run the security script to set the root password and remove insecure defaults:

   ```sh
   mysql_secure_installation
   ```

4. **Create the Database**:

   Access the MariaDB shell:

   ```sh
   mysql -u root -p
   ```

   Create a new database and a user with the necessary privileges:

   ```sql
   CREATE DATABASE shezlong;
   CREATE USER 'shezlong_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON shezlong.* TO 'shezlong_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Configure Environment Variables**:

   Update your `.env` file with the database connection details:

   ```sh
   NODE_ENV=development
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USERNAME=shezlong_user
   DATABASE_PASSWORD=password
   DATABASE_NAME=shezlong
   JWT_SECRET=shezlong-task
   ```

## Postman Documentation

You can access the Postman documentation for the Shezlong API at the following link:

[Shezlong API Postman Documentation](https://documenter.getpostman.com/view/19860605/2sA3kUG2Pi)

## Running the App

### Development

To start the app in development mode with hot-reload enabled:

```sh
npm run start:dev
```

# Kiosk Web Checkout

This repository contains a Node.js application for managing a small kiosk. The project was initially created to support a kiosk opened by a graduating class for dormitory residents and has been actively used since its deployment.

## Overview

The application provides a web interface to manage products, categories and sales reports. It relies on **Express** for the server and **SQLite** as a lightweight database. The user interface is served from static HTML, CSS and JavaScript files under the `public/` directory.

Key features include:

- Inventory management with CRUD operations for products and categories
- Image upload for products
- Price tracking and sales reporting for each date
- Tabs for viewing sales by delivery or in-store consumption
- Overview dashboard for daily revenues and prices

## Directory Structure

```
public/             Static assets (HTML, CSS, JS, images)
data/               Scripts for setting up and merging SQLite databases
server.js           Express application entry point
db.js               Database helper functions (products, categories, sales)
start.rm            Notes on running the application in production
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize the SQLite database (creates tables if they do not exist):
   ```bash
   node data/setupDatabase.js
   ```
3. Start the application:
   ```bash
   npm start
   ```
   By default the server runs on [http://localhost:3000](http://localhost:3000).

During development you can access:
- `/menu/menu.html` – menu page for customers
- `/products/index.html` – administration page for managing products and generating reports
- `/admin/overview.html` – daily overview of sales and revenue

## Production Notes

The file `start.rm` provides an example of how to configure the app with **pm2** and **Nginx** on a server. It also includes a reference to securing the site with **Certbot** for HTTPS support.

## API Endpoints

The server exposes a JSON API used by the front end. Some of the important endpoints are:

- `GET /api/products` – retrieve product list
- `POST /api/products` – add a new product (supports image upload)
- `PUT /api/products/:id` – update a product
- `PUT /api/products/:id/toggle-visibility` – hide or show a product
- `DELETE /api/products/:id` – delete a product
- `GET /api/categories` – get list of categories
- `POST /api/categories` – add a category
- `GET /api/check-report` – check if a sales report exists for a date
- `POST /api/save-report` – save a sales report and prices for a date
- `GET /api/sales-data` – retrieve aggregated sales data
- `GET /api/prices-data` – get product prices by date
- `GET /api/revenue-data` – revenue grouped by date

All data is stored in a local SQLite database located in `data/kiosk.db`.

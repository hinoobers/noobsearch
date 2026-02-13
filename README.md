# 🔍 noobsearch: Custom Crawler & Search Engine

[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

A Search engine architecture featuring a custom-built web crawler, a dedicated indexing algorithm, and a minimalist React-based interface.

---

## 🚀 Overview

NexusSearch isn't just a wrapper; it's a bottom-up implementation of search technology. It traverses the web via a seed list of domains, parses metadata, and utilizes a weighted search algorithm to deliver relevant results.

### Core Components
* **The Crawler:** An automated bot that visits domains listed in `domains.txt`.
* **The Indexer:** A Node.js logic layer that extracts titles, descriptions, and keywords.
* **The Engine:** A MySQL-powered search utility that ranks results based on metadata relevance.
* **The UI:** React application focused on speed and simplicity.

---

## ⚙️ How It Works



### 1. Data Acquisition (The Crawler)
The engine begins with a `domains.txt` file. 
* **Root-Level Preference:** The crawler is made to prioritize root domains to map the widest possible web graph.
* **Deep Crawling:** It recursively follows links to populate the index.
* *Note: Development is currently paused due to proxy requirements for high-volume scraping.*

### 2. The Database Schema
Data is structured in MySQL like this:

| Field | Type | Description |
| :--- | :--- | :--- |
| `url` | VARCHAR | The unique address of the indexed page. |
| `title` | TEXT | The `<title>` tag used for primary relevance. |
| `description` | TEXT | Snippet displayed in search results. |
| `keywords` | TEXT | Meta keywords used to boost search rankings. |
| `last_updated` | TIMESTAMP | Tracks freshness of the crawled data. |

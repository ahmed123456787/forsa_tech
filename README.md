# Forsa Tech

A full-stack AI chatbot application combining a Python-based backend with RAG (Retrieval-Augmented Generation) capabilities and a modern TypeScript/React frontend.

## Project Overview

Forsa Tech is a conversational AI system that leverages vector databases (Qdrant) for semantic search and retrieval. It consists of two main components:

### Backend (`chatbot_ai/`)

- **Python FastAPI** server implementing AI chatbot functionality
- **Qdrant vector database** integration for semantic search and document retrieval
- **RAG (Retrieval-Augmented Generation)** pipeline for intelligent responses
- Processes and stores document summaries for contextual understanding
- Handles conversation logic and AI model interactions

### Frontend (`frontend/`)

- **React + TypeScript** modern web interface
- **Vite** build tool for fast development and optimized production builds
- **Tailwind CSS** for responsive UI styling
- **ESLint** for code quality
- Interactive chat interface for user-AI conversations

## Features

- 💬 Real-time chatbot conversations
- 🔍 Semantic search through document database
- 📄 RAG-powered responses based on indexed documents
- 🎨 Modern, responsive user interface
- 🚀 Fast, optimized builds with Vite
- 📊 Vector database for intelligent information retrieval

## Project Structure

```
forsa_tech/
├── chatbot_ai/              # Python backend
│   ├── src/                 # Source code
│   │   ├── api/            # API endpoints
│   │   └── core/           # Core business logic
│   ├── data/               # Data storage (summaries, processed data)
│   ├── qdrant_storage/     # Vector database storage
│   ├── main.py             # Application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment configuration
│
├── frontend/               # React/TypeScript frontend
│   ├── src/               # React components and pages
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.ts # Tailwind configuration
│   └── .env              # Frontend environment variables
│
└── qdrant_backup_*/        # Backup snapshots of vector database
```

## Getting Started

### Prerequisites

- **Python 3.10+** for the backend
- **Node.js/Bun** for the frontend
- **Qdrant** vector database

### Backend Setup

1. Navigate to the chatbot_ai directory:

```bash
cd chatbot_ai
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the backend server:

```bash
python main.py
```

The API will be available at `http://localhost:8000` (or configured port)

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
bun install
# or: npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
# Update API endpoint and other settings
```

4. Start development server:

```bash
bun dev
# or: npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Building for Production

**Backend:**

```bash
cd chatbot_ai
python main.py  # Configure for production
```

**Frontend:**

```bash
cd frontend
bun run build
# or: npm run build
```

### Code Quality

- **Frontend:** ESLint is configured for TypeScript/React code quality
- **Backend:** Follow Python best practices and PEP 8 standards

## Database Management

Vector database backups are stored in `qdrant_backup_*` directories. The active database is in `qdrant_storage/`.

## Configuration

Both frontend and backend use `.env` files for configuration:

- `chatbot_ai/.env` - Backend configuration (API keys, database, ports)
- `frontend/.env` - Frontend configuration (API endpoint, feature flags)

## Technologies Used

**Backend:**

- Python 3.10+
- FastAPI
- Qdrant Vector Database
- RAG/LLM Integration

**Frontend:**

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- ESLint

## Contributing

1. Follow the established project structure
2. Maintain code quality with linting tools
3. Document your changes
4. Test thoroughly before committing

## License

[Add your license information here]

## Support

For issues and questions, please open an issue in the repository.

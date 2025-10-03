# Artwork Data Table

A React TypeScript application built with Vite that displays artwork data from the Art Institute of Chicago API in a paginated data table with advanced row selection capabilities.

## Features

- Server-side pagination with PrimeReact DataTable
- Cross-page row selection persistence
- Custom bulk selection overlay
- TypeScript with strict mode
- Responsive design

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **PrimeReact** - UI component library
- **PrimeIcons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/     # React components
├── services/       # API services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main app component
└── main.tsx        # App entry point
```

## API

This application uses the Art Institute of Chicago API:
- Base URL: `https://api.artic.edu/api/v1/artworks`
- Documentation: [Art Institute of Chicago API](https://api.artic.edu/docs/)

## Development

The project is configured with:
- TypeScript strict mode
- Path aliases for clean imports
- ESLint for code quality
- PrimeReact theme integration

## Deployment

The application can be deployed to any static hosting service like Netlify, Cloudflare Pages, or similar platforms."# artwork-data-table" 
# artwork-data-table
# artwork-data-table

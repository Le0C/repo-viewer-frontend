# Repo Viewer

An interactive web application for visualizing and exploring file and node relationships in a code repository. Built with Vite, TypeScript, and D3.js.

## About

This tool started off as a set of scripts which I used in the past to get an understanding of a new repository. When reading a file, I found it useful to be able to visualise where this file was used across the project. Additionally, I used these scripts to cross check modified files when testing, to ensure that I wasn't making a change in one place that would cause a bug in another.

I converted these scripts into a frontend & web service with the goal of developing new features which were becoming difficult to manage in the suite of scripts which I developed initially.

## Features

- **Graph Visualization:** Visualizes nodes and links using D3 force-directed layout.
- **Node Details:** Click a node to view its details and related links.
- **File Loader:** Enter a file path and load its structure into the graph.
- **Loading Spinner:** Displays a spinner while data is loading.
- **Customizable:** Easily extendable for new data formats or visual styles.
- **Responsive UI:** Resizes dynamically to fit the browser window.

## Tech Stack

- [Vite](https://vitejs.dev/) (vanilla-ts template)
- TypeScript
- D3.js (for graph rendering)
- HTML/CSS

## Project Structure

- `src/` — TypeScript source files (main logic, types)
- `scripts/` — JavaScript helpers (D3, file loading, etc.)
- `public/` — Static assets
- `index.html` — Main HTML entry point
- `index.css` — Styles

### Prerequisites

- Node.js v20.19.0 or newer (see Vite and D3 requirements)

### Installation

```sh
npm install
```

### Development

Start the development server:

```sh
npm run dev
```

Open your browser to the local address shown in the terminal (usually http://localhost:5173).

### Build

Create a production build:

```sh
npm run build
```

### Preview

Preview the production build locally:

```sh
npm run preview
```

## Usage

1. Enter a file path in the input box and click **Load File**.
2. The file path for this should be relative to the root of the viewer-backend repo.
3. The graph will display nodes and links from the loaded file.
4. Click a node to highlight its connections and view details in the sidebar.

The link under "Current File" can be clicked to open this file in vscode.

## Customization

- To change the graph layout or appearance, edit `src/index.ts` and `index.css`.
- To add new data sources or formats, update the file loader logic in `scripts/file.js`.

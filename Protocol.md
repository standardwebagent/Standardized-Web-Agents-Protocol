# SWAP: Standardized Web Agents Protocol

## Overview
Stan is a local-first, privacy-focused autonomous agent running entirely in the browser. It leverages WebGPU (with WASM fallback) for local LLM execution and PGlite for local vector memory.

## Core Capabilities
- **Local Intelligence**: Runs GMM, LLama, and SmolLM models locally using WebLLM.
- **Privacy First**: All data processing and memory storage happen on-device (OPFS via PGlite).
- **Dynamic Extensibility**: Connects to any Model Context Protocol (MCP) server for local tool integration.

## Built-in Protocol Tools

### Native Tools
- `search_memory(query)`: Vector search through local conversation history.
- `save_note(text)`: Store persistent information in local memory.
- `fetch_web(url)`: Extract text content from public web pages (cross-origin restricted).
- `calculate(expression)`: Safe mathematical evaluations.

### Browser Utility Tools
- `clipboardRead()`: Access system clipboard text.
- `clipboardWrite(text)`: Copy text to system clipboard.
- `getGeolocation()`: Retrieve current lat/lon (requires permission).
- `showNotification(title, body)`: Push browser notifications.
- `wakeLock()`: Prevent screen from sleeping during long tasks.
- `shareContent(text, url)`: Trigger native OS share sheet.
- `vibrate(ms)`: Provide haptic feedback.
- `barcodeScan()`: Detect barcodes/QR codes from visual input.

## Recent Protocol Upgrades

### Hybrid Execution Engine
- **WebGPU + WASM Fallback**: Stan now automatically detects environment capabilities. If WebGPU is unsupported, it falls back to WebAssembly CPU execution, ensuring 99% browser compatibility.

### Resilient Architecture
- **Concurrency Guard**: Implemented Web Locks API to prevent data corruption during multi-tab access to the local database.
- **MCP Resync**: Automatic session handshake restoration after model swaps or worker restarts.
- **Async Safety**: High-performance markdown rendering with specialized loading skeletons and memory safety guards.

### Advanced UX
- **Intelligent Installation**: Centralized progress tracking with real-time download speeds and throughput monitoring.
- **Responsive Core**: Desktop-optimized layout with adaptive message sizing for professional split-screen workflows.

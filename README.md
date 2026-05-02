# Standardized Web Agents Protocol

[![SWAP Conformance](https://img.shields.io/badge/SWAP-Conformance-blue)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Spec: CC BY-SA 4.0](https://img.shields.io/badge/Spec-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

**SWAP** (Standardized Web Agents Protocol) is an open specification for local-first, privacy-preserving autonomous AI agents. This repository contains:

- Formal specification (`protocol.md`) – covering storage, identity, intelligence, compliance, and more.
- Reference implementation (`swap-agent.html`) – the Standardized Web Agent.

The reference agent runs entirely in your browser using WebGPU, OPFS / PGlite for vector memory, and a ReAct loop. **No cloud, no API keys, no data leakage.**

### Why SWAP is a Paradigm Shift
SWAP defines a complete breakaway from centralized AI architectures, bringing **enterprise-grade autonomy entirely to the edge**.
1. **Zero Data Leakage:** Data cannot leave the device—there are no server endpoints.
2. **Infinite Scale, Zero Marginal Cost:** Since execution happens on user hardware, hosting 10 users costs the same as hosting 10 million.
3. **True Ownership:** Users hold cryptographic keys to their agent's memories within their personal Origin.
4. **Local Hardware Acceleration:** Leverages WebGPU and WASM to run multi-gigabyte models at native speeds.

This agent is a fully autonomous, 100% local, in-browser AI built entirely with web technologies. 
Everything runs directly on your device using WebGPU, meaning it is completely private and requires no server-side API calls once the model weights are downloaded.

---

## 🚀 Quick Start (Open Source)

1. Open `swap-agent.html` in a **WebGPU-compatible browser** (Chrome 113+, Edge, or Chrome on Android).
2. Wait for the initial model download (~1.3 GB for Gemma 2B – cached for future use).
3. Start chatting. The agent remembers your conversation across page reloads.

### Test memory
- Type: `My name is Alex`
- Then: `What is my name?` → The agent replies `Alex`.

### Upload a file (RAG)
- Click the 📎 button, select a `.txt` or `.md` file.
- Ask questions about its content.

### Model selection
Choose from three models in the header dropdown:
- 🚀 **Gemma 2B** (default, 8K context, balanced)
- ⚡ **SmolLM 1.7B** (fastest, ideal for mobile)
- 🧠 **Llama 3.2 3B** (most capable, heavier)

---

## 🧠 Open Core Model

The **Standardized Web Agent** reference implementation is open source under the MIT license. It includes all core enclaves and is free for any use – personal, research, or even commercial.

Here is a breakdown of what it can do:

**Autonomous Reasoning**
Instead of just responding directly, the agent runs in a loop (up to 10 steps).
When you give it a task, it can think step-by-step and decide to use various tools to gather information before giving you a final answer.

**Built-in Tools**
The agent has access to several tools it can invoke during its reasoning loop:

- **Web Fetching**: It can scrape and read text from a given URL to gather real-time information (limited by standard browser CORS policies).
- **Calculator**: It can evaluate mathematical expressions using a secure sandbox to ensure accurate math.
- **Note Taking**: It can intentionally save specific notes or facts to its memory if it thinks they will be useful later.
- **Memory Search**: It can query its own database to retrieve past context or read documents.

**Local Long-Term Memory (RAG)**
The app uses an embedded PostgreSQL database (pglite) compiled to WebAssembly, complete with the pgvector extension.

- **Document Ingestion**: You can upload .txt, .json, or .md files using the paperclip icon. The app chunks the text, locally embeds it using Transformers.js, and stores it in the vector database.
- **Semantic Search**: As you chat, the agent can search its vector database to recall past conversations, retrieve your saved notes, or answer questions based on the documents you've uploaded.

**Switchable Local Models**
You can swap between lightweight local models like Gemma 2B, SmolLM 1.7B, and Llama-3.2 3B seamlessly using the dropdown in the header.

In short, it acts as a private, self-contained mini-assistant that can read files, do math, browse text pages, and remember things over time without your data ever leaving your browser.

Contributions to the protocol specification or reference implementation are welcome. Please open an issue or pull request.

For major changes to the spec, open a protocol-change proposal.

---

📄 License

· Protocol specification (protocol.md): CC BY-SA 4.0
· Reference implementation (swap-agent.html and related code): MIT

---

🌐 Links

· GitHub Repository: https://github.com/standardwebagent/Protocol
· Live Demo (Open Source): URL after Vercel deployment
· Protocol Specification: protocol.md

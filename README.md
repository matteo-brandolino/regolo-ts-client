# **Regolo.ai TypeScript CLI**

A comprehensive TypeScript CLI and SDK for interacting with **Regolo.ai's** LLM-based API and Model Management platform.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@regolo/cli.svg)](https://npmjs.org/package/@regolo/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@regolo/cli.svg)](https://npmjs.org/package/@regolo/cli)

---

## **Table of Contents**

- [Installation](#installation)
- [CLI Usage](#cli-usage)
  - [Authentication](#authentication)
  - [Chat Interface](#chat-interface)
  - [Image Generation](#image-generation)
  - [Text Embeddings](#text-embeddings)
  - [Audio Transcription](#audio-transcription)
  - [Document Reranking](#document-reranking)
  - [Model Management](#model-management)
  - [Available Models](#available-models)
  - [Inference Management](#inference-management)
  - [SSH Key Management](#ssh-key-management)
  - [Workflow](#workflow)
- [SDK Usage](#sdk-usage)
  - [Chat and Completions](#chat-and-completions)
  - [Image Generation (SDK)](#image-generation-sdk)
  - [Text Embeddings (SDK)](#text-embeddings-sdk)
  - [Audio Transcription (SDK)](#audio-transcription-sdk)
  - [Document Reranking (SDK)](#document-reranking-sdk)
- [Model Management & Deployment](#model-management--deployment)
- [Environment Variables](#environment-variables)

---

## **Installation**

Install the CLI globally via npm:

```bash
npm install -g @regolo/cli
```

Or use it directly with npx:

```bash
npx @regolo/cli COMMAND
```

**Requirements:** Node.js >= 18.0.0

---

## **CLI Usage**

### **Authentication**

Authenticate with the Regolo Model Management platform:

```bash
# Interactive login
regolo auth login

# Non-interactive login
regolo auth login --username your@email.com --password yourpassword

# Logout
regolo auth logout
```

Credentials are stored in `~/.regolo_config.json`.

---

### **Chat Interface**

Start an interactive chat session with an LLM:

```bash
regolo chat --apiKey YOUR_API_KEY
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--apiKey` | Regolo API key | — |
| `--maxTokens` | Maximum tokens to generate | 2048 |
| `--noHide` | Show full output including thinking tokens | false |
| `--disableNewlines` | Disable newline parsing in responses | false |

**Examples:**

```bash
# Basic chat
regolo chat --apiKey YOUR_KEY

# Chat with extended output
regolo chat --apiKey YOUR_KEY --maxTokens 4096 --noHide
```

---

### **Image Generation**

Generate images from text prompts:

```bash
regolo create-image --apiKey YOUR_KEY --model MODEL_NAME --prompt "A sunset over the mountains"
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--apiKey` | Regolo API key |
| `--model` | Image generation model name |
| `--prompt` | Text prompt for image generation |
| `--n` | Number of images to generate |
| `--quality` | Image quality (e.g. `hd`) |
| `--size` | Image dimensions (e.g. `1024x1024`) |
| `--style` | Image style (e.g. `realistic`) |
| `--savePath` | Directory to save generated images |
| `--outputFileFormat` | Output format (e.g. `png`, `jpg`) |

**Examples:**

```bash
regolo create-image --apiKey YOUR_KEY --model Qwen-Image \
  --prompt "A futuristic city at night" --n 2 --quality hd --size 1024x1024
```

---

### **Text Embeddings**

Generate vector embeddings for text:

```bash
regolo embeddings --apiKey YOUR_KEY --model gte-Qwen2 --input "Hello world"
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--apiKey` | Regolo API key |
| `--model` | Embedding model name |
| `--input` | Text input (repeatable for multiple inputs) |
| `--inputFile` | JSON file containing an array of input strings |
| `--savePath` | File path to save results |
| `--format` | Output format: `json` or `table` |
| `--fullOutput` | Include full API response |

**Examples:**

```bash
# Single input
regolo embeddings --apiKey YOUR_KEY --model gte-Qwen2 --input "Hello world"

# Multiple inputs
regolo embeddings --apiKey YOUR_KEY --model gte-Qwen2 \
  --input "First text" --input "Second text"

# From JSON file
regolo embeddings --apiKey YOUR_KEY --model gte-Qwen2 \
  --inputFile inputs.json --format table
```

---

### **Audio Transcription**

Transcribe audio files to text:

```bash
regolo transcribe-audio --apiKey YOUR_KEY --model whisper-1 --filePath audio.mp3
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--apiKey` | Regolo API key |
| `--model` | Transcription model name |
| `--filePath` | Path to the audio file |
| `--language` | Audio language (e.g. `en`) |
| `--prompt` | Optional context prompt |
| `--responseFormat` | Format: `json`, `text`, `srt`, `verbose_json`, `vtt` |
| `--temperature` | Sampling temperature |
| `--stream` | Enable streaming output |
| `--savePath` | File path to save the transcription |
| `--fullOutput` | Include full API response |

**Examples:**

```bash
# Basic transcription
regolo transcribe-audio --apiKey YOUR_KEY --model whisper-1 --filePath audio.mp3

# Transcription with SRT output
regolo transcribe-audio --apiKey YOUR_KEY --model whisper-1 \
  --filePath audio.mp3 --responseFormat srt --savePath subtitles.srt

# Streaming transcription
regolo transcribe-audio --apiKey YOUR_KEY --model whisper-1 \
  --filePath audio.mp3 --stream
```

---

### **Document Reranking**

Rerank documents by relevance to a query:

```bash
regolo rerank --apiKey YOUR_KEY --model RERANK_MODEL \
  --query "search term" --documents "doc one" --documents "doc two"
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--apiKey` | Regolo API key |
| `--model` | Reranking model name |
| `--query` | Search query |
| `--documents` | Documents to rerank (repeatable) |
| `--documentsFile` | JSON file containing documents array |
| `--topN` | Number of top results to return |
| `--rankFields` | Fields to rank on (for structured documents) |
| `--savePath` | File path to save results |
| `--format` | Output format: `json` or `table` |

**Examples:**

```bash
# Rerank documents
regolo rerank --apiKey YOUR_KEY --model rerank-model \
  --query "machine learning" \
  --documents "Introduction to neural networks" \
  --documents "History of cooking" \
  --topN 1

# Rerank from file
regolo rerank --apiKey YOUR_KEY --model rerank-model \
  --query "machine learning" --documentsFile docs.json --format table
```

---

### **Model Management**

Manage your registered models (requires authentication):

```bash
# List all registered models
regolo models list

# List in JSON format
regolo models list --format json

# Register a HuggingFace model
regolo models register --name my-llm --type huggingface \
  --url https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct

# Register a private HuggingFace model
regolo models register --name my-private-llm --type huggingface \
  --url https://huggingface.co/myorg/private-model --apiKey HF_TOKEN

# Register a custom model
regolo models register --name my-custom-model --type custom

# Register an Ollama model
regolo models register --name my-ollama --type ollama --url ollama/modelname

# Get model details
regolo models details my-llm

# Delete a model
regolo models delete my-llm
```

---

### **Available Models**

Query models available for inference via the Regolo API:

```bash
# List all available models
regolo get-available-models --apiKey YOUR_KEY

# Filter by type
regolo get-available-models --apiKey YOUR_KEY --modelType chat
regolo get-available-models --apiKey YOUR_KEY --modelType embedding
regolo get-available-models --apiKey YOUR_KEY --modelType image_generation
regolo get-available-models --apiKey YOUR_KEY --modelType audio_transcription
regolo get-available-models --apiKey YOUR_KEY --modelType rerank
```

---

### **Inference Management**

Monitor and manage running inference instances (requires authentication):

```bash
# List available GPUs
regolo inference gpus

# Show currently loaded models
regolo inference status
regolo inference status --format json

# View usage statistics (current month)
regolo inference user-status

# View usage for a specific month
regolo inference user-status --month 012025

# View usage for a custom date range
regolo inference user-status --timeRangeStart 2025-01-01 --timeRangeEnd 2025-01-31
```

---

### **SSH Key Management**

Manage SSH keys for accessing custom model repositories (requires authentication):

```bash
# Add an SSH key from file
regolo ssh add --title "My Laptop" --keyFile ~/.ssh/id_rsa.pub

# Add an SSH key directly
regolo ssh add --title "My Key" --key "ssh-rsa AAAA..."

# List all SSH keys
regolo ssh list

# Delete an SSH key
regolo ssh delete KEY_ID
```

---

### **Workflow**

Run a complete end-to-end workflow: register model, optionally upload files, and load for inference:

```bash
# HuggingFace workflow
regolo workflow my-model --type huggingface \
  --url https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct --autoLoad

# Custom model workflow (with local files)
regolo workflow my-custom-model --type custom \
  --sshKeyFile ~/.ssh/id_rsa --sshKeyTitle "My Key" \
  --localModelPath /path/to/model/files --autoLoad
```

The workflow automates three steps:
1. **Register** the model
2. **Upload** model files (for custom models via GitLab)
3. **Load** the model on a GPU for inference (with `--autoLoad`)

---

## **SDK Usage**

Install the SDK in your TypeScript/JavaScript project:

```bash
npm install @regolo/sdk
```

### **Chat and Completions**

```typescript
import { RegoloClient } from '@regolo/sdk'

// Configure defaults
const client = new RegoloClient({
  apiKey: 'YOUR_API_KEY',
  model: 'Llama-3.3-70B-Instruct',
})

// Simple chat completion
const [role, content] = await client.runChat('Tell me about Rome')
console.log(`${role}: ${content}`)

// Streaming chat
const stream = await client.runChat('Tell me about Rome', { stream: true })
for await (const chunk of stream) {
  process.stdout.write(chunk)
}

// Manage conversation history
client.addPromptToChat('user', 'Tell me about Rome!')
const [, response] = await client.runChat()
console.log(response)

client.addPromptToChat('user', 'Tell me more about its history!')
const [, followUp] = await client.runChat()
console.log(followUp)
```

**Static methods:**

```typescript
import { RegoloClient } from '@regolo/sdk'

// Static chat completion (no instance needed)
const [role, content] = await RegoloClient.staticChatCompletions({
  messages: [{ role: 'user', content: 'What is the capital of France?' }],
  model: 'Llama-3.3-70B-Instruct',
  apiKey: 'YOUR_API_KEY',
})
console.log(`${role}: ${content}`)
```

---

### **Image Generation (SDK)**

```typescript
import { RegoloClient } from '@regolo/sdk'

const client = new RegoloClient({ apiKey: 'YOUR_API_KEY' })

const result = await client.createImage({
  prompt: 'A futuristic city skyline at sunset',
  model: 'Qwen-Image',
  n: 1,
  quality: 'hd',
  size: '1024x1024',
  style: 'realistic',
})

console.log(result)
```

---

### **Text Embeddings (SDK)**

```typescript
import { RegoloClient } from '@regolo/sdk'

const client = new RegoloClient({ apiKey: 'YOUR_API_KEY' })

// Single embedding
const result = await client.embeddings('Hello world', {
  model: 'gte-Qwen2',
})
console.log(result.data[0].embedding)

// Batch embeddings
const batchResult = await client.embeddings(['First text', 'Second text'], {
  model: 'gte-Qwen2',
})
batchResult.data.forEach((item, i) => {
  console.log(`Item ${i}: ${item.embedding.length} dimensions`)
})
```

---

### **Audio Transcription (SDK)**

```typescript
import { RegoloClient } from '@regolo/sdk'
import { readFileSync } from 'fs'

const client = new RegoloClient({ apiKey: 'YOUR_API_KEY' })

// Transcribe from file path
const result = await client.audioTranscription('audio.mp3', {
  model: 'whisper-1',
  language: 'en',
  responseFormat: 'text',
})
console.log(result)

// Streaming transcription
const stream = await client.audioTranscription('audio.mp3', {
  model: 'whisper-1',
  stream: true,
})
for await (const chunk of stream) {
  process.stdout.write(chunk)
}
```

---

### **Document Reranking (SDK)**

```typescript
import { RegoloClient } from '@regolo/sdk'

const client = new RegoloClient({ apiKey: 'YOUR_API_KEY' })

const result = await client.rerank({
  query: 'machine learning frameworks',
  documents: [
    'TensorFlow is a popular deep learning library',
    'History of ancient Rome',
    'PyTorch enables dynamic computation graphs',
  ],
  model: 'rerank-model',
  topN: 2,
})

result.results.forEach((item) => {
  console.log(`[${item.relevance_score.toFixed(3)}] ${item.document.text}`)
})
```

**Reranking structured documents:**

```typescript
const result = await client.rerank({
  query: 'neural networks',
  documents: [
    { title: 'Deep Learning', body: 'Introduction to neural networks' },
    { title: 'Cooking Guide', body: 'How to make pasta' },
  ],
  rankFields: ['title', 'body'],
  model: 'rerank-model',
  returnDocuments: true,
})
```

---

## **Model Management & Deployment**

### **1. Authentication**

```bash
regolo auth login
```

### **2. Register a Model**

```bash
# From HuggingFace
regolo models register --name llama-70b --type huggingface \
  --url https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct

# Custom model (creates a GitLab repository)
regolo models register --name my-finetuned --type custom
```

### **3. Add SSH Key (for custom models)**

```bash
regolo ssh add --title "My Machine" --keyFile ~/.ssh/id_rsa.pub
```

### **4. Upload Custom Model Files**

Clone the GitLab repository created during registration and push your model files:

```bash
git clone git@gitlab.regolo.ai:myusername/my-finetuned.git
cd my-finetuned
cp /path/to/your/model/files .
git add .
git commit -m "Add model files"
git push
```

### **5. Load the Model for Inference**

Use the workflow command to handle all steps automatically:

```bash
regolo workflow my-finetuned --type custom --autoLoad \
  --sshKeyFile ~/.ssh/id_rsa --localModelPath /path/to/model
```

### **6. Monitor Costs and Usage**

```bash
# Current month
regolo inference user-status

# Specific month
regolo inference user-status --month 012025
```

> **Note:** Billing is hourly, rounded up to the full hour. Minimum charge: 1 hour. Costs are in EUR.

### **7. Unload the Model**

Manage loaded models via the inference status and management API.

---

## **Environment Variables**

Configure default values via environment variables to avoid passing flags every time:

| Variable | Description |
|----------|-------------|
| `API_KEY` | Default Regolo API key |
| `LLM` | Default chat model |
| `IMAGE_GENERATION_MODEL` | Default image generation model |
| `EMBEDDER_MODEL` | Default embedding model |
| `REGOLO_URL` | Base URL for the inference API |
| `COMPLETIONS_URL_PATH` | Custom path for completions endpoint |
| `CHAT_COMPLETIONS_URL_PATH` | Custom path for chat completions endpoint |
| `IMAGE_GENERATION_URL_PATH` | Custom path for image generation endpoint |
| `EMBEDDINGS_URL_PATH` | Custom path for embeddings endpoint |
| `AUDIO_TRANSCRIPTION_URL_PATH` | Custom path for audio transcription endpoint |
| `RERANK_URL_PATH` | Custom path for rerank endpoint |

**Default API endpoints:**
- Inference API: `https://api.regolo.ai`
- Model Management API: `https://devmid.regolo.ai`

---

## **Troubleshooting**

**Authentication errors**
- Verify your API key with `regolo get-available-models --apiKey YOUR_KEY`
- For management commands, re-authenticate with `regolo auth login`

**Model not found**
- Check available models: `regolo get-available-models --apiKey YOUR_KEY`
- Check registered models: `regolo models list`

**SSH authentication failures**
- Verify your SSH key is added: `regolo ssh list`
- Ensure the correct private key is being used when cloning

**Model loading timeouts**
- Large models may take several minutes to load
- Monitor loading status: `regolo inference status`

# Self-Hosted Deployment Guide

This document describes how to deploy Ezzi with your own backend infrastructure. Since `VITE_SELF_HOSTED_MODE=true` bypasses authentication entirely, this guide focuses on implementing the AI processing endpoints only.

## Overview

Ezzi in self-hosted mode completely bypasses authentication and user management, requiring only AI processing endpoints. User settings are stored locally in the browser.

## Required API Endpoints

You need to implement exactly **2 endpoints** for self-hosted mode:

### POST /solutions/solve
Process screenshots to generate initial solution

**Request Body:**
```typescript
interface SolveRequest {
  images: string[]; // Array of base64-encoded images
  language: string; // Programming language for solution
  locale: string; // User locale for response language
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
  "language": "python",
  "locale": "en-US",
  "isMock": false
}
```

**Response:**
```typescript
interface SolveResponse {
  thoughts: string[]; // Array of thought processes
  code: string; // Generated code solution
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
  problem_statement: string; // Extracted problem statement
}
```

**Example Response:**
```json
{
  "thoughts": [
    "First, I need to understand the problem...",
    "The problem is asking for...",
    "I'll implement a solution using..."
  ],
  "code": "def solution(nums):\n    # Implementation\n    result = 0\n    # Logic here\n    return result",
  "time_complexity": "O(n)",
  "space_complexity": "O(1)",
  "problem_statement": "Given an array of integers, find the..."
}
```

### POST /solutions/debug
Process additional screenshots to debug/improve existing solution

**Request Body:**
```typescript
interface DebugRequest {
  images: string[]; // Array of base64-encoded images
  language: string; // Programming language for debugging
  locale: string; // User locale for response language
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
  "language": "python",
  "locale": "en-US",
  "isMock": false
}
```

**Response:**
```typescript
interface DebugResponse {
  code: string; // Debugged/improved code
  thoughts: string[]; // Array of debugging thoughts
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
}
```

**Example Response:**
```json
{
  "code": "def solution(nums):\n    # Improved implementation\n    if not nums:\n        return 0\n    result = 0\n    # Improved logic here\n    return result",
  "thoughts": [
    "The original solution has a bug...",
    "We need to handle edge cases...",
    "I've optimized the algorithm by..."
  ],
  "time_complexity": "O(n)",
  "space_complexity": "O(1)"
}
```

## Configuration

### Environment Variables

```bash
cp .env.example .env
```

Enter those values:
```
VITE_SELF_HOSTED_MODE=true
VITE_API_BASE_URL=http://localhost:3000
```

### Request Headers

**Self-hosted mode only requires:**
- Content-Type: application/json

**No Authorization header** is sent in self-hosted mode.

## Supported Data Types

### Programming Languages
```typescript
enum ProgrammingLanguage {
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Java = 'java',
  Go = 'golang',
  Cpp = 'cpp',
  Swift = 'swift',
  Kotlin = 'kotlin',
  Ruby = 'ruby',
  SQL = 'sql',
  R = 'r',
  PHP = 'php',
}
```

### User Languages (Locales)
```typescript
enum UserLanguage {
  EN_US = 'en-US', // English (United States)
  ES_ES = 'es-ES', // Spanish (Spain)
  ES_MX = 'es-MX', // Spanish (Mexico)
  ES_AR = 'es-AR', // Spanish (Argentina)
  PT_PT = 'pt-PT', // Portuguese (Portugal)
  PT_BR = 'pt-BR', // Portuguese (Brazil)
  FR_FR = 'fr-FR', // French (France)
  FR_CA = 'fr-CA', // French (Canada)
  DE_DE = 'de-DE', // German (Germany)
  DE_AT = 'de-AT', // German (Austria)
  UK_UA = 'uk-UA', // Ukrainian (Ukraine)
  RU_RU = 'ru-RU', // Russian (Russia)
  ZH_CN = 'zh-CN', // Chinese (Simplified, China)
  ZH_TW = 'zh-TW', // Chinese (Traditional, Taiwan)
  JA_JP = 'ja-JP', // Japanese (Japan)
  KO_KR = 'ko-KR', // Korean (Korea)
  HI_IN = 'hi-IN', // Hindi (India)
}
```

## Implementation Examples

### Minimal Express.js Server

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Solve endpoint
app.post('/solutions/solve', async (req, res) => {
  try {
    const { images, language, locale, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        thoughts: ["This is a mock response for testing"],
        code: `def mock_solution():\n    return "Mock solution in ${language}"`,
        time_complexity: "O(1)",
        space_complexity: "O(1)",
        problem_statement: "Mock problem statement"
      });
    }
    
    // Your AI processing logic here
    // 1. Process base64 images (OCR, image analysis)
    // 2. Extract problem statement
    // 3. Generate solution using AI (OpenAI, Claude, etc.)
    // 4. Analyze complexity
    
    const result = await processImages(images, language, locale);
    
    res.json({
      thoughts: result.thoughts,
      code: result.code,
      time_complexity: result.timeComplexity,
      space_complexity: result.spaceComplexity,
      problem_statement: result.problemStatement
    });
  } catch (error) {
    console.error('Solve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint
app.post('/solutions/debug', async (req, res) => {
  try {
    const { images, language, locale, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        thoughts: ["This is a mock debug response"],
        code: `def improved_mock_solution():\n    return "Improved mock solution in ${language}"`,
        time_complexity: "O(1)",
        space_complexity: "O(1)"
      });
    }
    
    // Your debugging logic here
    // 1. Process images to understand the debugging request
    // 2. Analyze existing code for issues
    // 3. Generate improved solution
    
    const result = await debugImages(images, language, locale);
    
    res.json({
      thoughts: result.thoughts,
      code: result.code,
      time_complexity: result.timeComplexity,
      space_complexity: result.spaceComplexity
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint (optional)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', mode: 'self-hosted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Self-hosted Ezzi API server running on port ${PORT}`);
});

// Example AI processing functions (implement these with your chosen AI service)
async function processImages(images, language, locale) {
  // Implement your AI processing logic here
  // This is where you'd integrate with OpenAI, Claude, or your own AI models
  throw new Error('AI processing not implemented');
}

async function debugImages(images, language, locale) {
  // Implement your debugging logic here
  throw new Error('Debug processing not implemented');
}
```

### Python FastAPI Server

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64

app = FastAPI(title="Ezzi Self-Hosted API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SolveRequest(BaseModel):
    images: List[str]
    language: str
    locale: str
    isMock: Optional[bool] = False

class DebugRequest(BaseModel):
    images: List[str]
    language: str
    locale: str
    isMock: Optional[bool] = False

class SolveResponse(BaseModel):
    thoughts: List[str]
    code: str
    time_complexity: str
    space_complexity: str
    problem_statement: str

class DebugResponse(BaseModel):
    thoughts: List[str]
    code: str
    time_complexity: str
    space_complexity: str

@app.post("/solutions/solve", response_model=SolveResponse)
async def solve_problem(request: SolveRequest):
    try:
        if request.isMock:
            return SolveResponse(
                thoughts=["This is a mock response for testing"],
                code=f"def mock_solution():\n    return 'Mock solution in {request.language}'",
                time_complexity="O(1)",
                space_complexity="O(1)",
                problem_statement="Mock problem statement"
            )
        
        # Your AI processing logic here
        result = await process_images(request.images, request.language, request.locale)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/solutions/debug", response_model=DebugResponse)
async def debug_solution(request: DebugRequest):
    try:
        if request.isMock:
            return DebugResponse(
                thoughts=["This is a mock debug response"],
                code=f"def improved_mock_solution():\n    return 'Improved mock solution in {request.language}'",
                time_complexity="O(1)",
                space_complexity="O(1)"
            )
        
        # Your debugging logic here
        result = await debug_images(request.images, request.language, request.locale)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "OK", "mode": "self-hosted"}

# Implement these functions with your AI service
async def process_images(image_data_list, language, locale):
    # Implement your AI processing logic here
    raise NotImplementedError("AI processing not implemented")

async def debug_images(image_data_list, language, locale):
    # Implement your debugging logic here
    raise NotImplementedError("Debug processing not implemented")
```

## Implementation Notes

### Image Processing
- Images are sent as base64-encoded strings
- Multiple images can be processed in a single request
- Images typically contain screenshots of coding problems
- Consider implementing proper error handling for invalid images

### Localization
- Response language is determined by the `locale` parameter
- Code solutions should be in the specified `language` parameter
- Thoughts and explanations should be in the user's preferred locale

### Mock Mode
- When `isMock=true`, return predefined responses for testing
- Useful for development and testing without calling actual AI services
- Should return properly formatted responses matching the expected schema

### Error Handling
- Implement proper HTTP status codes (500 for server errors, 400 for bad requests)
- Log errors for debugging purposes
- Return meaningful error messages in production

## Client Settings

In self-hosted mode, user settings are stored locally in the browser:

**Default Settings:**
- Solution Language: Python
- User Language: English (en-US)

Users can change these settings through the application UI, and they will persist locally.

## Development Testing

1. Set up your environment:
```bash
# Create .env
echo "VITE_SELF_HOSTED_MODE=true" >> .env
echo "VITE_API_BASE_URL=http://localhost:3000" >> .env
```

2. Run your API server on port 3000

3. Start the Ezzi application:
```bash
npm run dev
```

The app will automatically bypass authentication and use local storage for settings while making API calls to your self-hosted endpoints.

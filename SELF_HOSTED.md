# Self-Hosted Deployment Guide

This document describes how to deploy Ezzi with your own backend infrastructure. Since `VITE_SELF_HOSTED_MODE=true` bypasses authentication entirely, this guide focuses on implementing the AI processing endpoints only.

## Overview

Ezzi in self-hosted mode completely bypasses authentication and user management, requiring only AI processing endpoints. User settings are stored locally in the browser.

## App Modes

Ezzi supports two distinct app modes that determine the functionality and API endpoints used:

### Live Interview Mode
- **Mode ID**: `live-interview`
- **Purpose**: Comprehensive coding interview assistance with detailed explanations
- **API Endpoints**: `/solutions/solve` and `/solutions/debug`
- **Response Format**: Includes thoughts, code, complexity analysis, and problem statements
- **Use Case**: Real coding interviews where detailed explanations and analysis are needed

### LeetCode Solver Mode
- **Mode ID**: `leetcode-solver`  
- **Purpose**: Quick LeetCode problem solving with minimal response overhead
- **API Endpoints**: `/solutions/leetcode/solve` and `/solutions/leetcode/debug`
- **Response Format**: Only includes the generated code (streamlined for speed)
- **Use Case**: LeetCode practice sessions where fast code generation is prioritized

The app mode is managed client-side and determines which endpoints are called. Self-hosted implementations should support both modes for full compatibility.

## Required API Endpoints

You need to implement exactly **4 endpoints** for self-hosted mode (2 per app mode):

### Conversation ID Support (New in v1.0.4)

Starting with v1.0.4, LeetCode mode endpoints support conversation tracking:
- **LeetCode Solve** returns a `conversationId` for context continuity
- **LeetCode Debug** requires the `conversationId` from the previous solve request
- This enables better debugging by maintaining context between solve and debug operations
- Live Interview mode does not use conversation IDs (operates independently)

### Live Interview Mode Endpoints

#### POST /solutions/solve
Process screenshots to generate initial solution with detailed analysis

**Request Body:**
```typescript
interface SolveRequest {
  images: string[]; // Array of base64-encoded images
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
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

#### POST /solutions/debug
Process additional screenshots to debug/improve existing solution with detailed analysis

**Request Body:**
```typescript
interface DebugRequest {
  images: string[]; // Array of base64-encoded images
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
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

### LeetCode Solver Mode Endpoints

#### POST /solutions/leetcode/solve
Process screenshots to generate code solution (streamlined response for speed)

**Request Body:**
```typescript
interface LeetCodeSolveRequest {
  images: string[]; // Array of base64-encoded images
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
  "isMock": false
}
```

**Response:**
```typescript
interface LeetCodeSolveResponse {
  code: string; // Generated code solution
  conversationId: string; // Conversation ID for context continuity
}
```

**Example Response:**
```json
{
  "code": "def solution(nums):\n    # Implementation\n    result = 0\n    # Logic here\n    return result",
  "conversationId": "conv_abc123def456"
}
```

#### POST /solutions/leetcode/debug
Process additional screenshots to debug/improve existing solution (streamlined response)

**Request Body:**
```typescript
interface LeetCodeDebugRequest {
  images: string[]; // Array of base64-encoded images
  conversationId: string; // Required conversation ID from previous solve request
  isMock?: boolean; // Optional flag for mock responses
}
```

**Example Request:**
```json
{
  "images": ["base64image1", "base64image2"],
  "conversationId": "conv_abc123def456",
  "isMock": false
}
```

**Response:**
```typescript
interface LeetCodeDebugResponse {
  code: string; // Debugged/improved code
}
```

**Example Response:**
```json
{
  "code": "def solution(nums):\n    # Improved implementation\n    if not nums:\n        return 0\n    result = 0\n    # Improved logic here\n    return result"
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
  AR_SA = 'ar-SA', // Arabic (Saudi Arabia)
  AR_EG = 'ar-EG', // Arabic (Egypt)
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

// =============================================================================
// LIVE INTERVIEW MODE ENDPOINTS
// =============================================================================

// Live Interview - Solve endpoint
app.post('/solutions/solve', async (req, res) => {
  try {
    const { images, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        thoughts: ["This is a mock response for testing"],
        code: `def mock_solution():\n    return "Mock solution"`,
        time_complexity: "O(1)",
        space_complexity: "O(1)",
        problem_statement: "Mock problem statement"
      });
    }
    
    // Your AI processing logic here for Live Interview mode
    // 1. Process base64 images (OCR, image analysis)
    // 2. Extract problem statement
    // 3. Generate solution using AI (OpenAI, Claude, etc.)
    // 4. Analyze complexity and provide detailed thoughts
    
    const result = await processLiveInterviewSolve(images);
    
    res.json({
      thoughts: result.thoughts,
      code: result.code,
      time_complexity: result.timeComplexity,
      space_complexity: result.spaceComplexity,
      problem_statement: result.problemStatement
    });
  } catch (error) {
    console.error('Live Interview Solve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Live Interview - Debug endpoint
app.post('/solutions/debug', async (req, res) => {
  try {
    const { images, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        thoughts: ["This is a mock debug response"],
        code: `def improved_mock_solution():\n    return "Improved mock solution"`,
        time_complexity: "O(1)",
        space_complexity: "O(1)"
      });
    }
    
    // Your debugging logic here for Live Interview mode
    // 1. Process images to understand the debugging request
    // 2. Analyze existing code for issues
    // 3. Generate improved solution with detailed analysis
    
    const result = await processLiveInterviewDebug(images);
    
    res.json({
      thoughts: result.thoughts,
      code: result.code,
      time_complexity: result.timeComplexity,
      space_complexity: result.spaceComplexity
    });
  } catch (error) {
    console.error('Live Interview Debug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// LEETCODE SOLVER MODE ENDPOINTS
// =============================================================================

// LeetCode - Solve endpoint
app.post('/solutions/leetcode/solve', async (req, res) => {
  try {
    const { images, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        code: `def mock_leetcode_solution():\n    return "Mock LeetCode solution"`,
        conversationId: "mock_conv_123"
      });
    }
    
    // Your AI processing logic here for LeetCode mode
    // 1. Process base64 images quickly
    // 2. Generate code solution (no detailed analysis needed)
    
    const result = await processLeetCodeSolve(images);
    
    res.json({
      code: result.code,
      conversationId: result.conversationId
    });
  } catch (error) {
    console.error('LeetCode Solve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LeetCode - Debug endpoint
app.post('/solutions/leetcode/debug', async (req, res) => {
  try {
    const { images, conversationId, isMock } = req.body;
    
    // Handle mock mode
    if (isMock) {
      return res.json({
        code: `def improved_mock_leetcode_solution():\n    return "Improved mock LeetCode solution"`
      });
    }
    
    // Your debugging logic here for LeetCode mode
    // 1. Process images to understand the debugging request
    // 2. Generate improved code solution (streamlined response)
    
    const result = await processLeetCodeDebug(images, conversationId);
    
    res.json({
      code: result.code
    });
  } catch (error) {
    console.error('LeetCode Debug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// SHARED ENDPOINTS
// =============================================================================

// Health check endpoint (optional)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', mode: 'self-hosted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Self-hosted Ezzi API server running on port ${PORT}`);
  console.log('Supported endpoints:');
  console.log('  Live Interview: POST /solutions/solve, POST /solutions/debug');
  console.log('  LeetCode Solver: POST /solutions/leetcode/solve, POST /solutions/leetcode/debug');
});

// =============================================================================
// EXAMPLE AI PROCESSING FUNCTIONS
// =============================================================================
// Implement these functions with your chosen AI service

// Live Interview processing functions
async function processLiveInterviewSolve(images) {
  // Implement your AI processing logic here for detailed analysis
  // This is where you'd integrate with OpenAI, Claude, or your own AI models
  // Should return: { thoughts, code, timeComplexity, spaceComplexity, problemStatement }
  throw new Error('Live Interview solve processing not implemented');
}

async function processLiveInterviewDebug(images) {
  // Implement your debugging logic here for detailed analysis
  // Should return: { thoughts, code, timeComplexity, spaceComplexity }
  throw new Error('Live Interview debug processing not implemented');
}

// LeetCode processing functions
async function processLeetCodeSolve(images) {
  // Implement your AI processing logic here for quick code generation
  // Should return: { code, conversationId }
  throw new Error('LeetCode solve processing not implemented');
}

async function processLeetCodeDebug(images, conversationId) {
  // Implement your debugging logic here for quick code improvement
  // Should return: { code }
  // Use conversationId to maintain context with previous solve request
  throw new Error('LeetCode debug processing not implemented');
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

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

# Shared request models
class BaseRequest(BaseModel):
    images: List[str]
    isMock: Optional[bool] = False

# Live Interview models
class SolveRequest(BaseRequest):
    pass

class DebugRequest(BaseRequest):
    pass

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

# LeetCode models
class LeetCodeSolveRequest(BaseRequest):
    pass

class LeetCodeDebugRequest(BaseRequest):
    conversationId: str

class LeetCodeSolveResponse(BaseModel):
    code: str
    conversationId: str

class LeetCodeDebugResponse(BaseModel):
    code: str

# =============================================================================
# LIVE INTERVIEW MODE ENDPOINTS
# =============================================================================

@app.post("/solutions/solve", response_model=SolveResponse)
async def solve_problem(request: SolveRequest):
    """Live Interview mode - Generate detailed solution with analysis"""
    try:
        if request.isMock:
            return SolveResponse(
                thoughts=["This is a mock response for testing"],
                code="def mock_solution():\n    return 'Mock solution'",
                time_complexity="O(1)",
                space_complexity="O(1)",
                problem_statement="Mock problem statement"
            )
        
        # Your AI processing logic here for Live Interview mode
        result = await process_live_interview_solve(request.images)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/solutions/debug", response_model=DebugResponse)
async def debug_solution(request: DebugRequest):
    """Live Interview mode - Debug solution with detailed analysis"""
    try:
        if request.isMock:
            return DebugResponse(
                thoughts=["This is a mock debug response"],
                code="def improved_mock_solution():\n    return 'Improved mock solution'",
                time_complexity="O(1)",
                space_complexity="O(1)"
            )
        
        # Your debugging logic here for Live Interview mode
        result = await process_live_interview_debug(request.images)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# LEETCODE SOLVER MODE ENDPOINTS
# =============================================================================

@app.post("/solutions/leetcode/solve", response_model=LeetCodeSolveResponse)
async def solve_leetcode_problem(request: LeetCodeSolveRequest):
    """LeetCode mode - Generate code solution (streamlined response)"""
    try:
        if request.isMock:
            return LeetCodeSolveResponse(
                code="def mock_leetcode_solution():\n    return 'Mock LeetCode solution'",
                conversationId="mock_conv_123"
            )
        
        # Your AI processing logic here for LeetCode mode
        result = await process_leetcode_solve(request.images)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/solutions/leetcode/debug", response_model=LeetCodeDebugResponse)
async def debug_leetcode_solution(request: LeetCodeDebugRequest):
    """LeetCode mode - Debug code solution (streamlined response)"""
    try:
        if request.isMock:
            return LeetCodeDebugResponse(
                code="def improved_mock_leetcode_solution():\n    return 'Improved mock LeetCode solution'"
            )
        
        # Your debugging logic here for LeetCode mode
        result = await process_leetcode_debug(request.images)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# SHARED ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "OK", 
        "mode": "self-hosted",
        "supported_endpoints": {
            "live_interview": ["/solutions/solve", "/solutions/debug"],
            "leetcode_solver": ["/solutions/leetcode/solve", "/solutions/leetcode/debug"]
        }
    }

# =============================================================================
# EXAMPLE AI PROCESSING FUNCTIONS
# =============================================================================
# Implement these functions with your chosen AI service

# Live Interview processing functions
async def process_live_interview_solve(images: List[str]) -> SolveResponse:
    """Implement your AI processing logic here for detailed analysis"""
    # This is where you'd integrate with OpenAI, Claude, or your own AI models
    # Should return SolveResponse with: thoughts, code, time_complexity, space_complexity, problem_statement
    raise NotImplementedError("Live Interview solve processing not implemented")

async def process_live_interview_debug(images: List[str]) -> DebugResponse:
    """Implement your debugging logic here for detailed analysis"""
    # Should return DebugResponse with: thoughts, code, time_complexity, space_complexity
    raise NotImplementedError("Live Interview debug processing not implemented")

# LeetCode processing functions
async def process_leetcode_solve(images: List[str]) -> LeetCodeSolveResponse:
    """Implement your AI processing logic here for quick code generation"""
    # Should return LeetCodeSolveResponse with: code, conversationId
    raise NotImplementedError("LeetCode solve processing not implemented")

async def process_leetcode_debug(images: List[str]) -> LeetCodeDebugResponse:
    """Implement your debugging logic here for quick code improvement"""
    # Should return LeetCodeDebugResponse with: code
    raise NotImplementedError("LeetCode debug processing not implemented")

# =============================================================================
# RUNNING THE SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting Ezzi Self-Hosted API server...")
    print("Supported endpoints:")
    print("  Live Interview: POST /solutions/solve, POST /solutions/debug")
    print("  LeetCode Solver: POST /solutions/leetcode/solve, POST /solutions/leetcode/debug")
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

## Implementation Notes

### Image Processing
- Images are sent as base64-encoded strings
- Multiple images can be processed in a single request
- Images typically contain screenshots of coding problems
- Consider implementing proper error handling for invalid images

### Settings Management
- User language and programming language preferences are managed through the client application settings
- These settings are stored locally in self-hosted mode (or sent to backend via separate settings endpoints in cloud mode)
- Self-hosted API endpoints do not receive language/locale parameters - responses can be in a default language
- Programming language preferences are handled client-side for code display and syntax highlighting

### Mock Mode
- When `isMock=true`, return predefined responses for testing
- Useful for development and testing without calling actual AI services
- Should return properly formatted responses matching the expected schema

### Error Handling
- Implement proper HTTP status codes (500 for server errors, 400 for bad requests)
- Log errors for debugging purposes
- Return meaningful error messages in production

### App Mode Handling
- The client automatically switches between app modes based on user selection
- Each app mode calls different endpoints and expects different response formats
- Your self-hosted implementation should support both modes for full compatibility
- Consider implementing shared logic for image processing and AI calls
- Route requests to appropriate processing functions based on the endpoint path
- LeetCode mode endpoints should prioritize speed over detailed analysis
- Live Interview mode endpoints should provide comprehensive analysis and explanations

## Client Settings

In self-hosted mode, user settings are stored locally in the browser and do not affect API requests:

**Default Settings:**
- Solution Language: Python (for client-side code display/syntax highlighting)
- User Language: English (en-US) (for client-side UI)

**Settings Behavior:**
- Users can change these settings through the application UI
- Settings persist locally in browser storage
- Settings do NOT affect the API request format (no language/locale parameters are sent)
- Self-hosted implementations can respond in any language since localization is handled client-side
- Programming language setting affects syntax highlighting and code display, not the actual API processing

## API Design Changes (v2.0+)

**Important:** Starting from version 2.0, the Ezzi API has been simplified:

**What Changed:**
- Removed `language` and `locale` parameters from all request interfaces
- Language and locale preferences are now managed entirely client-side
- Self-hosted implementations no longer need to handle localization in API endpoints

**Migration from v1.x:**
If you have an existing v1.x self-hosted implementation that expects `language` and `locale` parameters:
1. Update your request handlers to not expect these parameters
2. Remove language/locale-specific processing logic
3. Return responses in your preferred default language
4. The client will handle language preferences and code syntax highlighting

**Benefits:**
- Simplified API interface with fewer parameters
- Reduced backend complexity (no localization logic needed)
- Better performance (fewer parameters to process)
- Client-side settings management provides better user experience

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

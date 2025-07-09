# Ezzi - an open-source invisible overlay UI for DSA interviews.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<a href="https://github.com/GetEzzi/ezzi-app/actions/workflows/build-pr.yml"><img src="https://github.com/GetEzzi/ezzi-app/actions/workflows/build-pr.yml/badge.svg?branch=main" alt="build status"></a>
<a href="https://github.com/GetEzzi/ezzi-app/actions/workflows/test-pr.yml"><img src="https://github.com/GetEzzi/ezzi-app/actions/workflows/test-pr.yml/badge.svg?branch=main" alt="test status"></a>

Ezzi ("easy") is inspired by Interview Coder, designed to help developers succeed in technical interviews and beyond. This desktop application provides undetectable assistance for coding interviews, technical practice, and learning.

## What Ezzi helps with:

- **Technical interview preparation** - Practice and solve coding problems with AI guidance
- **Coding practice** - Solve LeetCode problems for fun and skill development  
- **Learning assistant** - Get hints and guidance when stuck, with full solutions available
- **Interview support** - Undetectable assistance during actual interviews, including screen sharing

## Why it matters:

- **Broken hiring process** - Job searches drag on too long, leading to burnout and declining confidence
- **Time constraints** - Sometimes you need to pass mandatory steps quickly without extensive preparation
- **Learning data structures** - Get guidance on where to start with each problem type
- **Language barriers** - Get hints in your native language to reduce cognitive load during interviews

## Features

- 🖼️ **Screenshot capture and AI-powered analysis**
- 💻 **Multi-language coding solutions** (Python, JavaScript, Java, C++, Go, Swift, Kotlin, Ruby, SQL, R, PHP)
- 🐛 **Debug mode** for solution improvement
- 👻 **Always-on-top transparent window**
- ⌨️ **Global keyboard shortcuts** for seamless operation
- 🌐 **Cross-platform support** (Windows, macOS, Linux* - development only, production use not recommended)
- 🏠 **Self-hosted deployment option**

## Roadmap

Here's what we're planning to develop for Ezzi:

### Interview Live ✅ (Done)
A helpful tool that shows your problem, thoughts, and code all in one view. It works as an invisible layer during coding interviews.

### Hint-only 🔄 (Planned)
Gives you helpful tips on how to solve coding problems. Suggests which algorithms to use and helps identify problem types. Shows different solution approaches with their good and bad points. You can also see the complete solution if needed.

### Leetcode crusher 🔄 (Planned)
Helps you solve one coding problem at a time with a focus on finding the best solution. Keeps explanations simple and direct to save time.

### Quiz 🔄 (Planned)
Solve multiple choice questions that have time limits. Quickly.

### Take-home algo 🔄 (Planned)
Focuses on one coding task at a time and provides solutions without lengthy explanations. You can start with a simple solution and then learn how to improve it step by step.

## Usage

### Quick Start

1. Download and build the latest release for your platform via git
2. Grant necessary permissions (screen recording on macOS)
3. Launch the application
4. Use global shortcuts to capture and analyze coding problems

### Keyboard Shortcuts

Quick access to all Ezzi features:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘ + B` | Hide/Show Window | Quickly toggle the visibility of the Ezzi window |
| `⌘ + H` | Take Screenshot | Capture the current screen to analyze code or problems |
| `⌘ + ↑ ↓ ← →` | Move Window | Reposition the Ezzi window anywhere on screen |
| `⌘ + Return` | Generate Solution | Generate a solution for the current problem |
| `⌘ + Return` | Debug | Generate optimized solutions with performance improvements and detailed explanations of changes |
| `⌘ + G` | Reset Context | Clear the current conversation and start fresh |

### Configuration

The application supports various configuration options through environment variables:

- `VITE_SELF_HOSTED_MODE`: Enable self-hosted mode (bypasses authentication - you must host your own solutions server)
- `VITE_API_BASE_URL`: Custom API server URL
- `PRODUCT_NAME`: Customize application name for builds

## Undetectability

Ezzi remains completely invisible during coding interviews across all major platforms.

### Works anywhere. Stays invisible.

From HackerRank to CoderPad, Ezzi runs in the background — undetectable, seamless, and always on your side.

**Supported Platforms:** Zoom, HackerRank, CodeSignal, CoderPad, Amazon Chime, Microsoft Teams

### Core Undetectability Features

Four features that keep Ezzi completely invisible during your interviews:

- **Screen Sharing** - Invisible to all screen capture methods across Zoom, Teams, and web-based platforms
- **Active Tab Detection** - Keeps your cursor active and tab focused - no detectable switching occurs
- **Solution Explanations** - Provides code with inline comments and natural explanations for confident verbal reasoning
- **Webcam Monitoring** - Overlay positioning keeps your gaze naturally aligned with the coding area

### Platform Compatibility

Comprehensive testing across all major interview platforms and video conferencing software:

**Windows Support:**
- Zoom: ✅ Fully invisible
- Microsoft Teams: ✅ Fully invisible  
- Chime: ✅ Fully invisible
- Web-based platforms (HackerRank, CoderPad, CodeSignal, TestGorilla, Google Meet): ✅ Fully invisible

**Mac Support:**
- Zoom: ✅⚠️ Advanced capture with window filtering required
- Microsoft Teams: ✅ Fully invisible
- Chime: ✅ Fully invisible
- Web-based platforms (HackerRank, CoderPad, CodeSignal, TestGorilla, Google Meet): ✅ Fully invisible

### Detection Tactics & How We Avoid Them

**Screen Sharing & Recording Detection**
Platforms capture your screen through various methods including native screen sharing, browser-based recording, and third-party capture tools.

**Our Solution:** Ezzi uses advanced rendering techniques to remain completely invisible to all screen capture methods across desktop and web platforms.

**Behavioral & Focus Monitoring**
Advanced platforms monitor tab switching, cursor idle time, eye movement patterns, and typing behavior to detect assistance.

**Our Solution:** Smart overlay positioning and cursor management maintain natural interview behavior. Toggle with ⌘ + B keeps focus active while repositioning with ⌘ + arrow keys aligns your gaze naturally.

**Verbal Explanation Requirements**
Interviewers expect detailed explanations of your thought process and implementation approach beyond just working code.

**Our Solution:** Solutions include comprehensive inline comments and natural explanations that help you confidently discuss your approach and reasoning.

**Proven Track Record**
Ezzi has maintained a 100% undetected rate across thousands of interviews on all major platforms including advanced monitoring systems.

## Deployment Options

### Cloud Service

For the easiest setup, visit and register at [getezzi.com/cloud](https://getezzi.com/cloud) to use our hosted AI service.

### Self-Hosted

Deploy your own backend infrastructure for complete control and privacy. See [SELF_HOSTED.md](SELF_HOSTED.md) for detailed instructions on:

- **Simplified Mode**: Bypass authentication, implement only AI processing endpoints
- **Custom Backend**: Full implementation with user management and authentication
- **API Specification**: Complete endpoint documentation and examples

## Help

### Troubleshooting

Quick solutions for common issues with Ezzi:

**App Not Visible?**
If you can't see the Ezzi interface, try these steps:
1. **Use ⌘ + B to Toggle Visibility** - The app may be hidden — press ⌘ + B to bring it back into view
2. **Reinstall the App** - Uninstall the current version and reinstall it from the official site. This often resolves display issues

**Solutions Not Loading**
Try the following if solutions aren't appearing:
1. **Check Screen & Audio Permissions** - Ensure Ezzi has access to Screen Recording and System Audio. If not, a yellow warning popup may appear
2. **Reinstall Ezzi** - Remove all previous versions and install a fresh copy from our website
3. **Get Help from Support** - Still stuck? Reach out to our support team at help@getezzi.com

**App Visible During Screen Sharing**
Tips for hiding Ezzi during screen shares:
- Ezzi is compatible with the latest Zoom versions
- Enable Advanced Capture with window filtering to keep it hidden

### Support

- **Bug Reports**: [GitHub Issues](https://github.com/GetEzzi/ezzi-app/issues)
- **Email Support**: help@getezzi.com
- **Documentation**: [Self-Hosted Deployment Guide](SELF_HOSTED.md)
- **API Reference**: Complete backend API specification included in documentation

## Development

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/GetEzzi/ezzi-app.git
cd ezzi
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (create `.env`):
```bash
# For development with mocked responses
IS_MOCK=true

# For self-hosted mode
VITE_SELF_HOSTED_MODE=true
VITE_API_BASE_URL=http://localhost:3000
```

### Running

Development mode:
```bash
npm run dev
```

### Building

Standard build:
```bash
npm run build
```

Custom product name build:
```bash
# Mac/Linux
PRODUCT_NAME="Custom Assistant" npm run build

# Windows (PowerShell)
$env:PRODUCT_NAME="Custom Assistant"; npm run build
```

### Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## Architecture Overview

Ezzi is built with modern web technologies:

- **Frontend**: React 19 with TypeScript
- **Desktop Framework**: Electron 37
- **State Management**: React Query for API state
- **UI Components**: Radix UI with Tailwind CSS
- **Build System**: Vite with custom Electron integration

### Main Components

- **Main Process** (`electron/main.ts`): Window management, screenshot capture, global shortcuts
- **Renderer Process** (`src/`): React application with authentication and AI integration
- **IPC Communication** (`electron/ipc.handlers.ts`): Bridge between main and renderer processes

## Configuration

### Environment Variables

- `IS_MOCK`: Enable mock responses for development
- `VITE_SELF_HOSTED_MODE`: Enable self-hosted mode
- `VITE_API_BASE_URL`: Custom API server URL
- `PRODUCT_NAME`: Custom product name for builds

### Settings Storage

- **Cloud Mode**: Settings stored on server
- **Self-Hosted Mode**: Local storage in browser localStorage

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Ezzi

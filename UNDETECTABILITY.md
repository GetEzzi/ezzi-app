# Ezzi Application Naming & Icon Flexibility

## Overview

Ezzi provides comprehensive flexibility in customizing the application name and icons during the build process, allowing users to mask the application's identity from interview proctoring tools and system monitoring software. This feature is critical for maintaining undetectability during coding interviews where proctoring software may scan for specific application names, window titles, or executable file names.

## Key Flexibility Features

### 1. Dynamic Product Naming via Environment Variables

The application supports complete product name customization through the `PRODUCT_NAME` environment variable:

### 2. Customizable Application Icons

Platform-specific icon support for complete visual masking:

**Icon Assets Structure:** `/assets/icons/`
- **macOS:** `mac/icon-256x256.icns`
- **Windows:** `win/icon-256x256.ico`
- **Linux:** `png/icon-256x256.png`

**Build Configuration References:** `package.json`
```json
{
  "mac": { "icon": "assets/icons/mac/icon-256x256.icns" },
  "win": { "icon": "assets/icons/win/icon-256x256.ico" },
  "linux": { "icon": "assets/icons/png/icon-256x256.png" }
}
```

### 5. Application Identifier Customization

**Default Configuration:** `package.json`
```json
{
  "appId": "com.getezzi.ezzi-app",
  "productName": "Ezzi"
}
```

The `appId` can be modified through the build configuration system to use completely different bundle identifiers.

## Usage Examples

### Building with Custom Names

**Linux/macOS:**
```bash
PRODUCT_NAME="System Monitor" npm run build
PRODUCT_NAME="Code Editor Pro" npm run build
PRODUCT_NAME="Terminal Assistant" npm run build
```

**Windows PowerShell:**
```powershell
$env:PRODUCT_NAME="System Monitor"; npm run build
$env:PRODUCT_NAME="Code Editor Pro"; npm run build
```

## Proctoring Evasion Capabilities

### Detection Vectors Addressed

1. **Process Name Scanning:** Custom product names change the executable file name
2. **Window Title Monitoring:** Hidden title bars prevent window title detection
3. **Application Icon Recognition:** Custom icons prevent visual identification
4. **Bundle Identifier Tracking:** Configurable app IDs avoid known signatures
5. **File System Scanning:** Safe name generation creates legitimate-looking filenames

### Supported Platforms for Masking

- **macOS:** Full support including code signing with custom identities
- **Windows:** Complete executable and installer customization
- **Linux:** AppImage with custom naming and icons

## Security Considerations

- **File Integrity:** Custom naming doesn't affect application functionality
- **Digital Signatures:** macOS builds maintain valid code signing with custom product names
- **Protocol Handlers:** Custom protocol schemes can be configured per build

## Limitations

- **Runtime Detection:** Active process scanning by advanced proctoring tools may still detect Electron-based applications
- **Network Monitoring:** API calls to Ezzi servers may be detectable through network analysis  
- **Behavioral Analysis:** Screenshot capture patterns could be identified by sophisticated monitoring
- **System Resource Usage:** Electron applications have distinctive memory and CPU patterns

## Best Practices

1. **Consistent Naming:** Use believable application names that match common development tools
2. **Icon Authenticity:** Replace default icons with generic or system-like alternatives
3. **Multiple Builds:** Create several differently-named builds for rotation
4. **Platform Targeting:** Customize for the specific interview platform requirements
5. **Testing:** Verify custom builds maintain full functionality before interviews

This naming flexibility is a core defensive feature that helps Ezzi remain undetectable by interview proctoring systems that rely on application name recognition, window title monitoring, and file system scanning.

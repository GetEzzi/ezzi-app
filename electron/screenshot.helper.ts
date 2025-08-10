import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class ScreenshotHelper {
  private screenshotQueue: string[] = [];
  private readonly MAX_SCREENSHOTS = 2;

  private readonly screenshotDir: string;

  private view: 'queue' | 'solutions' | 'debug' = 'queue';

  constructor(view: 'queue' | 'solutions' | 'debug' = 'queue') {
    this.view = view;

    // Initialize directories
    this.screenshotDir = path.join(app.getPath('userData'), 'screenshots');

    // Create directories if they don't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir);
    }
  }

  public getView(): 'queue' | 'solutions' | 'debug' {
    return this.view;
  }

  public setView(view: 'queue' | 'solutions' | 'debug'): void {
    console.log('Setting view in ScreenshotHelper:', view);
    console.log('Current queue:', this.screenshotQueue);
    this.view = view;
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue;
  }

  public clearQueues(): void {
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err) {
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err);
        }
      });
    });
    this.screenshotQueue = [];
  }

  private async captureScreenshotMac(): Promise<Buffer> {
    const tmpPath = path.join(app.getPath('temp'), `${uuidv4()}.png`);
    await execFileAsync('screencapture', ['-x', tmpPath]);
    const buffer = await fs.promises.readFile(tmpPath);
    await fs.promises.unlink(tmpPath);

    return buffer;
  }

  private async captureScreenshotWindows(): Promise<Buffer> {
    // Using PowerShell's native screenshot capability
    const tmpPath = path.join(app.getPath('temp'), `${uuidv4()}.png`);
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
      $bitmap.Save('${tmpPath.replace(/\\/g, '\\\\')}')
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    await execFileAsync('powershell', ['-command', script]);
    const buffer = await fs.promises.readFile(tmpPath);
    await fs.promises.unlink(tmpPath);

    return buffer;
  }

  private async captureScreenshotLinux(): Promise<Buffer> {
    const tmpPath = path.join(app.getPath('temp'), `${uuidv4()}.png`);

    try {
      // Use gnome-screenshot as primary tool since it works well
      await execFileAsync('gnome-screenshot', [
        '-f',
        tmpPath, // output file
        '-d',
        '1', // 1 second delay
        '--include-border', // include window borders
      ]);
    } catch (error) {
      console.error('gnome-screenshot failed:', error);
      // Fallback to import with corrected flags
      try {
        await execFileAsync('import', [
          '-window',
          'root', // capture root window (full screen)
          '-silent', // suppress output
          '-depth',
          '8', // 8-bit color depth
          '-quality',
          '100', // maximum quality
          tmpPath,
        ]);
      } catch (error2) {
        console.error('import failed:', error2);

        throw new Error(
          'Screenshot capture failed. Please ensure gnome-screenshot or ImageMagick is installed.',
        );
      }
    }

    // !!! Required because window lags sometimes
    await new Promise((resolve) => setTimeout(resolve, 200));

    const buffer = await fs.promises.readFile(tmpPath);
    await fs.promises.unlink(tmpPath);

    return buffer;
  }

  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void,
  ): Promise<string> {
    console.log('Taking screenshot in view:', this.view);
    hideMainWindow();

    // !!! Required because window lags sometimes
    await new Promise((resolve) => setTimeout(resolve, 200));

    let screenshotPath = '';
    try {
      console.log('Capturing screenshot...');
      let screenshotBuffer: Buffer;
      if (process.platform === 'darwin') {
        screenshotBuffer = await this.captureScreenshotMac();
      } else if (process.platform === 'win32') {
        screenshotBuffer = await this.captureScreenshotWindows();
      } else if (process.platform === 'linux') {
        screenshotBuffer = await this.captureScreenshotLinux();
      } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
      }
      console.log('Screenshot captured, saving to file...');

      // Save and manage screenshot in single queue
      screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`);
      await fs.promises.writeFile(screenshotPath, screenshotBuffer);
      console.log('Adding screenshot to queue:', screenshotPath);
      this.screenshotQueue.push(screenshotPath);
      if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.screenshotQueue.shift();
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath);
            console.log('Removed old screenshot from queue:', removedPath);
          } catch (error) {
            console.error('Error removing old screenshot:', error);
          }
        }
      }
    } catch (error) {
      console.error('Screenshot error:', error);

      throw error;
    } finally {
      // !!! Required because window lags sometimes
      await new Promise((resolve) => setTimeout(resolve, 200));
      showMainWindow();
    }

    return screenshotPath;
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filepath);

      return `data:image/png;base64,${data.toString('base64')}`;
    } catch (error) {
      console.error('Error reading image:', error);

      throw error;
    }
  }

  public async deleteScreenshot(
    path: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.promises.unlink(path);
      this.screenshotQueue = this.screenshotQueue.filter(
        (filePath) => filePath !== path,
      );

      console.log('Screenshot deleted', path);

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);

      return { success: false, error: (error as Error).message };
    }
  }

  public resetQueue(): void {
    console.log('Resetting screenshot queue');
    // Clear current queue for fresh session
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err) {
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err);
        }
      });
    });
    this.screenshotQueue = [];
  }
}

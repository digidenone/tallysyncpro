/**
 * ================================================================
 * TallySyncPro - Splash Screen Component
 * ================================================================
 * 
 * Beautiful animated splash screen for application startup
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const { BrowserWindow, screen, app } = require('electron');
const path = require('path');
const log = require('electron-log');

class SplashScreen {
  constructor() {
    this.splashWindow = null;
    this.isVisible = false;
  }
  /**
   * Create and show splash screen
   */
  create() {
    try {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      
      this.splashWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        frame: false,
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        show: false,
        backgroundColor: '#1a1a2e',        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: false
        }      });

      // Load splash screen HTML - handle both dev and packaged paths
      let splashPath;
      if (app.isPackaged) {
        // In packaged app, assets are in the app.asar file
        splashPath = path.join(__dirname, '../../assets/splash.html');
      } else {
        // In development
        splashPath = path.join(__dirname, '../../assets/splash.html');
      }      console.log('Loading splash screen from:', splashPath);
      this.splashWindow.loadFile(splashPath).catch(error => {
        console.error('Failed to load splash screen:', error);
        // Fallback: create a simple splash screen
        this.splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%); 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                font-family: Arial, sans-serif; 
                color: white; 
              }
              .container { text-align: center; }
              h1 { font-size: 3em; margin-bottom: 20px; }
              p { font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>TallySyncPro</h1>
              <p>Loading...</p>
            </div>
          </body>
          </html>
        `));
      });// Show when ready
      this.splashWindow.once('ready-to-show', () => {
        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
          this.splashWindow.show();
          this.isVisible = true;
          log.info('SplashScreen: Splash screen displayed');
        }
      });

      // Handle window closed
      this.splashWindow.on('closed', () => {
        this.splashWindow = null;
        this.isVisible = false;
      });

      return this.splashWindow;

    } catch (error) {
      log.error('SplashScreen: Failed to create splash screen:', error);
      throw error;
    }
  }

  /**
   * Update splash screen with loading progress
   */
  updateProgress(message, progress = 0) {
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      this.splashWindow.webContents.send('update-progress', { message, progress });
    }
  }

  /**
   * Close splash screen
   */
  close() {
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      this.splashWindow.close();
      this.isVisible = false;
      log.info('SplashScreen: Splash screen closed');
    }
  }

  /**
   * Check if splash screen is visible
   */
  isDisplayed() {
    return this.isVisible && this.splashWindow && !this.splashWindow.isDestroyed();
  }
}

module.exports = new SplashScreen();

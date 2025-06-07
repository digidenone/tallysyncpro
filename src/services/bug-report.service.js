/**
 * ================================================================
 * TallySyncPro - Bug Reporting Service
 * ================================================================
 * 
 * Handles bug reporting via email templates and system information
 * collection for better debugging and issue resolution.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const nodemailer = require('nodemailer');
const { shell, app } = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const log = require('electron-log');

class BugReportService {
  constructor() {
    this.supportEmail = 'digidenone@gmail.com';
    this.appVersion = app.getVersion();
    this.appName = 'TallySyncPro';
  }

  /**
   * Collect system information for bug reports
   */
  async collectSystemInfo() {
    try {
      const systemInfo = {
        // Application Info
        appName: this.appName,
        appVersion: this.appVersion,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromiumVersion: process.versions.chrome,
        
        // System Info
        platform: os.platform(),
        arch: os.arch(),
        osVersion: os.release(),
        totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
        freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        cpuCores: os.cpus().length,
        
        // Runtime Info
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        locale: app.getLocale(),
        
        // Memory Usage
        memoryUsage: process.memoryUsage()
      };

      return systemInfo;
    } catch (error) {
      log.error('BugReportService: Failed to collect system info:', error);
      return null;
    }
  }

  /**
   * Generate bug report template
   */
  generateBugReportTemplate(bugData) {
    const { title, description, stepsToReproduce, expectedBehavior, actualBehavior, systemInfo } = bugData;

    return `
===== BUG REPORT - ${this.appName} =====

Bug Title: ${title || 'Untitled Bug Report'}

Description:
${description || 'No description provided'}

Steps to Reproduce:
${stepsToReproduce || 'Not specified'}

Expected Behavior:
${expectedBehavior || 'Not specified'}

Actual Behavior:
${actualBehavior || 'Not specified'}

===== SYSTEM INFORMATION =====
${systemInfo ? Object.entries(systemInfo)
  .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
  .join('\n') : 'System information not available'}

===== END OF REPORT =====

Generated on: ${new Date().toLocaleString()}
Report ID: ${this.generateReportId()}
    `.trim();
  }

  /**
   * Generate unique report ID
   */
  generateReportId() {
    return `TSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Open email client with pre-filled bug report
   */
  async openEmailClient(bugData) {
    try {
      const systemInfo = await this.collectSystemInfo();
      const bugReportContent = this.generateBugReportTemplate({
        ...bugData,
        systemInfo
      });

      // Include log file attachment info in the email body
      const logFileInfo = await this.getLogFileAttachmentInfo();
      const emailBody = `${bugReportContent}\n\n${logFileInfo}`;

      const subject = encodeURIComponent(`[${this.appName}] Bug Report: ${bugData.title || 'Issue Report'}`);
      const body = encodeURIComponent(emailBody);
      
      // Limit URL length to avoid issues with very long mailto links
      const maxBodyLength = 1800; // Leave room for subject and email
      const truncatedBody = body.length > maxBodyLength ? 
        encodeURIComponent(emailBody.substring(0, maxBodyLength) + '\n\n[Content truncated - please see attached log files]') : 
        body;
      
      const mailtoLink = `mailto:${this.supportEmail}?subject=${subject}&body=${truncatedBody}`;
      
      // Open default email client
      await shell.openExternal(mailtoLink);
      
      log.info('BugReportService: Email client opened with bug report');
      return { success: true, message: 'Email client opened successfully' };

    } catch (error) {
      log.error('BugReportService: Failed to open email client:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get log file attachment information
   */
  async getLogFileAttachmentInfo() {
    try {
      const { app } = require('electron');
      const logsPath = path.join(app.getPath('userData'), 'logs');
      const today = new Date().toISOString().split('T')[0];
      const currentLogFile = path.join(logsPath, `tallysyncpro-${today}.log`);
      
      const attachmentInfo = `
=== ATTACHMENT INFORMATION ===
Please manually attach the following log files to your email:

1. Current Log File: ${currentLogFile}
2. Logs Directory: ${logsPath}
3. Database Directory: ${path.join(app.getPath('userData'), 'data')}
4. User Data Directory: ${app.getPath('userData')}

Log files contain important debugging information that will help us resolve your issue faster.
      `;
      
      return attachmentInfo;
    } catch (error) {
      return '\n=== LOG FILES ===\nUnable to locate log files. Please check the logs directory in your TallySyncPro user data folder.';
    }
  }

  /**
   * Save bug report to local file
   */
  async saveBugReportToFile(bugData) {
    try {
      const systemInfo = await this.collectSystemInfo();
      const bugReportContent = this.generateBugReportTemplate({
        ...bugData,
        systemInfo
      });

      const reportId = this.generateReportId();
      const fileName = `bug-report-${reportId}.txt`;
      const userDataPath = app.getPath('userData');
      const reportsDir = path.join(userDataPath, 'bug-reports');
      
      // Ensure reports directory exists
      await fs.mkdir(reportsDir, { recursive: true });
      
      const filePath = path.join(reportsDir, fileName);
      await fs.writeFile(filePath, bugReportContent, 'utf8');
      
      log.info(`BugReportService: Bug report saved to ${filePath}`);
      return { success: true, filePath, reportId };

    } catch (error) {
      log.error('BugReportService: Failed to save bug report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create bug report dialog data
   */
  createBugReportDialog() {
    return {
      title: 'Report a Bug',
      fields: [
        {
          name: 'title',
          label: 'Bug Title',
          type: 'text',
          required: true,
          placeholder: 'Brief description of the issue'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          placeholder: 'Detailed description of the problem'
        },
        {
          name: 'stepsToReproduce',
          label: 'Steps to Reproduce',
          type: 'textarea',
          placeholder: '1. First step\n2. Second step\n3. Third step'
        },
        {
          name: 'expectedBehavior',
          label: 'Expected Behavior',
          type: 'textarea',
          placeholder: 'What should have happened?'
        },
        {
          name: 'actualBehavior',
          label: 'Actual Behavior',
          type: 'textarea',
          placeholder: 'What actually happened?'
        }
      ],
      actions: [
        {
          label: 'Send via Email',
          action: 'email',
          primary: true
        },
        {
          label: 'Save to File',
          action: 'save',
          secondary: true
        },
        {
          label: 'Cancel',
          action: 'cancel'
        }
      ]
    };
  }

  /**
   * Quick bug report for critical errors
   */
  async reportCriticalError(error, context = '') {
    try {
      const bugData = {
        title: 'Critical Error',
        description: `Critical error occurred: ${error.message}`,
        stepsToReproduce: `Error occurred in context: ${context}`,
        expectedBehavior: 'Application should function normally',
        actualBehavior: `Application encountered error: ${error.stack}`
      };

      const result = await this.saveBugReportToFile(bugData);
      
      if (result.success) {
        log.info(`BugReportService: Critical error report saved: ${result.reportId}`);
      }

      return result;

    } catch (reportError) {
      log.error('BugReportService: Failed to report critical error:', reportError);
      return { success: false, error: reportError.message };
    }
  }

  /**
   * Create bug report with file attachments support
   */
  async createBugReportWithAttachments(bugData, attachments = []) {
    try {
      // Automatically include current log file
      const logFiles = await this.getLogFilePaths();
      const allAttachments = [...attachments, ...logFiles];

      const reportData = {
        ...bugData,
        attachments: allAttachments,
        timestamp: new Date().toISOString(),
        systemInfo: await this.collectSystemInfo()
      };

      // Save report to file
      const saveResult = await this.saveBugReportToFile(reportData);
      
      if (saveResult.success) {
        // Copy attachments to report directory
        await this.copyAttachmentsToReportDir(saveResult.reportId, allAttachments);
      }

      return saveResult;

    } catch (error) {
      log.error('BugReportService: Failed to create bug report with attachments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current log file paths
   */
  async getLogFilePaths() {
    try {
      const { app } = require('electron');
      const logsPath = path.join(app.getPath('userData'), 'logs');
      const today = new Date().toISOString().split('T')[0];
      const currentLogFile = path.join(logsPath, `tallysyncpro-${today}.log`);
      
      const logFiles = [];
      
      // Add current log file if it exists
      if (await fs.access(currentLogFile).then(() => true).catch(() => false)) {
        logFiles.push({
          type: 'log',
          path: currentLogFile,
          name: `tallysyncpro-${today}.log`,
          autoAttached: true
        });
      }

      return logFiles;
    } catch (error) {
      log.error('BugReportService: Failed to get log file paths:', error);
      return [];
    }
  }

  /**
   * Copy attachments to report directory
   */
  async copyAttachmentsToReportDir(reportId, attachments) {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const reportDir = path.join(userDataPath, 'bug-reports', reportId);
      const attachmentsDir = path.join(reportDir, 'attachments');
      
      // Ensure attachments directory exists
      await fs.mkdir(attachmentsDir, { recursive: true });
      
      for (const attachment of attachments) {
        if (attachment.path && await fs.access(attachment.path).then(() => true).catch(() => false)) {
          const fileName = path.basename(attachment.path);
          const destPath = path.join(attachmentsDir, fileName);
          await fs.copyFile(attachment.path, destPath);
          log.info(`BugReportService: Copied attachment ${fileName} to report directory`);
        }
      }

    } catch (error) {
      log.error('BugReportService: Failed to copy attachments:', error);
    }
  }

  /**
   * Open file dialog for attachment selection
   */
  async selectAttachments() {
    try {
      const { dialog } = require('electron');
      
      const result = await dialog.showOpenDialog({
        title: 'Select Files to Attach',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
          { name: 'Documents', extensions: ['txt', 'pdf', 'doc', 'docx'] },
          { name: 'Logs', extensions: ['log', 'txt'] }
        ]
      });

      if (!result.canceled) {
        return result.filePaths.map(filePath => ({
          type: 'user',
          path: filePath,
          name: path.basename(filePath),
          autoAttached: false
        }));
      }

      return [];
    } catch (error) {
      log.error('BugReportService: Failed to select attachments:', error);
      return [];
    }
  }
}

module.exports = new BugReportService();

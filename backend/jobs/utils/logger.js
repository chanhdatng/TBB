const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = 'logs') {
    this.logDir = path.join(__dirname, '../../', logDir);
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    // Console output
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');

    // File output
    const logFile = path.join(this.logDir, `analytics-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, data) { this.log('INFO', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  success(message, data) { this.log('SUCCESS', message, data); }
}

module.exports = new Logger();

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

type LogLevelKey = keyof LogLevel;
type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

interface LogEntry {
  level: LogLevelKey;
  message: string;
  timestamp: Date;
  data?: LogData;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  
  private createLogEntry(level: LogLevelKey, message: string, data?: LogData, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      data,
      error
    };
  }

  private shouldLog(level: LogLevelKey): boolean {
    if (this.isDevelopment) return true;
    
    // 프로덕션에서는 ERROR와 WARN만 로깅
    return level === 'ERROR' || level === 'WARN';
  }

  private log(level: LogLevelKey, message: string, data?: LogData, error?: Error) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data, error);
    this.logs.push(logEntry);

    // 콘솔 출력
    const consoleKey = level.toLowerCase() as Lowercase<LogLevelKey>;
    const consoleMethod = console[consoleKey];
    if (typeof consoleMethod === 'function') {
      consoleMethod.call(console, `[${level}] ${message}`, data ?? '', error ?? '');
    }

    // 로그 버퍼 관리 (최대 100개 유지)
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // 프로덕션에서 에러 로깅 서비스에 전송
    if (!this.isDevelopment && level === 'ERROR') {
      this.sendToErrorService(logEntry);
    }
  }

  private sendToErrorService(logEntry: LogEntry) {
    void logEntry;
    // 실제 프로덕션에서는 Sentry, LogRocket, Bugsnag 등에 전송
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(_logEntry)
    // }).catch(() => {
    //   // 에러 로깅 실패 시 로컬 스토리지에 저장
    //   const savedErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    //   savedErrors.push(_logEntry);
    //   localStorage.setItem('error_logs', JSON.stringify(savedErrors.slice(-10)));
    // });
  }

  error(message: string, error?: Error, data?: LogData) {
    this.log('ERROR', message, data, error);
  }

  warn(message: string, data?: LogData) {
    this.log('WARN', message, data);
  }

  info(message: string, data?: LogData) {
    this.log('INFO', message, data);
  }

  debug(message: string, data?: LogData) {
    this.log('DEBUG', message, data);
  }

  // 사용자 액션 트래킹
  trackUserAction(action: string, data?: LogData) {
    this.info(`User Action: ${action}`, data);
  }

  // 성능 메트릭 로깅
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric}`, { value, unit });
  }

  // 로그 내보내기 (개발용)
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 로그 지우기
  clearLogs() {
    this.logs = [];
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
  logger.error('Global Error', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const rejectionError = event.reason instanceof Error
    ? event.reason
    : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled promise rejection');

  logger.error('Unhandled Promise Rejection', rejectionError, {
    reason: event.reason
  });
});

export default logger; 

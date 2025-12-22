export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  
  private createLogEntry(level: keyof LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      data,
      error
    };
  }

  private shouldLog(level: keyof LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // 프로덕션에서는 ERROR와 WARN만 로깅
    return level === 'ERROR' || level === 'WARN';
  }

  private log(level: keyof LogLevel, message: string, data?: any, error?: Error) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data, error);
    this.logs.push(logEntry);

    // 콘솔 출력
    const consoleMethod = console[level.toLowerCase() as keyof Console] as Function;
    if (consoleMethod) {
      consoleMethod(`[${level}] ${message}`, data || '', error || '');
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

  private sendToErrorService(_logEntry: LogEntry) {
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

  error(message: string, error?: Error, data?: any) {
    this.log('ERROR', message, data, error);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  // 사용자 액션 트래킹
  trackUserAction(action: string, data?: any) {
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
  logger.error('Unhandled Promise Rejection', new Error(event.reason), {
    reason: event.reason
  });
});

export default logger; 
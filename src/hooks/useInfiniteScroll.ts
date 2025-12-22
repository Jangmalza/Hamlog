import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  rootMargin = '100px'
}: UseInfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  // 디바운스된 로드 함수
  const debouncedLoadMore = useCallback(() => {
    if (hasMore && !loading && !isFetching) {
      setIsFetching(true);
      onLoadMore();
    }
  }, [hasMore, loading, isFetching, onLoadMore]);

  // Intersection Observer를 사용한 더 효율적인 스크롤 감지
  useEffect(() => {
    if (!targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          debouncedLoadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(targetRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [debouncedLoadMore, rootMargin]);

  // 폴백: 전통적인 스크롤 이벤트 리스너 (Intersection Observer 미지원 시)
  const handleScroll = useCallback(() => {
    if (!hasMore || loading || isFetching) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      debouncedLoadMore();
    }
  }, [hasMore, loading, isFetching, debouncedLoadMore, threshold]);

  useEffect(() => {
    // Intersection Observer가 지원되지 않는 경우에만 스크롤 이벤트 사용
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
      const throttledHandleScroll = throttle(handleScroll, 100);
      (window as Window).addEventListener('scroll', throttledHandleScroll, { passive: true });
      return () => (window as Window).removeEventListener('scroll', throttledHandleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (!loading) {
      setIsFetching(false);
    }
  }, [loading]);

  return { 
    isFetching, 
    targetRef: targetRef as React.RefObject<HTMLDivElement>
  };
};

// 쓰로틀 유틸리티 함수
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  let previous = 0;

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining) as unknown as number;
    }
  };
}
/**
 * PerformanceService - Optimización de rendimiento y experiencia de usuario
 */
export class PerformanceService {
  constructor() {
    this.loadingStates = new Map();
    this.debounceTimers = new Map();
    this.cacheStore = new Map();
    this.cacheExpiry = new Map();
    this.defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Muestra estado de carga en un elemento
   * @param {string|HTMLElement} element - Selector o elemento DOM
   * @param {boolean} isLoading - Estado de carga
   * @param {string} loadingText - Texto opcional durante la carga
   */
  setLoadingState(element, isLoading, loadingText = null) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const elementId = el.id || `element-${Date.now()}`;
    
    if (isLoading) {
      // Store original state
      if (!this.loadingStates.has(elementId)) {
        this.loadingStates.set(elementId, {
          originalText: el.textContent,
          originalDisabled: el.disabled,
          originalPointerEvents: el.style.pointerEvents
        });
      }

      // Apply loading state
      el.classList.add('loading');
      if (loadingText && el.tagName === 'BUTTON') {
        el.textContent = loadingText;
      }
      if (el.disabled !== undefined) {
        el.disabled = true;
      }
      el.style.pointerEvents = 'none';
    } else {
      // Restore original state
      const originalState = this.loadingStates.get(elementId);
      if (originalState) {
        el.classList.remove('loading');
        if (el.tagName === 'BUTTON') {
          el.textContent = originalState.originalText;
        }
        el.disabled = originalState.originalDisabled;
        el.style.pointerEvents = originalState.originalPointerEvents;
        this.loadingStates.delete(elementId);
      }
    }
  }

  /**
   * Debounce function calls
   * @param {string} key - Unique key for the debounce
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   */
  debounce(key, func, delay = 300) {
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttle function calls
   * @param {string} key - Unique key for the throttle
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   */
  throttle(key, func, limit = 100) {
    const lastCall = this.cacheStore.get(`throttle-${key}`);
    const now = Date.now();

    if (!lastCall || (now - lastCall) >= limit) {
      this.cacheStore.set(`throttle-${key}`, now);
      func();
    }
  }

  /**
   * Cache data with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCache(key, data, ttl = this.defaultCacheTTL) {
    this.cacheStore.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  getCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cacheStore.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cacheStore.get(key);
  }

  /**
   * Clear cache
   * @param {string} key - Specific key to clear, or null to clear all
   */
  clearCache(key = null) {
    if (key) {
      this.cacheStore.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.cacheStore.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Optimize database queries with caching
   * @param {string} cacheKey - Cache key
   * @param {Function} queryFunction - Function that returns a promise
   * @param {number} ttl - Cache TTL
   */
  async cachedQuery(cacheKey, queryFunction, ttl = this.defaultCacheTTL) {
    // Check cache first
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute query and cache result
    try {
      const result = await queryFunction();
      this.setCache(cacheKey, result, ttl);
      return result;
    } catch (error) {
      console.error('Cached query failed:', error);
      throw error;
    }
  }

  /**
   * Lazy load components
   * @param {string} componentName - Name of component to load
   * @param {Function} loader - Function that returns component promise
   */
  async lazyLoadComponent(componentName, loader) {
    const cacheKey = `component-${componentName}`;
    
    // Check if already loaded
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const component = await loader();
      this.setCache(cacheKey, component, 30 * 60 * 1000); // Cache for 30 minutes
      return component;
    } catch (error) {
      console.error(`Failed to lazy load component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize IndexedDB operations
   * @param {Function} operation - Database operation function
   * @param {string} operationName - Name for logging/caching
   */
  async optimizedDBOperation(operation, operationName = 'db-operation') {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow database operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      console.error(`Database operation failed: ${operationName}`, error);
      throw error;
    }
  }

  /**
   * Batch database operations
   * @param {Array} operations - Array of operation functions
   * @param {number} batchSize - Size of each batch
   */
  async batchOperations(operations, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < operations.length) {
        await this.sleep(10);
      }
    }
    
    return results;
  }

  /**
   * Virtual scrolling helper for large lists
   * @param {HTMLElement} container - Container element
   * @param {Array} items - Array of items
   * @param {Function} renderItem - Function to render each item
   * @param {number} itemHeight - Height of each item
   * @param {number} visibleCount - Number of visible items
   */
  setupVirtualScrolling(container, items, renderItem, itemHeight = 50, visibleCount = 10) {
    const totalHeight = items.length * itemHeight;
    const viewport = container;
    
    // Create virtual container
    const virtualContainer = document.createElement('div');
    virtualContainer.style.height = `${totalHeight}px`;
    virtualContainer.style.position = 'relative';
    
    // Create visible items container
    const visibleContainer = document.createElement('div');
    visibleContainer.style.position = 'absolute';
    visibleContainer.style.top = '0';
    visibleContainer.style.width = '100%';
    
    virtualContainer.appendChild(visibleContainer);
    viewport.appendChild(virtualContainer);
    
    let startIndex = 0;
    let endIndex = Math.min(visibleCount, items.length);
    
    const updateVisibleItems = () => {
      const scrollTop = viewport.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = Math.min(startIndex + visibleCount + 2, items.length); // +2 for buffer
      
      visibleContainer.style.top = `${startIndex * itemHeight}px`;
      visibleContainer.innerHTML = '';
      
      for (let i = startIndex; i < endIndex; i++) {
        const itemElement = renderItem(items[i], i);
        itemElement.style.height = `${itemHeight}px`;
        visibleContainer.appendChild(itemElement);
      }
    };
    
    // Throttled scroll handler
    viewport.addEventListener('scroll', () => {
      this.throttle('virtual-scroll', updateVisibleItems, 16); // ~60fps
    });
    
    // Initial render
    updateVisibleItems();
    
    return {
      updateItems: (newItems) => {
        items = newItems;
        virtualContainer.style.height = `${items.length * itemHeight}px`;
        updateVisibleItems();
      },
      destroy: () => {
        viewport.removeEventListener('scroll', updateVisibleItems);
        virtualContainer.remove();
      }
    };
  }

  /**
   * Preload critical resources
   * @param {Array} resources - Array of resource URLs
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      if (resource.endsWith('.js')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = resource;
        document.head.appendChild(link);
      } else if (resource.endsWith('.css')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = resource;
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Monitor performance metrics
   */
  startPerformanceMonitoring() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
        
        // Warn if memory usage is high
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          console.warn('High memory usage detected:', memoryUsage);
          this.clearCache(); // Clear cache to free memory
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry.duration.toFixed(2) + 'ms');
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task monitoring not supported');
      }
    }
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Optimize images for better performance
   * @param {HTMLImageElement} img - Image element
   * @param {Object} options - Optimization options
   */
  optimizeImage(img, options = {}) {
    const {
      lazy = true,
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
      quality = 0.8
    } = options;

    if (lazy && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      });

      // Set placeholder and observe
      if (img.src && !img.dataset.src) {
        img.dataset.src = img.src;
        img.src = placeholder;
      }
      observer.observe(img);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Clear cache
    this.clearCache();
    
    // Clear loading states
    this.loadingStates.clear();
  }
}
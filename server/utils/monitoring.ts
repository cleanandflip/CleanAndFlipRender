// Monitor server memory usage
export function monitorMemory() {
  const used = process.memoryUsage();
  
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
  
  const memoryInfo = {
    rss: `${mb(used.rss)}MB`, // Total memory
    heapTotal: `${mb(used.heapTotal)}MB`,
    heapUsed: `${mb(used.heapUsed)}MB`,
    external: `${mb(used.external)}MB`
  };
  
  console.log('[MEMORY]', memoryInfo);
  
  // Alert if memory usage is high
  if (used.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('⚠️ High memory usage detected!');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Forced garbage collection');
    }
  }
  
  return memoryInfo;
}

// Call periodically - commented out for now to avoid spam
// setInterval(monitorMemory, 60000); // Every minute
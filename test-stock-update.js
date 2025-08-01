// Test script to verify the stock update fix
async function testStockUpdate() {
  try {
    console.log('=== TESTING STOCK UPDATE FUNCTIONALITY ===');
    
    // 1. Get products list
    const res1 = await fetch('/api/admin/products?_t=' + Date.now(), {
      credentials: 'include'
    });
    const data1 = await res1.json();
    const product = data1.data[0];
    
    console.log('Product before update:', {
      id: product.id,
      name: product.name,
      stock: product.stock,
      stockQuantity: product.stockQuantity
    });
    
    // 2. Update stock to a new value
    const newStock = 25;
    console.log(`Updating stock to: ${newStock}`);
    
    const updateRes = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        description: product.description,
        stock: newStock, // This should map to stockQuantity in database
        isActive: product.isActive,
        isFeatured: product.isFeatured
      })
    });
    
    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateRes.status}`);
    }
    
    const updated = await updateRes.json();
    console.log('Update response:', {
      id: updated.id,
      name: updated.name,
      stock: updated.stock,
      stockQuantity: updated.stockQuantity
    });
    
    // 3. Fetch fresh data to verify persistence
    await new Promise(r => setTimeout(r, 500));
    const res2 = await fetch('/api/admin/products?_t=' + Date.now(), {
      credentials: 'include'
    });
    const data2 = await res2.json();
    const productAfter = data2.data.find(p => p.id === product.id);
    
    console.log('Product after update:', {
      id: productAfter.id,
      name: productAfter.name,
      stock: productAfter.stock,
      stockQuantity: productAfter.stockQuantity
    });
    
    // 4. Verify success
    const success = (productAfter.stock === newStock) && (productAfter.stockQuantity === newStock);
    console.log('=== TEST RESULT ===');
    console.log('SUCCESS:', success);
    console.log('Expected stock:', newStock);
    console.log('Actual stock:', productAfter.stock);
    console.log('Actual stockQuantity:', productAfter.stockQuantity);
    
    return success;
    
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.testStockUpdate = testStockUpdate;
}

console.log('Test script loaded. Run testStockUpdate() in browser console to test.');

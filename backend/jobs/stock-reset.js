const { getFirebaseServices } = require('../middleware/firebase-auth');
const logger = require('./utils/logger');

/**
 * Reset all stock quantities to 0
 * Runs daily at midnight
 */
async function resetStocks() {
  try {
    const { rtdb } = getFirebaseServices();
    const stocksRef = rtdb.ref('stocks');
    
    // Get current stocks to see what we have
    const snapshot = await stocksRef.once('value');
    const currentStocks = snapshot.val();
    
    if (!currentStocks) {
      logger.info('📊 No stocks found to reset');
      return { success: true, count: 0 };
    }
    
    // Create an update object to set all current keys to 0
    const updates = {};
    Object.keys(currentStocks).forEach(code => {
      updates[code] = 0;
    });
    
    // Perform bulk update
    await stocksRef.update(updates);
    
    logger.success(`📊 Successfully reset ${Object.keys(updates).length} stock items to zero`);
    
    // Add a log entry for the reset
    const reportRef = rtdb.ref('reportStocks');
    await reportRef.push({
      staffId: 'system-job',
      staffName: 'Automated Daily Reset',
      timestamp: Date.now(),
      date: new Date().toISOString(),
      changes: {
        all: {
          name: 'All Cakes',
          from: 'previous',
          to: 0,
          diff: 'reset'
        }
      },
      summary: { totalMade: 0, totalSold: 0, remaining: 0 }
    });
    
    return { 
      success: true, 
      count: Object.keys(updates).length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Failed to reset stocks:', error);
    throw error;
  }
}

module.exports = { resetStocks };

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Time Slots available
const TIME_SLOTS = [
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00"
];

/**
 * Parse CFAbsoluteTime (seconds since 2001-01-01) to JavaScript Date
 */
function parseCFTime(timestamp) {
  return new Date((timestamp + 978307200) * 1000);
}

/**
 * Determine the appropriate delivery time slot based on order date/time
 */
function getTimeSlotFromDate(timestamp) {
  if (!timestamp) return null;
  
  const date = parseCFTime(timestamp);
  if (isNaN(date.getTime())) return null;
  
  const hour = date.getHours();
  
  // Map hour to time slot
  if (hour >= 10 && hour < 12) return "10:00 - 12:00";
  if (hour >= 12 && hour < 14) return "12:00 - 14:00";
  if (hour >= 14 && hour < 16) return "14:00 - 16:00";
  if (hour >= 16 && hour < 18) return "16:00 - 18:00";
  if (hour >= 18 && hour < 20) return "18:00 - 20:00";
  
  // Outside business hours - return closest slot
  if (hour < 10) return "10:00 - 12:00"; // Before opening
  if (hour >= 20) return "18:00 - 20:00"; // After closing
  
  return null;
}

// Initialize Firebase Admin
let db;

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.database();
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                         serviceAccount.databaseURL ||
                         `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
      });

      console.log('✅ Firebase Admin initialized:', databaseURL);
      return admin.database();
    } else {
      throw new Error('Service account key not found at backend/serviceAccountKey.json');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
}

/**
 * Main function to fix all orders missing deliveryTimeSlot
 */
async function fixDeliveryTimeSlots() {
  const startTime = Date.now();
  console.log('🚀 Starting deliveryTimeSlot fix script (Paginated)');
  console.log('=' .repeat(50));

  try {
    // Initialize Firebase
    db = initializeFirebase();

    const updates = {};
    let skippedCount = 0;
    let nullSlotCount = 0;
    let processedCount = 0;
    
    // Pagination settings
    const FETCH_BATCH_SIZE = 500;
    let lastKey = null;
    let hasMore = true;

    console.log('\n📥 Fetching orders from Firebase in batches...');

    while (hasMore) {
        let query = db.ref('orders').orderByKey().limitToFirst(FETCH_BATCH_SIZE);
        
        if (lastKey) {
            query = query.startAfter(lastKey);
        }

        const snapshot = await query.once('value');
        const ordersBatch = snapshot.val();

        if (!ordersBatch) {
            hasMore = false;
            break;
        }

        const batchKeys = Object.keys(ordersBatch);
        if (batchKeys.length === 0) {
            hasMore = false;
            break;
        }

        // Update lastKey for next page
        lastKey = batchKeys[batchKeys.length - 1];
        
        // Process this batch
        for (const key of batchKeys) {
            processedCount++;
            const order = ordersBatch[key];

            // Skip if already has deliveryTimeSlot
            if (order.deliveryTimeSlot) {
                skippedCount++;
                continue;
            }

            // Get time slot from orderDate
            const timeSlot = getTimeSlotFromDate(order.orderDate);

            if (timeSlot) {
                updates[`orders/${key}/deliveryTimeSlot`] = timeSlot;
            } else {
                nullSlotCount++;
            }
        }

        // Help garbage collection
        delete ordersBatch; 
        
        // Log progress every few batches or so
        if (processedCount % 1000 === 0) {
             console.log(`   Processed ${processedCount} orders...`);
        }
    }
    
    console.log(`✅ Finished processing ${processedCount} orders`);

    const updateCount = Object.keys(updates).length;
    
    console.log(`\n📊 Results:`);
    console.log(`   - Already have timeSlot: ${skippedCount}`);
    console.log(`   - Need to update: ${updateCount}`);
    console.log(`   - Could not determine slot: ${nullSlotCount}`);

    if (updateCount === 0) {
      console.log('\n✅ No orders need updating. All done!');
      return { success: true, updated: 0, skipped: skippedCount };
    }

    // Perform batch update
    console.log(`\n💾 Updating ${updateCount} orders...`);
    
    // Firebase has a limit of ~256KB per update, so batch in chunks
    const BATCH_SIZE = 500;
    const updateKeys = Object.keys(updates);
    let totalUpdated = 0;

    for (let i = 0; i < updateKeys.length; i += BATCH_SIZE) {
      const batchKeys = updateKeys.slice(i, i + BATCH_SIZE);
      const batchUpdates = {};
      
      for (const key of batchKeys) {
        batchUpdates[key] = updates[key];
      }
      
      await db.ref().update(batchUpdates);
      totalUpdated += batchKeys.length;
      
      const progress = Math.round((totalUpdated / updateCount) * 100);
      console.log(`   Progress: ${totalUpdated}/${updateCount} (${progress}%)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '=' .repeat(50));
    console.log(`✅ Fix completed in ${duration}s`);
    console.log(`   Total updated: ${totalUpdated}`);

    return {
      success: true,
      duration: `${duration}s`,
      updated: totalUpdated,
      skipped: skippedCount,
      couldNotDetermine: nullSlotCount
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Fix failed after ${duration}s:`, error.message);
    throw error;
  }
}

// Run script
if (require.main === module) {
  fixDeliveryTimeSlots()
    .then(result => {
      console.log('\n📋 Final Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { fixDeliveryTimeSlots };

// Script to scan all product names containing "cheese" or "brazilian"
import { database } from './src/firebase.js';
import { ref, get } from 'firebase/database';

async function scanProductNames() {
    console.log('Scanning orders for product name variants...\n');

    try {
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);

        if (!snapshot.exists()) {
            console.log('No orders found');
            return;
        }

        const data = snapshot.val();
        const productNameCounts = new Map();

        Object.entries(data).forEach(([orderId, order]) => {
            if (!order.cakes || !Array.isArray(order.cakes)) return;

            order.cakes.forEach(cake => {
                const name = cake.name;
                if (!name) return;

                // Check if name contains "cheese", "brazilian", "bread", or "pão"
                const lowerName = name.toLowerCase();
                if (lowerName.includes('cheese') ||
                    lowerName.includes('brazilian') ||
                    lowerName.includes('bread') ||
                    lowerName.includes('pão')) {

                    const count = productNameCounts.get(name) || 0;
                    productNameCounts.set(name, count + 1);
                }
            });
        });

        // Sort by count descending
        const sorted = Array.from(productNameCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        console.log('Found product name variants:');
        console.log('='.repeat(60));
        sorted.forEach(([name, count]) => {
            console.log(`"${name}" -> ${count} occurrences`);
        });
        console.log('='.repeat(60));
        console.log(`Total unique variants: ${sorted.length}\n`);

        // Suggest variants that are NOT "Brazilian Cheesebread"
        console.log('\nVariants that need standardization:');
        console.log('-'.repeat(60));
        sorted.forEach(([name, count]) => {
            if (name !== 'Brazilian Cheesebread') {
                console.log(`  '${name}',`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('Error scanning orders:', error);
        process.exit(1);
    }
}

scanProductNames();

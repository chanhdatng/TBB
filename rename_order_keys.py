#!/usr/bin/env python3
"""
Script to rename Firebase order keys from current key to internal 'id' field.
This will restructure the orders collection to use the actual order IDs as keys.
"""

import json
import sys

def rename_order_keys(input_file, output_file):
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check if this is a multi-collection file (has "orders" key)
    if isinstance(data, dict) and 'orders' in data:
        print("Detected multi-collection structure (with 'orders' key)")
        orders = data['orders']
        is_multi_collection = True
    else:
        print("Detected single collection structure (orders only)")
        orders = data
        is_multi_collection = False
    
    new_orders = {}
    renamed_count = 0
    skipped_count = 0
    deleted_count = 0
    
    print(f"Processing {len(orders)} orders...")
    
    for old_key, order_data in orders.items():
        # Get the internal ID from order data
        if isinstance(order_data, dict) and 'id' in order_data:
            new_key = order_data['id']
            
            # Check if key needs to be changed
            if old_key != new_key:
                new_orders[new_key] = order_data
                renamed_count += 1
                if renamed_count <= 5:  # Show first 5 examples
                    print(f"  Renamed: {old_key} -> {new_key}")
            else:
                new_orders[old_key] = order_data
                skipped_count += 1
        else:
            # No internal ID found, delete this order
            deleted_count += 1
            if deleted_count <= 5:  # Show first 5 examples
                print(f"  Deleted: {old_key} (no 'id' field)")
    
    print(f"\nWriting to {output_file}...")
    
    if is_multi_collection:
        # Replace only the orders collection
        data['orders'] = new_orders
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    else:
        # Write orders directly
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(new_orders, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Done!")
    print(f"  - Renamed: {renamed_count} orders")
    print(f"  - Kept original: {skipped_count} orders")
    print(f"  - Deleted: {deleted_count} orders (no 'id' field)")
    print(f"  - Total: {len(new_orders)} orders")
    
    return True

if __name__ == "__main__":
    input_file = "DB-backup_renamed.json"
    output_file = "DB-backup_renamed_clean.json"
    
    try:
        success = rename_order_keys(input_file, output_file)
        if success:
            print(f"\n🎉 New file created: {output_file}")
            print("You can now import this file to Firebase")
        else:
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

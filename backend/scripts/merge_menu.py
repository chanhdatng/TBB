#!/usr/bin/env python3
"""
Menu Image Merger Script
Merges two menu images into one seamlessly
"""

import sys
import os
from PIL import Image

def merge_images(image1_path, image2_path, output_path, direction='vertical'):
    """
    Merge two images into one
    
    Args:
        image1_path: Path to first image
        image2_path: Path to second image
        output_path: Path for merged output
        direction: 'vertical' or 'horizontal'
    """
    try:
        # Open images
        img1 = Image.open(image1_path)
        img2 = Image.open(image2_path)
        
        # Convert to RGB if needed (remove alpha channel for JPEG compatibility)
        if img1.mode in ('RGBA', 'P'):
            img1 = img1.convert('RGB')
        if img2.mode in ('RGBA', 'P'):
            img2 = img2.convert('RGB')
        
        # Get dimensions
        w1, h1 = img1.size
        w2, h2 = img2.size
        
        if direction == 'vertical':
            # Stack vertically - use max width
            new_width = max(w1, w2)
            new_height = h1 + h2
            
            # Resize images to same width if needed
            if w1 != new_width:
                ratio = new_width / w1
                img1 = img1.resize((new_width, int(h1 * ratio)), Image.Resampling.LANCZOS)
                h1 = int(h1 * ratio)
            if w2 != new_width:
                ratio = new_width / w2
                img2 = img2.resize((new_width, int(h2 * ratio)), Image.Resampling.LANCZOS)
                h2 = int(h2 * ratio)
            
            new_height = h1 + h2
            merged = Image.new('RGB', (new_width, new_height), (255, 255, 255))
            merged.paste(img1, (0, 0))
            merged.paste(img2, (0, h1))
        else:
            # Stack horizontally - use max height
            new_height = max(h1, h2)
            new_width = w1 + w2
            
            # Resize images to same height if needed
            if h1 != new_height:
                ratio = new_height / h1
                img1 = img1.resize((int(w1 * ratio), new_height), Image.Resampling.LANCZOS)
                w1 = int(w1 * ratio)
            if h2 != new_height:
                ratio = new_height / h2
                img2 = img2.resize((int(w2 * ratio), new_height), Image.Resampling.LANCZOS)
                w2 = int(w2 * ratio)
            
            new_width = w1 + w2
            merged = Image.new('RGB', (new_width, new_height), (255, 255, 255))
            merged.paste(img1, (0, 0))
            merged.paste(img2, (w1, 0))
        
        # Save merged image
        merged.save(output_path, 'JPEG', quality=95)
        print(f"SUCCESS:{output_path}")
        return True
        
    except Exception as e:
        print(f"ERROR:{str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python merge_menu.py <image1> <image2> <output> [direction]", file=sys.stderr)
        sys.exit(1)
    
    img1 = sys.argv[1]
    img2 = sys.argv[2]
    output = sys.argv[3]
    direction = sys.argv[4] if len(sys.argv) > 4 else 'vertical'
    
    if not os.path.exists(img1):
        print(f"ERROR:Image 1 not found: {img1}", file=sys.stderr)
        sys.exit(1)
    
    if not os.path.exists(img2):
        print(f"ERROR:Image 2 not found: {img2}", file=sys.stderr)
        sys.exit(1)
    
    success = merge_images(img1, img2, output, direction)
    sys.exit(0 if success else 1)

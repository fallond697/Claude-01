"""Remove the glowing halo from the Overseer Teams background images."""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np


def analyze_halo(arr, cx, cy):
    """Print brightness stats in the halo region for tuning."""
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[:h, :w]
    dist = np.sqrt((xx - cx)**2 + (yy - cy)**2)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    brightness = (r + g + b) / 3.0

    for rad in range(30, 200, 10):
        ring = (dist >= rad - 5) & (dist <= rad + 5)
        if np.any(ring):
            avg_b = np.mean(brightness[ring])
            max_b = np.max(brightness[ring])
            print(f'  radius {rad}: avg brightness={avg_b:.1f}, max={max_b:.1f}')


def remove_halo(input_path, output_path, flipped=False):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img, dtype=np.float64)
    h, w = arr.shape[:2]

    # Halo center — statue head is roughly centered horizontally, ~28% from top
    cx = w // 2
    cy = int(h * 0.27)

    print(f'Image size: {w}x{h}, halo center: ({cx}, {cy})')
    analyze_halo(arr, cx, cy)

    yy, xx = np.mgrid[:h, :w]
    dist = np.sqrt((xx - cx)**2 + (yy - cy)**2)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    brightness = (r + g + b) / 3.0

    # The halo is a thin bright ring. Based on image dimensions,
    # the ring radius is roughly 12-18% of image height
    ring_radius_min = int(h * 0.10)
    ring_radius_max = int(h * 0.22)

    # Ring region
    ring_mask = (dist >= ring_radius_min) & (dist <= ring_radius_max)

    # Detect bright pixels in the ring that are part of the halo glow
    # The halo is bright cyan/white against dark background (~10-25 brightness)
    # Halo core is very bright (>100), glow extends to ~30-50
    is_halo_bright = brightness > 25
    # Also check for cyan-ish tint (higher blue+green relative to red)
    # But the core of the halo is nearly white, so also catch high brightness
    is_very_bright = brightness > 80
    is_cyan = ((b > 30) & (g > 20)) | ((b + g) > r * 2.5)

    halo_pixels = ring_mask & (is_very_bright | (is_halo_bright & is_cyan))

    # Also catch the softer outer glow
    outer_glow_region = (dist >= ring_radius_min * 0.85) & (dist <= ring_radius_max * 1.15)
    soft_glow = outer_glow_region & (brightness > 20) & is_cyan & ~halo_pixels
    halo_pixels = halo_pixels | soft_glow

    # Don't touch the statue body (center region)
    # The statue head is roughly within inner radius
    statue_head_radius = ring_radius_min * 0.7
    statue_mask = dist < statue_head_radius
    halo_pixels = halo_pixels & ~statue_mask

    # Also exclude pixels that are clearly part of the orange sash on the statue
    is_orange = (r > 120) & (r > g * 1.5) & (r > b * 2)
    halo_pixels = halo_pixels & ~is_orange

    # Expand to catch fringes
    halo_mask_img = Image.fromarray(halo_pixels.astype(np.uint8) * 255, mode='L')
    halo_mask_img = halo_mask_img.filter(ImageFilter.MaxFilter(size=9))
    halo_expanded = np.array(halo_mask_img) > 127

    # Re-apply statue exclusion after expansion
    halo_expanded = halo_expanded & ~statue_mask
    halo_expanded = halo_expanded & ~is_orange

    # Sample background color from dark area away from halo
    bg_region = (dist >= ring_radius_max * 1.3) & (dist <= ring_radius_max * 2.0) & (brightness < 20)
    if np.any(bg_region):
        bg_r = np.median(arr[bg_region, 0])
        bg_g = np.median(arr[bg_region, 1])
        bg_b = np.median(arr[bg_region, 2])
    else:
        bg_r, bg_g, bg_b = 8, 14, 24

    print(f'  Background color: ({bg_r:.0f}, {bg_g:.0f}, {bg_b:.0f})')
    print(f'  Halo pixels found: {np.sum(halo_expanded)}')

    # Create soft blending mask
    halo_float = halo_expanded.astype(np.float64)
    blend_img = Image.fromarray((halo_float * 255).astype(np.uint8), mode='L')
    blend_img = blend_img.filter(ImageFilter.GaussianBlur(radius=6))
    blend_mask = np.array(blend_img).astype(np.float64) / 255.0

    # Blend halo area with background
    result = arr.copy()
    for c, bg_val in enumerate([bg_r, bg_g, bg_b]):
        result[:, :, c] = arr[:, :, c] * (1 - blend_mask) + bg_val * blend_mask
    result[:, :, 3] = arr[:, :, 3]  # preserve alpha

    out_img = Image.fromarray(result.astype(np.uint8), mode='RGBA')
    out_img.save(output_path)
    print(f'Saved: {output_path}')


# Process both images
img1 = r'c:\Users\FallonD\OneDrive - Vituity\Pictures\Teams backround Overseer.png'
out1 = r'c:\Users\FallonD\OneDrive - Vituity\Pictures\Teams backround Overseer_no_halo.png'

img2 = r'c:\Users\FallonD\OneDrive - Vituity\Pictures\Teams_backround_Overseer_flipped.png'
out2 = r'c:\Users\FallonD\OneDrive - Vituity\Pictures\Teams_backround_Overseer_flipped_no_halo.png'

print('=== Image 1 (original) ===')
remove_halo(img1, out1)
print()
print('=== Image 2 (flipped) ===')
remove_halo(img2, out2)

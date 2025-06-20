# Assets Folder

This folder contains static assets like images, icons, and other media files for the Exchange App frontend.

## Structure

```
assets/
├── images/
│   ├── placeholder.svg  # Default placeholder image
│   └── [your-images]    # Add your custom images here
└── README.md           # This file
```

## How to Add Your Own Images

1. **Place your images** in the `images/` folder
2. **Supported formats**: PNG, JPG, JPEG, GIF, SVG
3. **Import in your components**:
   ```tsx
   import myImage from '../assets/images/my-image.png';
   
   // Then use in JSX:
   <img src={myImage} alt="Description" />
   ```

## Example Usage

```tsx
// In your component file
import React from 'react';
import logoImage from '../assets/images/logo.png';
import bannerImage from '../assets/images/banner.jpg';

const MyComponent: React.FC = () => {
  return (
    <div>
      <img src={logoImage} alt="Company Logo" className="logo" />
      <img src={bannerImage} alt="Welcome Banner" className="banner" />
    </div>
  );
};
```

## Best Practices

- **Optimize images** before adding them (compress for web)
- **Use descriptive filenames** (e.g., `user-profile-placeholder.png`)
- **Keep file sizes reasonable** (aim for under 1MB per image)
- **Use appropriate formats**:
  - PNG for images with transparency
  - JPG for photos
  - SVG for icons and simple graphics
- **Add alt text** for accessibility

## Current Images

- `placeholder.svg` - Default welcome image for the landing page (300x200px)

## Replacing the Default Image

To replace the placeholder image in the landing page:

1. Add your new image to this folder
2. Update the import in `components/Landing.tsx`:
   ```tsx
   // Change this line:
   import placeholderImage from '../assets/images/placeholder.svg';
   
   // To your new image:
   import welcomeImage from '../assets/images/your-image.png';
   ```
3. Update the image reference in the JSX 
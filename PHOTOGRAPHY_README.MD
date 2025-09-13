# Photography Section Setup

Your website now includes a complete photography portfolio system that automatically updates when you add photos to your GitHub repository!

## 🎯 How It Works

The photography system automatically:
- Loads photos from your GitHub repository
- Displays them in a beautiful, responsive gallery
- Shows the latest 3 photos on your homepage
- Organizes photos by location and date
- Provides search functionality
- Includes a modal viewer with navigation

## 📁 Setting Up Your Photo Folder

1. **Create the photos directory** in your GitHub repository:
   ```
   assets/images/photography/
   ```

2. **Upload your photos** to this folder using GitHub's web interface or git commands

## 🏷️ Photo Naming Convention

For best results, name your photos using this format:
```
YYYY-MM-DD_Location_Title.jpg
```

**Examples:**
- `2024-05-15_Naples_Italy_Sunset_Harbor.jpg`
- `2024-03-20_Rocky_Mountains_Colorado_Morning_Mist.jpg`
- `2024-01-10_New_York_City_Manhattan_Skyline.jpg`

**What each part does:**
- `YYYY-MM-DD`: Date taken (for chronological sorting)
- `Location`: Where the photo was taken (for location filtering)
- `Title`: Descriptive title (displayed as photo title)

## 📸 Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

## ✨ Features

### Homepage Banner
- Shows your 3 most recent photos
- Clicking any photo takes visitors to your full portfolio
- Automatically updates when you add new photos

### Photography Page Features
- **Grid/List View Toggle**: Switch between compact grid and detailed list views
- **Location Filter**: Filter photos by location
- **Date Sorting**: Sort by newest or oldest first
- **Search**: Search across titles, locations, and descriptions
- **Modal Viewer**: Click any photo for full-screen viewing with navigation
- **Keyboard Navigation**: Use arrow keys and ESC in modal view
- **Responsive Design**: Works perfectly on mobile devices

### Automatic Updates
- No manual updates needed
- Photos appear immediately after uploading to GitHub
- Filters and search update automatically
- Fallback demo photos if GitHub is unavailable

## 🛠️ Customization Options

### Changing the GitHub Folder
Edit these variables in `assets/js/photography.js` and `assets/js/photography-banner.js`:
```javascript
const GITHUB_USERNAME = 'LordOfTheTrees'; // Your GitHub username
const REPO_NAME = 'TreePage';             // Your repository name
const PHOTOS_FOLDER = 'assets/images/photography'; // Photo folder path
```

### Styling
- Main styles are in the photography page itself
- Banner styles are in the updated homepage
- Colors and spacing can be customized by editing the `<style>` sections

### Number of Banner Photos
Change this line in `photography-banner.js`:
```javascript
displayPhotoBanner(photos.slice(0, 3)); // Change 3 to your preferred number
```

## 📱 Mobile Optimization

The photography section is fully mobile-optimized with:
- Responsive grid layouts
- Touch-friendly modal navigation
- Optimized image loading
- Mobile-specific UI adjustments

## 🚀 Getting Started

1. Create the `assets/images/photography/` folder in your repository
2. Upload some photos using the naming convention above
3. Your photography section will automatically populate!

## 🔍 Troubleshooting

**Photos not showing?**
- Check that photos are in the correct folder: `assets/images/photography/`
- Ensure photo files have supported extensions (.jpg, .png, etc.)
- Verify your GitHub repository is public or API accessible

**Filters not working?**
- Make sure photo filenames include location information
- Use underscores or dashes to separate location parts

**Demo photos showing instead?**
- This happens when GitHub API is unavailable or no photos are found
- Upload photos to the correct folder to replace demo content

## 🎨 Advanced Tips

- **High-quality photos**: Upload high-resolution images for best quality
- **Consistent naming**: Use consistent location naming for better filtering
- **Descriptions**: Consider adding descriptions in filename or metadata
- **Organization**: Group photos by events or trips using date prefixes

Your photography portfolio is now ready to showcase your work automatically! Simply upload photos to GitHub and watch your website update instantly.

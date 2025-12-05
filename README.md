# ReferenceHub - Research Reference Manager

A beautiful, modern web-based reference management system for researchers, similar to Mendeley but with a superior user interface and user experience.

![ReferenceHub](https://img.shields.io/badge/Built%20with-React-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Powered%20by-Vite-646cff?style=flat-square&logo=vite)

## ✨ Features

### 📚 Reference Management
- **Add References**: Comprehensive form to add journal articles, conference papers, book chapters, theses, and more
- **Search & Filter**: Powerful search across titles, authors, tags, and abstracts
- **Organize**: Custom folders including "All Papers", "Recently Added", and "Favorites"
- **Details View**: Slide-out panel showing full reference information

### 🎨 Beautiful UI/UX
- **Dark Mode First**: Sophisticated dark theme with premium aesthetics
- **Glassmorphism Effects**: Modern glass-like UI elements with backdrop blur
- **Smooth Animations**: Micro-interactions and transitions throughout
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **View Modes**: Toggle between list and grid views

### 📝 Smart Features
- **Citations**: Export references in BibTeX and APA formats
- **Notes**: Add and edit personal notes for each reference
- **Tags**: Organize references with custom tags
- **Favorites**: Mark important references for quick access
- **Storage Indicator**: Visual progress bar showing library size

### 🔍 Search & Organization
- Real-time search across all reference fields
- Filter by folders (All Papers, Recently Added, Favorites)
- Tag-based filtering
- Sort and organize your library

### 🌍 Multi-Language Support
- **3 Languages**: Full support for English, French, and Arabic
- **Instant Switching**: Change language on-the-fly from Settings
- **RTL Layout**: Automatic right-to-left layout for Arabic
- **Persistent Selection**: Your language preference is saved
- **Auto-Detection**: Automatically detects browser language on first visit

### 🔬 Advanced Research Tools
- **Scholar Search**: Search 200M+ academic papers via Semantic Scholar
- **AI-Enhanced Search**: Optional AI query augmentation for better results
- **Novelty Evaluator**: Get brutal, honest feedback on research novelty
- **Quality Filters**: Filter by journal rankings (Q1-Q4)
- **Publication Types**: Filter by arXiv, conferences, and journals

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository and navigate to the client directory:
```bash
cd "Power Research/client"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 🏗️ Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 7
- **Styling**: Vanilla CSS with CSS Variables
- **Font**: Inter (Google Fonts)
- **State Management**: React Hooks (useState, useEffect)
- **Data Persistence**: localStorage
- **Internationalization**: i18next, react-i18next (3 languages: EN, FR, AR)
- **API Integration**: Semantic Scholar API, Cerebras AI, Google Gemini
- **PDF Processing**: PDF.js for metadata extraction

## 📁 Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Top navigation bar
│   │   ├── Sidebar.jsx             # Left sidebar navigation
│   │   ├── SearchBar.jsx           # Search input with filters
│   │   ├── ReferenceList.jsx       # Main reference display
│   │   ├── ReferenceDetails.jsx    # Slide-out details panel
│   │   ├── AddReferenceModal.jsx   # Add new reference form
│   │   ├── BatchAddReferencesModal.jsx  # Batch PDF import
│   │   ├── SettingsModal.jsx       # Settings with language selector
│   │   ├── LanguageSwitcher.jsx    # Language selection component
│   │   ├── ScholarSearch.jsx       # Academic paper search
│   │   ├── NoveltyEvaluator.jsx    # AI-powered novelty evaluation
│   │   └── TechnicalSheet.jsx      # Technical review sheet
│   ├── i18n/
│   │   ├── config.js               # i18next configuration
│   │   └── locales/
│   │       ├── en.json             # English translations
│   │       ├── fr.json             # French translations
│   │       └── ar.json             # Arabic translations
│   ├── utils/
│   │   ├── academicSearch.js       # Semantic Scholar integration
│   │   ├── cerebrasService.js      # Cerebras AI API
│   │   ├── geminiService.js        # Google Gemini API
│   │   ├── journalRanking.js       # Journal quality rankings
│   │   ├── pdfMetadata.js          # PDF metadata extraction
│   │   └── pdfStorage.js           # IndexedDB PDF storage
│   ├── App.jsx                     # Main application component
│   ├── main.jsx                    # Application entry point
│   ├── styles.css                  # Global styles & design system
│   └── novelty-evaluator.css      # Novelty evaluator styles
├── docs/
│   └── I18N.md                     # Internationalization guide
├── index.html
└── package.json
```

## 🎨 Design System

The application features a comprehensive design system with:

- **Color Palette**: HSL-based colors for primary, accent, success, warning, and danger states
- **Typography**: Inter font family with multiple weights
- **Spacing System**: Consistent spacing scale from XS to 2XL
- **Border Radius**: Predefined radius values for consistent roundness
- **Shadows**: Layered shadow system for depth
- **Transitions**: Smooth animations with cubic-bezier easing

## 💾 Data Persistence

All references are automatically saved to browser localStorage, ensuring your data persists between sessions. The application saves:

- Reference metadata (title, authors, year, journal, etc.)
- Personal notes
- Favorite status
- Tags and categorization

## 🌟 Key Features Explained

### Adding References
Click the "Add Reference" button in the header to open the form. Fill in:
- Title (required)
- Authors (required, comma-separated)
- Year
- Type (Journal Article, Conference Paper, etc.)
- Journal/Conference name
- Abstract
- Tags (comma-separated)

### Search
The search bar searches across:
- Reference titles
- Author names
- Tags
- Abstract text

### Exporting Citations
Click any reference to open the details panel, then use the export buttons to copy:
- **BibTeX**: For LaTeX documents
- **APA**: For APA-style citations


## 🔮 Future Enhancements

Potential features for future versions:
- PDF attachment and viewer
- Import from DOI/ISBN
- Bulk import from BibTeX files
- Cloud sync
- Collaboration features
- Advanced filtering and sorting
- Export entire library
- Integration with citation plugins

## 📱 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6+ support

## 🤝 Contributing

This is a personal reference management tool. Feel free to fork and customize for your own needs!

## 📄 License

MIT License - feel free to use and modify as needed.

## 🎯 Design Goals

1. **Premium Aesthetics**: Create a visually stunning interface that researchers enjoy using
2. **Smooth Performance**: Fast, responsive UI with smooth animations
3. **User-Friendly**: Intuitive interface requiring no learning curve
4. **Data Privacy**: All data stored locally in the browser
5. **Accessibility**: Keyboard navigation and screen reader support
6. **Global Reach**: Multi-language support for international researchers

---

Built with ❤️ for researchers who deserve better tools

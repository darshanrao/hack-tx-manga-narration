# Manga Reader Frontend

This is the frontend application for the Manga Reader for Visually Impaired project, built with Next.js 15, React 18, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or later
- npm 9.0 or later

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AccessibilitySettings.tsx
│   ├── AudioReader.tsx
│   ├── MangaPageViewer.tsx
│   ├── PlaybackControls.tsx
│   └── UploadArea.tsx
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React
- **State Management**: React Hooks

## ♿ Accessibility Features

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- High contrast mode
- Focus management
- Semantic HTML structure

## 🔧 Development

### Code Style
- ESLint configuration included
- TypeScript strict mode enabled
- Prettier recommended for formatting

### Testing
```bash
# Run tests (when implemented)
npm test

# Run accessibility tests
npm run test:a11y
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Other Platforms
- Netlify
- AWS Amplify
- Docker
- Self-hosted

## 📚 Documentation

- [Main README](../README.md) - Project overview
- [Requirements](../REQUIREMENTS.md) - System requirements
- [Dependencies](../DEPENDENCIES.md) - Dependency information
- [Installation](../INSTALLATION.md) - Installation guide
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
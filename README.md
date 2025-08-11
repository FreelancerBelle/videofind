# YouTube Channel Search Pro

A powerful web application for discovering and analyzing YouTube channels with advanced filtering capabilities.

## Features

- **Smart Search**: Find YouTube channels by keyword with comprehensive filtering
- **Geographic Filtering**: Only include channels from specific countries (AT, AU, BE, BG, CA, CH, CY, CZ, DE, DK, EE, ES, FI, FR, GB, GR, HR, HU, IE, IT, LT, LV, NL, NO, NZ, PL, PT, RO, SE, SI, SK, US, ZA)
- **Gaming Channel Exclusion**: Automatically filters out gaming-related content
- **Recency Filtering**: Only shows channels with videos uploaded in the last 6 months
- **Subscriber Filtering**: Filter channels with 1000+ subscribers
- **Automatic Excel Export**: Search results download automatically as formatted Excel files
- **Search History**: Track and revisit previous searches
- **Real-time Progress**: Monitor search progress with live updates

## Prerequisites

- Node.js 18+ 
- YouTube Data API v3 key from Google Cloud Console
- npm or yarn package manager

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd youtube-channel-search-pro
   npm install
   ```

2. **Get YouTube API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Copy your API key

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Open Your Browser**
   - Navigate to `http://localhost:5000`
   - Enter your YouTube API key
   - Start searching for channels!

## Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
YOUTUBE_API_KEY=your_api_key_here
PORT=5000
NODE_ENV=development
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API client
│   │   └── hooks/          # Custom React hooks
│   └── index.html
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   └── vite.ts            # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database and API schemas
└── package.json
```

## API Endpoints

- `POST /api/search` - Search for YouTube channels
- `GET /api/search-history` - Get search history
- `DELETE /api/search-history` - Clear search history
- `GET /api/channels/:searchId` - Get channels for a search
- `GET /api/export/:searchId` - Export channels as Excel file

## Search Filters

### Geographic Filter
Only includes channels from these countries:
- Europe: AT, AU, BE, BG, CH, CY, CZ, DE, DK, EE, ES, FI, FR, GB, GR, HR, HU, IE, IT, LT, LV, NL, NO, PL, PT, RO, SE, SI, SK
- Americas: CA, US
- Oceania: AU, NZ
- Africa: ZA
- Plus channels without country specification

### Gaming Filter
Automatically excludes channels containing gaming-related keywords in titles or descriptions.

### Recency Filter
Only includes channels that have uploaded videos within the last 6 months.

### Subscriber Filter
Option to only include channels with 1000+ subscribers.

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- shadcn/ui component library
- TanStack Query for data fetching
- Wouter for routing

### Backend
- Express.js with TypeScript
- In-memory storage (development)
- Drizzle ORM (ready for database)
- YouTube Data API v3 integration
- Excel export with xlsx library

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## Deployment

The application is designed to work on any Node.js hosting platform:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   - `YOUTUBE_API_KEY` (required)
   - `PORT` (default: 5000)
   - `NODE_ENV=production`

3. **Start the server**
   ```bash
   npm start
   ```

## API Quota Management

- Each search uses approximately 100-1000 API quota units
- Default YouTube API quota is 10,000 units per day
- Monitor usage in the application header
- Consider requesting quota increase for heavy usage

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify key is correct
   - Ensure YouTube Data API v3 is enabled
   - Check quota limits

2. **No Results Found**
   - Try broader search terms
   - Check if filters are too restrictive
   - Verify API key has proper permissions

3. **Export Not Working**
   - Ensure search completed successfully
   - Check browser download settings
   - Verify Excel file permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check this README
2. Review the troubleshooting section
3. Create an issue on GitHub
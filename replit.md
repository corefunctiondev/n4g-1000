# CDJ Digital Turntable Interface

## Overview

This is a full-stack web application that replicates the functionality of professional DJ equipment (CDJ-style digital turntables) in a browser environment. The application provides dual-deck mixing capabilities with real-time audio processing, waveform visualization, and professional DJ controls.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom CDJ-themed components
- **UI Components**: Radix UI primitives with shadcn/ui
- **Audio Processing**: Web Audio API for real-time audio manipulation
- **State Management**: React hooks with custom audio engine
- **Build Tool**: Vite for development and production builds

### Backend Architecture  
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: Supabase PostgreSQL (exclusive data source)
- **Storage**: Supabase Storage with "music" bucket for audio files
- **API Design**: RESTful endpoints using Supabase client directly
- **Architecture**: Simplified single-database design (no local PostgreSQL)

### Audio Engine Architecture
- **Core**: Custom AudioEngine class managing Web Audio API
- **Processing Chain**: Source → EQ → Gain → Crossfader → Master → Compressor → Output
- **Features**: Real-time BPM analysis, tempo adjustment, 3-band EQ, crossfading
- **Visualization**: Canvas-based waveform rendering with frequency analysis

## Key Components

### Audio System
- **AudioEngine**: Central audio processing manager
- **BPMAnalyzer**: Automatic tempo detection using autocorrelation and spectral analysis
- **AudioEffects**: Reverb, delay, and filtering capabilities
- **Deck Management**: Independent audio nodes per deck with sync capabilities

### UI Components
- **Deck**: Complete turntable interface with transport controls
- **Mixer**: Professional mixing console with crossfader and channel controls
- **Waveform**: Real-time audio visualization with seeking capability
- **Knob/Fader**: Hardware-accurate control elements

### Data Layer
- **Track Management**: Audio file metadata and waveform data storage
- **Playlist System**: User-created collections with ordering
- **DJ Sessions**: Recording and playback of mixing sessions
- **User System**: Authentication and personal libraries

## Data Flow

1. **Audio Loading**: File → AudioBuffer → BPM Analysis → Waveform Generation → Deck Assignment
2. **Playback**: Deck Controls → AudioEngine → Web Audio Nodes → Audio Output
3. **Mixing**: Crossfader → Gain Adjustment → Master Output
4. **Visualization**: Audio Analysis → Canvas Rendering → Real-time Updates
5. **Data Persistence**: User Actions → API Endpoints → Database Storage

## External Dependencies

### Audio Processing
- Web Audio API (browser native)
- Canvas API for waveform visualization
- File API for audio file handling

### UI Framework
- React ecosystem with TypeScript
- Tailwind CSS for styling
- Radix UI for accessible components
- Lucide React for icons

### Backend Services
- PostgreSQL database (configured for Neon serverless)
- Express.js web framework
- Drizzle ORM for type-safe database operations

### Development Tools
- Vite build system with HMR
- ESBuild for production bundling
- TypeScript for type safety
- PostCSS for style processing

## Deployment Strategy

### Development
- Replit environment with hot reload
- PostgreSQL module for database
- Port 5000 for local development
- Vite dev server with proxy setup

### Production Build
- `npm run build` creates optimized bundles
- Static assets served from Express
- Database migrations via Drizzle
- Environment variable configuration

### Scaling Considerations
- Autoscale deployment target configured
- Database connection pooling via Neon
- Static asset optimization
- Audio processing stays client-side for performance

Changelog:
- June 13, 2025. Initial setup
- June 13, 2025. Successfully connected Supabase database with music_tracks table
- June 13, 2025. Moved track selectors to top of CDJ interfaces for better UX
- June 13, 2025. Fixed audio loading timing issue - tracks now load and play successfully from Supabase storage
- June 13, 2025. Optimized track switching - selecting new track while playing auto-stops current and starts new track
- June 13, 2025. Fixed track switching race condition - completely reset audio timing when loading new tracks to prevent old track resumption
- June 13, 2025. Changed track switching behavior - new tracks load but don't auto-play, user must manually press PLAY button
- June 13, 2025. Removed .wav extension from track display names and replaced zoom controls with helpful DJ instructions above CDJs
- June 13, 2025. Implemented proper beatmatching for sync button - automatically adjusts tempo to match BPM between decks
- June 13, 2025. Added secure admin authentication system with content management capabilities for site administration
- June 13, 2025. Created complete database schema in Supabase with all tables: site_content, users, admin_sessions, tracks, playlists, playlist_tracks, dj_sessions
- June 13, 2025. Connected dynamic content system - admin-managed content now displays live on main Terminal OS website
- June 13, 2025. Resolved database connectivity issues and migrated all 25 authentic Need For Groove tracks from Supabase to local PostgreSQL database
- June 13, 2025. Successfully integrated complete music collection with CDJ interface - all tracks now accessible with proper BPM data for beatmatching
- June 13, 2025. Implemented complete visual editing system - users can click "Edit Page" button then click any website content to edit directly without coding knowledge
- June 13, 2025. Fixed database connection issues caused by malformed DATABASE_URL environment variable - reconstructed proper PostgreSQL connection string
- June 13, 2025. Created admin user "talentin4g" in local PostgreSQL database with proper password hashing for authentication system
- June 13, 2025. Migrated entire application to use Supabase exclusively - removed local PostgreSQL dependency for unified data management
- June 13, 2025. Removed all local storage files and dependencies - application now runs purely on Supabase with no local database connections
- June 13, 2025. Completed major architectural cleanup - removed 61 obsolete packages (Drizzle ORM, PostgreSQL drivers, session management) for simplified Supabase-only design
- June 13, 2025. Simplified schema.ts to pure TypeScript interfaces and Zod validation schemas without ORM dependencies
- June 13, 2025. Added burger menu navigation to admin login page with back button and responsive mobile navigation
- June 13, 2025. Migrated authentication system from custom users table to Supabase Auth for improved security and built-in password management
- June 13, 2025. Created admin user in Supabase Auth: admin@needforgroove.com with proper metadata flags for admin privileges
- June 13, 2025. Updated admin login and dashboard to use Supabase Auth sessions with localStorage-based session management
- June 13, 2025. Completed comprehensive content migration - migrated all 69 detailed content items (home, about, contact, sets, podcasts, bookings, releases, mixes) from static text to database-managed content
- June 13, 2025. All website sections now display live content from Supabase database - admin can edit any text, profile information, or content and see immediate updates on website

## User Preferences

Preferred communication style: Simple, everyday language.
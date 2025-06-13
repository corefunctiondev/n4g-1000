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
- **Database**: Supabase PostgreSQL with direct client connection
- **Storage**: Supabase Storage with "music" bucket for audio files
- **API Design**: RESTful endpoints connected to Supabase database

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

## User Preferences

Preferred communication style: Simple, everyday language.
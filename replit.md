# N4G-1000 Digital Turntable Interface

## Overview

This is a full-stack web application that replicates the functionality of professional DJ equipment (N4G-1000 style digital turntables) in a browser environment. The application provides dual-deck mixing capabilities with real-time audio processing, waveform visualization, and professional DJ controls.

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
- June 13, 2025. Moved track selectors to top of N4G-1000 interfaces for better UX
- June 13, 2025. Fixed audio loading timing issue - tracks now load and play successfully from Supabase storage
- June 13, 2025. Optimized track switching - selecting new track while playing auto-stops current and starts new track
- June 13, 2025. Fixed track switching race condition - completely reset audio timing when loading new tracks to prevent old track resumption
- June 13, 2025. Changed track switching behavior - new tracks load but don't auto-play, user must manually press PLAY button
- June 13, 2025. Removed .wav extension from track display names and replaced zoom controls with helpful DJ instructions above N4G-1000s
- June 13, 2025. Implemented proper beatmatching for sync button - automatically adjusts tempo to match BPM between decks
- June 13, 2025. Added secure admin authentication system with content management capabilities for site administration
- June 13, 2025. Created complete database schema in Supabase with all tables: site_content, users, admin_sessions, tracks, playlists, playlist_tracks, dj_sessions
- June 13, 2025. Connected dynamic content system - admin-managed content now displays live on main Terminal OS website
- June 13, 2025. Resolved database connectivity issues and migrated all 25 authentic Need For Groove tracks from Supabase to local PostgreSQL database
- June 13, 2025. Successfully integrated complete music collection with N4G-1000 interface - all tracks now accessible with proper BPM data for beatmatching
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
- June 13, 2025. Added missing Home section content items to database - all text including system status, member info, and notifications now fully admin-editable (14 total home content items)
- June 14, 2025. Implemented Wix-style live editing system - admin can click "Edit Mode" and then click directly on any website text to edit it inline with visual highlighting
- June 14, 2025. Added comprehensive audio feedback system - all clicks, hovers, and interactions now produce satisfying sound effects throughout the interface
- June 14, 2025. Created complete first-time boot experience - blank screen startup with BIOS sequence, ASCII logo, and choice between DJ mode or site exploration
- June 14, 2025. Implemented direct DJ launch pathway - choosing DJ mode runs code loading sequence and launches directly into N4G-1000 interface
- June 14, 2025. Added dynamic beat visualization system with gradient color pulses matching music tempo and real-time audio analysis for immersive background effects
- June 14, 2025. Replaced loop/slip/beat buttons with professional audio effects controls - reverb, delay, and echo knobs for enhanced DJ mixing capabilities
- June 14, 2025. Fixed audio effects system to properly connect reverb, delay, and echo to Web Audio API processing chain for real audio processing
- June 14, 2025. Reorganized N4G-1000 layout - moved all overflowing elements inside black screen boundaries and placed transport controls in gray deck area
- June 14, 2025. Enhanced mixer controls - made knobs bigger (32x32px) and sliders longer (64px height) for improved usability and touch interaction
- June 14, 2025. Expanded N4G-1000 gray area to properly contain tempo slider and play/stop buttons outside black screen but within deck frame
- June 14, 2025. Corrected N4G-1000 layout structure - separated black LCD screen (waveform/digital info only) from gray deck body (physical controls), moved tempo controls to mixer center below volume knobs
- June 14, 2025. Fixed N4G-1000 body color to proper gray and implemented fully functional tempo sliders with real-time audio playback rate adjustment, mouse drag interaction, and live percentage display
- June 14, 2025. Restored CUT FX button to gray N4G-1000 area next to STOP button for complete transport control set
- June 14, 2025. Updated N4G-1000 body color to authentic dark gray (bg-gray-800) matching professional hardware appearance
- June 14, 2025. Removed MASTER OUTPUT section with Monitoring/Main Out/Booth Out options for cleaner interface layout
- June 14, 2025. Replaced header text with Need For Groove logo, uploaded to Supabase storage for proper asset management
- June 14, 2025. Updated to blue "NEED FOR GROOVE" text logo with proper layout matching user design - "NEED" and "FOR" on top line, "GROOVE" centered below
- June 14, 2025. Created dedicated images bucket in Supabase storage with organized folders and replaced logo with user's actual SVG file (n4glogo.svg)
- June 14, 2025. Optimized logo display with large size (h-32) within constrained header container to prevent layout expansion
- June 14, 2025. Repositioned logo as large background watermark (h-96, 20% opacity) behind N4G-1000 interface with minimal header space for clean professional layout
- June 14, 2025. Positioned logo on left side of header area (600px height, 40% opacity) with absolute positioning to prevent header expansion while maintaining professional branding
- June 14, 2025. Fixed logo positioning in top left corner of page using fixed positioning (h-24) with highest z-index for consistent visibility
- June 14, 2025. Enlarged logo to h-40 (160px) and positioned closer to top edge (top-2) for prominent branding display
- June 14, 2025. Final logo positioning with negative top margin (-top-4) and larger size (h-48, 192px) for optimal visual integration with N4G-1000 interface
- June 14, 2025. Perfected logo display with -top-8 positioning and h-56 size (224px) for maximum brand impact while preserving interface functionality
- June 14, 2025. Completely rebuilt audio effects system with musical timing - delay uses 1/4 note, echo uses 3/8 note timing that syncs to track BPM and tempo changes for professional DJ effects
- June 14, 2025. Fixed logo positioning to absolute instead of fixed - logo now stays in place and doesn't move when scrolling, restored original h-56 size
- June 14, 2025. Added SYNC button to gray N4G-1000 transport control area alongside PLAY, STOP, and CUT FX buttons for consistent control layout on both decks
- June 14, 2025. Removed duplicate SYNC button from black LCD area, keeping only the one in gray transport controls for cleaner interface
- June 14, 2025. Removed duplicate CUT FX button from black LCD area, maintaining only transport controls in gray hardware section for authentic N4G-1000 layout
- June 14, 2025. Enhanced beat visualizer with vivid 10-color palette, dynamic color cycling, audio-responsive shifts, enhanced saturation/brightness filters, and multi-layer gradients for immersive club lighting experience
- June 14, 2025. Removed all pink colors from beat visualizer palette, replaced with additional vibrant blues, reds, and greens per user preference
- June 14, 2025. Transformed beat visualizer from gradient backgrounds to floating dust particle system with realistic movement, life cycles, audio responsiveness, and atmospheric glow effects
- June 14, 2025. Enhanced particle system to millions of futuristic dust particles with directional movement (left deck particles flow right, right deck particles flow left, center convergence effect)
- June 14, 2025. Replaced particle system with dynamic wave-based lighting - flexible SVG wave paths that curve and flow with the beat instead of straight lines
- June 14, 2025. Fixed glitchy wave rendering and improved display logic to show waves only on the side that's currently playing music
- June 14, 2025. Completely redesigned wave shapes - left deck uses lightning bolts, right deck uses spiral energy, center uses DNA helix patterns for connecting waves
- June 14, 2025. Made waves much thinner (2-6px stroke) and multiplied count to 12 waves per deck for dense, detailed lighting coverage on playing side only
- June 14, 2025. Rebuilt wave system with complex futuristic design - 16 layered waves with multiple frequency components, audio-reactive distortion, and glow effects for satisfying visual experience
- June 14, 2025. Simplified to minimal lighting system - clean gradient overlays with subtle effects, low opacity, and smooth transitions for professional ambiance
- June 14, 2025. Created gradient futuristic waves with precise beat synchronization - wave movement, scaling, and effects locked to exact BPM timing using requestAnimationFrame
- June 14, 2025. Enhanced waves with real-time audio-reactive sizing - wave amplitude, effects, and colors respond to live audio fluctuations with frequency-separated analysis and improved color palette
- June 14, 2025. Implemented beat drop detection with dynamic color changes - waves turn blue or black during intense musical moments, returning to white during normal playback
- June 14, 2025. Enhanced beat detection using real-time audio analysis - waves now bounce precisely on detected beats while continuously morphing shape slowly
- June 14, 2025. Added snake entrance animation - waves flow smoothly from sides when songs start, creating cinematic 6-second entrance effect with enhanced flexibility and controlled wave extension
- June 14, 2025. Implemented beat-only wave movement - removed all continuous animations, waves now move exclusively on detected song beats with enhanced responsiveness
- June 14, 2025. Updated all website content with authentic NEED FOR GROOVE information - replaced 55 placeholder content items with real business details including Kosovo origin, NY base, decade of experience, venues played, contact info, and upcoming album "TUTTO PASSA"
- June 14, 2025. Eliminated all mock data (ALEX RODRIGUEZ, JORDAN CHEN, fake contact info) throughout website - database now contains only 38 authentic NEED FOR GROOVE content items
- June 14, 2025. Fixed text flashing issue when navigating pages - implemented content preloading system with smooth opacity transitions to prevent jarring text replacements
- June 14, 2025. Confirmed Supabase integration working correctly - replaced final hardcoded mock data (alex@brooklyn.nyc, jordan@manhattan.nyc, Brooklyn Warehouse) with authentic NEED FOR GROOVE content from database
- June 14, 2025. Updated all AI-generated descriptions to sound more human and authentic - replaced formal corporate language with conversational, personal storytelling that feels like real DJs talking about their music journey
- June 14, 2025. Eliminated content repetition across all website pages - created unique descriptions and titles for each section, removed duplicate contact information scattered throughout different pages
- June 14, 2025. Removed all remaining mock content from website pages - replaced fake release titles, mix names, booking services, and corporate descriptions with authentic NEED FOR GROOVE information throughout all sections
- June 14, 2025. Implemented circular wave visualization for dual deck mixing - when both CDJs play simultaneously, linear snake waves transform into dynamic circular pattern with 12 concentric rings, beat-synchronized pulsing, and real-time audio analysis from both decks
- June 14, 2025. Added automatic beat matching and kick alignment system - when both tracks play simultaneously, Deck B instantly syncs to Deck A's tempo with real-time BPM matching, micro-timing adjustments for kick alignment, and continuous beat monitoring for seamless DJ mixing
- June 14, 2025. Updated all CDJ-3000 references to N4G-1000 and DJM references to N4G-800 throughout application for authentic NEED FOR GROOVE branding
- June 14, 2025. Replaced all Pioneer DJ branding with Groover - updated CSS classes, component styling, jog wheel text, and hardware references throughout interface
- June 14, 2025. Configured application for free Vercel deployment with serverless functions and custom domain support for needforgroove.com
- June 14, 2025. Completed comprehensive N4G rebranding - systematically replaced all CDJ-3000 references with N4G-1000 and DJM references with N4G-800 throughout entire application
- June 14, 2025. Updated all CSS classes from pioneer- to n4g- styling, boot sequence hardware emulation text, mixer component branding, and interface layout comments
- June 14, 2025. Added complete N4G CSS variable system with authentic hardware colors and component styling for buttons, knobs, faders, screens, and deck bodies
- June 14, 2025. Simplified website page structure - removed About page completely, podcasts and mixes pages show only "Coming Soon", bookings page shows only email and social media
- June 14, 2025. Cleaned contact page to display only essential contact information without duplication, organized home page to prominently feature next gig information
- June 14, 2025. Fixed crossfader branding from DJM-750MK2 to N4G-800, updated all CSS classes from pioneer- to n4g-, added center line indicator to crossfader
- June 14, 2025. Completely cleared website pages of all mock data - bookings shows only email and social links, sets/podcasts/mixes show only "Coming Soon"
- June 14, 2025. Removed all remaining database content from pages - completely deleted and recreated minimal content for clean page display
- June 14, 2025. Fixed Supabase integration - now properly using service role key for direct database operations instead of local API calls
- June 14, 2025. Completely restructured page components to display only authentic Supabase content without any fallback text or mock data

## User Preferences

Preferred communication style: Simple, everyday language.
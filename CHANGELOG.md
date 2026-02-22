# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-02-22

### Added
- Finger number labels on pad visualizer during pattern playback (toggle via header switch)
- Right hand shows `1`, `2`, `3`, `4`; left hand shows `(1)`, `(2)`, `(3)`, `(4)`
- Long bar pads (snare, kick) display L/R finger numbers at separate positions

### Fixed
- Pad highlight and finger label timing now correctly adapts to all subdivisions (triplets, 32nd notes, etc.)

## [1.0.4] - 2026-01-14

### Added
- Triplet subdivision support: 1/4T, 1/8T, 1/16T, 1/32T for swing and shuffle patterns
- Quarter note (1/4) subdivision for slower patterns

### Fixed
- Pattern URL compatibility with older shared links (v1.0.2)

## [1.0.3] - 2026-01-13

### Added
- Playhead always visible: red when stopped, green when playing, yellow when paused
- Drag box overlay during block selection with theme-aware colors
- Step header click/drag to move playhead position (disabled during playback)

### Changed
- Pad click uses mousedown for immediate audio response
- Block selection highlight: cyan glow for dark mode, violet glow for light mode
- Copy/paste improved: only copies active notes, paste adds without overwriting
- Stop button always enabled to reset playhead to beginning
- Click on grid clears block selection (no toggle)

## [1.0.2] - 2026-01-11

### Added
- Light/Dark theme support (FGDP-30/FGDP-50 naming)
- Theme toggle button with sun/moon icon and tooltip
- Toast notification system for user feedback
- Alternating beat background colors for improved grid readability

### Changed
- Header layout: left (title + GitHub) / center (playback) / right (share + theme)
- Playback buttons: neutral colors by default, colored only when active state
- Removed opacity/cursor styling from disabled buttons for cleaner UI
- Themed scrollbars for both Webkit and Firefox browsers
- Toast messages now have theme-aware styles

### Fixed
- Track labels now display correctly when loading patterns from URL

## [1.0.1] - 2026-01-11

### Added
- Real-time playhead visualization with smooth linear movement
- Distinct play, pause, and stop buttons for better playback control
- GitHub link in header for easy access to repository
- Audio status toast notifications for better user feedback

### Changed
- Improved playback controls UX with separate play/pause/stop states
- Enhanced mobile and tablet layout for better usability on smaller screens
- Improved responsive design: sequencer controls stack vertically on mobile, horizontally on desktop
- Refactored audio initialization and playback logic for improved performance
- Improved pause/resume behavior: playhead stops and resumes at exact position without snapping

## [1.0.0] - 2026-01-10

### Added
- Initial release of FGDP Trainer
- 18-track step sequencer matching FGDP-30 and FGDP-50 pad layout
- Dynamic grid with 1-4 bars and 1/8, 1/16, 1/32 note subdivisions
- Finger designation system with L/R hand and finger number indicators
- Real-time audio playback with Tone.js synthesis
- Pattern sharing via compact URL encoding
- Zoom control (Alt/Option + scroll)
- Keyboard shortcuts (Space for play/stop, arrows for BPM)
- GitHub Pages deployment workflow

[1.0.5]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/97wobbler/yamaha-fgdp-simulator/releases/tag/v1.0.0

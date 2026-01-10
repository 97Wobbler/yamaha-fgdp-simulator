# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.1]: https://github.com/97wobbler/yamaha-fgdp-simulator/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/97wobbler/yamaha-fgdp-simulator/releases/tag/v1.0.0

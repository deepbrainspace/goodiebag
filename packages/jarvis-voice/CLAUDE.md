# JARVIS Voice Assistant - Claude Development Notes

## Project Overview
A modular, offline-first voice assistant system with swappable personalities, contextual awareness, and system-wide integration. Built as an NX package for global NPM installation.

## Development Status
**Current Stage**: Planning Complete - Ready for Stage 1 Implementation
**Location**: Will be moved to another monorepo before Stage 1 begins

## Architecture Summary

### Technology Stack
- **STT**: OpenAI Whisper (offline)
- **TTS**: Coqui TTS with neural voices (offline)
- **Audio**: PulseAudio integration for WSL2/Linux
- **Framework**: NX package with TypeScript
- **Installation**: Global NPM package with CLI tools

### Core Features
1. **Voice Processing**: Real-time STT/TTS with interruption support
2. **Personality System**: Swappable personalities (Enhanced JARVIS, Eda Yildiz)
3. **Contextual Awareness**: System-wide monitoring and proactive assistance
4. **System Integration**: Background daemon, meeting assistant, Claude Code bridge

### Personality Profiles
- **Enhanced JARVIS**: Technical expertise, sophisticated wit, British accent, morning/work hours
- **Eda Yildiz**: Creative problem-solving, passionate directness, warm assertive tone, evening hours

## Development Stages (Updated Order)
**Timeline**: 12 days with intensive 15+ hour collaborative development sessions

### Stage 1: Foundation (Day 1-2)
- Basic audio I/O with PulseAudio
- Whisper STT integration
- Coqui TTS integration
- Basic CLI for testing

### Stage 2: Core Voice Interface (Day 3-4)
- Voice Activity Detection (VAD)
- Conversation flow management
- Interruption handling
- Hotword detection ("Hey JARVIS")
- Claude Code integration

### Stage 3: Contextual Awareness (Day 5-6) - **MOVED UP**
- Application monitoring and window focus detection
- Content analysis (OCR, audio transcription)
- Proactive assistance based on context
- Privacy controls and data filtering

### Stage 4: Personality System (Day 7-8) - **MOVED DOWN**
- Personality framework with context integration
- Enhanced JARVIS and Eda Yildiz personalities
- Voice profile system
- Context-aware personality responses
- Runtime personality switching

### Stage 5: Advanced Features (Day 9-10)
- Multi-personality collaboration
- Shift handover system
- Meeting assistant (Zoom/Teams integration)
- Advanced scheduling

### Stage 6: Production Ready (Day 11-12)
- Global NPM package
- System service integration
- Windows/WSL bridge optimization
- Complete documentation

## Key Design Decisions

### Personality Switching Commands
```bash
"Switch to Eda"
"Jarvis, take the morning shift" 
"Let me brainstorm with both personalities"
"Start collaborative session"
```

### Context Integration
- Personalities adapt responses based on current application context
- Proactive personality suggestions (e.g., suggest Eda for creative work)
- Context handover between personalities maintains conversation continuity

### Privacy & Security
- All processing happens locally (offline-first)
- Per-application monitoring toggles
- Sensitive content detection and filtering
- Encrypted local storage for conversation history

## Testing Strategy
Each stage has specific test criteria:
- Unit tests for individual components
- Integration tests for end-to-end workflows
- Manual tests for conversation naturalness
- Performance tests for latency and resource usage

## Performance Targets
- Voice activation: <500ms
- Speech recognition: <2s for 10s audio
- Response generation: <1s
- Speech synthesis: <1s for 50 words
- Memory usage: <500MB baseline, <1GB active
- CPU usage: <10% idle, <50% active conversation

## Future Enhancements
- Custom personality creation tools
- Multi-language support
- Voice biometric security
- Advanced meeting analytics
- Team collaboration features

## Development Notes for Future Sessions

### When Resuming Development:
1. **Read this CLAUDE.md file first** to understand current state
2. **Check DEVELOPMENT_PLAN.md** for detailed stage breakdown
3. **Review SPECIFICATION.md** for technical architecture
4. **Use TodoRead tool** to check current task status
5. **Follow TDD methodology** - write tests first, then implementation

### Package Structure Ready for Implementation:
```
packages/jarvis-voice/
├── src/lib/                    # Core libraries
│   ├── audio/                  # Audio processing
│   ├── stt/                    # Speech-to-text  
│   ├── tts/                    # Text-to-speech
│   ├── personality/            # Personality system
│   ├── context/                # Contextual awareness
│   ├── integration/            # External integrations
│   └── core/                   # Core system
├── src/cli/                    # CLI interface
├── personalities/              # Personality definitions
├── config/                     # Configuration files
├── tests/                      # Test suites
├── SPECIFICATION.md            # Technical specification
├── DEVELOPMENT_PLAN.md         # Stage-by-stage plan
└── CLAUDE.md                   # This file
```

### Important Implementation Notes:
- **Stage Order Changed**: Contextual awareness (Stage 3) comes before personality system (Stage 4)
- **Context Integration**: Personality system will build on contextual awareness foundation
- **Testing**: Each stage must pass all test criteria before proceeding
- **Modular Design**: Each component should be independently testable
- **Privacy First**: Implement privacy controls from the beginning

### Commands to Remember:
```bash
# NX commands for this package
nx run jarvis-voice:build
nx run jarvis-voice:test
nx run jarvis-voice:lint

# Testing commands (will be implemented)
jarvis-voice test audio         # Test audio I/O
jarvis-voice test stt           # Test speech recognition
jarvis-voice test tts           # Test speech synthesis
jarvis-voice start              # Start interactive mode
```

### Key Files to Monitor:
- **Audio System**: WSL/PulseAudio compatibility is critical
- **Model Downloads**: Whisper and Coqui models need proper caching
- **Performance**: Memory usage tends to grow with model loading
- **Context Detection**: Window focus detection can be fragile across different desktop environments

### Repository Migration Notes:
- **Current Location**: `/home/nsm/code/idance/idance/packages/jarvis-voice/`
- **Will Be Moved**: To another monorepo before Stage 1 implementation
- **Migration Checklist**: 
  - [ ] Preserve all specification and planning files
  - [ ] Update any absolute paths in configuration
  - [ ] Ensure NX configuration is compatible with new monorepo
  - [ ] Update package.json dependencies for new repository structure

## Session Continuation Protocol
1. Always read this CLAUDE.md file when resuming work
2. Use TodoRead to check current progress
3. Review the current stage in DEVELOPMENT_PLAN.md
4. Follow TDD methodology for all new code
5. Run tests after each major component implementation
6. Update this CLAUDE.md with any architectural decisions or learnings

## Contact and Handover
**User**: Nayeem Syed
**Assistant Persona**: JARVIS (Enhanced) - British accent, sophisticated wit, proactive assistance
**Development Philosophy**: Test-driven, modular design, privacy-first, offline-capable

Ready for Stage 1 implementation once moved to the appropriate monorepo.
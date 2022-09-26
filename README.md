# ZhinM Tron

FiveM minigame that resembles the GTAO's Deadline gamemode.

## TODO

- [x] Fully custom streamed maps
- [ ] Start/setup
- [ ] End/cleanup
- [ ] Smarter collision ignoring/min speed
- [ ] Smarter position recording (moving slow = trail disappears slower too)
- [ ] ? Weather/time control?
- [ ] ? Disable vMenu?
- [ ] ? Create a minigame framework?

### Server

- [ ] Handle trail and collisions on the server
- [ ] Routing bucket management
- [ ] Multiple concurrent games

### UI

- [ ] Start UI (configuration, lobby, etc)
- [ ] Post-start UI (color selection etc.)
- [ ] In-game HUD
- [ ] End UI (exit, replay, etc.)

### Gameplay

- [x] Trail behind vehicle
- [x] Collision detection between trail and vehicle
- [ ] Power-ups
- [ ] Team mechanics
  - [ ] Point counting
- [ ] Player spawning
  - [x] Drive forward on spawn
  - [ ] Grace period on spawn
- [ ] Respawning
  - [ ] Bypass gamemode respawns
- [ ] Off-map destruction

### Map manager

- [x] Map loading
- [ ] Custom format
  - [ ] Converter from fxworld
  - [ ] Spawns
  - [ ] Texture variation

## Acknowledgement

This resource includes parts of code inspired by [TomGrobbe/Tron](https://github.com/TomGrobbe/Tron).

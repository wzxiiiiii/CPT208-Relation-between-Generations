# TimeLens Video Demo Guide

This guide is for the final 2-minute demonstration video.

## 1. Run the prototype

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## 2. Video demo mode

Use the built-in recording mode:

```text
http://localhost:5173/?demo=video
```

Useful options:

- `?demo=video&scene=cover`
- `?demo=video&scene=hook`
- `?demo=video&scene=concept`
- `?demo=video&scene=scan`
- `?demo=video&scene=reveal`
- `?demo=video&scene=dialogue`
- `?demo=video&scene=map`
- `?demo=video&scene=create`
- `?demo=video&scene=impact`
- `?demo=video&scene=credits`

Optional flags:

- `&ui=0`: hide the director controls
- `&captions=0`: hide the caption overlay
- `&autoplay=1`: auto-step through scenes

Keyboard shortcuts in video mode:

- `Right Arrow`: next scene
- `Left Arrow`: previous scene
- `Space`: toggle autoplay
- `C`: show or hide captions

## 3. Recommended 2-minute structure

### 0:00 - 0:08 Cover

URL:

```text
/?demo=video&scene=cover
```

What to show:

- project title
- group name
- theme keywords

### 0:08 - 0:20 The Hook

URL:

```text
/?demo=video&scene=hook
```

What to say:

- family stories often stay hidden inside meaningful objects
- younger users do not naturally enter archive-style tools

### 0:20 - 0:30 Concept

URL:

```text
/?demo=video&scene=concept
```

What to say:

- TimeLens connects object, reveal, and reply
- the design is mobile XR plus an NFC tangible trigger

### 0:30 - 0:45 Walkthrough 1: NFC Tap

URL:

```text
/?demo=video&scene=scan
```

Action:

- click `Trigger NFC tap` in the director panel
- or click the central tap circle manually

### 0:45 - 0:58 Walkthrough 2: Reveal

URL:

```text
/?demo=video&scene=reveal
```

What to show:

- 3D memory object
- story card
- visual delight of the reveal

### 0:58 - 1:15 Walkthrough 3: Dialogue

URL:

```text
/?demo=video&scene=dialogue
```

Action:

- click `Send demo reply`
- or use one of the quick reply chips

### 1:15 - 1:27 Walkthrough 4: Map

URL:

```text
/?demo=video&scene=map
```

What to say:

- memories become a revisitable family collection
- the interaction is not only one-time unlock

### 1:27 - 1:40 Walkthrough 5: Create

URL:

```text
/?demo=video&scene=create
```

Action:

- click `Save sample story`

### 1:40 - 1:52 Impact

URL:

```text
/?demo=video&scene=impact
```

What to say:

- the system starts from real family objects
- it gives children a playful entry point
- it supports reciprocal memory exchange

### 1:52 - 2:00 Closing

URL:

```text
/?demo=video&scene=credits
```

What to include in final edit:

- final student IDs
- acknowledgements
- AI disclosure if required by the module brief

## 4. What is already completed for recording

- fixed demo routes for all core states
- recording-oriented scene captions
- director controls for stepping through scenes
- one-click NFC tap trigger in video mode
- one-click demo reply in the dialogue scene
- prefilled story in the create scene
- real Web NFC tools on the home page
- NFC tag writing support on supported devices
- map actions that route locked items back to the tap flow

## 5. What still needs your real project evidence

These cannot be honestly auto-generated:

- real usability-testing quote or clip
- real participant reactions
- final student IDs
- live deployment URL if you want to show it in the video

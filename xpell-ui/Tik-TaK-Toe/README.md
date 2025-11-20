# Xpell.ai Example: Tic-Tac-Toe Game

This project is a simple Tic-Tac-Toe game built using the [Xpell.ai UI framework](https://xpell.ai/). It demonstrates how to use Xpell's real-time data cache, UI module, and animation features to create an interactive web game.

## Features
- Interactive 3x3 Tic-Tac-Toe board
- Real-time turn tracking and status updates
- Animated title using [animate.css](https://animate.style/)
- Dynamic winner detection and color animation
- Modular code structure with Xpell UI components

## Project Structure
```
Tik-TaK-Toe/
├── index.html         # Main HTML file
├── package.json       # Project dependencies
├── public/
│   └── style.css      # Custom styles
├── src/
│   └── index.ts       # Main game logic (Xpell UI)
└── README.md          # Project documentation
```

## How It Works
- The game board is rendered using Xpell UI views and buttons.
- Player turns are managed with Xpell's real-time data cache (`XData`).
- Clicking a cell updates the board, switches turns, and checks for a winner.
- The status label updates automatically to show whose turn it is or who won.
- Winner announcement includes animated color effects.

## Getting Started
1. **Install dependencies** (if not already):
   ```bash
   npm install
   ```
2. **Run the project** (using a local server or build tool):
   ```bash
   # Example using live-server
   npm run dev
   ```
   Or open `index.html` directly in your browser (ensure module imports are resolved).

## Customization
- Modify `src/index.ts` to change game logic or UI.
- Update `public/style.css` for custom styles.
- Use Xpell modules to add more features or animations.

## Learn More
- [Xpell.ai Documentation](https://xpell.ai)
- [animate.css Documentation](https://animate.style/)

## License
This example is provided for educational purposes. See [LICENSE](../LICENSE) for details.

Copyright (c) 2025 Aime Technologies
md
# TutleType

A minimalistic typing speed test application combining Monkeytype and TypeRacer features. Built with vanilla JavaScript for smooth performance. Includes time and word-based tests, real-time WPM tracking, 6 themes, and upcoming multiplayer mode for competitive racing.

## Key Features & Benefits

*   **Time-Based & Word-Based Tests:** Choose between testing yourself based on time (15s, 30s, 60s, 120s) or word count (10, 25, 50, 100 words).
*   **Real-Time WPM & Accuracy Tracking:** Get instant feedback on your typing speed and accuracy as you type.
*   **Multiple Themes:** Customize the look and feel with 6 available themes.
*   **Clean & Distraction-Free Interface:** Focus solely on improving your typing skills without unnecessary distractions.
*   **Vanilla JavaScript:** Built with vanilla JavaScript for smooth and efficient performance.
*   **Upcoming Multiplayer Mode:** Get ready for competitive typing races against other players!

## Prerequisites & Dependencies

*   Web browser (Chrome, Firefox, Safari, etc.)
*   A text editor (VSCode, Sublime Text, etc.) - *Optional for development purposes*

## Installation & Setup Instructions

Since TutleType is built with vanilla JavaScript, there's no complex installation process. Simply:

1.  Clone the repository to your local machine:
    ```bash
    git clone https://github.com/ParthG2209/TutleType.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd TutleType
    ```
3.  Open the `index.html` file in your web browser.

## Usage Examples & API Documentation

Currently, TutleType doesn't have a dedicated API. To use the application:

1.  Open `index.html` in your web browser.
2.  Click on the typing area to focus.
3.  Start typing the displayed text.
4.  Your WPM and accuracy will be tracked in real-time.
5.  Use the reset button to start a new test.

## Configuration Options

TutleType offers several configuration options directly within the application:

*   **Test Mode:** Switch between "Time" and "Words" modes by clicking the respective labels.
*   **Test Length:** Select the desired test length by clicking on the available options (e.g., 15s, 30s, 10 words, 25 words).
*   **Themes:** Change the visual appearance by selecting a different theme from the theme selection menu (Not implemented at the moment).

## Project Structure

```
TutleType/
├── README.md
├── index.html
└── public/
    └── css/
        ├── login.css
        ├── multiplayer.css
        └── styles.css
    └── js/
        ├── app.js
        ├── login.js
        ├── multiplayer-engine.js
        ├── multiplayer-race.js
        ├── results.js
        ├── typing-engine.js
        └── words.js
├── login.html
├── multiplayer.html
├── results.html

```

*   `index.html`: The main HTML file that loads the application.
*   `public/css/`: Contains the CSS stylesheets for styling the application.
    *   `styles.css`: Main styling for typing test
    *   `login.css`: Styling for the login/authentication features
    *   `multiplayer.css`: Styling specific to multiplayer functionality
*   `public/js/`: Contains the JavaScript files that handle the application's logic.
    *   `app.js`: Main application logic.
    *   `typing-engine.js`: Manages the typing test engine.
    *   `words.js`: Provides the words used in the typing tests.
    *   `login.js`: Handles user login/authentication
    *   `multiplayer-engine.js`: The backend engine for the multiplayer functionality
    *   `multiplayer-race.js`: Handles the multiplayer races
    *   `results.js`: Logic for displaying the results of the typing test.
*   `login.html`: HTML file for login page
*   `multiplayer.html`: HTML file for multiplayer game
*   `results.html`: HTML file for results display

## Contributing Guidelines

Contributions are welcome! If you'd like to contribute to TutleType, please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  Make your changes and commit them with descriptive commit messages.
4.  Push your changes to your forked repository.
5.  Submit a pull request to the main repository.

Please ensure your code adheres to the existing code style and includes appropriate comments.

## License Information

This project has no specified license.

## Acknowledgments

*   Inspired by Monkeytype and TypeRacer

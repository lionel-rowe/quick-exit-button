# Quick Exit Button

A simple, self-contained Web Component to add a "Quick Exit" button to any website, maximizing safety for users in sensitive situations (e.g., domestic abuse support sites).

Following the recommendations from [*Click Here to Exit: An Evaluation of Quick Exit Buttons* (Turk & Hutchings, 2023)](https://www.cl.cam.ac.uk/~kst36/documents/click-here-to-exit.pdf).

## Usage via CDN

Add the script to your HTML `<head>` or `<body>`.

```html
<script src="https://cdn.example.com/quick-exit-button.mjs" defer></script>
```

Then place the component anywhere in your `<body>`.

```html
<!-- Default behavior: Exits to Google -->
<quick-exit-button></quick-exit-button>

<!-- Custom destination: Exits to BBC Weather -->
<quick-exit-button url="https://www.bbc.com/weather"></quick-exit-button>

<!-- Custom label -->
<quick-exit-button label="Leave Site Immediately"></quick-exit-button>
```

## Features

-   **Instant Navigation**: Uses `window.location.replace()` to prevent the "Back" button from returning to your site.
-   **Keyboard Shortcut**: Pressing `Esc` immediately triggers the exit.
-   **Always Visible**: Fixed position stays on screen while scrolling.
-   **High Visibility**: Designed with high contrast and high z-index (partially immune to cookie banners).
-   **Shadow DOM**: Styles are encapsulated and won't leak into or be broken by your site's CSS.
-   **Zero Dependencies**: Just drop it in.

## Configuration

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `url` | The URL to navigate to upon exit. | `https://www.google.com` |
| `label` | The text on the button. | `Quick Exit (Esc)` |
| `theme` | Optional color theme (`red`, `orange`, `blue`). | `red` |

## Development

1.  Clone the repo.
2.  Open `index.html` in a browser to test.
3.  Modify `quick-exit-button.js` as needed.

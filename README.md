# Quick Exit Button

A simple, self-contained Web Component to add a "Quick Exit" button to any website, maximizing safety for users in sensitive situations (e.g., domestic abuse support sites).

Following the recommendations from [*Click Here to Exit: An Evaluation of Quick Exit Buttons* (Turk & Hutchings, 2023)](https://www.cl.cam.ac.uk/~kst36/documents/click-here-to-exit.pdf), as well as general best practices for usability, security, and accessibility.

## Requirements

- Easy to locate and use in emergencies.
- Highly visible on all backgrounds, devices, and screen sizes with default styles.
- Includes keyboard shortcut (<kbd>Esc</kbd> key) for quick access.
- Immediately clears screen and blanks title and favicon.
- Navigates current tab away from the site.
- Prevents "Back" button from returning to the sensitive site.
- Opens a new, history-less tab in case of multiple history entries containing the sensitive site.
- Features a help tooltip explaining the button's limitations, with a link to further information on online safety.
- Default destination URLs are neutral, high-traffic sites (e.g., Google), but are configurable by the host site. For example, in countries that block Google, the default should be set to a local search engine or news site instead. As far as possible, locale-independent sites should be used as it's possible the sensitive site is in a different language from the user's native language that they typically use to browse the web.
- Default text is clear and unambiguous, but is configurable, e.g. for other languages or to add context-specific safety instructions.

## Usage via CDN

Add the script to your HTML `<head>` or `<body>`.

```html
<script src="https://cdn.example.com/quick-exit-button.js"></script>
```

Then place the component anywhere in your `<body>`.

```html
<!-- Default behavior: Exits MSN (current tab) and Google (new tab) -->
<quick-exit-button></quick-exit-button>

<!-- Custom destination: Exits to BBC Weather -->
<quick-exit-button primary-url="https://www.bbc.com/weather"></quick-exit-button>

<!-- Custom label and secondary URL -->
<quick-exit-button label="Leave Site Immediately" secondary-url="https://weather.com"></quick-exit-button>
```

## Features

-   **Instant Navigation**: Uses `window.location.replace()` to prevent the "Back" button from returning to your site.
-   **Keyboard Shortcut**: Pressing `Esc` immediately triggers the exit.
-   **Always Visible**: Fixed position (top-right) stays on screen while scrolling.
-   **High Visibility**: Designed with high contrast and high z-index (partially immune to cookie banners).
-   **Shadow DOM**: Styles are encapsulated and won't leak into or be broken by your site's CSS.
-   **Zero Dependencies**: Just drop it in.

## TODO Features

-   **Graceful Degradation**: If JavaScript is disabled, a simple link should still be available.
-   **Accessibility**: Ensure the button is accessible via keyboard and screen readers.
-   **Mobile Optimization**: Adjust styles for smaller screens and touch interactions. E.g. maybe BOTTOM right on mobile for easier thumb access?


## Configuration

Attribute | Description | Default
-|-|-
`primary-url` | The URL to open in a new, history-less tab. | `https://www.google.com/`
`secondary-url` | The URL the current tab navigates to (obscuring history). | `https://www.msn.com/`
`label` | The main text on the button. | `Quick Exit`
`shortcut-description` | Small text description of the keyboard shortcut. | `Or press "Escape" on your keyboard.`
`safety-text` | Preceding text for the safety link. | `The button above will take you to a safe page...`
`safety-link-text` | Text for the safety link. | `Learn how to hide your internet history.`
`safety-link-url` | URL for the safety link. | `https://womensaid.org.uk/...`

## Custom Styling

Simply add a `<style>` element with the `slot="custom-styles"` attribute inside the component.

```html
<quick-exit-button>
	<style slot="custom-styles">
		.exit-button {
			background-color: orange;
		}
	</style>
</quick-exit-button>
```

## Development

1.  Clone the repo.
2.  Open `demo/index.html` in a browser to test.
3.  Modify `src/quick-exit-button.mjs` as needed.

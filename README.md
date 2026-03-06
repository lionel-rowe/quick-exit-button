# Quick Exit Button

A simple, self-contained Web Component to add a "Quick Exit" button to any website, maximizing safety for users in sensitive situations (e.g., domestic abuse support sites).

Following the recommendations from [_Click Here to Exit: An Evaluation of Quick Exit Buttons_ (Turk & Hutchings, 2023)](https://www.cl.cam.ac.uk/~kst36/documents/click-here-to-exit.pdf), as well as general best practices for usability, security, and accessibility.

## Features

- Easy to locate and use in emergencies.
- Highly visible on all backgrounds, devices, and screen sizes with default styles.
- Fixed position stays on screen while scrolling, ensuring the button is always visible.
- Includes keyboard shortcut (<kbd>Esc</kbd> key) for quick access.
- Immediately clears screen and blanks title and favicon.
- Navigates current tab away from the site.
- Prevents "Back" button from returning to the sensitive site.
- Opens a new, history-less tab in case of multiple history entries containing the sensitive site.
- Features a help tooltip explaining the button's limitations, with a link to further information on online safety.
- Destination URLs are neutral, high-traffic, reasonably fast-loading sites (e.g., Google), but are configurable by the host site. For example, in countries that block Google, the default should be set to a local search engine or news site instead. As far as possible, locale-independent sites should be used as it's possible the sensitive site is in a different language from the user's native language that they typically use to browse the web.
- Default text is clear and unambiguous, but is configurable, e.g. for other languages or to add context-specific safety instructions.
- Easy to add to any site, with zero dependencies, sensible defaults, styles that won't be broken by the host site's CSS, and minimal technical knowledge required.
- Styles are optimized for smaller screens and touch interactions. On mobile, the button is moved to the bottom of the screen for easy thumb access, and the keyboard shortcut description is hidden as it's not relevant without a physical keyboard.

## Tradeoffs

- Color
  - Default yellow color - easily noticeable and visible
  - Red would be even more noticeable, but also more likely to immediately draw the eye of an adversary glancing at the screen from a distance. Choosing yellow also avoids any issues with red-green color blindness.
- Shortcut key
  - <kbd>Esc</kbd> (easy to find without looking, and already associated with "exit" actions in many contexts, commonly used in existing implementations) vs other?
  - Should <kbd>Esc</kbd> cause exit in all contexts, or only if no other action is triggered by it? E.g. if a text box is focused, should <kbd>Esc</kbd> still trigger exit, or should it only unfocus the text box, with only the second press triggering exit? The former is faster and more likely to be effective in an emergency, but the latter is less likely to cause accidental exits while using the site.
- Tab navigation/opening behavior
  - Is it better to open a new tab in addition to navigating the old one? This means the top tab is guaranteed to have fully clean history, at the cost of possibly looking more suspicious if both tabs are visibly loading at the same time (e.g. due to spinner in tab UI).

## Limitations

- Doesn't clear all evidence of the sensitive site (e.g. browser history), because browsers do not allow control over this. Mitigation: Inform users of this limitation and link to information on how to clear their history.
- Doesn't fully clear back-button history in the original tab. This is impossible to do in principle, because browsers do not allow tabs to close themselves from JavaScript, and the best we can do is `window.location.replace()`, which overwrites the current history entry but doesn't remove previous entries. Mitigation: Open a new, history-less tab in addition to navigating the current tab, which will show up on top.

## Usage

Add the script to your HTML `<head>` or `<body>`.

```html
<script src="path/to/quick-exit-button.js"></script>
```

By default, including the script adds a button to your site with default options. If you want to customize the button, you can explicitly include a `<quick-exit-button>` element in your site's HTML, which will override the default one. See the [Configuration](#configuration) and [Custom Styling](#custom-styling) sections below for details on the available options and how to customize the styles.

## TODO

- Add e2e tests with Puppeteer.
- Maybe add invisible hit box (`z-index: -2147483648` to avoid interfering with other elements) around the button to make it easier to click in a panic?
- Graceful Degradation: If JavaScript is disabled, a simple link should still be available (maybe? This could make config more difficult and may be a poor fit for sites with limited technical resources).
- Stretch goal: A bespoke, permalinked "how to hide your internet history" page designed for readability, usability, and prioritization high->low impact to avoid overwhelming users with information. This might also be interactive or personalized based on the user's browser and device as detected from UA string.
- Stretch goal: Plugins/widgets/etc for popular CMSs (e.g. WordPress) to make it even easier for non-technical users to add the button to their sites.
- Stretch goal: Translations of docs and i18n attributes into other languages.

## Configuration

Some minimal markdown formatting (`**strong**`, `_emphasis_`, and `<kbd>keyboard</kbd>`) are supported.

| Attribute              | Description                                                            | Default                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `foreground-url`       | The URL to open in a new, history-less tab.                            | `https://www.google.com/`                                                                                  |
| `background-url`       | The URL the current tab navigates to (obscuring last item of history). | `https://www.wikipedia.org/`                                                                               |
| `label`                | The main text on the button.                                           | `Quick Exit`                                                                                               |
| `shortcut-description` | Small text description of the keyboard shortcut.                       | `Or press <kbd>Esc</kbd> key.`                                                                             |
| `safety-text`          | Preceding text for the safety link.                                    | `The Quick Exit button will take you to a safe page. Note that it will **NOT** hide your internet history` |
| `safety-link-text`     | Text for the safety link.                                              | `Learn how to hide your internet history.`                                                                 |
| `safety-link-url`      | URL for the safety link.                                               | `https://womensaid.org.uk/information-support/what-is-domestic-abuse/cover-your-tracks-online/`            |
| `safety-information`   | Aria label for the safety information tooltip.                         | `Safety Information`                                                                                       |

## Custom Styling

Simply add a `<style>` element inside the component. CSS variables can be set on `--host`, or finer grained rules can also be used to target specific elements. For example:

```html
<quick-exit-button>
	<style>
		:host {
			--bg: firebrick;
			--fg: white;
			--help-icon-bg: white;
			--help-icon-fg: blue;
		}

		a:not(:hover) {
			text-decoration: none;
		}
	</style>
</quick-exit-button>
```

## Development

1. Clone the repo.
2. Install [Deno 2.x](https://deno.com/), which is used for building the script and serving the demo.
3. Run `deno task start` to watch for changes and serve the demo at `http://localhost:8000/`.

## Prior Art

- https://github.com/TodayDesign/panic-button
  - Includes keyboard shortcut. Overwrites current site _title_ before navigation, but can still be navigated back to via "Back" button.
- https://github.com/bboyle/quick-exit
  - Nice visual design, but only overwrites current history entry to current site's home page, which would often still be sensitive.
- https://womensaid.org.uk/
  - Good safety/navigation features, but a little small and easy to miss, and lacking help or further info link.
- https://www.thehotline.org/
  - Includes keyboard shortcut of pressing `Esc` twice. Nice info popup, but no link, plus the info popup is no longer visible lower down the page.
- https://wordpress.org/plugins/safety-exit/
  - Handy plug-and-play WordPress plugin. Good safety/navigation features, but no immediate screen blanking. Always pinned to bottom right or bottom left of screen, no option for top. Lacking help or further info link.

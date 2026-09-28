(function () {
  "use strict";
  window.LocalApp = window.LocalApp || {};
  const VERSION = "0.0.1.2";
  const CONFIG = {
  "identity": {
    "name": "T&A",
    "shortName": "T&A",
    "description": "Tristan's and Adam's Running Note for Bets, Golf, and Other Shenanigans",
    "version": VERSION,
    "buildId": VERSION,
    "repository": {
      "label": "App repository",
      "url": "https://github.com/themadat/t-a"
    },
    "support": [
      {
        "label": "Report a problem",
        "url": "https://github.com/themadat/t-a/issues/new"
      },
      {
        "label": "View documentation",
        "url": "https://github.com/themadat/t-a#readme"
      }
    ],
    "assets": {
      "favicon": "assets/icons/favicon.svg",
      "appIconLight": "assets/icons/app-icon-light.svg",
      "appIconDark": "assets/icons/app-icon-dark.svg",
      "manifestLight": "manifest.webmanifest",
      "manifestDark": "manifest-dark.webmanifest"
    }
  },
  "schemaVersion": 5,
  "storage": {
    "stateKey": "t-a.state.v4",
    "legacyKeys": [],
    "recoveryKey": "t-a.recovery.v1",
    "secretKey": "t-a.githubToken.v1",
    "sessionSecretKey": "t-a.githubToken.session.v1"
  },
  "cloudSync": {
    "owner": "themadat",
    "repo": "data-t-a",
    "branch": "main",
    "path": "data/t-a.json"
  },
  "features": {
    "documents": true,
    "cloudSync": true,
    "roadmap": true,
    "developerTools": true,
    "hints": true
  },
  "controls": {
    "shortcutHintModifier": "ShiftControlOption",
    "autosaveDelayMs": 180,
    "syncCheckIntervalMs": 30000,
    "hintsEnabledByDefault": false,
    "whatsNewAutoDismissMs": 20000,
    "maxImportBytes": 5242880,
    "maxTextLength": 20000,
    "maxDocumentHtmlLength": 250000
  },
  "themeDefaults": {
    "accent": "#315f73",
    "accent2": "#b86b4b",
    "success": "#4f745f",
    "warning": "#9b6a24",
    "danger": "#a74747"
  },
  "releases": [
    {
      "version": VERSION,
      "date": "2026-09-27T20:00:00.000Z",
      "title": "Money and Golf",
      "summary": "A shared running ledger and golf history for Adam and Tristan.",
      "features": ["Money balances and repayments", "Golf rounds with linked winnings", "Reviewed note import", "Concurrent and offline shared editing"],
      "improvements": ["Desktop tables and mobile cards", "New entries appear at the top", "Automatic Sync after initial setup"],
      "fixes": [],
      "knownIssues": []
    },
    {
      "version": "0.0.1.1",
      "date": "2026-09-27T12:00:00.000Z",
      "title": "Welcome to T&A",
      "summary": "A fresh shared starting point for bets, golf, and other shenanigans.",
      "features": [
        "Plain-text Notes",
        "Local backups and recovery",
        "Optional GitHub Sync"
      ],
      "improvements": [],
      "fixes": [],
      "knownIssues": []
    }
  ],
  "roadmap": [],
  "help": [
    {
      "id": "start",
      "title": "Getting started",
      "section": "Basics",
      "keywords": "start notes search settings",
      "html": "<p>Choose your name, then add a Money entry or Golf round. New additions appear at the top, even when backdated. Golf winnings create a linked Money entry. Record repayment reduces the amount owed. Search finds Money, Golf, Notes, Help, releases, and Roadmap entries. Changes save on this device automatically. Open Settings to customize appearance, manage backups, or connect GitHub Sync.</p>"
    },
    {
      "id": "notes",
      "title": "Working with Notes",
      "section": "Features",
      "keywords": "notes text edit modal autosave",
      "html": "<p>Open Notes from the top bar or press <kbd>N</kbd>. The single plain-text editor saves locally and is included in backup and synchronization data.</p>"
    },
    {
      "id": "roadmap",
      "title": "Using Roadmap",
      "section": "Features",
      "keywords": "roadmap planned released wishlist priority target effort reset filters",
      "html": "<p>Search Roadmap, filter by state, priority, target, or effort, reset the controls in one step, and sort by priority, target release, effort, age, or title. The Roadmap starts empty and will grow as features are planned.</p>"
    },
    {
      "id": "backup",
      "title": "Backup and restore",
      "section": "Data",
      "keywords": "json export import backup restore recovery",
      "html": "<p>Export a JSON backup from Settings. Imports are parsed, migrated, sanitized, summarized, and confirmed before replacement. The current copy is saved as a recovery snapshot first.</p>"
    },
    {
      "id": "sync",
      "title": "GitHub synchronization",
      "section": "Data",
      "keywords": "github cloud sync token conflict merge",
      "html": "<p>GitHub sync is optional. The app configuration fixes the repository, branch, and JSON file path; enter a fine-grained token with Contents access in Settings → Data Sync. Expand Sync payload (JSON) there to inspect the current local content included in uploads. Money, Golf, and Notes sync; appearance and settings stay on this device. First use Sync Now to combine your content with the shared file. Then enable Auto Sync for background sharing while the app is open. Separate edits merge; conflicting edits are reviewed individually. Each person should use a separate token limited to the private data repository.</p>"
    },
    {
      "id": "install",
      "title": "Install the application",
      "section": "Installation",
      "keywords": "install add home screen iphone ipad android mac windows pwa offline update refresh shortcut",
      "html": "<p>Use your browser’s Install app, Add to Home Screen, or Add to Dock command. There is no in-app installation dialog. Once the application shell has loaded, core local features continue to work offline. Use the top-bar Update button or Shift–Control–Option–R to check for updates and force refresh.</p>"
    },
    {
      "id": "app-icon",
      "title": "App icon controls",
      "section": "Appearance",
      "keywords": "icon theme dark light beta developer mode hold press shortcut pipe",
      "html": "<p>Click or tap the app icon, or press <kbd>T</kbd>, to switch between light and dark themes. Press and hold the icon, or press <kbd>|</kbd> or <kbd>D</kbd>, to enable or disable Developer Mode. The Beta pill appears automatically on a <code>/beta/</code> URL or when <code>?beta=1</code> is present.</p>"
    },
    {
      "id": "privacy",
      "title": "Privacy and local data",
      "section": "Data",
      "keywords": "privacy local storage token secret",
      "html": "<p>Money, Golf, and Notes remain in browser storage unless you export them or use GitHub Sync. Tokens are stored separately per device and excluded from backups and diagnostics.</p>"
    },
    {
      "id": "shortcuts",
      "title": "Keyboard access",
      "section": "Accessibility",
      "keywords": "keyboard shortcuts slash escape alt option shift control hints hover version update refresh pipe developer countdown auto dismiss",
      "html": "<p>Press <kbd>/</kbd> for global search, <kbd>N</kbd> for Notes, <kbd>V</kbd> for What’s New, <kbd>T</kbd> for the theme, <kbd>|</kbd> or <kbd>D</kbd> for Developer Mode, <kbd>,</kbd> for Settings, and <kbd>H</kbd> or <kbd>?</kbd> for Help. The main-page What’s New notice closes automatically after its configurable countdown (20 seconds by default); use <kbd>V</kbd> to view release notes or <kbd>X</kbd> to dismiss it sooner. Use Shift–Control–Option–R to check for updates and force refresh, and Shift–Control–Option–C to clear search, even while search is focused. Commands work directly or with Shift–Control–Option held. Hold that chord to reveal available shortcut badges, and hover a shortcut-enabled control for its full command.</p>"
    }
  ]
};
  window.LocalApp.config = Object.freeze(CONFIG);
})();

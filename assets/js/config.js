(function () {
  "use strict";
  window.LocalApp = window.LocalApp || {};
  const VERSION = "0.0.1.17";
  const CONFIG = {
  "identity": {
    "name": "T&A",
    "shortName": "T&A",
    "description": "Tristen's and Adam's Running Note for Bets, Golf, and Other Shenanigans",
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
      "appIconLight": "assets/icons/favicon.svg",
      "appIconDark": "assets/icons/favicon.svg",
      "manifestLight": "manifest.webmanifest",
      "manifestDark": "manifest-dark.webmanifest"
    }
  },
  "schemaVersion": 6,
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
    {"version": VERSION, "date": "2026-09-30T18:17:00.000Z", "title": "Golf Winnings And Dollar Bets", "summary": "Separate Golf and Bet winnings, unknown scores, and clearer yearly summaries.", "features": ["Dollar Bet quick actions credit $1 to the selected winner with editable What and optional Notes", "Independent Golf Winnings and Bet Winnings when adding or editing a round", "Unknown golf scores without fabricated stroke totals or ties"], "improvements": ["Expanded combines each round with its Golf Winnings and places nonzero Bets above it", "Year-filtered Books and Course summaries; round wins list the signed-in person first", "Mobile toolbar buttons stay together; only quick filters stick on scroll", "Rounds, Bets, Food, and Other filters; two-line Round Paid By label", "Pays label above the Money direction switch and consistent Title Case labels", "Expanded summary cards omit the active highlight border"], "fixes": ["Round and bet links stay atomic through edit, delete, Undo, import, and sync", "Older clients reject the new shared schema; previous backups and shared files migrate without losing history"], "knownIssues": []},
    {"version": "0.0.1.16", "date": "2026-09-30T16:59:00.000Z", "title": "Date sorting and clearer columns", "summary": "Newest dates first, a separate Tags column, and matching Amount and Balance displays.", "features": [], "improvements": ["Date-sorted Money, Golf, and combined tables with chronological running balances", "Compact identity pill below the version; Expanded hides it", "Expanded Force update action between Appearance and recovery in Settings", "Add label below its icon", "Mobile Search... placeholder and entry counts", "Expanded Tags column, round-only results, and matching Amount/Balance styling"], "fixes": ["Date edits move entries to their correct chronological position", "Summary hints distinguish Money Wins from recorded-round winnings"], "knownIssues": []},
    {"version": "0.0.1.15", "date": "2026-09-30T16:02:00.000Z", "title": "Quick actions and inline details", "summary": "One Add button, sticky category filters, and entry details directly in the table.", "features": ["Sticky Round Paid By controls and Golf, Bets, Food, Other filters", "Click a cell to expand its entry details inline"], "improvements": ["Layout choice follows Button Style in Appearance", "One Add button beside the year with matching control heights", "Expanded identity pill beside the version", "Full names and a cleaner search field on mobile", "Payer and Payee headers in Money entries"], "fixes": ["Expanded includes linked Golf Winnings and round payments", "Compact omits Adding as", "Settings layout choice responds correctly"], "knownIssues": []},
    {"version": "0.0.1.14", "date": "2026-09-30T14:56:00.000Z", "title": "Personal layouts and ledger history", "summary": "Expanded and Compact views, token-first loading, and a May 2025 ledger boundary.", "features": ["Expanded combined table with Round tags and entry details", "Personal layout toggle: Compact for Adam, Expanded for everyone else", "Token entry fills 80% of the screen and loads shared data before opening the app"], "improvements": ["Desktop summaries between app identity and toolbar", "Ledger Begins divider at May 2025", "Larger Expanded text and controls"], "fixes": ["Saved categories survive editing, reload and sync", "Year-only history counts toward Wins and Bets without changing the money balance", "Linked category edits preserve round amounts and links"], "knownIssues": []},
    {"version": "0.0.1.13", "date": "2026-09-29T23:45:00.000Z", "title": "Header summaries and aligned results", "summary": "Compact header summaries and year-only winnings in Money.", "features": ["Historical year-only winnings in Money"], "improvements": ["Aligned golf results", "Whole-dollar displays", "Single-row mobile toolbar"], "fixes": ["Equal money input sizes"], "knownIssues": []},
    {"version": "0.0.1.12", "date": "2026-09-29T23:30:00.000Z", "title": "Compact mobile ledger", "summary": "Wins categories and compact phone layouts.", "features": ["Separate Wins category"], "improvements": ["Two-line mobile money rows", "Aligned category and payment controls", "Compact summaries and golf columns"], "fixes": ["Remove repeated course details"], "knownIssues": []},
    {"version": "0.0.1.11", "date": "2026-09-29T23:00:00.000Z", "title": "Personal balance views", "summary": "Balances and rows reflect your signed-in perspective.", "features": ["Developer identity preview", "Command–Enter saves entry forms"], "improvements": ["Category totals and compact quick payments", "Blue golf summary and outcome row shading", "Single entry search"], "fixes": [], "knownIssues": []},
    {"version": "0.0.1.10", "date": "2026-09-29T22:00:00.000Z", "title": "Faster entry forms", "summary": "One-click categories, payment direction, and winnings controls.", "features": [], "improvements": ["Compact Money and Golf forms", "Tristen name correction with legacy-data support", "Compact summary labels and linked course names"], "fixes": [], "knownIssues": []},
    {"version": "0.0.1.9", "date": "2026-09-29T21:00:00.000Z", "title": "Compact golf results", "summary": "Compact results and two-way entry links.", "features": ["Golf links to its Money entries"], "improvements": ["Separate Date and Course columns", "Three-part results and compact golf summary", "Half-size row controls"], "fixes": [], "knownIssues": []},
    {"version": "0.0.1.8", "date": "2026-09-29T20:00:00.000Z", "title": "Clearer ledger rows", "summary": "Dedicated columns and full-width details keep Money compact.", "features": ["Colored category pills", "Linked-round buttons"], "improvements": ["Quick round payments inside In the Books", "Golf totals inside On the Course", "Shorter balance labels"], "fixes": [], "knownIssues": []},
    {"version": "0.0.1.7", "date": "2026-09-29T18:00:00.000Z", "title": "Side-by-side tables", "summary": "Money and Golf share the desktop workspace.", "features": ["Quick $20 golf-round entries", "Hover a row and press E to edit"], "improvements": ["Side-by-side desktop tables", "Square Add and Edit controls", "Centered identity and edge-to-edge black favicon"], "fixes": [], "knownIssues": []},
    {"version": "0.0.1.6", "date": "2026-09-29T12:00:00.000Z", "title": "Table controls", "summary": "Choose Money or Golf directly from the summary cards.", "features": [], "improvements": ["Colored identity in the top bar", "Card Add controls and pencil edit icons", "Entry search count and period shortcut", "Black favicon background"], "fixes": [], "knownIssues": []},
    {
      "version": "0.0.1.5",
      "date": "2026-09-28T18:00:00.000Z",
      "title": "Compact layout",
      "summary": "More room for entries and Notes.",
      "features": [],
      "improvements": ["Full-width Money and Golf layout", "Compact summaries and entry rows", "Notes fills 80% of the viewport with an expanding editor"],
      "fixes": [],
      "knownIssues": []
    },
    {
      "version": "0.0.1.4",
      "date": "2026-09-28T16:00:00.000Z",
      "title": "Shared info",
      "summary": "Golf rules and contacts now have a dedicated private Info tab.",
      "features": ["Info tab between Data Sync and Help", "Tap-to-call and email contact links"],
      "improvements": ["Info stays sourced from private synced Notes", "Rules and contacts are searchable"],
      "fixes": [],
      "knownIssues": []
    },
    {
      "version": "0.0.1.3",
      "date": "2026-09-28T12:00:00.000Z",
      "title": "Token identity",
      "summary": "Label both tokens once; each person connects with just their token.",
      "features": ["Owner setup for Adam and Tristen’s tokens", "Automatic name selection from private token fingerprints"],
      "improvements": ["Connect loads shared content and enables Auto Sync", "No everyday name picker"],
      "fixes": [],
      "knownIssues": []
    },
    {
      "version": "0.0.1.2",
      "date": "2026-09-27T20:00:00.000Z",
      "title": "Money and Golf",
      "summary": "A shared running ledger and golf history for Adam and Tristen.",
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
      "html": "<p>Connect your assigned token in Data Sync, then add a Money entry or Golf round. Entries are sorted by newest date. Scores can be unknown, and Golf Winnings and Bet Winnings are independent. Expanded combines Golf Winnings with the Round and shows nonzero Bet Winnings separately. Dollar Bet credits $1 to the selected winner, with editable What and optional Notes. Record repayment reduces the amount owed. Search finds Money, Golf, Notes, Help, releases, and Roadmap entries. Changes save on this device automatically. Open Settings to customize appearance, manage backups, or connect GitHub Sync.</p>"
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
      "html": "<p>GitHub sync is optional. The app configuration fixes the repository, branch, and JSON file path; enter a fine-grained token with Contents access in Settings → Data Sync. Expand Sync payload (JSON) there to inspect the current local content included in uploads. Money, Golf, and Notes sync; appearance and settings stay on this device. Adam labels both tokens once in Data Sync and publishes the setup. Afterward, paste your assigned token and press Connect: the app identifies you, loads shared content, and enables Auto Sync. Separate edits merge; conflicting edits are reviewed individually. Each person should use a separate token limited to the private data repository.</p>"
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

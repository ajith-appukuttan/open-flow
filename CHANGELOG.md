# Changelog

All notable changes to Workflow Designer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Workflow versioning and history
- Real-time collaboration
- Webhook triggers for external events
- Batch workflow operations
- Role-based access control

---

## [1.2.0] - 2026-01-14

### Added
- **Data Flow Between Steps** - Reference outputs from previous nodes using `{{NodeLabel.response}}` syntax
- **Workflow Context** - Execution context that stores outputs from all executed nodes
- **Variable Resolution** - Automatic variable substitution in API URLs, headers, body, query params, and conditions
- **Available Variables Panel** - Shows accessible variables from upstream nodes in Properties Panel
- **Auto-Evaluate Conditions** - Decision nodes automatically evaluate conditions when possible
- **Nested Property Access** - Support for `{{Node.response.data[0].id}}` syntax

### Changed
- Decision nodes now auto-execute when condition can be evaluated
- Test flow shows resolved values alongside original variable syntax
- API responses are stored in context for use by subsequent nodes

### Fixed
- Decision node handle positioning with rotated diamond shape
- Variable resolution for node labels containing spaces

---

## [1.1.0] - 2026-01-13

### Added
- **API Call Actions** - Configure HTTP requests directly in Action nodes
- **HTTP Methods** - Support for GET, POST, PUT, PATCH, DELETE
- **Custom Headers** - Key-value editor for request headers
- **Query Parameters** - Key-value editor for URL query params
- **Request Body** - JSON body editor for POST/PUT/PATCH requests
- **API Testing** - Test API configuration from Properties Panel
- **Response Display** - View API responses in test chat

### Changed
- Action nodes now show action type badge
- Properties Panel reorganized for API configuration

---

## [1.0.0] - 2026-01-12

### Added
- **Interactive Test Runner** - Chat-style workflow testing
- **Test Drawer** - Resizable bottom panel for test execution
- **Real-time Highlighting** - Visual feedback showing current and visited nodes
- **Decision Prompts** - Interactive selection at decision points
- **Loop Controls** - Continue/exit options for loop nodes
- **Parallel Branch Selection** - Choose which branch to simulate
- **Test Messages** - Detailed execution log with timestamps

### Changed
- Header includes "Test Flow" button
- Nodes receive test mode state for visual styling

---

## [0.3.0] - 2026-01-11

### Added
- **Workflow Validation** - Server-side validation with errors and warnings
- **Export/Import** - Download and upload workflow JSON files
- **Duplicate Workflow** - Create copy of existing workflow
- **Edge Labels** - Add labels to connections for clarity

### Changed
- Validation results displayed in toast notifications
- Improved error handling for API failures

### Fixed
- Edge deletion not removing from state
- Node selection clearing when clicking canvas

---

## [0.2.0] - 2026-01-10

### Added
- **Properties Panel** - Edit node and edge properties
- **Node Descriptions** - Optional description field for all nodes
- **Decision Conditions** - Condition expression for decision nodes
- **Loop Configuration** - Loop count and condition settings
- **Parallel Branches** - Configure number of parallel branches
- **Keyboard Shortcuts** - Delete nodes with Backspace/Delete

### Changed
- Sidebar shows node count per workflow
- Canvas background changed to dot pattern

### Fixed
- Node position not saving correctly
- Sidebar list not updating after save

---

## [0.1.0] - 2026-01-09

### Added
- **Visual Canvas** - React Flow based drag-and-drop editor
- **Node Types** - Start, End, Action, Decision, Parallel, Loop
- **Edge Connections** - Connect nodes with animated edges
- **Toolbar** - Draggable node palette
- **Sidebar** - Workflow list with create/load/delete
- **REST API** - CRUD operations for workflows
- **File Storage** - JSON-based persistence
- **Dark Theme** - Modern dark UI design

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.2.0 | 2026-01-14 | Data flow, variables, auto-evaluate |
| 1.1.0 | 2026-01-13 | API configuration, HTTP requests |
| 1.0.0 | 2026-01-12 | Interactive testing, test drawer |
| 0.3.0 | 2026-01-11 | Validation, export/import |
| 0.2.0 | 2026-01-10 | Properties panel, node config |
| 0.1.0 | 2026-01-09 | Initial release |

---

## Migration Guides

### Upgrading to 1.2.0

No breaking changes. Existing workflows will continue to work. New features:
- Use `{{NodeLabel.response}}` syntax to reference previous outputs
- Decision nodes will auto-evaluate if conditions are set

### Upgrading to 1.1.0

No breaking changes. Action nodes now support:
- `actionType: 'api_call'` for HTTP requests
- `apiConfig` object for request configuration

### Upgrading to 1.0.0

No breaking changes. New test mode state properties added to nodes:
- `isTestActive`
- `isTestVisited`
- `isTestMode`

---

## Deprecations

Currently no deprecations planned.

---

## Security

For security-related issues, please contact security@your-domain.com rather than opening a public issue.

### Security Updates

| Date | Version | Description |
|------|---------|-------------|
| - | - | No security updates yet |

---

[Unreleased]: https://github.com/your-org/workflowdesigner/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/your-org/workflowdesigner/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/your-org/workflowdesigner/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-org/workflowdesigner/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/your-org/workflowdesigner/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/your-org/workflowdesigner/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/workflowdesigner/releases/tag/v0.1.0

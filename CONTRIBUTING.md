# Contributing to Workflow Designer

Thank you for your interest in contributing to Workflow Designer! This document provides guidelines and information for contributors.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Guidelines](#issue-guidelines)
8. [Architecture Decisions](#architecture-decisions)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors regardless of background, identity, or experience level.

### Expected Behavior

- Be respectful and inclusive in language and actions
- Accept constructive criticism gracefully
- Focus on what is best for the community and project
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Violations may be reported to the maintainers. All complaints will be reviewed and investigated, resulting in appropriate action.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ or yarn 1.22+
- Git
- Code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/workflowdesigner.git
cd workflowdesigner

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-ORG/workflowdesigner.git
```

### Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Run Development Servers

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

### Verify Setup

- Client: http://localhost:5173
- Server API: http://localhost:3001/api/workflows

---

## Development Workflow

### Branch Strategy

```
main
├── develop (integration branch)
│   ├── feature/description
│   ├── bugfix/description
│   └── hotfix/description
```

### Creating a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your code changes
2. Write/update tests if applicable
3. Update documentation if needed
4. Ensure linting passes
5. Test your changes manually

### Syncing with Upstream

```bash
git fetch upstream
git rebase upstream/main
```

---

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface WorkflowNode {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
}

function getNode(id: string): WorkflowNode | undefined {
  return nodes.find(n => n.id === id);
}

// Bad
type Node = any;

function getNode(id) {
  return nodes.find(n => n.id === id);
}
```

### React

- Use functional components with hooks
- Use `memo` for performance-critical components
- Extract custom hooks for reusable logic
- Keep components focused and small

```typescript
// Good
const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div className={selected ? 'selected' : ''}>
      {data.label}
    </div>
  );
});

// Custom hook
function useWorkflowValidation(workflow: Workflow) {
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    validateWorkflow(workflow).then(setErrors);
  }, [workflow]);
  
  return errors;
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Extract common patterns to components
- Use CSS variables for theme values
- Avoid inline styles

```tsx
// Good
<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white">
  Save
</button>

// Bad
<button style={{ padding: '8px 16px', backgroundColor: '#4f46e5' }}>
  Save
</button>
```

### File Organization

```
component/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests
├── index.ts               # Re-exports
└── types.ts               # Component-specific types (if needed)
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ActionNode.tsx` |
| Hooks | camelCase with `use` prefix | `useWorkflowStore` |
| Functions | camelCase | `handleSave` |
| Constants | UPPER_SNAKE_CASE | `MAX_NODES` |
| Types/Interfaces | PascalCase | `WorkflowNode` |
| Files | PascalCase (components), camelCase (utils) | `ActionNode.tsx`, `workflowApi.ts` |

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies |

### Examples

```bash
# Feature
feat(nodes): add custom node type support

# Bug fix
fix(canvas): correct handle positioning on decision nodes

# Documentation
docs(api): update workflow schema documentation

# Refactor
refactor(store): simplify state update logic
```

### Rules

- Subject line max 72 characters
- Use imperative mood ("add" not "added")
- No period at end of subject
- Body explains what and why (not how)
- Reference issues in footer: `Fixes #123`

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No linting errors
- [ ] Commits are clean and atomic

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing approach

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. Submit PR against `develop` branch
2. Automated checks run (lint, tests, build)
3. Maintainer reviews code
4. Address feedback with new commits
5. Squash and merge when approved

### After Merge

```bash
# Update your fork
git checkout main
git pull upstream main
git push origin main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Issue Guidelines

### Bug Reports

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]

## Screenshots
If applicable

## Additional Context
Any other relevant information
```

### Feature Requests

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches considered

## Additional Context
Mockups, examples, etc.
```

### Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | Critical issues |
| `priority: low` | Nice to have |

---

## Architecture Decisions

### When to Document

Create an Architecture Decision Record (ADR) when:
- Adding new major features
- Changing core architecture
- Adopting new libraries/frameworks
- Making trade-off decisions

### ADR Template

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Consequences
What becomes easier or more difficult because of this change?
```

### Current ADRs

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Use React Flow for canvas | Accepted |
| ADR-002 | Zustand for state management | Accepted |
| ADR-003 | File-based storage | Accepted |
| ADR-004 | Variable syntax `{{}}` | Accepted |

---

## Recognition

Contributors are recognized in:
- CHANGELOG.md (for each release)
- GitHub contributors page
- Project documentation

---

## Questions?

- Check existing issues and discussions
- Review documentation in `/docs`
- Open a new discussion for questions
- Contact maintainers for sensitive issues

---

Thank you for contributing to Workflow Designer! 🎉

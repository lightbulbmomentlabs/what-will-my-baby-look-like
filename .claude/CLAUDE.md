# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository. 

Do not make any changes until you have 95% confidence that you know that what to build and how to build it without introducing any bugs or errors in the code. Ask me any follow up questions you have until you reach confidence. 

MCPS:

ShadCN - pnpm dlx shadcn@latest mcp init --client claude




Playwright - claude mcp add playwright npx @playwright/mcp@latest

# PRD.md

This file provides exact reference to the app we are building when working in this repository. It can be found at [.claude/PRD.md](.claude/PRD.md)

# Apps Reference

This file tracks information about the applications you're working on for quick reference.

## App Index

*No apps documented yet*

---
## Visual Development

### Design Reference
- See comprehensive checklist in [context/design-principles.md](context/design-principles.md) for design guidelines and principles.
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance.

### Quick Visual Check
1. **Identify what changed** - Review the modified components/pages/screens
2. **Navigate to affected pages** - Use `@mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against [context/design-principles.md](context/design-principles.md)
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Check for errors** - Run `@mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `design-review-agent` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsive testing
- Making changes that affect multiple components or pages

### UI Components
- Modern component library built on Radix UI components
- Tailwind CSS v3 with CSS variables for theming
- Lucide React icons throughout
- Follow existing patterns for consistency

## Template for New Apps

When adding a new app, include:

### App Name
- **Type**: [web app, mobile app, CLI tool, etc.]
- **Tech Stack**: [languages, frameworks, databases, etc.]
- **Purpose**: [brief description]
- **Key Files**: [important files/directories]
- **Build Commands**: [how to build/run]
- **Test Commands**: [how to run tests]
- **Notes**: [any special considerations]



### Guidance Memories
- Please ask for clarification upfront, upon the initial prompts, when you need more direction
- Always run build/lint/typecheck commands after making code changes
- Use TodoWrite tool for complex multi-step tasks
- Follow existing code conventions and patterns

---

*This file will be updated as we work on different applications together.*
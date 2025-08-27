# Update Changelog Command

This command helps maintain the project changelog following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## Command Usage

When Claude completes implementation tasks, use this command to update the CHANGELOG.md file:

```
/changelog <version> <type> <description>
```

### Parameters

- `version`: The version section to update (`unreleased`, `1.0.1`, `2.0.0`, etc.)
- `type`: The type of change (`added`, `changed`, `deprecated`, `removed`, `fixed`, `security`)
- `description`: Brief description of the change

### Examples

```bash
# Add a new feature to unreleased section
/changelog unreleased added "User profile settings page with avatar upload"

# Record a bug fix
/changelog unreleased fixed "Resolved authentication redirect loop issue"

# Document a breaking change for next major version
/changelog 2.0.0 changed "Refactored API endpoints to use REST conventions (BREAKING)"

# Add security improvement
/changelog unreleased security "Enhanced input validation for user uploads"
```

## Manual Update Process

When implementing features or fixes:

1. **After completing implementation**, update CHANGELOG.md
2. **Add entries under `[Unreleased]`** section
3. **Use appropriate category**: Added, Changed, Deprecated, Removed, Fixed, Security
4. **Write clear, user-focused descriptions**
5. **Group related changes** together when possible

### Categories

- **Added**: New features
- **Changed**: Changes in existing functionality  
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements or fixes

### Entry Format

```markdown
### Added
- New user authentication system with OAuth support
- Email verification workflow for account security
- Dashboard analytics with real-time metrics

### Fixed
- Resolved memory leak in event listener cleanup
- Fixed responsive layout issues on mobile devices
```

## Release Process

When preparing a release:

1. **Move entries** from `[Unreleased]` to new version section
2. **Add release date** in ISO format (YYYY-MM-DD)
3. **Create new empty `[Unreleased]` section** for future changes
4. **Update version links** at bottom of file if using compare links

### Version Section Format

```markdown
## [1.2.0] - 2024-03-15

### Added
- Feature that was previously in unreleased

## [Unreleased]

### Added
- New features go here
```

## Best Practices

- **Update immediately** after completing implementation
- **Be specific** but concise in descriptions
- **Focus on user impact** rather than technical implementation details  
- **Link to issues/PRs** when relevant using `(#123)` format
- **Maintain chronological order** within each category
- **Use imperative mood** for consistency ("Add feature" not "Added feature")

## Automation

This changelog should be updated manually for now. Future automation could:
- Extract changes from commit messages
- Generate entries from PR descriptions
- Validate changelog format in CI/CD pipeline
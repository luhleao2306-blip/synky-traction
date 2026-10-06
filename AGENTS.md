# Synky Traction — delivery rules

- Send every completed, authorized update to `https://github.com/luhleao2306-blip/synky-traction`, preserving the existing `main` history. This is the owner's standing instruction.
- Publish changes to the existing Sites project in `.openai/hosting.json`. Keep GitHub and Sites source contents synchronized; their Git histories are separate. Never force-push one history over the other.
- Before committing, review the changed files and verify the affected behavior and responsive layout. Exclude credentials, environment files, local databases, generated build output, and local test data.
- Changes to internal modules must leave the landing page intact unless the owner explicitly asks to change it.
- Use isolated local test data for write tests. Do not create fictitious companies in production.

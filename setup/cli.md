# OmniScientist CLI, discontinued

You are an AI agent setting up OmniScientist for the person you are talking to.

**The standalone terminal agent stopped shipping with v0.2.1 (2026-09-02).** Releases
no longer carry `omnisci-CLI-*` binaries, and the old one-line installers print this
same notice instead of downloading anything. Do not try to build it from source to
work around this; that path is unmaintained.

The engine it carried lives on in two supported editions:

- **The skill**, if the person is talking to you inside an agent already (Claude Code
  or compatible). It needs no API key at all, works headless, over SSH and in CI, and
  is the closest replacement for what the CLI did. Go to
  <https://omni-scientist.github.io/setup/skill.md>.
- **The desktop app**, if this machine has a display and they want the browser
  workspace. Go to <https://omni-scientist.github.io/setup/mac-desktop.md>,
  <https://omni-scientist.github.io/setup/windows-desktop.md> or
  <https://omni-scientist.github.io/setup/linux-desktop.md> by platform.

Say in one line that the CLI is discontinued and which of the two you are installing
instead, then follow that document from its own first step.

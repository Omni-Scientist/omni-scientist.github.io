# Install OmniScientist

You are an AI agent installing OmniScientist for the person you are talking to.

**This document installs nothing.** It works out *which* of four procedures applies, and
sends you to that one. Do the steps below, then stop reading this file and follow the
document it names, from that document's own first step.

## Step 1 — the request usually already says which one

Read what the person actually asked for. Most requests name the target, because the
project page and the README hand out a sentence that does. Match it here first:

| If the request says | Go to |
|---|---|
| Desktop **on this Mac**, macOS desktop, the browser workspace on a Mac | <https://omni-scientist.github.io/setup/mac-desktop.md> |
| Desktop **on this Windows machine**, Windows desktop | <https://omni-scientist.github.io/setup/windows-desktop.md> |
| Desktop **on this Linux machine**, Linux desktop | <https://omni-scientist.github.io/setup/linux-desktop.md> |
| the **terminal agent**, CLI, `omnisci` on the command line | The standalone CLI is discontinued. <https://omni-scientist.github.io/setup/cli.md> says what to install instead (usually the skill) |
| headless, SSH, CI, Docker, no display | <https://omni-scientist.github.io/setup/skill.md> |
| the **skill**, "for this agent", "inside Claude Code", no API key | <https://omni-scientist.github.io/setup/skill.md> |

If one of those matches, go to Step 3 now. Do not ask a question you already have the
answer to.

One check before you do: if the request names a platform that is not the platform you
are on, the machine wins, not the sentence. `uname -s` printing `Linux` while the
request says "on this Mac" means they pasted a line meant for another machine. Say so in
one line, take the Linux document instead, and carry on rather than stopping.

## Step 2 — only if the request did not say

```bash
uname -s -m 2>/dev/null || echo "windows"
[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && echo "graphical session" || echo "no display"
```

On Windows the first command fails and you are in PowerShell; that is the answer, not an
error. `Darwin` is macOS, `Linux` is Linux.

**If that printed `no display`** (a server, a container, an SSH session, a CI runner),
the desktop edition has no browser to open and is not an option. The standalone CLI is
discontinued, so go to <https://omni-scientist.github.io/setup/skill.md>; it works
headless and needs no API key. If they explicitly asked for the CLI,
<https://omni-scientist.github.io/setup/cli.md> says how to answer.

**Otherwise ask exactly one question**, in your own words, and give them enough to answer
it:

- a **browser workspace** they open from the Dock, Start menu, or application menu;
- a **skill** inside the agent they are talking to right now, which needs **no API key at
  all**, because you do the perceiving and the writing yourself, and which also covers
  headless machines and CI.

Then take the matching document: mac, Windows, or Linux desktop by what Step 2 printed,
otherwise `skill.md`.

Do not decide this for them because one answer is cheaper. The skill costs nothing to
run and is the right answer surprisingly often, but somebody setting up a shared machine
for a lab wants the desktop edition, and installing the wrong one wastes more of their
time than the question does.

The reference implementation in `engine/` also lives in the repository, but it is
a Python package for reproducing the technical report rather than an edition to install.
If that is what they want, send them to
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md#engine>
instead of improvising it here.

## Step 3 — follow that document

Read it and do what it says, in order, starting at its own Step 0. It repeats the
platform check you may have just done, which is deliberate: each one is written to work
whether or not anybody came through this file.

Three things carry over into all four, so they are worth knowing now:

- **Never invent, guess, or reuse an API key.** Ask the person and wait. Only the skill
  edition needs none.
- **On failure, stop.** Report the command and its exact output and say which step
  failed. Do not retry a failed download, do not fall back to a different edition, and
  do not substitute an install method you remember.
- **A run reaches a compiled paper only with Python 3.10+ and
  [tectonic](https://tectonic-typesetting.github.io/).** Without tectonic a run still
  perceives the evidence, runs the analysis, draws the figures, assembles the `.tex`,
  says so, and stops there. The desktop edition offers to install both for you; the
  other editions expect you to have them.

If you cannot fetch the document you were sent to, say so and stop. Do not install from
memory.

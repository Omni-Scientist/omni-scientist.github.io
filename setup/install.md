# Install OmniScientist

You are an AI agent installing OmniScientist for the person you are talking to. This
document does not install anything. It works out **which** of five procedures applies,
and then you go and follow that one from its first step.

Do the two steps below, then stop reading this file and read the one it sent you to.

## Step 1 — read the machine

```bash
uname -s -m 2>/dev/null || echo "windows"
[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && echo "graphical session" || echo "no display"
```

On Windows this fails and you are in PowerShell; that is the answer, not an error.
Note what you got. `Darwin` is macOS, `Linux` is Linux, anything else with PowerShell is
Windows.

## Step 2 — work out which edition

Four editions run the same research loop. They differ in what does the seeing and whose
key pays for it. Decide in this order and do not ask more than one question.

**If you are a harness that loads skills** (you read them from `~/.claude/skills/` or an
equivalent), and the person has not asked for something standalone, **the skill is the
right answer.** It needs no API key of any kind: you do the perceiving and the writing
yourself, and the Python that ships with it does the rendering, the analysis runs, the
references, and the gates. Say that is what you are doing and why, then go to
<https://omni-scientist.github.io/setup/skill.md>.

**Otherwise, if step 1 said `no display`** (a server, a container, an SSH session, a CI
runner), the desktop edition has no browser to open and is not an option. Go to
<https://omni-scientist.github.io/setup/cli.md>.

**Otherwise ask one question**, in your own words: do they want a browser workspace they
open from the Dock, Start menu, or application menu, or a terminal agent they run where
they already work? Then:

| They said | Step 1 said | Go to |
|---|---|---|
| browser workspace | `Darwin` | <https://omni-scientist.github.io/setup/mac-desktop.md> |
| browser workspace | `Linux` | <https://omni-scientist.github.io/setup/linux-desktop.md> |
| browser workspace | Windows | <https://omni-scientist.github.io/setup/windows-desktop.md> |
| terminal | any | <https://omni-scientist.github.io/setup/cli.md> |

The fifth case is the reference implementation in `engine/`, which is a Python package
for reproducing the technical report rather than something to install. If that is what
they want, send them to
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md#engine>
instead of guessing at it here.

## Step 3 — follow that document

Read it and do what it says, in order, starting at its own Step 0. It repeats the
platform check you just did, which is deliberate: it is written to work whether or not
anyone came through this file.

Three things carry over into every one of them, so they are worth knowing now:

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

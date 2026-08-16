# OmniScientist Desktop on macOS

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. This document is the whole procedure; you do
not need anything you remember from elsewhere.

When you are done they will have `OmniScientist.app` installed, a menu bar icon, and a
research workspace open in their own browser at `127.0.0.1`.

## Ground rules

1. Run each command as written. Do not substitute a package manager, a different
   download URL, or an install method you remember. There is exactly one supported
   path and it is below.
2. **Never invent, guess, or reuse an API key.** If a step needs one, ask the person
   and wait. A placeholder written into a config file is worse than no config file.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download, do not fall back to another edition, do not
   try to work around it. A wrong install is harder to diagnose than a missing one.
4. **No `sudo` anywhere in this document.** Nothing here needs it. If you find
   yourself reaching for it, you are off the path.
5. Stay quiet until the final step, except where a step tells you to ask a question.
   One report at the end, not a running commentary.

## Step 0 — confirm this is the right document

```bash
uname -s
```

If it does not print `Darwin`, stop and point the person at the right one:

| It printed | Use instead |
|---|---|
| `Linux` with a desktop session | <https://omni-scientist.github.io/setup/linux-desktop.md> |
| `Linux` on a server, container, or CI runner | <https://omni-scientist.github.io/setup/ci.md> |
| `MINGW`, `MSYS`, or you are in PowerShell | <https://omni-scientist.github.io/setup/windows-desktop.md> |

If the person is inside Claude Code and wants no API key at all, the skill edition is
the better fit: <https://omni-scientist.github.io/setup/skill.md>.

## Step 1 — read the machine

```bash
uname -m && sw_vers -productVersion
```

`arm64` is Apple silicon, `x86_64` is an Intel Mac. Both are published. Keep the
macOS version for your final report; the desktop edition was accepted on macOS 15.7.7
on an M3, and a report from an older release is useful to the project.

## Step 2 — download, verify, install

One block. It picks the architecture, checks the checksum, unpacks into
`/Applications`, and falls back to `~/Applications` if that directory is not writable.

```bash
set -eu
case "$(uname -m)" in
  arm64)  arch=arm64 ;;
  x86_64) arch=x86_64 ;;
  *) echo "no macOS build for $(uname -m)" >&2; exit 1 ;;
esac
asset="OmniScientist-macos-$arch.tar.gz"
base="https://github.com/Omni-Scientist/OmniScientist/releases/latest/download"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -fsSL --retry 3 -o "$tmp/$asset" "$base/$asset"
curl -fsSL --retry 3 -o "$tmp/$asset.sha256" "$base/$asset.sha256"
( cd "$tmp" && shasum -a 256 -c "$asset.sha256" )

dest=/Applications
[ -w "$dest" ] || { dest="$HOME/Applications"; mkdir -p "$dest"; }
tar -xzf "$tmp/$asset" -C "$dest"

echo "installed: $dest/OmniScientist.app"
```

Expected: a line ending in `: OK` from the checksum check, then the `installed:` line.
Record which `dest` it printed; step 4 needs it.

**Install through the terminal, never through a browser download.** The quarantine
attribute is set by whatever does the downloading, and `curl` does not set it, so
Gatekeeper is never consulted and there is no "unidentified developer" dialog to talk
the person through. If they have already downloaded the tarball in a browser, throw it
away and run the block above instead of trying to clear the attribute.

## Step 3 — credentials

The desktop edition sends text to DeepSeek and pixels to a vision model. Ask the
person for what they have, in your own words:

- `DEEPSEEK_API_KEY` is required. It drives the reasoning.
- `ANTHROPIC_API_KEY` is the perception sidecar. The DeepSeek endpoint accepts text
  only, so images, spectra, video frames, and 3-D renders go to a vision model that
  returns a bounded factual observation. Text-only work does not need it, but nearly
  every interesting run does.

If they would rather use some other OpenAI-compatible endpoint, the three variables are
`OMNISCI_BASE_URL`, `OMNISCI_API_KEY`, and `OMNISCI_MODEL`, and they replace the
DeepSeek key rather than joining it.

Write only the keys they actually gave you:

```bash
mkdir -p ~/.omnisci
umask 177
cat > ~/.omnisci/env <<'ENV'
DEEPSEEK_API_KEY=<paste>
ANTHROPIC_API_KEY=<paste>
ENV
chmod 600 ~/.omnisci/env
```

The file is parsed strictly as data and is never run as shell. One `KEY=VALUE` per
line, an optional `export` prefix, and matching quotes are accepted. Anything else and
**the entire file is ignored rather than half read**, so do not add comments in
unusual places, do not wrap values in backticks, and do not leave a trailing `\`.

If the person does not want to hand over keys right now, skip this step and say so in
your report. The app starts without them and its interface offers to set them.

## Step 4 — first launch

```bash
open -a OmniScientist || open "$HOME/Applications/OmniScientist.app"
```

A menu bar icon appears and the browser opens by itself. The service binds `127.0.0.1`
only, takes a free port, and hands the browser a one-time token in the URL, which the
server immediately exchanges for an `HttpOnly` cookie and redirects, so the token does
not linger in the address bar or in history.

Confirm it really came up rather than trusting the icon:

```bash
for _ in $(seq 1 60); do [ -f ~/.omnisci/desktop.lock ] && break; sleep 0.5; done
port=$(sed -n 's/.*"port"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' ~/.omnisci/desktop.lock)
curl -fsS "http://127.0.0.1:$port/api/health"
```

Expected, on one line:

```json
{"ok":true,"version":"0.1.0","port":54321,"workspace":"/Users/<name>/OmniScientist"}
```

If `desktop.lock` never appears, the service did not start. The logs are in
`~/.omnisci/logs/`; read the newest one and report what it says. Do not launch it a
second time, the lock file exists precisely to stop a second service.

## Step 5 — the two things that live outside the app

A run reaches a compiled PDF only with **Python 3.10 or newer** (numpy, pandas,
matplotlib, scipy, scikit-learn, sympy, imageio, soundfile) and
**[tectonic](https://tectonic-typesetting.github.io/)**, which compiles the LaTeX.
Without tectonic a run still produces the `.tex`, says so, and stops there. Everything
before that step works.

The desktop edition checks for both on startup and offers to install them under its own
data directory, touching nothing else on the machine. **Let it.** Do not install them
yourself with Homebrew or pip. Just tell the person, in your report, that the workbench
will ask on first use and that saying yes is the intended path.

For your report, record what is already there:

```bash
python3 --version 2>&1; command -v tectonic || echo "tectonic: not installed"
```

## Step 6 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist Desktop is installed at `<path from step 2>` and running.
> Workspace: `<workspace from the health check>`. Credentials: `<written / skipped>`.
> Python `<version or missing>`, tectonic `<present or missing>`.
>
> The workbench is open in your browser. Drop a folder of raw data into the workspace
> and tell it a research direction. If it asks to install Python or tectonic on the
> first run, say yes: those two are what turn a finished analysis into a PDF.
>
> Quit from the menu bar icon when you are done.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Troubleshooting

**`curl: (22) ... 404`** on the tarball. There is no published release for that
architecture yet. Report it; do not substitute a different asset name.

**The checksum line does not end in `OK`.** The download is wrong. Delete it and stop.
Do not install it anyway.

**"OmniScientist is damaged and can't be opened"** or an unidentified developer dialog.
The tarball was downloaded in a browser, so it carries the quarantine attribute. Delete
the app and reinstall with the `curl` block in step 2.

**The browser page says it needs the launcher.** The page was opened at
`127.0.0.1:<port>` without the one-time token, or the cookie expired after a day.
Reopen it from the menu bar icon.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

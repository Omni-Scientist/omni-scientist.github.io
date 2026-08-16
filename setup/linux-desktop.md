# OmniScientist Desktop on Linux

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. This document is the whole procedure; you do
not need anything you remember from elsewhere.

When you are done they will have `omnisci-desktop` installed under `~/.local`, an entry
in their application menu, and a research workspace open in their own browser at
`127.0.0.1`. Nothing is installed system wide and no step needs root.

## Ground rules

1. Run each command as written. Do not substitute apt, dnf, snap, flatpak, or a
   download URL you remember. There is exactly one supported path and it is below.
2. **Never invent, guess, or reuse an API key.** If a step needs one, ask the person
   and wait.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download, do not fall back to another edition.
4. **No `sudo` anywhere in this document.** The installer is deliberately per user. If
   you find yourself reaching for root, you are off the path.
5. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — confirm this is the right document

```bash
uname -s; [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && echo "graphical session" || echo "no display"
```

`uname -s` must print `Linux`. If it prints `Darwin`, use
<https://omni-scientist.github.io/setup/mac-desktop.md> instead.

If it printed **`no display`**, this is a server, a container, or an SSH session
without X or Wayland forwarding. The desktop edition opens a browser and has nothing to
open one with. Stop here and use <https://omni-scientist.github.io/setup/ci.md>, which
is the headless path and is what the person actually wants. Say so plainly rather than
installing something that cannot start.

## Step 1 — read the machine

```bash
uname -m; . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"
```

`x86_64` is always published. `aarch64` is built on a runner that is allowed to fail,
so an arm64 tarball is sometimes absent from a given release. Step 2 handles that case
by saying so, not by silently installing the wrong architecture.

## Step 2 — download, verify, unpack

```bash
set -eu
case "$(uname -m)" in
  x86_64)          arch=x86_64 ;;
  aarch64|arm64)   arch=arm64 ;;
  *) echo "no Linux build for $(uname -m)" >&2; exit 1 ;;
esac
asset="OmniScientist-linux-$arch.tar.gz"
base="https://github.com/Omni-Scientist/OmniScientist/releases/latest/download"
work="$HOME/.cache/omniscientist-install"
rm -rf "$work"; mkdir -p "$work"; cd "$work"

curl -fsSL --retry 3 -O "$base/$asset" || {
  echo "no $asset in the latest release" >&2; exit 1; }
curl -fsSL --retry 3 -O "$base/$asset.sha256"
sha256sum -c "$asset.sha256"
tar -xzf "$asset"
cd OmniScientist-*-linux-*
pwd
```

Expected: a line ending in `: OK`, then the path of the unpacked directory. If the
first `curl` failed on `aarch64`, that architecture was not published in this release.
Report that and stop; do not install the `x86_64` build on an ARM machine, it fails
with `Exec format error` the moment it runs.

## Step 3 — install for the current user

From inside the directory step 2 printed:

```bash
./install.sh
```

It copies the binary to `~/.local/bin/omnisci-desktop`, writes a `.desktop` entry to
`~/.local/share/applications/`, drops an icon under
`~/.local/share/icons/hicolor/512x512/apps/`, and refreshes the desktop and icon caches
if those tools exist. `PREFIX=/somewhere ./install.sh` moves all of that.
`./install.sh --uninstall` removes exactly what it added and leaves `~/.omnisci` and
the workspace alone.

It prints a hint if `~/.local/bin` is not on `PATH`. If it does, add this to the
person's shell profile and mention it in your report:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Then clean up the download:

```bash
rm -rf "$HOME/.cache/omniscientist-install"
```

## Step 4 — credentials

The desktop edition sends text to DeepSeek and pixels to a vision model. Ask the
person for what they have, in your own words:

- `DEEPSEEK_API_KEY` is required. It drives the reasoning.
- `ANTHROPIC_API_KEY` is the perception sidecar. The DeepSeek endpoint accepts text
  only, so images, spectra, video frames, and 3-D renders go to a vision model that
  returns a bounded factual observation. Text-only work does not need it, but nearly
  every interesting run does.

For any other OpenAI-compatible endpoint the three variables are `OMNISCI_BASE_URL`,
`OMNISCI_API_KEY`, and `OMNISCI_MODEL`, and they replace the DeepSeek key rather than
joining it.

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

The file is parsed strictly as data and is never sourced as shell. One `KEY=VALUE` per
line, an optional `export` prefix, and matching quotes are accepted. Anything else and
**the entire file is ignored rather than half read**.

If they would rather not hand over keys now, skip this and say so in your report. The
app starts without them and its interface offers to set them.

## Step 5 — first launch

```bash
~/.local/bin/omnisci-desktop &
```

The service binds `127.0.0.1` only, takes a free port, and hands the browser a one-time
token in the URL, which the server immediately exchanges for an `HttpOnly` cookie and
redirects, so the token does not stay in the address bar or in history. The person can
also launch it from the application menu from now on.

Confirm it really came up:

```bash
for _ in $(seq 1 60); do [ -f ~/.omnisci/desktop.lock ] && break; sleep 0.5; done
port=$(sed -n 's/.*"port"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' ~/.omnisci/desktop.lock)
curl -fsS "http://127.0.0.1:$port/api/health"
```

Expected, on one line:

```json
{"ok":true,"version":"0.1.0","port":54321,"workspace":"/home/<name>/OmniScientist"}
```

If `desktop.lock` never appears, the service did not start. Read the newest file in
`~/.omnisci/logs/` and report what it says. Do not launch it again; the lock file
exists precisely to stop a second service.

Useful flags, if a default is wrong for this machine: `-w, --workspace <dir>` (default
`~/OmniScientist`), `-p, --port <n>` (default 0, meaning pick a free one), `--no-open`
to print the address instead of opening a browser, and `-v, --verbose` to mirror the
log to stderr.

## Step 6 — the two things that live outside the app

A run reaches a compiled PDF only with **Python 3.10 or newer** (numpy, pandas,
matplotlib, scipy, scikit-learn, sympy, imageio, soundfile) and
**[tectonic](https://tectonic-typesetting.github.io/)**, which compiles the LaTeX.
Without tectonic a run still produces the `.tex`, says so, and stops there.

The desktop edition detects both on first use and offers to install them under
`~/.local/share/omniscientist`, touching nothing else. **Let it.** Do not install them
through the distribution package manager on the person's behalf.

For your report, record what is already there:

```bash
python3 --version 2>&1; command -v tectonic || echo "tectonic: not installed"
```

## Step 7 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist Desktop is installed at `~/.local/bin/omnisci-desktop` and running.
> Workspace: `<workspace from the health check>`. Credentials: `<written / skipped>`.
> Python `<version or missing>`, tectonic `<present or missing>`.
>
> It is in your application menu as OmniScientist, and the workbench is open in your
> browser. Drop a folder of raw data into the workspace and tell it a research
> direction. If it offers to install Python or tectonic on the first run, say yes:
> those two are what turn a finished analysis into a PDF.
>
> To remove it later, rerun the unpacked `install.sh --uninstall`.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Troubleshooting

**`curl: (22) ... 404`** on the tarball. That architecture was not published in this
release. Report it; do not substitute a different asset name.

**`Exec format error`.** An `x86_64` binary on an ARM machine, or the reverse. Uninstall
and take the matching build.

**No application menu entry.** The desktop database was not refreshed because
`update-desktop-database` is not installed. `omnisci-desktop` on the command line works
regardless, and most desktops pick the entry up after a re-login.

**The browser page says it needs the launcher.** The page was opened at
`127.0.0.1:<port>` without the one-time token, or the cookie expired after a day.
Relaunch from the application menu.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

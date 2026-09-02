# OmniScientist Desktop on Linux

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. This document is the whole procedure; you do
not need anything you remember from elsewhere.

When you are done they will have OmniScientist installed as a system package
(`omni-scientist`), an entry in their application menu, and a research workspace open
in its own native window. Everything runs locally; the service behind the window binds
`127.0.0.1` only.

## Ground rules

1. Run each command as written. Do not substitute snap, flatpak, or a download URL you
   remember. There is exactly one supported path and it is below.
2. **Never invent, guess, or reuse an API key.** If a step needs one, ask the person
   and wait.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download, do not fall back to another edition.
4. **The one root step is installing the package** (`sudo apt install` in step 3, which
   is how any .deb lands). Have the person type their own password. Nothing else in
   this document needs root.
5. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — confirm this is the right document

```bash
uname -s; [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && echo "graphical session" || echo "no display"
```

`uname -s` must print `Linux`. If it prints `Darwin`, use
<https://omni-scientist.github.io/setup/mac-desktop.md> instead.

If it printed **`no display`**, this is a server, a container, or an SSH session
without X or Wayland forwarding. The desktop edition is a native window and has
nowhere to draw one. Stop here and use
<https://omni-scientist.github.io/setup/skill.md>, the headless path: it runs inside the
agent they are talking to and needs no API key (the standalone CLI is discontinued;
<https://omni-scientist.github.io/setup/cli.md> explains). Say so plainly rather than
installing something that cannot start.

## Step 1 — read the machine

```bash
uname -m; . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"
```

The desktop package is a `.deb` for **x86_64 on Debian-family systems** (Debian,
Ubuntu, Mint and friends). Two cases to stop on:

- `aarch64`: no ARM desktop build is published. Report it and offer the skill,
  <https://omni-scientist.github.io/setup/skill.md>; the discontinued CLI's ARM builds are gone too.
- A non-Debian distribution (Fedora, Arch, openSUSE): there is no rpm or AUR package.
  Report it and offer the skill, same link as above.

## Step 2 — download and verify

```bash
set -eu
[ "$(uname -m)" = x86_64 ] || { echo "only x86_64 is published for the desktop" >&2; exit 1; }
pgrep -x OmniScientist >/dev/null && {
  echo "OmniScientist is currently running; ask the person to quit it, then rerun" >&2; exit 1; }
asset="OmniSci-Desktop-Linux-x64.deb"
base="https://github.com/Omni-Scientist/OmniScientist/releases/latest/download"
work="$HOME/.cache/omniscientist-install"
rm -rf "$work"; mkdir -p "$work"; cd "$work"

curl -fsSL --retry 3 -O "$base/$asset"
curl -fsSL --retry 3 -O "$base/SHA256SUMS"
grep " $asset\$" SHA256SUMS | sha256sum -c
```

Expected: a line ending in `: OK`. If the checksum does not match, delete the file and
stop. Do not install it anyway.

## Step 3 — install the package

```bash
sudo apt install -y "$HOME/.cache/omniscientist-install/OmniSci-Desktop-Linux-x64.deb"
```

`apt` resolves the desktop dependencies (webkit2gtk and friends) at the same time,
which is why this is `apt install` on a file rather than `dpkg -i`. This is the one
root step; the person types their own password.

Then clean up the download:

```bash
rm -rf "$HOME/.cache/omniscientist-install"
```

Removing it later is `sudo apt remove omni-scientist`, like any other package. The
workspace and `~/.omnisci` are left alone.

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
OmniScientist &
```

A native window opens, shows a short loading screen, then the workspace. The person
can also launch it from the application menu from now on. Behind the window a local
service binds `127.0.0.1` only, takes a free port, and hands the window a one-time
token that is immediately exchanged for an `HttpOnly` cookie, so nothing on the
network can reach the session.

Confirm it really came up:

```bash
for _ in $(seq 1 60); do [ -f ~/.omnisci/desktop.lock ] && break; sleep 0.5; done
port=$(sed -n 's/.*"port"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' ~/.omnisci/desktop.lock)
curl -fsS "http://127.0.0.1:$port/api/health"
```

Expected, on one line:

```json
{"ok":true,"version":"0.2.0","port":54321,"workspace":"/home/<name>/OmniScientist"}
```

If `desktop.lock` never appears, the service did not start. Read the newest file in
`~/.omnisci/logs/` and report what it says. Do not launch it again; the lock file
exists precisely to stop a second service.

## Step 6 — the two things that live outside the app

A run reaches a compiled PDF only with **Python 3.10 or newer** (numpy, pandas,
matplotlib, scipy, scikit-learn, sympy, imageio, soundfile) and
**[tectonic](https://tectonic-typesetting.github.io/)**, which compiles the LaTeX.
Without tectonic a run still produces the `.tex`, says so, and stops there.

The desktop edition detects both at first launch and installs what is missing under
its own data directory automatically, touching nothing else. **Let it work.** Do not
install them through the distribution package manager on the person's behalf.

For your report, record what is already there:

```bash
python3 --version 2>&1; command -v tectonic || echo "tectonic: not installed"
```

## Step 7 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist Desktop is installed (package `omni-scientist`) and running.
> Workspace: `<workspace from the health check>`. Credentials: `<written / skipped>`.
> Python `<version or missing>`, tectonic `<present or missing>`.
>
> It is in your application menu as OmniScientist, and the workbench is open in its
> own window. Drop a folder of raw data into the workspace and tell it a research
> direction. On first use it sets up its own Python environment and LaTeX compiler,
> so the first run takes a few extra minutes.
>
> To remove it later: `sudo apt remove omni-scientist`.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Troubleshooting

**`curl: (22) ... 404`** on the .deb. There is no published asset by that name in the
latest release. Report it; do not substitute a different asset name.

**`apt` reports unmet dependencies.** That normally means a non-Debian system or a
very old release. Report the exact output and fall back to
the skill, <https://omni-scientist.github.io/setup/skill.md>; do not force the install with
`dpkg -i`.

**No application menu entry.** Most desktops pick the entry up immediately; some need
a re-login. `OmniScientist` on the command line works regardless.

**The window stays on the loading screen.** A cold first start can take twenty seconds
or so and the screen says as much. If it never moves on, quit the app, read the newest
file in `~/.omnisci/logs/`, and report what it says.

**Inside WSL2, the health check times out while the log looks perfectly healthy.**
WSL2's mirrored networking mode can wedge IPv4 loopback for the whole distro (even a
listener cannot connect to itself). That is an environment fault, not an install
fault; `wsl --shutdown` from the Windows side and reopening the distro usually clears
it.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

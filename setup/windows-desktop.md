# OmniScientist Desktop on Windows

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. Everything here is PowerShell. This document is
the whole procedure; you do not need anything you remember from elsewhere.

When you are done they will have OmniScientist installed under
`%LOCALAPPDATA%\OmniScientist`, a Start menu entry, and a research workspace open in
its own native window. No step needs an administrator: the installer is per-user by
design.

## Ground rules

1. Run each command as written. Do not substitute winget, choco, scoop, or a download
   URL you remember. There is exactly one supported path and it is below.
2. **Never invent, guess, or reuse an API key.** If a step needs one, ask the person
   and wait.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download and do not improvise around it.
4. **Never run PowerShell as administrator for this.** Everything is per user.
5. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — confirm this is the right document

```powershell
$PSVersionTable.PSVersion.ToString(); $env:PROCESSOR_ARCHITECTURE
```

If this is not Windows, stop and use the matching document:
[macOS](https://omni-scientist.github.io/setup/mac-desktop.md),
[Linux desktop](https://omni-scientist.github.io/setup/linux-desktop.md),
[terminal or headless](https://omni-scientist.github.io/setup/cli.md).

If `PROCESSOR_ARCHITECTURE` is **`ARM64`**: only the x64 installer is published.
Windows on ARM runs x64 binaries through its emulation layer; tell the person that
before you continue, and if step 4 fails, move to step 6 rather than hunting for an
ARM build that does not exist.

If they are inside an agent already and want no API key at all, the skill edition is a
better fit: <https://omni-scientist.github.io/setup/skill.md>.

## Step 1 — download and verify

The installer has a fixed name, so the latest release is one URL away. Download it and
the release checksum list, then compare:

```powershell
$ErrorActionPreference = 'Stop'
$base = 'https://github.com/Omni-Scientist/OmniScientist/releases/latest/download'
$work = Join-Path $env:TEMP 'omniscientist-install'
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $work | Out-Null
$setup = Join-Path $work 'OmniSci-Desktop-Windows-x64-setup.exe'
Invoke-WebRequest -Uri "$base/OmniSci-Desktop-Windows-x64-setup.exe" -OutFile $setup -UseBasicParsing

$sums = (Invoke-WebRequest -Uri "$base/SHA256SUMS" -UseBasicParsing).Content
$line = $sums -split "`n" | Where-Object { $_ -match 'OmniSci-Desktop-Windows-x64-setup\.exe' } | Select-Object -First 1
if (-not $line) { throw 'SHA256SUMS has no entry for the installer' }
$want = ($line -split '\s+')[0]
$got = (Get-FileHash -Algorithm SHA256 $setup).Hash.ToLower()
if ($got -ne $want.ToLower()) { throw "checksum mismatch: got $got, expected $want" }
'checksum ok'
```

If the checksum does not match, delete the file and stop. Do not install it anyway.

## Step 2 — install for the current user

```powershell
Start-Process -FilePath $setup -ArgumentList '/S' -Wait
Test-Path (Join-Path $env:LOCALAPPDATA 'OmniScientist\OmniScientist.exe')
```

Expected: `True`. `/S` runs the installer silently; it copies the app to
`%LOCALAPPDATA%\OmniScientist`, writes a Start menu entry and an uninstaller, and
needs no elevation.

The binary carries publisher and version metadata but is not signed with a purchased
certificate, so Windows Defender SmartScreen may interpose a warning. If it does, show
it to the person and let them decide; do not click through on their behalf. Once the
person confirms the install works, `Remove-Item -Recurse -Force $work` is safe.

## Step 3 — credentials

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

Write only the keys they actually gave you. **Write it without a byte order mark.**
The file is parsed strictly as data, one `KEY=VALUE` per line, and a BOM turns the
first key into an unrecognised name, at which point the whole file is ignored rather
than half read. `Set-Content -Encoding UTF8` on Windows PowerShell 5.1 writes a BOM,
so do not use it here:

```powershell
$dir = Join-Path $env:USERPROFILE '.omnisci'
New-Item -ItemType Directory -Force $dir | Out-Null
$lines = @(
  'DEEPSEEK_API_KEY=<paste>'
  'ANTHROPIC_API_KEY=<paste>'
)
[IO.File]::WriteAllText((Join-Path $dir 'env'),
  ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))
```

If the person would rather not hand over keys now, skip this and say so in your report.
The app starts without them and its interface offers to set them.

## Step 4 — first launch

```powershell
Start-Process (Join-Path $env:LOCALAPPDATA 'OmniScientist\OmniScientist.exe')
```

A native window opens, shows a short loading screen, then the workspace. Behind it a
local service binds `127.0.0.1` only, takes a free port, and hands the window a
one-time token that is immediately exchanged for an `HttpOnly` cookie, so nothing on
the network can reach the session.

Confirm it really came up rather than trusting the window:

```powershell
$lock = Join-Path $env:USERPROFILE '.omnisci\desktop.lock'
for ($i = 0; $i -lt 60 -and -not (Test-Path $lock); $i++) { Start-Sleep -Milliseconds 500 }
if (-not (Test-Path $lock)) { throw 'the service never wrote a lock file' }
$port = (Get-Content $lock -Raw | ConvertFrom-Json).port
Invoke-RestMethod "http://127.0.0.1:$port/api/health"
```

Expected: an object with `ok = True`, version `0.2.0` or later, the port, and the
workspace, which defaults to `%USERPROFILE%\OmniScientist`.

If the lock file never appears, the service did not start. The logs are in
`%USERPROFILE%\.omnisci\logs`; read the newest one and report what it says. Do not
launch it a second time, the lock file exists precisely to stop a second service.

## Step 5 — the two things that live outside the app, and the shell

A run reaches a compiled PDF only with **Python 3.10 or newer** (numpy, pandas,
matplotlib, scipy, scikit-learn, sympy, imageio, soundfile) and
**[tectonic](https://tectonic-typesetting.github.io/)**, which compiles the LaTeX.
Without tectonic a run still produces the `.tex`, says so, and stops there.

The workbench checks for both on first use and offers to install them under its own
data directory. **Let it.** Do not install them yourself.

One Windows specific behaviour worth telling the person about: if WSL is installed, the
agent's `bash` tool runs through WSL by default. `OMNISCI_SHELL=cmd` or
`OMNISCI_SHELL=bash` overrides that. If WSL is present and its Python is not the one
they expect their data to be read by, this is the setting that explains it.

For your report:

```powershell
python --version 2>&1
if (Get-Command tectonic -ErrorAction SilentlyContinue) { 'tectonic: present' } else { 'tectonic: not installed' }
wsl --status 2>&1 | Select-Object -First 1
```

## Step 6 — if the desktop app will not run

The terminal edition is the fallback and installs in one line:

```powershell
irm https://raw.githubusercontent.com/Omni-Scientist/OmniScientist/main/install.ps1 | iex
```

It puts `omnisci.exe` in `%LOCALAPPDATA%\OmniScientist\bin` and adds it to the user
`PATH`, which takes effect in a new terminal. It reads the same
`%USERPROFILE%\.omnisci\env` you wrote in step 3, so nothing there is wasted. Verify
with `omnisci --help`.

Use this only if the desktop app genuinely failed, and say in your report that you
fell back and why.

## Step 7 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist Desktop is installed at
> `%LOCALAPPDATA%\OmniScientist\OmniScientist.exe` and running.
> Workspace: `<workspace from the health check>`. Credentials: `<written / skipped>`.
> Python `<version or missing>`, tectonic `<present or missing>`.
>
> Open it from the Start menu as OmniScientist. Drop a folder of raw data into the
> workspace and tell it a research direction. If it offers to install Python or
> tectonic on the first run, say yes: those two are what turn a finished analysis into
> a PDF.
>
> To uninstall: Settings, Apps, OmniScientist, or run
> `%LOCALAPPDATA%\OmniScientist\uninstall.exe`.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Troubleshooting

**`Invoke-WebRequest` returns 404.** There is no published asset by that name in the
latest release. Report it; do not substitute a different asset name. The terminal
edition in step 6 still works.

**The checksum does not match.** The download is wrong. Delete it and stop. Do not
install it anyway.

**SmartScreen blocks the installer or the app.** The binary is not signed with a
purchased certificate. That is a fact for the person to decide about; show them the
dialog and let them choose "More info", then "Run anyway", themselves.

**The window stays on the loading screen.** A cold first start can take twenty seconds
or so and the screen says as much. If it never moves on, quit the app, read the newest
file in `%USERPROFILE%\.omnisci\logs`, and report what it says.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

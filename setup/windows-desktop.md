# OmniScientist Desktop on Windows

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. Everything here is PowerShell. This document is
the whole procedure; you do not need anything you remember from elsewhere.

When you are done they will have `OmniScientist.exe` under
`%LOCALAPPDATA%\Programs\OmniScientist`, a Start menu entry, and a research workspace
open in their own browser at `127.0.0.1`. No step needs an administrator.

**Read this before you start.** The Windows desktop package is built and smoke tested
on a real Windows runner in CI: the package is produced, it contains a GUI subsystem
executable, it starts, it publishes a session and it answers `/api/health`. What has
**not** happened is a full paper run on Windows by a person. Treat this as a first
install, tell the person so in your report, and pass back what actually worked. If it
does not come up, the terminal edition is the tested fallback and step 7 says how.

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

If `PROCESSOR_ARCHITECTURE` is **`ARM64`**: only the x64 package is published. Windows
on ARM does run x64 binaries under emulation, but nobody has confirmed this one does.
Tell the person that before you continue, and if step 4 fails, move to step 7 rather
than hunting for an ARM build that does not exist.

If they are inside an agent already and want no API key at all, the skill edition is a
better fit: <https://omni-scientist.github.io/setup/skill.md>.

## Step 1 — find the package in the latest release

The desktop zip carries its version in the filename, so there is no fixed
`latest/download` URL for it. Ask the release API which file to take:

```powershell
$ErrorActionPreference = 'Stop'
$rel = Invoke-RestMethod 'https://api.github.com/repos/Omni-Scientist/OmniScientist/releases/latest'
$asset = $rel.assets | Where-Object { $_.name -like 'OmniScientist-*-windows-*.zip' } | Select-Object -First 1
if (-not $asset) { throw 'this release has no Windows desktop package' }
$sum = $rel.assets | Where-Object { $_.name -eq ($asset.name + '.sha256') } | Select-Object -First 1
"$($rel.tag_name)  $($asset.name)  $([math]::Round($asset.size/1MB,1)) MB"
```

If it throws `this release has no Windows desktop package`, the desktop zip is attached
only to tagged releases. Report that and go to step 7; do not download a CLI asset and
call it the desktop.

## Step 2 — download and verify

```powershell
$work = Join-Path $env:TEMP 'omniscientist-install'
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $work | Out-Null
$zip = Join-Path $work $asset.name
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing

if ($sum) {
  $want = ((Invoke-WebRequest -Uri $sum.browser_download_url -UseBasicParsing).Content -split '\s+')[0]
  $got  = (Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower()
  if ($got -ne $want.ToLower()) { throw "checksum mismatch: got $got, expected $want" }
  'checksum ok'
} else { 'no checksum published for this asset, skipped' }
```

If the checksum does not match, delete the file and stop. Do not install it anyway.

## Step 3 — install for the current user

The zip unpacks to a single folder named after the version, holding
`OmniScientist.exe`, `install.ps1`, `uninstall.ps1`, and a `README.txt`.

```powershell
Expand-Archive -Path $zip -DestinationPath $work -Force
$pkg = Get-ChildItem -Directory $work | Where-Object { $_.Name -like 'OmniScientist-*-windows-*' } | Select-Object -First 1
powershell -ExecutionPolicy Bypass -File (Join-Path $pkg.FullName 'install.ps1')
```

That copies the executable to `%LOCALAPPDATA%\Programs\OmniScientist\OmniScientist.exe`
and creates a Start menu shortcut. It touches nothing else and needs no elevation.

`-ExecutionPolicy Bypass` is scoped to that one child process and does not change the
machine's policy. Do not run `Set-ExecutionPolicy` instead.

Keep `$pkg` for now; step 7 and the uninstall instructions refer to it. Once the person
confirms it works, `Remove-Item -Recurse -Force $work` is safe, and uninstalling later
only needs `install.ps1 -Uninstall` from a fresh copy of the package.

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

## Step 5 — first launch

```powershell
Start-Process (Join-Path $env:LOCALAPPDATA 'Programs\OmniScientist\OmniScientist.exe')
```

The service binds `127.0.0.1` only, takes a free port, and hands the browser a one-time
token in the URL, which the server immediately exchanges for an `HttpOnly` cookie and
redirects, so the token does not stay in the address bar or in history.

Confirm it really came up rather than trusting the window:

```powershell
$lock = Join-Path $env:USERPROFILE '.omnisci\desktop.lock'
for ($i = 0; $i -lt 60 -and -not (Test-Path $lock); $i++) { Start-Sleep -Milliseconds 500 }
if (-not (Test-Path $lock)) { throw 'the service never wrote a lock file' }
$port = (Get-Content $lock -Raw | ConvertFrom-Json).port
Invoke-RestMethod "http://127.0.0.1:$port/api/health"
```

Expected: an object with `ok = True`, a version, the port, and the workspace, which
defaults to `%USERPROFILE%\OmniScientist`.

If the lock file never appears, the service did not start. The logs are in
`%USERPROFILE%\.omnisci\logs`; read the newest one and report what it says. Do not
launch it a second time, the lock file exists precisely to stop a second service. If
Windows Defender SmartScreen blocked it, say so explicitly in your report: the
executable carries publisher and version metadata but is not signed with a purchased
certificate, and that is a fact the person should decide about, not something you
should click through on their behalf.

Useful flags if a default is wrong: `-w, --workspace <dir>`, `-p, --port <n>`,
`--no-open` to print the address instead of opening a browser, `-v, --verbose`.

## Step 6 — the two things that live outside the app, and the shell

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

## Step 7 — if the desktop package will not run

The terminal edition is the tested Windows path and installs in one line:

```powershell
irm https://raw.githubusercontent.com/Omni-Scientist/OmniScientist/main/install.ps1 | iex
```

It puts `omnisci.exe` in `%LOCALAPPDATA%\OmniScientist\bin` and adds it to the user
`PATH`, which takes effect in a new terminal. It reads the same
`%USERPROFILE%\.omnisci\env` you wrote in step 4, so nothing there is wasted. Verify
with `omnisci --help`.

Use this only if the desktop package genuinely failed, and say in your report that you
fell back and why.

## Step 8 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist Desktop is installed at
> `%LOCALAPPDATA%\Programs\OmniScientist\OmniScientist.exe` and running.
> Workspace: `<workspace from the health check>`. Credentials: `<written / skipped>`.
> Python `<version or missing>`, tectonic `<present or missing>`.
>
> Open it from the Start menu as OmniScientist. Drop a folder of raw data into the
> workspace and tell it a research direction. If it offers to install Python or
> tectonic on the first run, say yes: those two are what turn a finished analysis into
> a PDF.
>
> One caveat worth knowing: the Windows build passes its automated checks on a Windows
> runner, but no one has driven a full paper run on Windows yet. If something breaks,
> that report is genuinely useful to the project.
>
> To uninstall: run `install.ps1 -Uninstall` from the package folder. Add `-PurgeData`
> to also delete the managed dependencies and `%USERPROFILE%\.omnisci`.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Troubleshooting

**`this release has no Windows desktop package`.** The zip is attached to tagged
releases only. Use step 7.

**`Expand-Archive` fails or the folder is empty.** The download is incomplete. Delete
`$env:TEMP\omniscientist-install` and redo step 2 once. If it fails again, stop.

**A black console window flashes on launch.** That is a console subsystem build, which
the release pipeline rejects. It means the executable did not come from a release.
Report it and reinstall from step 1.

**The browser page says it needs the launcher.** The page was opened at
`127.0.0.1:<port>` without the one-time token, or the cookie expired after a day.
Reopen from the Start menu.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

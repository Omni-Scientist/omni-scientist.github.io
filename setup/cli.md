# OmniScientist CLI, the terminal agent

You are an AI agent setting up OmniScientist for the person you are talking to.
Work through the steps below in order. This document is the whole procedure; you do
not need anything you remember from elsewhere.

When you are done they will have one executable called `omnisci` on their `PATH`. It is
a general terminal agent with file, shell, search, and vision tools, and the paper
workflow travels inside it as a skill that activates only when a paper is actually
asked for. There is no window and no browser: it runs where they already work, over
SSH, in tmux, or unattended in a container.

## Ground rules

1. Run each command as written. Do not substitute brew, apt, npm, or a download URL you
   remember. There is exactly one supported path per platform and both are below.
2. **Never invent, guess, or reuse an API key.** If a step needs one, ask the person
   and wait.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download and do not improvise around it.
4. **No `sudo` for the agent itself.** It installs under the home directory. Step 5 is
   the only place root can come up, and it is optional.
5. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — confirm this is the right document

```bash
uname -s -m
```

If they want the browser workspace with a menu bar icon rather than a terminal, they
want the desktop edition: [macOS](https://omni-scientist.github.io/setup/mac-desktop.md),
[Windows](https://omni-scientist.github.io/setup/windows-desktop.md),
[Linux](https://omni-scientist.github.io/setup/linux-desktop.md). If they are inside an
agent already and want no API key at all, they want the skill:
<https://omni-scientist.github.io/setup/skill.md>.

Otherwise carry on. Published builds are macOS `arm64` and `x86_64`, Linux `x86_64` and
`arm64`, and Windows `x86_64`.

## Step 1 — install

**macOS and Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/Omni-Scientist/OmniScientist/main/install.sh | sh
```

**Windows, in PowerShell:**

```powershell
irm https://raw.githubusercontent.com/Omni-Scientist/OmniScientist/main/install.ps1 | iex
```

The installer downloads exactly one file. The skill is embedded in the binary and is
written out to the application data directory on first run, so there is nothing to
unpack and no directory layout to keep intact. It verifies the published checksum when
the release carries one and says so when it does not.

It lands in `~/.local/bin` on macOS and Linux, and in
`%LOCALAPPDATA%\OmniScientist\bin` on Windows, where it also adds itself to the user
`PATH`. `BIN_DIR=/usr/local/bin` puts it somewhere else, `VERSION=v0.1.0` pins a
release.

On Apple silicon the installer ad-hoc signs the binary, because the kernel refuses to
execute an unsigned one. That is unrelated to Gatekeeper: a file fetched with `curl`
never carries the quarantine attribute, so Gatekeeper is never consulted. Do not tell
the person to download it in a browser.

## Step 2 — make sure the shell can find it

```bash
command -v omnisci || echo "not on PATH"
```

If it is not found, `~/.local/bin` is not on `PATH`. Add it to the profile the person
actually uses and say so in your report:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # or ~/.bashrc
```

On Windows the installer edits the user `PATH`, which only takes effect in a **new**
terminal. Open one rather than trying to force it in the current session.

## Step 3 — credentials

Ask the person for what they have, in your own words:

- `DEEPSEEK_API_KEY` is required. It drives the reasoning.
- `ANTHROPIC_API_KEY` is the perception sidecar. The DeepSeek endpoint accepts text
  parts only, so `view_image` sends pixels to a vision model and gets back a bounded
  factual observation. Text-only work does not need it, but nearly every interesting
  run does. Override the choice with `OMNISCI_VISION_PROVIDER` and
  `OMNISCI_VISION_MODEL`.

For any other OpenAI-compatible endpoint, `OMNISCI_BASE_URL`, `OMNISCI_API_KEY`, and
`OMNISCI_MODEL` replace the DeepSeek key.

```bash
mkdir -p ~/.omnisci
umask 177
cat > ~/.omnisci/env <<'ENV'
DEEPSEEK_API_KEY=<paste>
ANTHROPIC_API_KEY=<paste>
ENV
chmod 600 ~/.omnisci/env
```

On Windows the file is `%USERPROFILE%\.omnisci\env` and it must be written **without a
byte order mark**, which `Set-Content -Encoding UTF8` on PowerShell 5.1 adds:

```powershell
$dir = Join-Path $env:USERPROFILE '.omnisci'
New-Item -ItemType Directory -Force $dir | Out-Null
[IO.File]::WriteAllText((Join-Path $dir 'env'),
  "DEEPSEEK_API_KEY=<paste>`nANTHROPIC_API_KEY=<paste>`n",
  (New-Object System.Text.UTF8Encoding($false)))
```

The file is parsed strictly as data and is **never sourced as shell**, deliberately: a
command substitution in a credential file would otherwise run on the host. One
`KEY=VALUE` per line, an optional `export` prefix, matching quotes. Anything else and
the whole file is ignored rather than half read. At startup the values are handed over
through a one-time file descriptor and removed from the environment, so the analysis
scripts and shell commands the agent runs do not inherit them.

## Step 4 — verify

```bash
omnisci --help
```

It should print the usage block, which is also the flag reference worth knowing:

```
  -C, --cwd <dir>         workspace, defaults to the current directory
  -d, --data <dir>        take this data directory as the workspace and go
                          end to end to a candidate paper
      --auto-approve      turn off the approval gate (controlled directories only)
      --resume <id>       continue a session, cache included
```

Opening a workspace does **not** start a paper run. `--data` is the only thing that
does, and it exits non-zero unless the run used the dedicated `omnisci_record`,
`omnisci_bib`, and `omnisci_compile` tools, the receipts match the ledger,
bibliography, manifest, TeX, and PDF hashes, the gate passed on that exact TeX, and
every evidence image and figure carries a current `view_image` receipt.

## Step 5 — the two things that live outside the binary

Unlike the desktop edition, the CLI does not install these for anyone. A run reaches a
compiled paper only with both.

**Python 3.10 or newer** with numpy, pandas, matplotlib, scipy, scikit-learn, sympy,
imageio, and soundfile:

```bash
python3 -c 'import numpy, pandas, matplotlib, scipy, sklearn, sympy, imageio, soundfile; print("python stack ok")'
```

**[tectonic](https://tectonic-typesetting.github.io/)**, which compiles the LaTeX.
Without it a run still perceives the evidence, runs the analysis, draws the figures,
assembles the `.tex`, says tectonic is missing, and stops there. Ask before installing
it, because the straightforward route wants `sudo`:

```bash
# x86_64
curl -fsSL https://drop-sh.fullyjustified.net | sh && sudo mv tectonic /usr/local/bin/

# ARM (Apple silicon, Graviton, Jetson): the wrong architecture fails with
# "Exec format error", so take the matching build
V=0.17.0; A=$(uname -m)          # aarch64 or x86_64
curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40$V/tectonic-$V-$A-unknown-linux-musl.tar.gz" \
  | sudo tar -xz -C /usr/local/bin tectonic
```

Anything on `PATH` is used, so `~/.local/bin` is fine too and skips the `sudo`.

## Step 6 — report

Say only this, with the placeholders filled in from what you actually observed:

> `omnisci` is installed at `<path>` and answers `--help`.
> Credentials: `<written / skipped>`. Python `<version or missing>`,
> tectonic `<present / installed / missing, runs will stop at the .tex>`.
>
> Interactive, in whatever directory you are in:
> `omnisci`
>
> One shot, no session:
> `omnisci -C ~/work "why is the build failing"`
>
> Data in, candidate paper out:
> `omnisci --data ~/slides`
>
> Only the last one starts a paper run, and it exits non-zero unless every number in
> the manuscript traces back to a real recorded run.

If any step failed, say which one, paste the exact output, and stop. Do not report a
partial install as a success.

## Unattended: containers and CI

For a build server, a scheduled job, or a CI runner, use the image rather than the bare
binary. It carries tectonic and the whole scientific Python stack, so the runner needs
neither, and it runs the agent under a real sandbox.

```bash
git clone --depth 1 https://github.com/Omni-Scientist/OmniScientist.git
docker build -f OmniScientist/cli/docker/Dockerfile -t omnisci:local OmniScientist/cli
```

The build context is `cli/`, not the repository root. Then:

```bash
OmniScientist/cli/docker/run.sh /absolute/path/to/data \
  --data /work --auto-approve \
  "State the research direction here, in one or two sentences."
```

`run.sh` reads `~/.omnisci/env`, or `OMNISCI_ENV_FILE` if you point it elsewhere, and
refuses to start without one. The sandbox it sets up is worth knowing, because a job
that fights it looks like a mysterious failure: the root filesystem is read only, all
capabilities are dropped, `no-new-privileges` is set, PIDs are capped at 1024
(`OMNISCI_PIDS_LIMIT` raises it), and `/tmp` and the home directory are tmpfs. **The
mounted data directory is the only writable place that survives the run**, and
everything the run produces lands there:

```
series.json
host/paper.tex
host/paper.pdf
host/paper_overleaf.zip
host/paper.manifest.json
host/paper_review/*.png
```

`--auto-approve` turns off the approval gate, which is correct here and only here:
that gate exists for an interactive session and there is nobody to approve. It does not
disable the hard blocks in `guard.ts`, which are enforced in code and refuse `rm`,
`find -delete`, `shred`, `truncate`, `mkfs`, `rsync --delete`, `qdel`, `git push`, and
`git reset --hard` regardless of the flag.

A GitHub Actions job, as a shape to adapt rather than paste. Note the timeout: a full
run is long, and a job that dies at the default limit looks like a crash when it was a
clock.

```yaml
jobs:
  omniscientist:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4          # the data lives in this repository

      - name: Fetch OmniScientist
        run: git clone --depth 1 https://github.com/Omni-Scientist/OmniScientist.git .omniscientist

      - name: Build the image
        run: docker build -f .omniscientist/cli/docker/Dockerfile -t omnisci:local .omniscientist/cli

      - name: Credentials
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          mkdir -p ~/.omnisci && umask 177
          printf 'DEEPSEEK_API_KEY=%s\nANTHROPIC_API_KEY=%s\n' \
            "$DEEPSEEK_API_KEY" "$ANTHROPIC_API_KEY" > ~/.omnisci/env

      - name: Run
        run: |
          .omniscientist/cli/docker/run.sh "$PWD/case" \
            --data /work --auto-approve \
            "Read the evidence in this folder and take one defensible quantitative
             question through to a compiled paper."

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: paper
          path: |
            case/host/paper.pdf
            case/host/paper.tex
            case/host/paper.manifest.json
```

Two things to tell the person about this job. It costs real API money every time it
runs, so a schedule or a manual trigger is almost always right and a push trigger
almost never is. And the step fails when the paper is not grounded, which is the
intended behaviour: that failure is the check, not a flake to retry.

## Troubleshooting

**`omnisci: command not found`** after installing. `~/.local/bin` is not on `PATH`, or
on Windows the terminal predates the install. See step 2.

**`curl: (22) ... 404`** from the installer. There is no published build for that
platform and architecture. Report it; do not substitute a different asset.

**`Exec format error`.** An `x86_64` binary on an ARM machine, or the reverse, and the
same message from tectonic means the same thing.

**The run stops at the `.tex`.** tectonic is missing. That is designed behaviour, not a
crash.

**A refusal with a rewritten command attached.** That is `guard.ts`, not the model being
difficult. The blocks are enforced in code before the approval gate, and
`--auto-approve` does not reach them. Machine-specific rules go in
`~/.omnisci/guard-rules.json`; the repository ships a
`cli/guard-rules.example.json` to copy.

**`env 文件格式错误`.** A line in the credential file is not `KEY=VALUE`. The parser
refuses the whole file rather than half reading it, on purpose. Fix the line.

**Exit code 137 in Docker.** The container was killed for memory. Raise the runner's
memory or the Docker limit.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script the agent just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

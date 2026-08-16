# OmniScientist headless, in Docker

You are an AI agent setting up OmniScientist to run **unattended**: a CI job, a build
server, a container, or any machine with no display and nobody sitting in front of it.
Work through the steps below in order.

The shape of it: data goes in, a candidate paper comes out, and the process exits
non-zero if the paper is not properly grounded. That last part is what makes this
usable as a CI step rather than a demo. The run has to have used the dedicated
`omnisci_record`, `omnisci_bib`, and `omnisci_compile` tools; the receipts have to match
the ledger, bibliography, manifest, TeX, and PDF hashes; the gate has to have passed on
that exact TeX; and every evidence image and figure has to carry a current `view_image`
receipt. Anything short of that is a failure exit code, not a warning.

Docker is the supported way to do this. The image carries tectonic and the whole
scientific Python stack, so the runner needs neither.

## Ground rules

1. Run each command as written.
2. **Never invent, guess, or reuse an API key.** In CI they come from the secret store,
   never from a literal in a file you commit. If you cannot find them, ask; do not
   proceed with a placeholder.
3. **On failure, stop.** Report the command and its exact output, and say which step
   failed.
4. **Never commit a credential.** Step 3 writes one file outside the repository and it
   stays there.
5. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — confirm this is the right document

```bash
uname -s; docker --version || echo "docker: not installed"
```

If this machine has a graphical session and the person wants the browser workspace,
they want the desktop edition instead:
[macOS](https://omni-scientist.github.io/setup/mac-desktop.md),
[Linux](https://omni-scientist.github.io/setup/linux-desktop.md),
[Windows](https://omni-scientist.github.io/setup/windows-desktop.md).

If Docker is not installed and cannot be, skip to the appendix at the end, which is the
bare binary path. Do not install Docker on someone's build server without asking.

## Step 1 — get the source

The image is built from the repository, because that is where the Dockerfile and the
agent's own source live.

```bash
set -eu
git clone --depth 1 https://github.com/Omni-Scientist/OmniScientist.git
cd OmniScientist
ls cli/docker
```

Expected: `Dockerfile`, `run.sh`, `entrypoint.sh`, `smoke.sh`, `e2e.sh`, `test.sh`,
`test-api.sh`, `fixtures`.

## Step 2 — build the image

```bash
docker build -f cli/docker/Dockerfile -t omnisci:local cli
```

The build context is `cli/`, not the repository root. It pins tectonic 0.17.0, creates
a virtualenv at `/opt/omnisci/.venv` with the skill's requirements, and drops to an
unprivileged `bun` user. Expect several minutes the first time and almost nothing
afterwards.

Confirm the two things that a paper run cannot proceed without:

```bash
docker run --rm --entrypoint sh omnisci:local -c 'tectonic --version && python3 -c "import numpy, pandas, matplotlib, scipy, sklearn, sympy, imageio, soundfile; print(\"python stack ok\")"'
```

## Step 3 — credentials

Ask the person where these come from on this machine. In CI the answer is the secret
store; on a build server it is usually a file only the service account can read.

- `DEEPSEEK_API_KEY` is required. It drives the reasoning.
- `ANTHROPIC_API_KEY` is the perception sidecar. The DeepSeek endpoint accepts text
  only, so pixels go to a vision model that returns a bounded factual observation.
  Every run that looks at images, spectra, video, or 3-D data needs it.

`cli/docker/run.sh` reads an env file and refuses to start without one. Write it
outside the repository:

```bash
mkdir -p ~/.omnisci
umask 177
cat > ~/.omnisci/env <<'ENV'
DEEPSEEK_API_KEY=<from the secret store>
ANTHROPIC_API_KEY=<from the secret store>
ENV
chmod 600 ~/.omnisci/env
```

`OMNISCI_ENV_FILE=/path/to/env` points at a different one, which is what a CI job with
a mounted secret should use.

The file is parsed strictly as data and is **never sourced as shell**, deliberately: a
command substitution in a credential file would otherwise execute on the host before
Docker had a chance to isolate anything. One `KEY=VALUE` per line, an optional `export`
prefix, matching quotes. Anything else and the whole file is ignored rather than half
read. Inside the container the values are sealed into an inherited file descriptor and
removed from the environment, so the analysis scripts and shell commands the agent runs
do not inherit them.

## Step 4 — a first run

`cli/docker/run.sh` is the entry point. It takes a data directory, mounts it at `/work`,
and hands everything after it to the agent:

```bash
cli/docker/run.sh /absolute/path/to/data \
  --data /work --auto-approve \
  "State the research direction here, in one or two sentences."
```

The sandbox it sets up is worth knowing, because a job that fights it will look like a
mysterious failure: the root filesystem is read only, all capabilities are dropped,
`no-new-privileges` is set, PIDs are capped at 1024 (`OMNISCI_PIDS_LIMIT` raises it),
and `/tmp` and the home directory are tmpfs. **The mounted data directory is the only
writable place that survives the run.** Everything the run produces lands there.

`--auto-approve` turns off the approval gate, which is correct here and only here: the
approval gate exists for an interactive session, and there is nobody to approve. It
does not disable the hard blocks in `guard.ts`, which are enforced in code and refuse
`rm`, `find -delete`, `shred`, `truncate`, `mkfs`, `rsync --delete`, `qdel`,
`git push`, and `git reset --hard` regardless.

When it finishes, the data directory holds:

```
series.json
host/paper.tex
host/paper.pdf
host/paper_overleaf.zip
host/paper.manifest.json
host/paper_review/*.png
```

and the exit code is 0 only if all of that is grounded. Check it explicitly:

```bash
echo "exit: $?"
ls /absolute/path/to/data/host/paper.pdf
```

## Step 5 — wire it into CI

A GitHub Actions job, as a shape to adapt rather than a thing to paste unchanged. Note
the timeout: a full run is long, and a job that dies at the default limit looks like a
crash when it was a clock.

```yaml
jobs:
  omniscientist:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4          # your data lives in this repository

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

## Step 6 — report

Say only this, with the placeholders filled in from what you actually observed:

> OmniScientist is set up to run headless in Docker. Image `omnisci:local`, built from
> `<clone path>`, with tectonic `<version>` and the Python stack inside it.
> Credentials: `<path to the env file>`, mode 600, outside the repository.
>
> Run it with:
> `cli/docker/run.sh <data dir> --data /work --auto-approve "<research direction>"`
>
> The data directory is the only writable path and everything lands there:
> `host/paper.pdf`, the `.tex`, the manifest, and the review figures. The exit code is
> 0 only if every number in the paper traces back to a real recorded run, so it is safe
> to gate a pipeline on.
>
> `<if a first run was made: what came out, and how long it took>`

If any step failed, say which one, paste the exact output, and stop.

## Troubleshooting

**`找不到 API 配置` and exit 78.** `run.sh` found neither `OMNISCI_ENV_FILE` nor
`~/.omnisci/env`. Redo step 3.

**`env 文件格式错误`.** A line in the env file is not `KEY=VALUE`. The parser refuses the
whole file rather than half reading it, on purpose. Fix the line.

**The run writes nothing.** Something was written outside the mounted data directory,
where the filesystem is read only. Confirm the path passed to `run.sh` is the directory
you meant and that `--data /work` points inside the mount.

**The run ends non-zero with a PDF present.** That is the grounding check, not a build
error. A number in the manuscript did not trace back to a recorded run, or a figure has
no current `view_image` receipt. Read the output; it names what failed.

**Exit code 137.** The container was killed for memory. Raise the runner's memory or
the Docker limit; the scientific stack plus a large evidence set is not small.

## Appendix: no Docker

If Docker genuinely is not available, install the single binary and supply tectonic and
Python yourself:

```bash
curl -fsSL https://raw.githubusercontent.com/Omni-Scientist/OmniScientist/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
omnisci --help
```

`VERSION=v0.1.0` pins a release, `BIN_DIR=/usr/local/bin` moves it. The skill travels
inside the binary and is written out on first run, so there is nothing to unpack. It
reads the same `~/.omnisci/env`. Then:

```bash
omnisci --data /absolute/path/to/data --auto-approve "<research direction>"
```

You are now responsible for Python 3.10+ with the scientific stack and for tectonic,
which the image would have supplied. Without tectonic the run stops at the `.tex` and
says so. Installing it:

```bash
V=0.17.0; A=$(uname -m)          # aarch64 or x86_64
curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40$V/tectonic-$V-$A-unknown-linux-musl.tar.gz" \
  | sudo tar -xz -C /usr/local/bin tectonic
```

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

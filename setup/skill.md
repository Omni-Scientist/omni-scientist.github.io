# OmniScientist as an agent skill

You are an AI agent installing OmniScientist into your own harness, for the person you
are talking to. Work through the steps below in order.

This edition needs **no API key of any kind**. There is no model call anywhere in it.
Your own multimodal read is the perceiver: you look at the evidence, you form the
hypothesis, you write and run the analysis, and the Python that ships with the skill
does only what a model must not do by hand, which is render raw data into something
viewable, run code, fetch real references, assemble the LaTeX, and enforce the gates.

## Ground rules

1. Run each command as written, with one substitution: `SKILLS_DIR`, which Step 0 sets.
   Do not substitute a different download URL.
2. **On failure, stop.** Report the command and its exact output, and say which step
   failed. Do not retry a failed download and do not improvise around it.
3. **No `sudo` for the skill itself.** Step 3 is the only place a system install can
   come up, and it is optional.
4. Stay quiet until the final step, except where a step tells you to ask a question.

## Step 0 — set SKILLS_DIR

What gets installed is one directory: a `SKILL.md` describing the workflow, and a `bin/`
of Python command line tools you call with `bash`. Nothing in it is specific to any one
harness, and nothing below depends on where it sits, so put it wherever your harness
reads skills from and move on.

Every later command uses it.

```bash
# If your harness keeps skills of its own somewhere, name that directory on the line
# below. Leaving it alone is correct for Claude Code and for anything unsure.
SKILLS_DIR=${SKILLS_DIR:-$HOME/.claude/skills}

mkdir -p "$SKILLS_DIR" && echo "installing into $SKILLS_DIR"
```

Run that as it stands and you get `~/.claude/skills`. To send it elsewhere, set
`SKILLS_DIR` to your own path first, and every later command follows.

If the person wants it scoped to one repository rather than to their account, set
`SKILLS_DIR` to `<repo>/.claude/skills` (or your harness's project-local equivalent)
instead. Account-wide is the right default.

If your harness audits skills before installing them, run that audit now on the
unpacked directory from Step 1 and report it as your harness requires; the rest of these
steps are unaffected.

If they wanted a standalone terminal agent rather than something inside this one, they
want a different edition:
[macOS](https://omni-scientist.github.io/setup/mac-desktop.md),
[Windows](https://omni-scientist.github.io/setup/windows-desktop.md),
[Linux](https://omni-scientist.github.io/setup/linux-desktop.md),
[terminal or headless](https://omni-scientist.github.io/setup/cli.md).

## Step 1 — install the skill

```bash
set -eu
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
base="https://github.com/Omni-Scientist/OmniScientist/releases/latest/download"

curl -fsSL --retry 3 -o "$tmp/omnisci-skill.zip" "$base/omnisci-skill.zip"
curl -fsSL --retry 3 -o "$tmp/omnisci-skill.zip.sha256" "$base/omnisci-skill.zip.sha256" || true
if [ -s "$tmp/omnisci-skill.zip.sha256" ]; then
  ( cd "$tmp" && { sha256sum -c omnisci-skill.zip.sha256 2>/dev/null \
      || shasum -a 256 -c omnisci-skill.zip.sha256; } )
fi

unzip -oq "$tmp/omnisci-skill.zip" -d "$SKILLS_DIR/"
ls "$SKILLS_DIR/omnisci"
```

Expected: `SKILL.md`, `INSTALL.md`, `requirements.txt`, `bin`.

If they already have the repository cloned, the directory in it is the same thing and
`cp -r skill/omnisci "$SKILLS_DIR/"` is equivalent. Do not do both.

## Step 2 — the Python the skill drives

The skill's command line tools need numpy, pandas, matplotlib, sympy, imageio,
soundfile, scipy, and scikit-learn on the **same `python3` you will invoke them with**.
Check before installing anything:

```bash
python3 -c 'import numpy, pandas, matplotlib, sympy, imageio, soundfile, scipy, sklearn; print("all present")'
```

If that prints `all present`, skip the rest of this step.

Otherwise install into the user site directory, which leaves the system tree alone:

```bash
python3 -m pip install --user -r "$SKILLS_DIR/omnisci/requirements.txt"
```

If pip refuses with `externally-managed-environment`, that is PEP 668: the interpreter
belongs to the OS or to Homebrew. A user level install is still the right answer, it
just has to say so out loud:

```bash
python3 -m pip install --user --break-system-packages -r "$SKILLS_DIR/omnisci/requirements.txt"
```

If the person already works inside a virtualenv or a conda environment, install there
instead and leave `--user` off. **Do not create a new virtualenv for this.** A fresh
environment would only be active in the shell you made it in, and the skill's commands
run as plain `python3` in later sessions, which would then be the wrong interpreter.

## Step 3 — tectonic, which is what turns a run into a PDF

Without it a run still perceives the evidence, runs the analysis, produces the figures,
assembles the `.tex`, says tectonic is missing, and stops there. Everything before that
step works. So this is worth doing, and it is not a blocker.

```bash
command -v tectonic || echo "tectonic: not installed"
```

If it is missing, ask the person before installing, because the straightforward route
writes to `/usr/local/bin` and therefore wants `sudo`:

```bash
# x86_64
curl -fsSL https://drop-sh.fullyjustified.net | sh && sudo mv tectonic /usr/local/bin/

# ARM (Apple silicon, Graviton, Jetson): the wrong architecture fails with
# "Exec format error", so take the matching build
V=0.17.0; A=$(uname -m)          # aarch64 or x86_64
curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40$V/tectonic-$V-$A-unknown-linux-musl.tar.gz" \
  | sudo tar -xz -C /usr/local/bin tectonic
```

Anything on `PATH` is used, so if they would rather keep it under `~/.local/bin`, do
that instead and skip the `sudo`.

## Step 4 — verify

The skill's tools live in `bin/` and everything is driven through them:

```bash
export OMNISCI="$SKILLS_DIR/omnisci/bin"
python3 $OMNISCI/evidence_cli.py --help
```

That exercises the import path and the argument parser without needing any data. If it
tracebacks on an import, step 2 installed into a different interpreter than the one
`python3` resolves to; report which, and do not paper over it.

If the person has a folder of real data handy, the useful second check reads it:

```bash
python3 $OMNISCI/case_cli.py inspect --dir /path/to/their/data
```

It prints the modalities and labels it found, and names the directory it looked in if
it cannot find an evidence layer.

## Step 5 — make it available in the session

Skills are read when a session starts. If `/omnisci` is not offered in the current one,
start a new session and it will be there. Do not reinstall, and do not edit `SKILL.md`
to try to force it.

One thing worth reading once, if you are the agent that will run it: the skill's
`SKILL.md` warns that `--task` accepts a bare name that resolves under `$OMNISCI_CASES`
or the engine's bundled `examples/`, and that a bare name can land on a bundled example
that already holds someone else's recorded runs, in which case the gate would ground
the paper's numbers against their ledger. Every command echoes the case it resolved.
**Check it on the first call, and pass an absolute path when the case is the person's
own folder.**

## Step 6 — report

Say only this, with the placeholders filled in from what you actually observed:

> The OmniScientist skill is installed at `$SKILLS_DIR/omnisci`. No API key is
> involved anywhere: I do the perceiving and the writing myself, and the skill's Python
> does the rendering, the analysis runs, the references, and the gates.
>
> Python dependencies: `<already present / installed into --user>`.
> tectonic: `<present / installed / skipped, runs will stop at the .tex>`.
>
> Start a new session and type `/omnisci`, or just tell me what you have, for example
> "I have a folder of microscope images in ~/slides, make me a paper".

If any step failed, say which one, paste the exact output, and stop.

## Troubleshooting

**`curl: (22) ... 404`** on `omnisci-skill.zip`. There is no published release yet, or
the asset name changed. Report it; do not substitute another asset.

**`ModuleNotFoundError` from one of the `bin/*.py` tools.** The packages went to a
different interpreter than the one `python3` resolves to. Compare
`python3 -c 'import sys; print(sys.executable)'` with the pip you used, and fix the
mismatch rather than reinstalling blindly.

**`Exec format error` from tectonic.** An `x86_64` build on an ARM machine. Take the
`aarch64` one.

**The run stops at the `.tex`.** tectonic is missing. That is designed behaviour, not a
crash.

**A Python import fails partway through a run.** Package versions move, and recent
pandas and matplotlib have removed arguments older analysis code still passes. The run
prints the traceback instead of swallowing it, and the fix normally belongs in the
analysis script you just wrote.

Full reference, including the other three editions:
<https://github.com/Omni-Scientist/OmniScientist/blob/main/docs/INSTALL.md>

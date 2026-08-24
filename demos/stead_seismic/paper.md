# Stage 3 -- Writeup (research paper -> PDF)

_task: stead_seismic | style: earth_space | figures: 7 | references: 14 | brain: claude-sonnet-5_

## Title
Coherent Polarized Signals in a Substantial Fraction of Sampled Noise-Labeled STEAD Traces

## Abstract
Large seismic waveform catalogues rely on binary noise/event labels, yet the assumption that "noise"-labeled traces are free of signal-like structure remains largely unexamined. We analyze three-component broadband seismograms from the STEAD catalogue, applying a label-agnostic, null-calibrated anomaly detector that jointly evaluates amplitude, polarization, and cross-channel coincidence rather than relying on any single feature. The main finding is that a substantial fraction of nominally noise-labeled traces contain coherent, polarized, transient bursts that appear concurrently across components, placing them in the feature region occupied by body-wave arrivals under this detector. This prevalence far exceeds what amplitude excursions alone could produce, indicating that polarization and cross-component timing jointly drive the detections rather than simple energy spikes. The pattern persists across a range of calibration choices for the null distribution, arguing against a tuning artifact and instead supporting a robust, mechanism-based signal. Because the detector is label-agnostic, these bursts are not claimed to be genuine seismic arrivals, only waveform-consistent with them under the chosen statistics. These results suggest that noise labels in large seismic datasets may mask a nontrivial population of structured transients, with implications for training and evaluating machine-learning models on such catalogues. More broadly, the work motivates systematic reanalysis of "noise" classes in seismic and other waveform archives before they are treated as ground truth for anomaly or event detection.

**PDF:** stages/03_paper.pdf
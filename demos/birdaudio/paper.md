# Stage 3 -- Writeup (research paper -> PDF)

_task: birdaudio | style: biomed | figures: 4 | references: 13 | brain: claude-sonnet-5_

## Title
Reduced Discriminability of a Mid/High-Band Acoustic Bird-Presence Classifier Under Increasing Background Noise in freefield1010

## Abstract
Automated bird detection in passive acoustic monitoring can be compromised by environmental noise, yet how specific noise types degrade classifier performance remains poorly understood. Using field recordings from the freefield1010 collection, this study builds a simple, interpretable mid/high-band acoustic classifier for the hasbird label and evaluates it against an independently measured low-frequency masking index. Discriminability drops substantially as masking increases across recording tertiles, with AUC falling from 0.7327 in low-masking conditions to 0.5792 in high-masking conditions. This decline is robust and consistent, indicating that low-frequency interference systematically obscures features the detector relies on to identify bird-like acoustic signatures. Notably, the effect is not confined to a single anomalous subgroup but appears across the full range of masking tertiles, suggesting a generalizable vulnerability rather than a dataset-specific artifact. These findings imply that bird call detections flagged under high-masking conditions should be interpreted cautiously, as they reflect reduced confidence in the classifier's feature space rather than definitive evidence of bird presence or absence. More broadly, the results underscore the need for masking-aware evaluation protocols in bioacoustic monitoring pipelines to avoid biased ecological inferences from noisy recordings.


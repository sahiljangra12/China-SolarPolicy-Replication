# Replication and evaluation of "China's solar expansion policy reduces bird diversity"

Zhang et al. (2026), *Science* 393, 831 ([doi:10.1126/science.aee0747](https://doi.org/10.1126/science.aee0747)).

Work by Sahil, research assistant to Prof. Paul J. Ferraro, Johns Hopkins University. All analysis is in Stata (StataNow/BE 19.5), run on the authors' public data.

**Website:** <https://sahiljangra12.github.io/China-SolarPolicy-Replication/>
It has live tools, the evidence with links to the exact Stata log lines, a claim-by-claim check of the paper, and a library of every output. The site is published from the `gh-pages` branch; `docs/` holds the same files.

## Short answer

The paper's numbers reproduce exactly. The evidence does not establish that solar policy reduced birds: the data cannot separate "policy reduces birds" from "policy is related to where and how much people record birds". These results do not show that solar development is harmless either.

| Evidence | What it shows |
|---|---|
| Paper's TWFE regression | −0.0125 per PSI point, significant. Reproduced exactly |
| TWFE in fair comparisons | −0.0027, p = 0.47 (urban × year-month effects, or counties with real PSI only) |
| Missing policy data | PSI is set to 0 for 724 counties: 83% of urban county-months, 1% of rural |
| Birdwatching effort | PSI goes with fewer records and fewer observed months; both links vanish in fair comparisons |
| Sensitivity (Cinelli–Hazlett) | A confounder explaining 2.2% of leftover variation brings the estimate to zero |
| Instrumental variable | Passes weak-instrument-robust tests, but the instrument has a direct effect; allowing for it gives −0.042, not significant |
| Staggered DiD (Callaway–Sant'Anna, BJS, Sun–Abraham) | +0.02 to +0.08, not significant |
| de Chaisemartin–D'Haultfœuille (PSI as a dose) | −0.03 to −0.05; not significant with the paper's controls in fair samples; effort pre-trends fail |
| Solar-plant area as treatment | Negative in TWFE; vanishes holding birdwatcher records fixed |

Full account: [`07_Final_Report/Final_Report.pdf`](07_Final_Report/Final_Report.pdf).

## What is in this repository

| Folder | Contents |
|---|---|
| `00_Original_Package/` | The authors' code and 46 data files, an unchanged copy of their public replication package (see `DATA_NOTICE.md`) |
| `00_Paper_Guide/` | Plain-language guide to the paper |
| `01_Task1_Replication/` | Reproduction, data structure, TWFE diagnostics, IV exclusion tests |
| `02_Task2_Sensitivity/` | Cinelli–Hazlett sensitivity analysis |
| `03_Task3_Staggered_DiD/` | Callaway–Sant'Anna, Borusyak–Jaravel–Spiess, Sun–Abraham |
| `04_Framework_Comparison/` | The paper checked against the Ferraro and Hanauer (2014) framework |
| `04_Synthesis_Report/` | Synthesis reports for Tasks 1–3, with Stata screenshots |
| `05_Followups_Nov13/` | Effort, sample flow, missing months, solar area, weak-IV and Anderson–Rubin inference |
| `06_Followups_Nov19/` | Residualized sensitivity, dCDH estimators, data checks |
| `07_Final_Report/` | Final report and the dCDH report |
| `07_Interactive/` | The 792-regression grid, sensitivity inputs and IV grid behind the website's live tools |
| `08_Reference_Documents/` | Line-by-line guide to the Stata code, the data dictionary, and the earlier (12 November) report on Tasks 1–3 |
| `docs/` | The website |
| `site_source/` | Page sources and the script that builds `docs/` from the outputs above |

Each task folder has `code/`, `logs/`, `tables/`, `figures/`, `data/` and `report/` where they apply. File names start with the task and step number, so they sort in run order.

## How to reproduce

1. In every `.do` file, replace `YOUR_PATH/China-SolarPolicy-Replication` with the folder's location on your computer. The paths are set in `00_config.do` and at the top of each runner.
2. In Stata:

```stata
do "YOUR_PATH/China-SolarPolicy-Replication/run_everything.do"
```

Task 1 must run first because it builds `01_Task1_Replication/data/analysis_sample.dta`, which every later step uses. Packages are installed automatically if missing: `reghdfe`, `ftools`, `ivreghdfe`, `ivreg2`, `ranktest`, `estout`, `winsor2`, `psmatch2`, `binscatter`, `sensemakr`, `csdid`, `drdid`, `did_imputation`, `event_plot`, `eventstudyinteract`, `avar`, `gtools`, `did_multiplegt_dyn`, `did_multiplegt_stat`.

Three specifications could not run in Stata/BE because of its 2,048-variable limit: `did_multiplegt_dyn` with `controls()`, `did_multiplegt_dyn` with `continuous()`, and sensitivity analysis with explicit county dummies. The workarounds are documented in the reports; all three can run in Stata/MP or R.

## What is not here

- **The paper and its Supplementary Materials.** They are under copyright. On the website you can load your own copy, and every reference then opens at the exact page.
- **Private working notes** (meeting scripts and notes).

## Citation

If you use the data, please cite the original paper:

> Zhang, H. et al. (2026). China's solar expansion policy reduces bird diversity. *Science* 393, 831.

This is an independent replication and evaluation. It is not affiliated with the paper's authors or the journal.

* helper: rerun only the Callaway-Sant'Anna and imputation steps
do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
foreach step in 3_3_callaway_santanna 3_4_imputation_bjs {
    capture log close _all
    log using "$T3/logs/`step'.log", replace text
    clear
    estimates clear
    do "$ROOT/00_config.do"
    capture noisily do "$T3/code/`step'.do"
    if _rc di as err "STEP `step' FAILED with rc = " _rc
    log close
}

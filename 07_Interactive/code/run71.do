quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
capture mkdir "$ROOT/07_Interactive"
capture mkdir "$ROOT/07_Interactive/logs"
capture log close _all
log using "$ROOT/07_Interactive/logs/7_1_spec_grid.log", replace text
capture noisily do "$ROOT/07_Interactive/code/7_1_spec_grid.do"
di "RC71=" _rc
log close

quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
global T6 "$ROOT/06_Followups_Nov19"
capture log close
log using "$T6/logs/6_4_extra_checks.log", replace text
capture noisily do "$T6/code/6_4_extra_checks.do"
di "RC64=" _rc
log close

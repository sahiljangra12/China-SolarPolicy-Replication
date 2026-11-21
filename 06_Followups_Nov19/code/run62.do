quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
global T6 "$ROOT/06_Followups_Nov19"
capture log close
log using "$T6/logs/6_2_dcdh_estimators.log", replace text
capture noisily do "$T6/code/6_2_dcdh_estimators.do"
log close

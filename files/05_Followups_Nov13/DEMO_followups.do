*==========================================================================
* DEMO_followups.do  -  one-command walk-through of the 13 Nov follow-ups
*
* HOW TO USE: in the Stata command window type
*     do "YOUR_PATH/China-SolarPolicy-Replication/05_Followups_Nov13/DEMO_followups.do"
* and press Enter. (Or use the menu button: User > Solar Birds: Follow-ups.)
* Each step runs the real Stata code, prints the result with a plain-English
* note, and waits. Press Enter for the next step; type q and Enter to stop.
*
* Steps: 1 sample flow | 2 effort | 3 missing months | 4 solar-plant area |
*        5 instrument strength | 6 Anderson-Rubin sets | 7 exclusion check |
*        8 fixed-site data | 9 summary
*==========================================================================
version 16
clear all
set more off
set linesize 120
quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
global T5 "$ROOT/05_Followups_Nov13"
foreach f in tables logs figures data {
    capture mkdir "$T5/`f'"
}
foreach p in weakivtest weakiv {
    capture which `p'
    if _rc capture noisily ssc install `p', replace
}

* load the demo programs silently (results show, code does not)
run "$T5/code/demo_programs.do"
solar_demo

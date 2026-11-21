* Task 1.1: reproduce the paper's main estimate (Table 1, col 3)
quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
use "$SAMPLE", clear
reghdfe ShannonBD PI $control, absorb(county year) cluster(county)

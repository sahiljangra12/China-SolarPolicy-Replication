* Task 1.3: IV exclusion test - instrument where PSI is missing (cannot move PSI)
reghdfe ShannonBD Sun_ccpu $control if in_PI_file==0, absorb(county year) cluster(county)

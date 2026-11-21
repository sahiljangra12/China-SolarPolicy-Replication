* Task 1.3: same model, but cities and countryside get their own monthly trends
reghdfe ShannonBD PI $control, absorb(county year#urban) cluster(county)

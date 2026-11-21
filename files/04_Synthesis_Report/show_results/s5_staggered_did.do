* Task 3: overall effects from the staggered DiD estimators (saved by 3_2-3_5)
import delimited using "$T3/tables/3_3_cs_att.csv", clear varnames(1)
format att se %8.4f
list spec att se, noobs sep(0) abbreviate(40)
import delimited using "$T3/tables/3_4_bjs.csv", clear varnames(1)
keep if event_time==99
format b se %8.4f
list spec b se, noobs sep(0) abbreviate(40)
import delimited using "$T3/tables/3_5_sun_abraham.csv", clear varnames(1)
keep if event_time==99
format b se %8.4f
list estimator b se, noobs
import delimited using "$T3/tables/3_2_twfe.csv", clear varnames(1)
keep if event_time==99
format b se %8.4f
list estimator b se, noobs

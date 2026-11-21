*==========================================================================
* DEMO_show_all_results.do
* ONE-CLICK DEMO: shows every key result of Tasks 1-3 in order, live in Stata.
* After each step, press ENTER in the Command window to go to the next step.
* Graphs open in Preview automatically.
*==========================================================================
clear all
set more off
quietly do "YOUR_PATH/China-SolarPolicy-Replication/00_config.do"
set more off

capture program drop nextstep
program define nextstep
    di _n as txt "{hline 90}"
    display as res "  >>> Press ENTER in the Command window to continue..." _request(_junk)
end

capture program drop step
program define step
    args title
    cls
    di as txt "{hline 90}"
    di as res "  `title'"
    di as txt "{hline 90}"
end

*------------------------------------------------------------------ 1
step "TASK 1 | Step 1: All 12 published numbers reproduce exactly"
import delimited using "$T1/tables/1_4_reproduction_check.csv", clear varnames(1)
list result paper_b our_b paper_se our_se match, noobs sep(0) abbreviate(12)
count if match==0
di as res _n "  Mismatches with the paper: " r(N)
nextstep

*------------------------------------------------------------------ 2
step "TASK 1 | Step 2: Main regression run live (paper: -0.0125, SE 0.0037)"
use "$SAMPLE", clear
reghdfe ShannonBD PI $control, absorb(county year) cluster(county)
nextstep

*------------------------------------------------------------------ 3
step "TASK 1 | Step 3: Missing PSI coded as 0 is mostly URBAN"
di as txt "  in_PI_file = 0 means the county is missing from the policy file (PSI forced to 0)"
tab urban in_PI_file, row nofreq
nextstep

*------------------------------------------------------------------ 4
step "TASK 1 | Step 4: Fair comparison - urban and rural get their own monthly trends"
reghdfe ShannonBD PI $control, absorb(county year#urban) cluster(county)
di as res _n "  Paper: -0.0125 (p=0.001)  ->  urban x month FE: " %7.4f _b[PI] ///
   "  (p = " %5.3f 2*ttail(e(df_r), abs(_b[PI]/_se[PI])) ")"
nextstep

*------------------------------------------------------------------ 5
step "TASK 1 | Step 5: All like-with-like comparisons in one table"
eststo clear
quietly eststo A1: reghdfe ShannonBD PI $control,                  absorb(county year)       cluster(county)
quietly eststo A2: reghdfe ShannonBD PI $control if in_PI_file==1, absorb(county year)       cluster(county)
quietly eststo A3: reghdfe ShannonBD PI $control if urban==0,      absorb(county year)       cluster(county)
quietly eststo A4: reghdfe ShannonBD PI $control if urban==1,      absorb(county year)       cluster(county)
quietly eststo A5: reghdfe ShannonBD PI $control,                  absorb(county year#urban) cluster(county)
quietly eststo A6: reghdfe ShannonBD PI $control,                  absorb(county year#prov)  cluster(county)
esttab A1 A2 A3 A4 A5 A6, keep(PI) b(4) p(3) star(* 0.10 ** 0.05 *** 0.01) ///
    mtitles("Paper" "Real PSI" "Rural" "Urban" "Urban x YM" "Prov x YM") stats(N, fmt(0))
nextstep

*------------------------------------------------------------------ 6
step "TASK 1 | Step 6: IV zero-first-stage test (instrument where PSI cannot change)"
reghdfe ShannonBD Sun_ccpu $control if in_PI_file==0, absorb(county year) cluster(county)
di as res _n "  If the exclusion restriction held, this coefficient should be 0. It is " ///
   %7.4f _b[Sun_ccpu] " (p = " %5.3f 2*ttail(e(df_r), abs(_b[Sun_ccpu]/_se[Sun_ccpu])) ")"
nextstep

*------------------------------------------------------------------ 7
step "TASK 2 | Step 7: Sensitivity analysis (Cinelli-Hazlett) - robustness values"
import delimited using "$T2/tables/2_1_robustness_values.csv", clear varnames(1)
format est %8.4f
format r2_yd rv_q1 rv_q1_a05 rv_q1_a05_clustered %7.4f
list spec est r2_yd rv_q1 rv_q1_a05 rv_q1_a05_clustered, noobs sep(0) abbreviate(20)
import delimited using "$T2/tables/2_1_benchmark_bounds.csv", clear varnames(1)
keep if (benchmark=="Duration" | strpos(benchmark,"Urban")) & strpos(spec,"S1")
format adj_est %8.4f
format adj_t_clustered %6.2f
list benchmark k adj_est adj_t_clustered, noobs sep(0) abbreviate(20)
shell open "$T2/figures/2_1_contour_estimate_S1.pdf"
shell open "$T2/figures/2_1_contour_tvalue_S1.pdf"
nextstep

*------------------------------------------------------------------ 8
step "TASK 3 | Step 8: Staggered DiD - adoption cohorts"
import delimited using "$T3/tables/3_1_cohort_sizes.csv", clear varnames(1)
list adoption_year counties_main, noobs sep(0)
nextstep

*------------------------------------------------------------------ 9
step "TASK 3 | Step 9: Staggered DiD - overall effects (none negative, none significant)"
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
shell open "$T3/figures/3_3_event_study_cs_1.pdf"
shell open "$T3/figures/3_4_event_study_bjs_1.pdf"
shell open "$T3/figures/3_4_event_study_bjs_2.pdf"
nextstep

*------------------------------------------------------------------ end
step "SUMMARY"
di as txt "  Task 1: all 12 numbers reproduce; urban x month FE: -0.0125 -> -0.0027 (p=0.47)"
di as txt "  Task 1: IV zero-first-stage: -0.0021 (p=0.048) -> exclusion likely violated"
di as txt "  Task 2: RV = 2.2%, RV-alpha = 1.2% (0.93% clustered); urban trend explains 12.3% of PSI"
di as txt "  Task 3: CS +0.057, BJS +0.078, SA +0.024, TWFE +0.032 -> no decline"
di as res _n "  Conclusion: the study's data do not show that solar policy harms bird diversity."

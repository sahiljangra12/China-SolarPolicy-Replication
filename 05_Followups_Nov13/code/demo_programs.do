*==========================================================================
* demo_programs.do - the programs behind DEMO_followups.do.
* Loaded silently with -run- so the demo shows results, not code.
*==========================================================================
*-------------------------------------------------------- helper programs
capture program drop banner
program define banner
    di _n as txt "{hline 100}"
    di as res "  " `0'
    di as txt "{hline 100}"
end
capture program drop say
program define say
    di as txt "  " `0'
end
capture program drop waitkey
program define waitkey
    di _n as input "  >>> Press Enter for the next step (q + Enter to stop) " _request(_resp)
    if lower(trim("$_resp")) == "q" {
        di as txt "  Demo stopped."
        exit 1
    }
end

capture program drop solar_demo
program define solar_demo
    local tab cells(b(fmt(4) star) se(fmt(4) par) p(fmt(3) par("[" "]"))) star(* 0.10 ** 0.05 *** 0.01) modelwidth(17)

    banner "FOLLOW-UP ANALYSES FROM THE 13 NOVEMBER MEETING  (Zhang et al. 2026, Science 393, 831)"
    say "Every number below is produced live by Stata from the authors' data."
    say "Tables show: coefficient, (standard error clustered by county), [p-value]."
    waitkey

    *========================================================================== 1
    banner "STEP 1 - Items 5 and 6: where the rows and counties go"
    quietly {
        use "$DATA/Bird.dta", clear
        local n1 = _N
        egen t = tag(id)
        count if t
        local c1 = r(N)
        use "$SAMPLE", clear
        local n2 = _N
        egen t = tag(county)
        count if t
        local c2 = r(N)
        bysort county: gen nrow = _N
        count if t & nrow==1
        local s3 = r(N)
        count if nrow > 1
        local n3 = r(N)
        count if t & nrow > 1
        local c3 = r(N)
        count if !missing(Sun_ccpu)
        local n4 = r(N)
    }
    di as txt _n "  {ul:Step}                                         {ul:Rows}   {ul:Counties}"
    di as txt "  0 Possible county-months (2,778 x 120)    " as res %9.0fc 333360 "   " %6.0fc 2778
    di as txt "  1 County-months with a bird record        " as res %9.0fc `n1' "   " %6.0fc `c1'
    di as txt "  2 After dropping rows missing a control   " as res %9.0fc `n2' "   " %6.0fc `c2' as txt "   (-" `n1'-`n2' " rows)"
    di as txt "  3 After dropping singleton counties       " as res %9.0fc `n3' "   " %6.0fc `c3' as txt "   (-" `s3' " counties)"
    di as txt "  4 IV sample (sunshine + city CPU)         " as res %9.0fc `n4'
    say ""
    say "Counties observed in each calendar year (2,324 is the 2023 count, not a sample size):"
    preserve
        quietly contract YEAR county
        quietly contract YEAR, freq(counties)
        list YEAR counties, noobs sep(0) abbreviate(10)
    restore
    preserve
        quietly contract county, freq(months)
        quietly summarize months, detail
        say "Months observed per county: median " r(p50) ", mean " %4.1f r(mean) ", max " r(max) " (of 120)."
    restore
    waitkey

    *========================================================================== 2
    banner "STEP 2 - Item 1: does solar policy (PSI) change birdwatching effort?"
    say "Outcome: ln(number of birdwatchers). Three comparisons: paper's FE,"
    say "urban x year-month FE, and only counties with real PSI data."
    use "$SAMPLE", clear
    gen lnBN = ln(BN)
    gen lnBT = ln(BT + 1)
    eststo clear
    quietly eststo e1: reghdfe lnBN PI $control_noD,                  absorb(county year)       cluster(county)
    quietly eststo e2: reghdfe lnBN PI $control_noD,                  absorb(county year#urban) cluster(county)
    quietly eststo e3: reghdfe lnBN PI $control_noD if in_PI_file==1, absorb(county year)       cluster(county)
    quietly eststo e4: reghdfe ShannonBD PI $control lnBN,            absorb(county year)       cluster(county)
    esttab e1 e2 e3 e4, keep(PI) `tab' stats(N, fmt(%9.0fc)) nonumbers ///
        mtitles("lnBN paper" "lnBN urban x YM" "lnBN real-PSI" "Shannon | lnBN")
    say "Reading: in the paper's comparison +1 PSI = about 4% fewer birdwatchers."
    say "It shrinks with fair comparisons, and holding birdwatchers fixed the"
    say "PSI effect on Shannon is gone (last column). Fewer birds, or fewer observers?"
    waitkey

    *========================================================================== 3
    banner "STEP 3 - Item 2: does PSI predict whether a county-month is observed at all?"
    capture confirm file "$T5/data/county_month_grid.dta"
    if _rc {
        say "Building the full county x month grid (first time only, about a minute)..."
        quietly do "$T5/code/5_4_missingness_test.do"
    }
    use "$T5/data/county_month_grid.dta", clear
    global cg "Temp Wind Pop Carbon Water Green Farm Grass"
    quietly summarize obs
    say "Full grid: " %9.0fc r(N) " county-months; share observed = " %4.1f 100*r(mean) "%"
    eststo clear
    quietly eststo m1: reghdfe obs PI $cg,                  absorb(county ym)       cluster(county)
    quietly eststo m2: reghdfe obs PI $cg,                  absorb(county ym#urban) cluster(county)
    quietly eststo m3: reghdfe obs PI $cg if in_PI_file==1, absorb(county ym)       cluster(county)
    esttab m1 m2 m3, keep(PI) `tab' stats(N, fmt(%9.0fc)) nonumbers ///
        mtitles("paper FE" "urban x YM" "real-PSI only")
    preserve
        collapse (mean) obs, by(YEAR urban)
        replace obs = 100*obs
        twoway (connected obs YEAR if urban==1, lcolor(navy) mcolor(navy)) ///
               (connected obs YEAR if urban==0, lcolor(cranberry) mcolor(cranberry) msymbol(S)), ///
            legend(order(1 "Urban districts" 2 "Rural counties") rows(1)) ///
            ytitle("% of county-months observed") xtitle("Year") ///
            title("Share of possible county-months with a bird record", size(medium)) name(obs_share, replace)
        capture window manage forward command
    restore
    say "Reading: in the paper's comparison PSI predicts fewer observed months;"
    say "with urban x YM FE or real-PSI counties the effect is zero. Missingness"
    say "follows the same urban-rural split that drives the main estimate (see graph)."
    waitkey

    *========================================================================== 4
    banner "STEP 4 - Item 3: solar-plant area (km2) instead of the policy index"
    use "$SAMPLE", clear
    gen lnBN = ln(BN)
    egen pym = group(prov year)
    eststo clear
    quietly eststo a1: reghdfe ShannonBD Area $control,                  absorb(county year)       cluster(county)
    quietly eststo a2: reghdfe ShannonBD Area $control,                  absorb(county year#urban) cluster(county)
    quietly eststo a3: reghdfe ShannonBD Area $control,                  absorb(county pym)        cluster(county)
    quietly eststo a4: reghdfe ShannonBD Area $control if in_PI_file==1, absorb(county year)       cluster(county)
    esttab a1 a2 a3 a4, keep(Area) `tab' stats(N, fmt(%9.0fc)) nonumbers ///
        mtitles("paper (S12)" "urban x YM" "prov x YM" "real-PSI") title("A. Comparison groups")
    eststo clear
    quietly eststo d1: reghdfe lnBN      Area $control_noD,  absorb(county year) cluster(county)
    quietly eststo d2: reghdfe ShannonBD Area $control lnBN, absorb(county year) cluster(county)
    quietly eststo d3: reghdfe Richness  Area $control,      absorb(county year) cluster(county)
    quietly eststo d4: reghdfe Evenness  Area $control,      absorb(county year) cluster(county)
    esttab d1 d2 d3 d4, keep(Area) `tab' stats(N, fmt(%9.0fc)) nonumbers ///
        mtitles("ln birdwatchers" "Shannon | lnBN" "Richness" "Evenness") title("B. Is it effort?")
    say "Reading: Area survives the comparison-group checks (table A) - stronger"
    say "than PSI. But Area cuts the number of birdwatchers, and holding them fixed"
    say "the effect disappears; species counts fall, evenness does not (table B)."
    waitkey

    *========================================================================== 5
    banner "STEP 5 - Item 4a: is the instrument strong? (effective F, benchmark 23.1)"
    use "$SAMPLE", clear
    keep if !missing(Sun_ccpu)
    eststo clear
    quietly eststo i1: ivreghdfe ShannonBD (PI = Sun_ccpu) $control, absorb(county year) cluster(county) keepsingleton
    quietly eststo i2: ivreghdfe ShannonBD (PI = Sun_ccpu) $control, absorb(county year) cluster(city)   keepsingleton
    quietly eststo i3: ivreghdfe ShannonBD (PI = Sun_ccpu) $control, absorb(county year) cluster(prov)   keepsingleton
    quietly eststo i4: ivreghdfe ShannonBD (PI = Sun_ccpu) $control, absorb(county year#urban) cluster(county) keepsingleton
    esttab i1 i2 i3 i4, keep(PI) cells(b(fmt(4) star) se(fmt(4) par)) star(* 0.10 ** 0.05 *** 0.01) ///
        stats(N N_clust widstat, fmt(%9.0fc %9.0fc 2) labels("Rows" "Clusters" "Effective F")) nonumbers ///
        mtitles("cl county" "cl city" "cl province" "urbYM cl county")
    quietly reghdfe PI Sun_ccpu $control, absorb(county year) cluster(county) keepsingleton
    local jF = e(F)
    quietly test Sun_ccpu
    say "Main first stage: joint F of all 10 regressors = " %5.2f `jF' "   instrument-only F = " %5.2f r(F)
    preserve
        use "$SAMPLE", clear
        keep if !missing(inv_CCPU)
        quietly reghdfe PI inv_CCPU $control, absorb(county year) cluster(county)
        local jF = e(F)
        quietly test inv_CCPU
        say "Table S10 col 4: joint F = " %5.2f `jF' " (the '8' in the table)   instrument-only F = " %5.2f r(F)
    restore
    say "Reading: strong only when clustering by county (30.2). Weak by city (10.8),"
    say "the natural level of the CPU shock, and very weak by province. The 'F = 8'"
    say "in Table S10 is the joint F of all regressors, not the instrument's strength."
    waitkey

    *========================================================================== 6
    banner "STEP 6 - Item 4b: Anderson-Rubin 95% sets (valid even with a weak instrument)"
    say "For each candidate effect b0: regress (Shannon - b0*PSI) on the instrument."
    say "Keep b0 if the instrument is NOT significant (p > 0.05). Kept values = AR set."
    foreach v in ShannonBD PI Sun_ccpu {
        quietly reghdfe `v' $control, absorb(county year) resid(r_`v') keepsingleton
    }
    tempname P
    tempfile arcurve
    postfile `P' str10 clus b0 ar using `arcurve', replace
    foreach cl in county city prov {
        local prev = 0
        local segs
        local lo = -1.2
        local hi = 1.2
        local st = 0.005
        local start = `lo'
        local n = round((`hi'-`lo')/`st')
        forvalues i = 0/`n' {
            local b0 = `lo' + `i'*`st'
            quietly gen double ytil = r_ShannonBD - `b0'*r_PI
            quietly regress ytil r_Sun_ccpu, nocons vce(cluster `cl')
            quietly test r_Sun_ccpu
            post `P' ("`cl'") (`b0') (r(F))
            local acc = (r(p) > 0.05)
            if `acc' & !`prev' local start = `b0'
            if !`acc' & `prev' {
                local s1 : display %6.3f `start'
                if `start' == `lo' local s1 "-infinity"
                local s2 : display %6.3f `b0'-`st'
                local segs `"`segs' [`s1', `s2']"'
            }
            local prev = `acc'
            drop ytil
        }
        if `prev' {
            local s1 : display %6.3f `start'
            local segs `"`segs' [`s1', +infinity]"'
        }
        di as res `"  cluster `cl': AR 95% set =`segs'"'
    }
    postclose `P'
    preserve
        use `arcurve', clear
        twoway (line ar b0 if clus=="county", lcolor(navy)) ///
               (line ar b0 if clus=="city", lcolor(cranberry)) ///
               (line ar b0 if clus=="prov", lcolor(ltblue)) if ar <= 25 & inrange(b0,-0.6,0.3), ///
            yline(3.85, lpattern(dash) lcolor(gs8)) xline(0, lcolor(black)) xline(-0.1264, lpattern(dot) lcolor(gs8)) ///
            legend(order(1 "cluster county" 2 "cluster city" 3 "cluster province") rows(1)) ///
            ytitle("Anderson-Rubin statistic") xtitle("Candidate effect of PSI on Shannon") ///
            title("Values below the dashed line are inside the 95% AR set", size(medium)) name(ar_curve, replace)
        capture window manage forward command
    restore
    say "Reading: every AR set excludes zero (the province set is unbounded on the"
    say "left but still excludes zero). A weak instrument is NOT what makes the IV"
    say "significant. But AR assumes the exclusion restriction holds - next step."
    waitkey

    *========================================================================== 7
    banner "STEP 7 - Item 4c: the exclusion restriction (plausibly exogenous IV)"
    say "In counties with PSI imputed 0, the instrument cannot move PSI. Does it"
    say "still predict Shannon there? (zero-first-stage test)"
    reghdfe ShannonBD Sun_ccpu $control if in_PI_file==0, absorb(county year) cluster(county)
    scalar g_hat = _b[Sun_ccpu]
    scalar g_se  = _se[Sun_ccpu]
    say ""
    say "Subtract that direct effect (gamma) and re-estimate the IV:"
    foreach g in 0 `=g_hat' `=g_hat-1.96*g_se' `=g_hat+1.96*g_se' {
        capture drop y_adj
        quietly gen double y_adj = ShannonBD - (`g')*Sun_ccpu
        quietly ivreghdfe y_adj (PI = Sun_ccpu) $control, absorb(county year) cluster(county) keepsingleton
        di as txt "  gamma = " as res %9.6f `g' as txt "   ->  IV effect = " as res %7.4f _b[PI] ///
           as txt "  (se " %6.4f _se[PI] ", p = " %5.3f 2*normal(-abs(_b[PI]/_se[PI])) ")"
    }
    say ""
    say "Reading: about two-thirds of the reduced form also appears where PSI cannot"
    say "respond. Removing it cuts the IV from -0.126 to about -0.04 (not significant)."
    say "The IV's problem is exclusion, not strength."
    waitkey

    *========================================================================== 8
    banner "STEP 8 - Item 7: fixed-site (standardized) bird monitoring data in China"
    say "China BON-Birds (Ministry of Ecology and Environment, since 2011): fixed 1-3 km"
    say "  line transects (breeding season, Mar-Jul) and point counts at wetlands (winter)."
    say "  Whole China BON: 441 sample regions, about 9,000 transects/points (all taxa)."
    say "  Public subset: Yangtze River Basin, 536 sites, 2011-2020, on Dryad"
    say "  (doi:10.5061/dryad.np5hqbzzh). Overlaps our PSI years 2014-2020."
    say "  National raw data: by request to the Nanjing Institute of Environmental Sciences."
    say "China Coastal Waterbird Census: 32 coastal sites since 2005 (14 monthly);"
    say "  waterbirds only, volunteer-run - not suitable for a national test."
    say "Use: site-year Shannon on county solar area/PSI with site and year FE;"
    say "effort is fixed by design, so the effort problem disappears."
    waitkey

    *========================================================================== 9
    banner "SUMMARY"
    say "1. One confounder keeps appearing: PSI is high in rural counties and imputed"
    say "   0 in most urban districts, where birding grew much faster. It drives the PSI"
    say "   effect on Shannon, on effort, and on which months are observed."
    say "2. Solar-plant area is the better treatment and survives the comparison checks,"
    say "   but it moves with birdwatching effort; holding effort fixed removes it."
    say "3. IV: weak by city/province clustering, but AR sets exclude zero; the binding"
    say "   problem is exclusion - correcting for the measured direct effect removes"
    say "   most of the IV estimate."
    say "4. Next: event study on the first solar plant; weighting for observed months;"
    say "   effort-standardized outcomes; test Area at China BON-Birds fixed sites."
    di _n as res "  End of demo. Full tables: run code/5_0_run_followups.do (logs in /logs)."
end

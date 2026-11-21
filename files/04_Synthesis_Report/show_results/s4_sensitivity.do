* Task 2: Cinelli-Hazlett sensitivity results (saved by 2_1_sensitivity_analysis.do)
import delimited using "$T2/tables/2_1_robustness_values.csv", clear varnames(1)
format est %8.4f
format r2_yd rv_q1 rv_q1_a05 rv_q1_a05_clustered %7.4f
list spec est r2_yd rv_q1 rv_q1_a05 rv_q1_a05_clustered, noobs sep(0) abbreviate(20)
import delimited using "$T2/tables/2_1_benchmark_bounds.csv", clear varnames(1)
keep if benchmark=="Duration" | strpos(benchmark,"Urban")
keep if strpos(spec,"S1")
format adj_est %8.4f
format adj_t_clustered %6.2f
list benchmark k adj_est adj_t_clustered, noobs sep(0) abbreviate(20)

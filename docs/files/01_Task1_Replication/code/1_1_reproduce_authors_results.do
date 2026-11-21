*==========================================================================
* 1_1_reproduce_authors_results.do
* PURPOSE : Run the authors' complete replication code (paths changed only)
*           and produce every table and figure in the paper.
* INPUT   : 00_Original_Package/DATA (all .dta files)
* CODE    : 1_1a_authors_code_localpaths.do (authors' CODE.do; [PATH] lines)
* OUTPUT  : tables/authors_tables (.rtf)  (Tables 1-2, S4, S7-S19, R1-R2)
*           figures/authors_figures (.pdf) (Figs S2, S3)
* WHY     : Task 1, item 3 — check the published numbers can be reproduced
*           from the authors' own code and data before analysing them.
*==========================================================================
do "$T1/code/1_1a_authors_code_localpaths.do"

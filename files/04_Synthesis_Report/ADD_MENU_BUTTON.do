* Run once per Stata session: adds  User > Solar Birds Demo  to the menu bar.
window menu clear
window menu append submenu "stUser" "Solar Birds Demo"
window menu append item "Solar Birds Demo" "Run full demo (all results)" ///
    `"do "YOUR_PATH/China-SolarPolicy-Replication/04_Synthesis_Report/DEMO_show_all_results.do""'
window menu refresh
di as res "Menu added: User > Solar Birds Demo > Run full demo"

*==========================================================================
* ADD_FOLLOWUP_MENU.do  -  run ONCE. Adds a one-click menu item:
*     User > Solar Birds: Follow-ups (13 Nov)
* Clicking it runs DEMO_followups.do. The item is also written to your
* profile.do so it appears every time Stata starts.
*==========================================================================
local demo "YOUR_PATH/China-SolarPolicy-Replication/05_Followups_Nov13/DEMO_followups.do"

* 1. add the menu item now
window menu append item "stUser" "Solar Birds: Follow-ups (13 Nov)" `"do "`demo'""'
window menu refresh

* 2. make it permanent: append the same two lines to profile.do (once)
local prof "`c(sysdir_personal)'profile.do"
capture findfile profile.do
if !_rc local prof "`r(fn)'"
* create the PERSONAL folder (and its parents) if it does not exist yet
local p "`c(sysdir_personal)'"
local build ""
local rest = subinstr("`p'", "/", " ", .)
foreach part of local rest {
    local build "`build'/`part'"
    capture mkdir "`build'"
}
local already 0
capture confirm file "`prof'"
if !_rc {
    tempname fh
    file open `fh' using "`prof'", read text
    file read `fh' line
    while r(eof) == 0 {
        if strpos(`"`macval(line)'"', "Follow-ups (13 Nov)") local already 1
        file read `fh' line
    }
    file close `fh'
}
if !`already' {
    tempname fw
    file open `fw' using "`prof'", write text append
    file write `fw' _n `"window menu append item "stUser" "Solar Birds: Follow-ups (13 Nov)" `"do "`demo'""'"' _n
    file write `fw' "window menu refresh" _n
    file close `fw'
    di as res "Added to `prof'"
}
else di as txt "Menu item already in `prof'"
di as res "Done: look under the User menu -> Solar Birds: Follow-ups (13 Nov)"

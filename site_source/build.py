#!/usr/bin/env python3
"""Builds the website (docs/) from the replication package and the page sources.
Every link to a Stata log line is verified: the build fails if a cited string is not in the cited file."""
import csv, html, json, os, re, shutil, subprocess, sys
from pathlib import Path

PKG = Path('/home/claude/pkg')            # the replication package (code, logs, tables, figures, reports)
RAW = Path('/home/claude/fu/raw/DATA')    # authors' data files
SRC = Path('/home/claude/web/src')
OUT = Path('/home/claude/web/out')
REPO = 'https://github.com/sahiljangra12/China-SolarPolicy-Replication'
LOCAL = '/Users/sahiljangra/Desktop/Johns Hopkins/RA/Solar_Birds_Replication'
PORTABLE = 'YOUR_PATH/China-SolarPolicy-Replication'

# Not published: rehearsal scripts and notes that recount private meetings
HELD = ['04_Meeting_Script', '04_Synthesis_Report/Knowledge_Base', '04_Synthesis_Report/Presentation_Speech',
        '04_Synthesis_Report/Talking_Points']
def held(rel): return any(rel.startswith(h) for h in HELD)

if OUT.exists(): shutil.rmtree(OUT)
for d in ['assets', 'files', 'figures', 'reports', 'shots']: (OUT / d).mkdir(parents=True)

# ---------------------------------------------------------------- text files (code, logs, tables)
def scrub(text): return text.replace(LOCAL, PORTABLE).replace('/Users/sahiljangra/Desktop/Johns Hopkins/RA/Stata Analysis/DATA', PORTABLE + '/00_Original_Package/DATA')
files_meta = {}
for p in sorted(PKG.rglob('*')):
    if not p.is_file(): continue
    rel = p.relative_to(PKG).as_posix()
    if held(rel) or p.name == '.DS_Store' or rel == 'README.md': continue
    dest = None
    if p.suffix in ('.do', '.log', '.csv', '.md'):
        dest = OUT / 'files' / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        txt = p.read_text(encoding='utf-8', errors='replace')
        dest.write_text(scrub(txt) if p.suffix == '.do' else txt, encoding='utf-8')
    elif p.suffix == '.rtf':
        dest = OUT / 'files' / (rel + '.txt')
        dest.parent.mkdir(parents=True, exist_ok=True)
        txt = subprocess.run(['pandoc', '-f', 'rtf', '-t', 'plain', '--columns=400', str(p)], capture_output=True, text=True).stdout
        dest.write_text(re.sub(r'\^\((\*+)\)', r'\1', txt), encoding='utf-8')
    if dest: files_meta[dest.relative_to(OUT).as_posix()] = dest.stat().st_size

# ---------------------------------------------------------------- figures, screenshots, reports
FIGS = [  # (source, name, caption)
 ('05_Followups_Nov13/figures/5_4_observed_share_by_year.png', 'Observed months by year', 'Share of possible county-months with any bird record, urban and rural.'),
 ('05_Followups_Nov13/figures/5_5_area_coefplot.png', 'Solar area: coefficient plot', 'Effect of solar-plant area on Shannon across specifications.'),
 ('05_Followups_Nov13/figures/5_6_anderson_rubin_curve.png', 'Anderson-Rubin curve', 'Weak-instrument-robust test across candidate IV effect sizes.'),
 ('06_Followups_Nov19/figures/6_1_contour_estimate_S1.png', 'Sensitivity contours: estimate, paper design', 'How the estimate changes with confounder strength (sensemakr).'),
 ('06_Followups_Nov19/figures/6_1_contour_estimate_S2.png', 'Sensitivity contours: estimate, urban x month', 'Same, with urban x year-month effects.'),
 ('06_Followups_Nov19/figures/6_1_contour_tvalue_S1.png', 'Sensitivity contours: t-value, paper design', 'How the t-value changes with confounder strength.'),
 ('06_Followups_Nov19/figures/6_1_contour_tvalue_S2.png', 'Sensitivity contours: t-value, urban x month', 'Same, with urban x year-month effects.'),
 ('06_Followups_Nov19/figures/6_2_dcdh_dyn_eventstudy.png', 'dCDH event study', 'de Chaisemartin-D\'Haultfoeuille effects and placebos, PSI as a dose.'),
 ('03_Task3_Staggered_DiD/figures/3_2_event_study_twfe.pdf', 'Event study: TWFE', 'Two-way fixed effects event study of first solar-policy adoption.'),
 ('03_Task3_Staggered_DiD/figures/3_3_event_study_cs_1.pdf', 'Event study: Callaway-Sant\'Anna, main sample', 'Unconditional, counties with real PSI.'),
 ('03_Task3_Staggered_DiD/figures/3_3_event_study_cs_2.pdf', 'Event study: Callaway-Sant\'Anna, conditional on urban', 'Main sample, conditioning on urban status.'),
 ('03_Task3_Staggered_DiD/figures/3_3_event_study_cs_3.pdf', 'Event study: Callaway-Sant\'Anna, paper-style sample', 'Counties with missing PSI treated as never treated.'),
 ('03_Task3_Staggered_DiD/figures/3_4_event_study_bjs_1.pdf', 'Event study: BJS, main sample', 'Borusyak-Jaravel-Spiess imputation estimator.'),
 ('03_Task3_Staggered_DiD/figures/3_4_event_study_bjs_2.pdf', 'Event study: BJS, paper-style sample', 'Counties with missing PSI treated as never treated.'),
 ('03_Task3_Staggered_DiD/figures/3_5_event_study_sa.pdf', 'Event study: Sun-Abraham', 'Interaction-weighted estimator, main sample.'),
 ('02_Task2_Sensitivity/figures/2_1_contour_estimate_S1.pdf', 'Task 2 contours: estimate, paper design', 'First sensitivity run (exact degrees of freedom).'),
 ('02_Task2_Sensitivity/figures/2_1_contour_estimate_S2.pdf', 'Task 2 contours: estimate, urban x month', 'First sensitivity run, urban x year-month effects.'),
 ('02_Task2_Sensitivity/figures/2_1_contour_tvalue_S1.pdf', 'Task 2 contours: t-value, paper design', 'First sensitivity run.'),
 ('02_Task2_Sensitivity/figures/2_1_contour_tvalue_S2.pdf', 'Task 2 contours: t-value, urban x month', 'First sensitivity run.'),
 ('01_Task1_Replication/figures/authors_figures/FigS2_PV_area_vs_PSI.pdf', 'Fig. S2 as reproduced', 'PSI against solar-plant area, from the authors\' code.'),
 ('01_Task1_Replication/figures/authors_figures/FigS3_PSI_vs_instrument.pdf', 'Fig. S3 as reproduced', 'PSI against the instrument, from the authors\' code.'),
]
figures = []
for src, name, cap in FIGS:
    p = PKG / src; stem = p.stem
    if p.suffix == '.pdf': subprocess.run(['pdftoppm', '-r', '140', '-png', '-singlefile', str(p), str(OUT / 'figures' / stem)], check=True)
    else: shutil.copy(p, OUT / 'figures' / p.name)
    figures.append({'file': f'figures/{stem}.png', 'name': name, 'cap': cap})
SHOTS = [('c_s0.jpg', 'Stata: 12-number reproduction check'), ('c_s1.jpg', 'Stata: the paper\'s main regression'), ('c_s2.jpg', 'Stata: urban x year-month effects'),
         ('c_s3.jpg', 'Stata: instrument where PSI cannot respond'), ('c_s4.jpg', 'Stata: sensitivity analysis'), ('c_s5a.jpg', 'Stata: staggered DiD (1)'), ('c_s5b.jpg', 'Stata: staggered DiD (2)')]
for f, cap in SHOTS:
    shutil.copy(PKG / '04_Synthesis_Report/shots' / f, OUT / 'shots' / f)
    figures.append({'file': f'shots/{f}', 'name': cap, 'cap': 'Screenshot of the Stata Results window.'})

REPORTS = [  # (source, title, description, when)
 ('07_Final_Report/Final_Report.pdf', 'Final report', 'All tasks and follow-ups in one account, with interpretation and the reason for each analysis. Start here.', '20 Nov 2026'),
 ('07_Final_Report/dCDH_Report.pdf', 'dCDH estimators', 'de Chaisemartin and D\'Haultfoeuille estimators with PSI as a dose, and which of their methods fits these data.', '20 Nov 2026'),
 ('06_Followups_Nov19/report/Followup2_Nov19.pdf', 'Follow-ups, 19 November', 'Residualized sensitivity analysis, dCDH estimators, the birdwatcher variable, Area data checks.', '19 Nov 2026'),
 ('04_Synthesis_Report/Summary_for_Prof_Ferraro.pdf', 'Summary of Tasks 1-3 and first follow-ups', 'Six-page summary prepared for the 19 November meeting.', '18 Nov 2026'),
 ('05_Followups_Nov13/report/Followup_Report.pdf', 'Follow-ups, 13 November', 'Effort test, sample flow, missing-months grid, solar area as treatment, weak-instrument and Anderson-Rubin inference. Includes annotated code.', '18 Nov 2026'),
 ('01_Task1_Replication/report/Task1_Report.pdf', 'Task 1: Replication', 'Reproduction, data structure, estimands, TWFE diagnostics and IV exclusion tests.', 'Nov 2026'),
 ('02_Task2_Sensitivity/report/Task2_Report.pdf', 'Task 2: Sensitivity analysis', 'Cinelli-Hazlett robustness values, benchmark bounds and contour plots.', 'Nov 2026'),
 ('03_Task3_Staggered_DiD/report/Task3_Report.pdf', 'Task 3: Staggered DiD', 'Adoption timing, TWFE event study, Callaway-Sant\'Anna, BJS and Sun-Abraham.', 'Nov 2026'),
 ('04_Synthesis_Report/Synthesis_Report.pdf', 'Synthesis of Tasks 1-3', 'Reproducible but not robust: seven-page synthesis of the first three tasks.', 'Nov 2026'),
 ('04_Synthesis_Report/Replication_Report.pdf', 'Tasks 1-3 with Stata screenshots', 'Methods, code, results and screenshots of the Stata output for each task.', 'Nov 2026'),
 ('04_Synthesis_Report/Results_Explained.pdf', 'Results in plain English', 'What the three tasks show, without jargon.', 'Nov 2026'),
 ('04_Framework_Comparison/FH_Framework_Comparison.pdf', 'Ferraro and Hanauer framework: the design', 'What the framework recommends, what the paper did, and how to close each gap.', 'Nov 2026'),
 ('04_Framework_Comparison/FH_Results_Comparison.pdf', 'Ferraro and Hanauer framework: the results', 'The paper\'s results, our Stata results and a verdict for each check.', 'Nov 2026'),
 ('00_Paper_Guide/Solar_Paper_Simple_Guide.pdf', 'Plain guide to the paper', 'What the paper does, section by section, in simple language.', 'Nov 2026'),
]
reports = []
for src, title, desc, when in REPORTS:
    p = PKG / src; shutil.copy(p, OUT / 'reports' / p.name)
    pages = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', str(p)], capture_output=True, text=True).stdout).group(1))
    tex = src[:-4] + '.tex'
    reports.append({'file': f'reports/{p.name}', 'title': title, 'desc': desc, 'when': when, 'pages': pages, 'tex': tex if (PKG / tex).exists() else ''})

# ---------------------------------------------------------------- library lists
GROUPS = {'00_Original_Package': 'Authors\' package', '01_Task1_Replication': 'Task 1: Replication', '02_Task2_Sensitivity': 'Task 2: Sensitivity',
          '03_Task3_Staggered_DiD': 'Task 3: Staggered DiD', '04_Synthesis_Report': 'Synthesis helpers', '05_Followups_Nov13': 'Follow-ups, 13 Nov',
          '06_Followups_Nov19': 'Follow-ups, 19 Nov', '07_Interactive': 'Live tools', '': 'Run everything'}
def group(rel): return GROUPS.get(rel.split('/')[0] if '/' in rel else '', 'Other')
def purpose(path):
    t = path.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'^\*\s*(?:PURPOSE|Purpose)\s*:\s*(.+(?:\n\*\s{6,}.+)*)', t, re.M)
    if m:
        s = ' '.join(re.sub(r'^\*\s*', '', l).strip() for l in m.group(1).split('\n'))
        return re.split(r'(?<=[a-z0-9\)])\.\s', s)[0].rstrip('.')[:170]
    return ''
CODE_DESC = {'00_config.do': 'Paths, control-variable lists and package installation', 'run_all.do': 'Runs Tasks 1 to 3', 'run_everything.do': 'Runs every task and follow-up',
             '00_Original_Package/authors_CODE.do': 'The authors\' original code (only the data path edited)', '01_Task1_Replication/code/1_1a_authors_code_localpaths.do': 'The authors\' code with only file paths changed'}
code, logs, tables = [], [], []
purposes = {}
for rel in sorted(files_meta):
    r = rel[len('files/'):]; name = r.split('/')[-1]; size = files_meta[rel]
    if r.endswith('.do'):
        d = CODE_DESC.get(r) or purpose(OUT / rel) or ('Runner for this step' if re.match(r'(run\d+|\d_0\w*)\.do', name) else 'Helper')
        purposes[name[:-3]] = d
        code.append({'file': rel, 'name': name, 'desc': d, 'group': group(r), 'size': size})
for rel in sorted(files_meta):
    r = rel[len('files/'):]; name = r.split('/')[-1]; size = files_meta[rel]
    if r.endswith('.log'):
        logs.append({'file': rel, 'name': name, 'desc': purposes.get(name[:-4], 'Stata log'), 'group': group(r), 'size': size})
    elif r.endswith('.csv') or r.endswith('.rtf.txt'):
        if r.endswith('.csv'):
            d = {'1_3_data_structure_facts': 'Facts about the data: rows, counties, records by year, PSI distribution', '1_4_reproduction_check': 'Twelve published numbers against our reproduction',
                 '2_1_benchmark_bounds': 'Sensitivity bounds for every benchmark control, 1 to 5 times its strength', '2_1_robustness_values': 'Robustness values, classical and clustered',
                 '3_1_cohort_sizes': 'Counties by year of first solar policy', '3_2_twfe': 'TWFE event-study coefficients', '3_3_cs_att': 'Callaway-Sant\'Anna overall effects',
                 '3_3_cs_event': 'Callaway-Sant\'Anna event-study coefficients', '3_4_bjs': 'Borusyak-Jaravel-Spiess coefficients', '3_5_sun_abraham': 'Sun-Abraham coefficients',
                 '5_3_sample_flow': 'Rows and counties at each step of sample construction', 'spec_grid': '792 regressions behind the specification tool',
                 'iv_gamma': 'IV estimates for each assumed direct effect of the instrument', 'sens_inputs': 'Inputs for the sensitivity calculator'}.get(name[:-4], 'Table')
        else:
            lines = [l.strip() for l in (OUT / rel).read_text().split('\n') if l.strip()]
            head = []
            for l in lines:
                if l.startswith('---'): break
                head.append(l)
            d = ' '.join(head)[:150] or {'5_4_missingness': 'Does PSI predict which months are observed?', '5_5_pv_area': 'Solar-plant area as the treatment', '5_6_weak_iv': '2SLS and first-stage strength by clustering'}.get(name[:-8], 'Regression table')
        g = 'Authors\' tables, as reproduced' if 'authors_tables' in r else group(r)
        tables.append({'file': rel, 'name': name.replace('.rtf.txt', '.rtf'), 'desc': d, 'group': g, 'size': size})

AUTH = {'Bird': 'Bird diversity indices (Shannon, Simpson), county-month', 'BTN': 'Birdwatching time (BT) and number of birdwatchers (BN)', 'PI': 'Policy Stringency Index (PSI)',
 'Climate': 'Temperature and wind speed', 'PD': 'Population density', 'air': 'CO2 emissions and PM2.5', 'TD': 'Land use: water, green cover, farmland, grassland', 'IC': 'Installed capacity of centralized solar plants',
 'cities': 'Provincial capital and municipality indicator', 'enin': 'Central Environmental Inspection indicator', 'Coal': 'Coal plant closure indicator', 'Windexp': 'Wind power expansion indicator',
 'highPI': 'Neighbours a high-PSI county', 'sunshine': 'Average sunshine duration by county', 'CCPU': 'City climate-policy uncertainty index', 'poverty': 'National poverty county', 'north_region': 'Three-North region indicator',
 'Gebi': 'Sandy and gravel desert indicator', 'Ndvi': 'NDVI vegetation index', 'NL': 'Night-time light', 'LAI': 'Leaf area index', 'Richeven': 'Species richness and evenness', 'AP': 'Crop yield', 'baseline': 'Authors\' county-year baseline file'}
def adesc(stem):
    if stem in AUTH: return AUTH[stem]
    if re.match(r'PI\d', stem): return 'Alternative PSI scoring'
    if stem.startswith('BirdDrop'): return 'Bird diversity after excluding low-activity observations'
    return 'Diversity for a species group (heterogeneity analysis)'
data = [{'name': p.name, 'path': f'00_Original_Package/DATA/{p.name}', 'desc': adesc(p.stem), 'group': 'Authors', 'size': p.stat().st_size} for p in sorted(RAW.glob('*.dta'))]
BUILT = {'01_Task1_Replication/data/analysis_sample.dta': 'The paper\'s regression sample plus our flags (urban, real PSI). Used by every task',
 '01_Task1_Replication/data/authors_countyyear_baseline.dta': 'County-year file written by the authors\' code', '03_Task3_Staggered_DiD/data/staggered_monthly.dta': 'County-month panel with adoption cohorts',
 '03_Task3_Staggered_DiD/data/staggered_countyyear.dta': 'County-year panel with adoption cohorts', '05_Followups_Nov13/data/county_month_grid.dta': 'Full county x month grid, observed or not',
 '06_Followups_Nov19/data/countyyear_psi.dta': 'County-year panel for the dCDH estimators', '07_Interactive/data/spec_grid.dta': '792 regressions behind the specification tool'}
for rel, d in BUILT.items(): data.append({'name': rel.split('/')[-1], 'path': rel, 'desc': d, 'group': 'Built here', 'size': (PKG / rel).stat().st_size})

DICT = [('ShannonBD', 'Shannon diversity index (the outcome)', 'ShannonBD'), ('PI', 'Policy Stringency Index, PSI (the treatment)', '政策强度'),
 ('Area', 'Area of centralized solar plants, km²', '集中式光伏电站面积平方千米'), ('ICtotal', 'Cumulative installed solar capacity, MW', '累计装机规模MW'),
 ('BN', 'Labelled "number of birdwatchers"; in the data, a count of submitted records', '观鸟人数'), ('BT', 'Total birdwatching time', '观鸟时长'),
 ('BTN', 'Birdwatching time per birdwatcher (BT / BN)', ''), ('Duration', 'ln(BT/BN + 1): the paper\'s effort control', 'Duration'),
 ('Temp', 'Annual mean temperature', '年均温'), ('Wind', 'Mean wind speed', '平均风速'), ('Pop', 'ln(population density)', 'Pop'), ('PD', 'Population density, people per km²', '人口密度人/平方公里'),
 ('Carbon', 'ln(carbon emissions)', 'Carbon'), ('CO2', 'Carbon emissions, tonnes', '碳排放吨'), ('Water', 'Water share of county area', '水域占比'), ('Green', 'Forest and shrub share', '森林灌木占比'),
 ('Farm', 'Farmland share', '农田占比'), ('Grass', 'Grassland share', '草原占比'),
 ('sun', 'Average sunshine duration. The label says 1994–2023; the paper says 1984–2013', '1994-2023日照时长平均'), ('lnsun', 'ln(sunshine)', ''),
 ('CCPU', 'City climate-policy uncertainty index', 'CCPU'), ('inv_CCPU', '1 / CCPU', ''), ('Sun_ccpu', 'The instrument: ln(sunshine) / CCPU', ''),
 ('in_PI_file', 'Our flag: 1 if the county is in the policy file, 0 if PSI was filled in as 0', 'County present in PI.dta (1) or PSI imputed as 0 (0)'),
 ('urban', 'Our flag: urban district (administrative code ending 01–20)', 'Urban district (admin code ending 01-20)'), ('any_PSI', 'Our flag: PSI above 0 in this year', 'PSI > 0 in this year'),
 ('PI_stock', 'Our variable: cumulative PSI', ''), ('county', 'County identifier', 'group(id)'), ('id', 'County administrative code', '县级行政区划代码'),
 ('prov', 'Province identifier', 'Province id'), ('city', 'Prefecture city identifier', 'Prefecture city id'), ('YEAR', 'Calendar year', ''), ('year', 'Year-month index (the paper\'s time fixed effect)', ''), ('month', 'Month', ''),
 ('SimpsonBD', 'Simpson diversity index', 'SimpsonBD'), ('Richness', 'Number of species recorded', 'Richness'), ('Evenness', 'Evenness of records across species', 'Evenness'),
 ('ShannonBD3 / 5 / 10 / 20', 'Shannon after the authors\' low-activity exclusions', 'ShannonBD3 ...'), ('PI1 – PI6', 'Alternative PSI scorings (1-2-3, 1-2-4, 2-4-8; weighted and unweighted)', '分值等分三段赋分 ...'),
 ('Ndvi', 'NDVI vegetation index', 'Ndvi'), ('Nightlight', 'Mean night-time light', '夜间灯光均值'), ('LAI', 'Leaf area index', '叶面积指数'),
 ('cities', 'Provincial capital or municipality', '省会或直辖市=1'), ('CEI', 'Central Environmental Inspection policy', '环保督察政策'), ('FFP / Coal', 'Coal power plant closure', '煤电厂关闭'),
 ('Windexp', 'Wind power expansion', ''), ('Greenfin', 'Green-finance pilot zone', ''), ('poverty_county', 'National poverty county', '贫困县'), ('north_region', 'In the Three-North region', '属于三北地区=1'),
 ('desert_gobi', 'Sandy or gravel desert', '沙戈壁'), ('Migratory / Resident', 'Diversity of migratory / resident species', '候鸟 / 留鸟'), ('Endemic / non_Endemic', 'Diversity of endemic / other species', '特有鸟种'),
 ('Protected / non_Protected', 'Diversity of nationally protected / other species', '国家重点保护野生动物'), ('Nest_veg / Land_water', 'Diversity by nesting guild', '利用植被 / 陆地水面'),
 ('Herbivorous / non_Herbivorous', 'Diversity by diet', '食茎叶果实 / 杂食食肉虫'), ('Small_flock / Large_flock', 'Diversity by flocking behaviour', '小群 / 大群'), ('APtotal / Output', 'Grain output, tonnes / its log', '粮食产量吨')]

(OUT / 'assets/library.js').write_text('window.LIB=' + json.dumps({'reports': reports, 'figures': figures, 'tables': tables, 'logs': logs, 'code': code, 'data': data, 'dict': DICT}, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')

# ---------------------------------------------------------------- data.js (all from Stata output files)
def rows(rel): return list(csv.DictReader(open(PKG / rel, encoding='utf-8-sig')))
specs = [[r['y'], r['d'], r['fe'], r['smp'], r['ctrl'], r['cl'], float(r['b']), float(r['se']), float(r['p']), int(float(r['N'])), int(float(r['Ncl']))] for r in rows('07_Interactive/data/spec_grid.csv')]
sens = {r['spec']: {k: float(v) for k, v in r.items() if k != 'spec'} for r in rows('07_Interactive/data/sens_inputs.csv')}
iv = {}; gh = None
for r in rows('07_Interactive/data/iv_gamma.csv'):
    iv.setdefault(r['cl'], []).append([float(r['gamma']), float(r['b']), float(r['se'])]); iv['F_' + r['cl']] = float(r['F']); gh = (float(r['ghat']), float(r['gse']))
for k in ('county', 'city'): iv[k].sort()
def series(rws, key, label_of):
    out = {}
    for r in rws:
        out.setdefault(r[key], {'pts': [], 'att': None})
        k = int(float(r['event_time']))
        if k == 99: out[r[key]]['att'] = [float(r['b']), float(r['se'])]
        else: out[r[key]]['pts'].append([k, float(r['b']), float(r['se'])])
    return [{'label': label_of(k), 'pts': v['pts'], 'att': v['att']} for k, v in out.items()]
cs = series(rows('03_Task3_Staggered_DiD/tables/3_3_cs_event.csv'), 'spec', lambda k: k)
csatt = {r['spec']: [float(r['att']), float(r['se'])] for r in rows('03_Task3_Staggered_DiD/tables/3_3_cs_att.csv')}
for s in cs: s['att'] = csatt.get(s['label'])
bjs = series(rows('03_Task3_Staggered_DiD/tables/3_4_bjs.csv'), 'spec', lambda k: k)
sa_rows = rows('03_Task3_Staggered_DiD/tables/3_5_sun_abraham.csv'); tw_rows = rows('03_Task3_Staggered_DiD/tables/3_2_twfe.csv')
def single(rws, lab):
    pts = [[int(float(r['event_time'])), float(r['b']), float(r['se'])] for r in rws if int(float(r['event_time'])) != 99]
    att = [[float(r['b']), float(r['se'])] for r in rws if int(float(r['event_time'])) == 99]
    return [{'label': lab, 'pts': pts, 'att': att[0] if att else None}]
def short(l): return l.replace(' (missing PSI = never)', '').replace('Main sample, ', 'Main sample: ')
for grp in (cs, bjs):
    for s in grp: s['label'] = short(s['label'])
es = [{'name': 'Borusyak, Jaravel & Spiess (imputation)', 'series': bjs}, {'name': 'Callaway & Sant\'Anna', 'series': cs},
      {'name': 'Sun & Abraham', 'series': single(sa_rows, 'Main sample')}, {'name': 'TWFE event study', 'series': single(tw_rows, 'Main sample')}]
repro = [[r['result'], r['paper_b'], r['paper_se'], r['our_b'], r['our_se'], int(float(r['our_N'])), int(r['match'])] for r in rows('01_Task1_Replication/tables/1_4_reproduction_check.csv')]
flow = [[re.sub(r'^\d\s*', '', r['step']).split(' (')[0].replace('Bird.dta: ', '').replace(' (authors)', ''), int(r['rows']), int(r['counties'])] for r in rows('05_Followups_Nov13/tables/5_3_sample_flow.csv')]
flow_labels = ['All possible county-months', 'With a bird record', 'No missing control', 'Regression sample', 'IV sample']
flow = [[flow_labels[i], f[1], f[2]] for i, f in enumerate(flow)]
facts = {r['fact']: r['value'] for r in rows('01_Task1_Replication/tables/1_3_data_structure_facts.csv')}
years = [[str(y), int(facts[f'Bird.dta: county-months in {y}'])] for y in range(2014, 2024)]
coh = [[('Never' if r['adoption_year'] == '0' else r['adoption_year']), int(r['counties_main'])] for r in rows('03_Task3_Staggered_DiD/tables/3_1_cohort_sizes.csv')]
coh = coh[1:] + coh[:1]
log63 = (PKG / '06_Followups_Nov19/logs/6_3_meeting_facts.log').read_text()
m0 = re.search(r'^\s+0 \|\s+(\d[\d,]*)\s+[\d,]+ \|\s+([\d,]+)\s*\n\s+1 \|\s+(\d[\d,]*)\s+[\d,]+ \|\s+([\d,]+)', log63[log63.index('tab urban in_PI_file if tagc'):], re.M)
n = lambda s: int(s.replace(',', ''))
imp = {'rural': [n(m0.group(1)), n(m0.group(2))], 'urban': [n(m0.group(3)), n(m0.group(4))]}
assert imp == {'rural': [9, 1497], 'urban': [694, 847]}, imp
(OUT / 'assets/data.js').write_text('window.DATA=' + json.dumps({'specs': specs, 'sens': sens, 'iv': iv, 'ghat': gh[0], 'gse': gh[1], 'es': es, 'repro': repro,
    'flow': flow, 'years': years, 'cohorts': coh, 'imp': imp}, separators=(',', ':')) + ';')

# ---------------------------------------------------------------- pages
for f in ['site.css', 'site.js', 'lab.js', 'pagecharts.js', 'libpage.js', 'sources.js']: shutil.copy(SRC / f, OUT / 'assets' / f)
shutil.copytree(SRC / 'pdfjs', OUT / 'assets/pdfjs')
NAV = [('index.html', 'Overview'), ('lab.html', 'Live tools'), ('evidence.html', 'Evidence'), ('paper.html', 'Paper check'), ('library.html', 'Library'), ('qa.html', 'Q&A')]
SHELL = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{title} | Solar Policy and Bird Diversity</title>
<meta name="description" content="Replication and evaluation of Zhang et al. (2026), China's solar expansion policy reduces bird diversity. Stata analyses, live tools and page-level references.">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<header class="top"><div class="in">
  <a class="brand" href="index.html"><i></i><span>Solar Policy &amp; Bird Diversity</span></a>
  <nav class="tabs">{tabs}</nav>
  <div class="tools"><input id="gsearch" type="search" placeholder="Search  /" aria-label="Search this site" autocomplete="off"><div id="gres"></div><button class="iconbtn" id="themeBtn" type="button">Dark</button></div>
</div></header>
<div class="wrap{nosb}">{side}<main>
{body}
</main></div>
<footer>Independent replication and evaluation of Zhang et al. (2026), <i>Science</i> 393, 831. Not affiliated with the paper's authors or the journal. Code, data and outputs: <a href="''' + REPO + '''">GitHub</a>.</footer>
<dialog id="drawer"><div class="dh"><b id="dtitle"></b><button class="iconbtn" data-close type="button">Close</button></div><div class="db" id="dbody"></div></dialog>
<dialog id="viewer"><div class="dh"><b id="vname"></b><span class="small" id="vcount"></span><input id="vfind" type="search" placeholder="Find in file" aria-label="Find in file"><a class="iconbtn" id="vraw" target="_blank" rel="noopener">Raw</a><a class="iconbtn" id="vgh" target="_blank" rel="noopener">GitHub</a><button class="iconbtn" data-close type="button">Close</button></div><pre id="vtext"></pre><div id="vhtml" style="display:none"></div></dialog>
<dialog id="pdfv"><div class="dh"><b id="pdftitle"></b><span class="small" id="pdfpage"></span><button class="iconbtn" id="pdfprev" type="button">&larr;</button><button class="iconbtn" id="pdfnext" type="button">&rarr;</button><button class="iconbtn" id="pdfout" type="button">&minus;</button><button class="iconbtn" id="pdfin" type="button">+</button><button class="iconbtn" id="pdfswap" type="button">Change file</button><button class="iconbtn" data-close type="button">Close</button></div>
  <div id="pdfbody"><div id="pdfask" class="card" style="max-width:560px;margin:40px auto;text-align:left;display:none"><p id="pdfmsg"></p><input type="file" id="pdffile" accept="application/pdf,.pdf"></div><canvas id="pdfcanvas"></canvas></div></dialog>
<dialog id="lightbox"><img alt=""><p></p></dialog>
<script src="assets/data.js"></script>
<script src="assets/sources.js"></script>
<script src="assets/search.js"></script>
<script src="assets/site.js"></script>
{scripts}
</body>
</html>
'''
EXTRA = {'lab.html': ['lab.js'], 'evidence.html': ['pagecharts.js'], 'paper.html': ['pagecharts.js'], 'library.html': ['library.js', 'libpage.js']}
search = []
def strip(h): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|svg|select)[\s\S]*?</\1>', ' ', h)))).strip()
for fn, label in NAV:
    body = (SRC / 'pages' / fn).read_text(encoding='utf-8')
    title = re.search(r'<!--title:(.*?)-->', body).group(1)
    nosb = '<!--nosidebar-->' in body
    tabs = ''.join('<a href="%s"%s>%s</a>' % (f, ' class="on"' if f == fn else '', html.escape(l)) for f, l in NAV)
    page = SHELL.format(title=html.escape(title), tabs=tabs, nosb=' nosb' if nosb else '', side='' if nosb else '<aside class="side" id="side"></aside>', body=body,
                        scripts='\n'.join(f'<script src="assets/{s}"></script>' for s in EXTRA.get(fn, [])))
    (OUT / fn).write_text(page, encoding='utf-8')
    for m in re.finditer(r'<section[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)</section>', body):
        sid, inner = m.group(1), m.group(2)
        h = re.search(r'<h[12][^>]*>([\s\S]*?)</h[12]>', inner)
        if sid == 'qa':
            for d in re.finditer(r'<details><summary>([\s\S]*?)</summary>([\s\S]*?)</details>', inner): search.append({'p': f'{fn}#qa', 't': strip(d.group(1)), 'pg': 'Q&A', 'x': strip(d.group(2))})
            continue
        search.append({'p': f'{fn}#{sid}', 't': strip(h.group(1)) if h else title, 'pg': label, 'x': strip(inner)[:1500]})
for r in reports: search.append({'p': r['file'], 't': r['title'], 'pg': 'Report (PDF)', 'x': r['desc']})
for c in code: search.append({'p': f'library.html#view={c["file"]}', 't': c['name'], 'pg': 'Code', 'x': c['desc']})
for c in logs: search.append({'p': f'library.html#view={c["file"]}', 't': c['name'], 'pg': 'Stata log', 'x': c['desc']})
for c in tables: search.append({'p': f'library.html#view={c["file"]}', 't': c['name'], 'pg': 'Table', 'x': c['desc']})
(OUT / 'assets/search.js').write_text('window.SEARCH=' + json.dumps(search, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
(OUT / '.nojekyll').write_text('')

# ---------------------------------------------------------------- verification
errors = []
texts = {fn: (OUT / fn).read_text(encoding='utf-8') for fn, _ in NAV}
texts['sources.js'] = (OUT / 'assets/sources.js').read_text(encoding='utf-8')
pairs = set()
for name, t in texts.items():
    for m in re.finditer(r'data-file="([^"]+)"(?:\s+data-find="([^"]*)")?', t): pairs.add((m.group(1), html.unescape(m.group(2) or ''), name))
    for m in re.finditer(r"file:'([^']+)'(?:,find:'([^']*)')?", t): pairs.add((m.group(1), (m.group(2) or '').encode().decode('unicode_escape') if '\\u' in (m.group(2) or '') else (m.group(2) or ''), name))
for f, find, where in sorted(pairs):
    p = OUT / f
    if not p.exists(): errors.append(f'MISSING FILE {f} (in {where})'); continue
    if find and find not in p.read_text(encoding='utf-8', errors='replace'): errors.append(f'TEXT NOT FOUND "{find}" in {f} (in {where})')
ids = {fn: set(re.findall(r'\bid="([^"]+)"', t)) for fn, t in texts.items()}
for name, t in texts.items():
    for m in re.finditer(r'''href=["']([^"'#:]+?)(?:#([^"']*))?["']''', t):
        tgt, frag = m.group(1), m.group(2)
        if tgt.startswith(('http', 'mailto')): continue
        if not (OUT / tgt).exists(): errors.append(f'BROKEN LINK {tgt} (in {name})'); continue
        if frag and tgt in ids and not re.match(r'(spec|view|ref)=', frag) and frag not in ids[tgt] and not (tgt == 'library.html' and frag in ('reports', 'figures', 'tables', 'logs', 'code', 'data')): errors.append(f'BROKEN ANCHOR {tgt}#{frag} (in {name})')
    for m in re.finditer(r'data-s="([^"]+)"', t):
        if not re.search(r'(^|\n)' + re.escape(m.group(1)) + r':\{', texts['sources.js']): errors.append(f'UNKNOWN SOURCE {m.group(1)} (in {name})')
    for m in re.finditer(r'<img[^>]+src="([^"]+)"', t):
        if not (OUT / m.group(1)).exists(): errors.append(f'MISSING IMAGE {m.group(1)} (in {name})')
print(f'{len(pairs)} file links checked, {sum(1 for p in pairs if p[1])} with a text anchor; {len(code)} code, {len(logs)} logs, {len(tables)} tables, {len(figures)} figures, {len(reports)} reports, {len(data)} datasets; {len(search)} search entries')
size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
print(f'site size {size/1e6:.1f} MB')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print('all checks passed')

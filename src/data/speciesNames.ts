/** English name of every species of the database, for searching and labelling. */
export const speciesNames: Record<
  string,
  { name: string; alternatives?: string[] }
> = {
  '(C2H5)3N': {
    name: 'triethylamine',
    alternatives: ['N,N-diethylethanamine'],
  },
  '(C2H5)3NH+': {
    name: 'triethylammonium ion',
    alternatives: ['protonated triethylamine', 'triethylazanium ion'],
  },
  'Ag(CH3NH2)2+': {
    name: 'bis(methylamine)silver(I) ion',
    alternatives: [
      'silver(I) methylamine complex',
      'bis(methanamine)silver(I) ion',
    ],
  },
  'Ag(CN)2-': {
    name: 'dicyanoargentate(I) ion',
    alternatives: ['dicyanidoargentate(I) ion', 'silver dicyanide complex'],
  },
  'Ag(NH3)2+': {
    name: 'diamminesilver(I) ion',
    alternatives: [
      'silver diammine complex',
      "Tollens' reagent ion",
      'diamminesilver(I) cation',
    ],
  },
  'Ag(S2O3)2---': {
    name: 'bis(thiosulfato)argentate(I) ion',
    alternatives: [
      'bis(thiosulfato)silver(I) ion',
      'silver dithiosulfate complex',
      'bis(thiosulphato)argentate(I) ion',
    ],
  },
  'Ag+': {
    name: 'silver(I) ion',
    alternatives: ['silver ion', 'silver cation', 'argentous ion'],
  },
  Ag2CO3: {
    name: 'silver carbonate',
    alternatives: ['silver(I) carbonate', 'disilver carbonate'],
  },
  Ag2CrO4: {
    name: 'silver chromate',
    alternatives: ['silver(I) chromate'],
  },
  Ag2S: {
    name: 'silver sulfide',
    alternatives: ['silver(I) sulfide', 'silver sulphide', 'acanthite'],
  },
  AgBr: {
    name: 'silver bromide',
    alternatives: ['silver(I) bromide'],
  },
  'AgBr2-': {
    name: 'dibromoargentate(I) ion',
    alternatives: ['dibromidoargentate(I) ion', 'silver dibromide complex'],
  },
  AgBrO3: {
    name: 'silver bromate',
    alternatives: ['silver(I) bromate'],
  },
  AgCl: {
    name: 'silver chloride',
    alternatives: ['silver(I) chloride', 'chlorargyrite'],
  },
  'AgCl2-': {
    name: 'dichloroargentate(I) ion',
    alternatives: ['dichloridoargentate(I) ion', 'silver dichloride complex'],
  },
  AgI: {
    name: 'silver iodide',
    alternatives: ['silver(I) iodide'],
  },
  'AgI2-': {
    name: 'diiodoargentate(I) ion',
    alternatives: ['diiodidoargentate(I) ion', 'silver diiodide complex'],
  },
  AgOH: {
    name: 'silver hydroxide',
    alternatives: ['silver(I) hydroxide'],
  },
  'Al(H2O)5OH++': {
    name: 'pentaaquahydroxoaluminium(III) ion',
    alternatives: [
      'pentaaquahydroxidoaluminium(III) ion',
      'hydroxopentaaquaaluminum(III) ion',
      'monohydroxo aluminium complex',
    ],
  },
  'Al(H2O)6+++': {
    name: 'hexaaquaaluminium(III) ion',
    alternatives: [
      'hexaaquaaluminum(III) ion',
      'hydrated aluminium(III) ion',
      'aquated aluminium ion',
    ],
  },
  'Al(OH)3': {
    name: 'aluminium hydroxide',
    alternatives: [
      'aluminum hydroxide',
      'aluminium(III) hydroxide',
      'gibbsite',
    ],
  },
  'Al+++': {
    name: 'aluminium(III) ion',
    alternatives: ['aluminum ion', 'aluminium cation', 'Al3+'],
  },
  'AlF4-': {
    name: 'tetrafluoroaluminate ion',
    alternatives: [
      'tetrafluoridoaluminate(III) ion',
      'tetrafluoroaluminate(III) ion',
    ],
  },
  'AlF6---': {
    name: 'hexafluoroaluminate ion',
    alternatives: ['hexafluoridoaluminate(III) ion', 'cryolite anion'],
  },
  'Au(CN)2-': {
    name: 'dicyanoaurate(I) ion',
    alternatives: [
      'dicyanidoaurate(I) ion',
      'gold dicyanide complex',
      'gold cyanide leaching complex',
    ],
  },
  'Au+': {
    name: 'gold(I) ion',
    alternatives: ['aurous ion', 'gold(I) cation'],
  },
  'Ba++': {
    name: 'barium ion',
    alternatives: ['barium(II) ion', 'barium cation', 'Ba2+'],
  },
  BaCO3: {
    name: 'barium carbonate',
    alternatives: ['witherite'],
  },
  BaCrO4: {
    name: 'barium chromate',
    alternatives: ['barium chromate(VI)'],
  },
  BaF2: {
    name: 'barium fluoride',
    alternatives: ['frankdicksonite'],
  },
  BaSO4: {
    name: 'barium sulfate',
    alternatives: ['barium sulphate', 'barite', 'baryte'],
  },
  'Be++': {
    name: 'beryllium ion',
    alternatives: ['beryllium(II) ion', 'beryllium cation', 'Be2+'],
  },
  'BeF4--': {
    name: 'tetrafluoroberyllate ion',
    alternatives: [
      'tetrafluoridoberyllate(II) ion',
      'tetrafluoroberyllate(II) ion',
    ],
  },
  'Bi+++': {
    name: 'bismuth(III) ion',
    alternatives: ['bismuth ion', 'bismuthous ion', 'Bi3+'],
  },
  Bi2S3: {
    name: 'bismuth(III) sulfide',
    alternatives: ['bismuth sulfide', 'bismuth sulphide', 'bismuthinite'],
  },
  'Br-': {
    name: 'bromide ion',
    alternatives: ['bromide', 'bromide anion'],
  },
  'BrO-': {
    name: 'hypobromite ion',
    alternatives: ['bromate(I) ion', 'hypobromite'],
  },
  'BrO3-': {
    name: 'bromate ion',
    alternatives: ['bromate(V) ion', 'bromate'],
  },
  'C2H5COO-': {
    name: 'propanoate ion',
    alternatives: ['propionate ion', 'propanoate', 'propionate'],
  },
  C2H5COOH: {
    name: 'propanoic acid',
    alternatives: ['propionic acid'],
  },
  C2H5NH2: {
    name: 'ethylamine',
    alternatives: ['ethanamine', 'aminoethane', 'monoethylamine'],
  },
  'C2H5NH3+': {
    name: 'ethylammonium ion',
    alternatives: [
      'protonated ethylamine',
      'ethylazanium ion',
      'ethanaminium ion',
    ],
  },
  C2H8N2: {
    name: 'ethylenediamine',
    alternatives: [
      'ethane-1,2-diamine',
      '1,2-diaminoethane',
      'H2NCH2CH2NH2',
      'en',
    ],
  },
  'C2O4--': {
    name: 'oxalate ion',
    alternatives: ['ethanedioate ion', 'oxalate', 'oxalate dianion'],
  },
  C5H5N: {
    name: 'pyridine',
    alternatives: ['azine', 'azabenzene'],
  },
  'C5H5NH+': {
    name: 'pyridinium ion',
    alternatives: ['protonated pyridine', 'pyridinium cation'],
  },
  'C6H5COO-': {
    name: 'benzoate ion',
    alternatives: ['benzoate', 'benzenecarboxylate ion'],
  },
  C6H5COOH: {
    name: 'benzoic acid',
    alternatives: ['benzenecarboxylic acid', 'phenylmethanoic acid'],
  },
  C6H5NH2: {
    name: 'aniline',
    alternatives: ['phenylamine', 'aminobenzene', 'benzenamine'],
  },
  'C6H5NH3+': {
    name: 'anilinium ion',
    alternatives: [
      'phenylammonium ion',
      'protonated aniline',
      'benzenaminium ion',
    ],
  },
  'Ca(OH)2': {
    name: 'calcium hydroxide',
    alternatives: ['slaked lime', 'portlandite', 'calcium dihydroxide'],
  },
  'Ca++': {
    name: 'calcium ion',
    alternatives: ['calcium(II) ion', 'calcium cation', 'Ca2+'],
  },
  'Ca3(PO4)2': {
    name: 'calcium phosphate',
    alternatives: [
      'tricalcium phosphate',
      'calcium orthophosphate',
      'calcium bis(phosphate)',
    ],
  },
  CaCO3: {
    name: 'calcium carbonate',
    alternatives: ['calcite', 'aragonite', 'limestone', 'chalk'],
  },
  CaF2: {
    name: 'calcium fluoride',
    alternatives: ['fluorite', 'fluorspar'],
  },
  CaSO4: {
    name: 'calcium sulfate',
    alternatives: ['calcium sulphate', 'anhydrite'],
  },
  'Cd(CN)4--': {
    name: 'tetracyanocadmate(II) ion',
    alternatives: [
      'tetracyanidocadmate(II) ion',
      'cadmium tetracyanide complex',
    ],
  },
  'Cd(NH3)4++': {
    name: 'tetraamminecadmium(II) ion',
    alternatives: ['tetraamminecadmium(2+) ion', 'cadmium tetraammine complex'],
  },
  'Cd(NH3)6++': {
    name: 'hexaamminecadmium(II) ion',
    alternatives: ['hexaamminecadmium(2+) ion', 'cadmium hexaammine complex'],
  },
  'Cd(SCN)4--': {
    name: 'tetrathiocyanatocadmate(II) ion',
    alternatives: [
      'tetrakis(thiocyanato)cadmate(II) ion',
      'cadmium tetrathiocyanate complex',
    ],
  },
  'Cd++': {
    name: 'cadmium(II) ion',
    alternatives: ['cadmium ion', 'cadmium cation', 'Cd2+'],
  },
  CdS: {
    name: 'cadmium sulfide',
    alternatives: [
      'cadmium(II) sulfide',
      'cadmium sulphide',
      'greenockite',
      'cadmium yellow',
    ],
  },
  'CH2ClCO2-': {
    name: 'chloroacetate ion',
    alternatives: [
      'chloroethanoate ion',
      'monochloroacetate ion',
      'chloroacetate',
    ],
  },
  CH2ClCO2H: {
    name: 'chloroacetic acid',
    alternatives: [
      'chloroethanoic acid',
      'monochloroacetic acid',
      '2-chloroacetic acid',
    ],
  },
  CH3CO2H: {
    name: 'acetic acid',
    alternatives: ['ethanoic acid', 'CH3COOH'],
  },
  'CH3COO-': {
    name: 'acetate ion',
    alternatives: ['ethanoate ion', 'acetate', 'CH3CO2-'],
  },
  CH3NH2: {
    name: 'methylamine',
    alternatives: ['methanamine', 'aminomethane', 'monomethylamine'],
  },
  'CH3NH3+': {
    name: 'methylammonium ion',
    alternatives: [
      'protonated methylamine',
      'methylazanium ion',
      'methanaminium ion',
    ],
  },
  'Cl-': {
    name: 'chloride ion',
    alternatives: ['chloride', 'chloride anion'],
  },
  'ClO-': {
    name: 'hypochlorite ion',
    alternatives: ['chlorate(I) ion', 'hypochlorite', 'bleach anion'],
  },
  'ClO2-': {
    name: 'chlorite ion',
    alternatives: ['chlorate(III) ion', 'chlorite'],
  },
  'ClO4-': {
    name: 'perchlorate ion',
    alternatives: [
      'chlorate(VII) ion',
      'perchlorate',
      'tetraoxidochlorate(1-) ion',
    ],
  },
  'CN-': {
    name: 'cyanide ion',
    alternatives: ['cyanide', 'cyanide anion', 'nitridocarbonate(1-) ion'],
  },
  'Co(C2O4)3----': {
    name: 'tris(oxalato)cobaltate(II) ion',
    alternatives: [
      'trioxalatocobaltate(II) ion',
      'cobalt(II) trisoxalate complex',
      'tris(oxalato)cobaltate(4-) ion',
    ],
  },
  'Co(C2H8N2)3++': {
    name: 'tris(ethylenediamine)cobalt(II) ion',
    alternatives: [
      'tris(ethane-1,2-diamine)cobalt(II) ion',
      'cobalt(II) tris(ethylenediamine) complex',
    ],
  },
  'Co(C2H8N2)3+++': {
    name: 'tris(ethylenediamine)cobalt(III) ion',
    alternatives: [
      'tris(ethane-1,2-diamine)cobalt(III) ion',
      'cobalt(III) tris(ethylenediamine) complex',
    ],
  },
  'Co(NH3)4+++': {
    name: 'tetraamminecobalt(III) ion',
    alternatives: [
      'cobalt(III) tetraammine complex',
      'tetraamminecobalt(3+) ion',
    ],
  },
  'Co(NH3)6++': {
    name: 'hexaamminecobalt(II) ion',
    alternatives: ['cobalt(II) hexaammine complex', 'hexaamminecobalt(2+) ion'],
  },
  'Co++': {
    name: 'cobalt(II) ion',
    alternatives: ['cobaltous ion', 'cobalt ion', 'Co2+'],
  },
  'Co+++': {
    name: 'cobalt(III) ion',
    alternatives: ['cobaltic ion', 'Co3+'],
  },
  'CO3--': {
    name: 'carbonate ion',
    alternatives: [
      'carbonate',
      'carbonate dianion',
      'trioxidocarbonate(2-) ion',
    ],
  },
  'CrO4--': {
    name: 'chromate ion',
    alternatives: [
      'chromate(VI) ion',
      'chromate',
      'tetraoxidochromate(2-) ion',
    ],
  },
  'Cu(CN)2-': {
    name: 'dicyanocuprate(I) ion',
    alternatives: ['dicyanidocuprate(I) ion', 'copper(I) dicyanide complex'],
  },
  'Cu(C2H8N2)2++': {
    name: 'bis(ethylenediamine)copper(II) ion',
    alternatives: [
      'bis(ethane-1,2-diamine)copper(II) ion',
      'copper(II) bis(ethylenediamine) complex',
    ],
  },
  'Cu(NH3)4++': {
    name: 'tetraamminecopper(II) ion',
    alternatives: [
      'copper(II) tetraammine complex',
      'tetraamminecopper(2+) ion',
      "Schweizer's reagent ion",
    ],
  },
  'Cu(OH)2': {
    name: 'copper(II) hydroxide',
    alternatives: ['cupric hydroxide', 'copper hydroxide'],
  },
  'Cu(OH)4--': {
    name: 'tetrahydroxocuprate(II) ion',
    alternatives: ['tetrahydroxidocuprate(II) ion', 'cuprate(II) ion'],
  },
  'Cu(SCN)2': {
    name: 'bis(thiocyanato)copper(II)',
    alternatives: ['copper(II) thiocyanate', 'cupric thiocyanate'],
  },
  'Cu+': {
    name: 'copper(I) ion',
    alternatives: ['cuprous ion', 'copper(I) cation'],
  },
  'Cu++': {
    name: 'copper(II) ion',
    alternatives: ['cupric ion', 'copper ion', 'Cu2+'],
  },
  'CuBr2-': {
    name: 'dibromocuprate(I) ion',
    alternatives: ['dibromidocuprate(I) ion', 'copper(I) dibromide complex'],
  },
  CuCl: {
    name: 'copper(I) chloride',
    alternatives: ['cuprous chloride', 'nantokite'],
  },
  'CuCl2-': {
    name: 'dichlorocuprate(I) ion',
    alternatives: ['dichloridocuprate(I) ion', 'copper(I) dichloride complex'],
  },
  'CuI2-': {
    name: 'diiodocuprate(I) ion',
    alternatives: ['diiodidocuprate(I) ion', 'copper(I) diiodide complex'],
  },
  CuS: {
    name: 'copper(II) sulfide',
    alternatives: ['cupric sulfide', 'copper sulphide', 'covellite'],
  },
  'F-': {
    name: 'fluoride ion',
    alternatives: ['fluoride', 'fluoride anion'],
  },
  'Fe(C2O4)3---': {
    name: 'tris(oxalato)ferrate(III) ion',
    alternatives: [
      'trioxalatoferrate(III) ion',
      'ferrioxalate ion',
      'tris(oxalato)ferrate(3-)',
      'iron(III) oxalate complex',
    ],
  },
  'Fe(CN)6---': {
    name: 'hexacyanoferrate(III) ion',
    alternatives: [
      'ferricyanide ion',
      'hexacyanidoferrate(III) ion',
      'red prussiate ion',
    ],
  },
  'Fe(CN)6----': {
    name: 'hexacyanoferrate(II) ion',
    alternatives: [
      'ferrocyanide ion',
      'hexacyanidoferrate(II) ion',
      'yellow prussiate ion',
    ],
  },
  'Fe(C2H8N2)3++': {
    name: 'tris(ethylenediamine)iron(II) ion',
    alternatives: ['tris(ethane-1,2-diamine)iron(II) ion', '[Fe(C2H8N2)3]2+'],
  },
  'Fe(H2O)5OH++': {
    name: 'pentaaquahydroxoiron(III) ion',
    alternatives: [
      'hydroxopentaaquairon(III) ion',
      'pentaaquahydroxidoiron(2+)',
      '[Fe(H2O)5(OH)]2+',
      'monohydroxo iron(III) complex',
    ],
  },
  'Fe(H2O)6+++': {
    name: 'hexaaquairon(III) ion',
    alternatives: [
      'hexaaquairon(3+)',
      'hexaaquairon(III) cation',
      '[Fe(H2O)6]3+',
      'hydrated ferric ion',
    ],
  },
  'Fe(OH)2': {
    name: 'iron(II) hydroxide',
    alternatives: ['ferrous hydroxide'],
  },
  'Fe(OH)3': {
    name: 'iron(III) hydroxide',
    alternatives: ['ferric hydroxide', 'hydrated iron(III) oxide'],
  },
  'Fe(SCN)3': {
    name: 'tris(thiocyanato)iron(III)',
    alternatives: [
      'ferric thiocyanate',
      'blood-red iron thiocyanate complex',
      'iron(III) thiocyanate',
    ],
  },
  'Fe++': {
    name: 'iron(II) ion',
    alternatives: ['ferrous ion', 'Fe2+', 'iron(2+)'],
  },
  'Fe+++': {
    name: 'iron(III) ion',
    alternatives: ['ferric ion', 'Fe3+', 'iron(3+)'],
  },
  FeS: {
    name: 'iron(II) sulfide',
    alternatives: ['ferrous sulfide', 'iron sulfide', 'troilite'],
  },
  'H+': {
    name: 'hydrogen ion',
    alternatives: ['proton', 'hydron', 'hydronium ion', 'H3O+', 'oxonium ion'],
  },
  H2CO3: {
    name: 'carbonic acid',
    alternatives: ['dihydrogen carbonate', 'aqueous carbon dioxide', 'CO2(aq)'],
  },
  H2O: {
    name: 'water',
    alternatives: ['oxidane', 'dihydrogen monoxide'],
  },
  'H2PO3-': {
    name: 'dihydrogen phosphite ion',
    alternatives: ['dihydrogenphosphite ion', 'hydrogen phosphonate ion'],
  },
  'H2PO4-': {
    name: 'dihydrogen phosphate ion',
    alternatives: [
      'dihydrogenphosphate ion',
      'biphosphate ion',
      'dihydrogenorthophosphate ion',
    ],
  },
  H2S: {
    name: 'hydrogen sulfide',
    alternatives: [
      'hydrosulfuric acid',
      'sulfane',
      'dihydrogen sulfide',
      'sulfhydric acid',
    ],
  },
  H2SO3: {
    name: 'sulfurous acid',
    alternatives: ['dihydrogen sulfite', 'aqueous sulfur dioxide', 'SO2(aq)'],
  },
  H2SO4: {
    name: 'sulfuric acid',
    alternatives: ['dihydrogen sulfate', 'oil of vitriol'],
  },
  H3PO3: {
    name: 'phosphorous acid',
    alternatives: [
      'phosphonic acid',
      'orthophosphorous acid',
      'dihydroxyphosphine oxide',
    ],
  },
  H3PO4: {
    name: 'phosphoric acid',
    alternatives: ['orthophosphoric acid', 'trihydrogen phosphate'],
  },
  HBr: {
    name: 'hydrobromic acid',
    alternatives: ['hydrogen bromide'],
  },
  HBrO: {
    name: 'hypobromous acid',
    alternatives: ['bromic(I) acid', 'bromanol', 'hydrogen hypobromite'],
  },
  HCl: {
    name: 'hydrochloric acid',
    alternatives: ['hydrogen chloride', 'muriatic acid'],
  },
  HClO: {
    name: 'hypochlorous acid',
    alternatives: ['chloric(I) acid', 'chloranol', 'hydrogen hypochlorite'],
  },
  HClO2: {
    name: 'chlorous acid',
    alternatives: ['chloric(III) acid', 'hydrogen chlorite'],
  },
  HClO4: {
    name: 'perchloric acid',
    alternatives: ['chloric(VII) acid', 'hydrogen perchlorate'],
  },
  HCN: {
    name: 'hydrogen cyanide',
    alternatives: ['hydrocyanic acid', 'prussic acid', 'formonitrile'],
  },
  'HCO2-': {
    name: 'formate ion',
    alternatives: ['methanoate ion', 'HCOO-', 'formate anion'],
  },
  HCO2H: {
    name: 'formic acid',
    alternatives: ['methanoic acid', 'HCOOH'],
  },
  'HCO3-': {
    name: 'hydrogen carbonate ion',
    alternatives: ['bicarbonate ion', 'hydrogencarbonate ion'],
  },
  HF: {
    name: 'hydrofluoric acid',
    alternatives: ['hydrogen fluoride', 'fluorane'],
  },
  'Hg(NH3)4++': {
    name: 'tetraamminemercury(II) ion',
    alternatives: ['[Hg(NH3)4]2+', 'mercury(II) ammine complex'],
  },
  'Hg(SCN)4--': {
    name: 'tetrathiocyanatomercurate(II) ion',
    alternatives: [
      'tetrakis(thiocyanato)mercurate(II) ion',
      'tetrathiocyanidomercurate(II) ion',
      'mercury(II) tetrathiocyanate complex',
    ],
  },
  'Hg+': {
    name: 'mercury(I) ion',
    alternatives: ['mercurous ion', 'Hg2 2+', 'dimercury(2+) ion'],
  },
  'Hg++': {
    name: 'mercury(II) ion',
    alternatives: ['mercuric ion', 'Hg2+', 'mercury(2+)'],
  },
  Hg2Cl2: {
    name: 'mercury(I) chloride',
    alternatives: ['calomel', 'mercurous chloride', 'dimercury dichloride'],
  },
  'HgBr4--': {
    name: 'tetrabromomercurate(II) ion',
    alternatives: [
      'tetrabromidomercurate(II) ion',
      '[HgBr4]2-',
      'mercury(II) tetrabromide complex',
    ],
  },
  'HgCl4--': {
    name: 'tetrachloromercurate(II) ion',
    alternatives: [
      'tetrachloridomercurate(II) ion',
      '[HgCl4]2-',
      'mercury(II) tetrachloride complex',
    ],
  },
  'HgI4--': {
    name: 'tetraiodomercurate(II) ion',
    alternatives: [
      'tetraiodidomercurate(II) ion',
      '[HgI4]2-',
      "Nessler's reagent anion",
    ],
  },
  HI: {
    name: 'hydroiodic acid',
    alternatives: ['hydrogen iodide', 'hydriodic acid'],
  },
  HIO3: {
    name: 'iodic acid',
    alternatives: ['iodic(V) acid', 'hydrogen iodate'],
  },
  HNO2: {
    name: 'nitrous acid',
    alternatives: [
      'nitric(III) acid',
      'hydrogen nitrite',
      'dioxonitric(III) acid',
    ],
  },
  HNO3: {
    name: 'nitric acid',
    alternatives: ['nitric(V) acid', 'hydrogen nitrate', 'aqua fortis'],
  },
  HOCN: {
    name: 'cyanic acid',
    alternatives: ['hydrogen cyanate', 'isocyanic acid', 'HNCO'],
  },
  'HPO3--': {
    name: 'hydrogen phosphite ion',
    alternatives: ['hydrogenphosphite ion', 'phosphonate ion', 'HPO3 2-'],
  },
  'HPO4--': {
    name: 'hydrogen phosphate ion',
    alternatives: [
      'monohydrogen phosphate ion',
      'hydrogenphosphate ion',
      'HPO4 2-',
    ],
  },
  'HS-': {
    name: 'hydrogen sulfide ion',
    alternatives: ['bisulfide ion', 'hydrosulfide ion', 'sulfanide'],
  },
  'HSO3-': {
    name: 'hydrogen sulfite ion',
    alternatives: ['bisulfite ion', 'hydrogensulfite ion'],
  },
  'HSO4-': {
    name: 'hydrogen sulfate ion',
    alternatives: ['bisulfate ion', 'hydrogensulfate ion'],
  },
  'I-': {
    name: 'iodide ion',
    alternatives: ['iodide'],
  },
  'IO3-': {
    name: 'iodate ion',
    alternatives: ['iodate(V) ion', 'trioxidoiodate(1-)'],
  },
  'Li+': {
    name: 'lithium ion',
    alternatives: ['lithium(I) ion', 'lithium cation'],
  },
  Li2CO3: {
    name: 'lithium carbonate',
    alternatives: ['dilithium carbonate'],
  },
  'Mg(OH)2': {
    name: 'magnesium hydroxide',
    alternatives: ['brucite', 'milk of magnesia', 'magnesium dihydroxide'],
  },
  'Mg++': {
    name: 'magnesium ion',
    alternatives: ['magnesium(II) ion', 'Mg2+', 'magnesium cation'],
  },
  MgCO3: {
    name: 'magnesium carbonate',
    alternatives: ['magnesite'],
  },
  'Mn(C2H8N2)3++': {
    name: 'tris(ethylenediamine)manganese(II) ion',
    alternatives: [
      'tris(ethane-1,2-diamine)manganese(II) ion',
      '[Mn(C2H8N2)3]2+',
    ],
  },
  'Mn(OH)2': {
    name: 'manganese(II) hydroxide',
    alternatives: ['manganous hydroxide', 'pyrochroite'],
  },
  'Mn++': {
    name: 'manganese(II) ion',
    alternatives: ['manganous ion', 'Mn2+', 'manganese(2+)'],
  },
  'NH2-': {
    name: 'amide ion',
    alternatives: ['azanide', 'amide anion'],
  },
  NH3: {
    name: 'ammonia',
    alternatives: ['azane', 'aqueous ammonia', 'ammonia solution'],
  },
  'NH4+': {
    name: 'ammonium ion',
    alternatives: ['azanium', 'ammonium cation'],
  },
  'Ni(CN)4--': {
    name: 'tetracyanonickelate(II) ion',
    alternatives: [
      'tetracyanidonickelate(II) ion',
      '[Ni(CN)4]2-',
      'nickel(II) tetracyanide complex',
    ],
  },
  'Ni(C2H8N2)3++': {
    name: 'tris(ethylenediamine)nickel(II) ion',
    alternatives: ['tris(ethane-1,2-diamine)nickel(II) ion', '[Ni(C2H8N2)3]2+'],
  },
  'Ni(NH3)6++': {
    name: 'hexaamminenickel(II) ion',
    alternatives: [
      'hexaamminenickel(2+)',
      '[Ni(NH3)6]2+',
      'nickel(II) hexaammine complex',
    ],
  },
  'Ni++': {
    name: 'nickel(II) ion',
    alternatives: ['nickelous ion', 'Ni2+', 'nickel(2+)'],
  },
  'NO2-': {
    name: 'nitrite ion',
    alternatives: ['nitrate(III) ion', 'dioxidonitrate(1-)'],
  },
  'NO3-': {
    name: 'nitrate ion',
    alternatives: ['nitrate(V) ion', 'trioxidonitrate(1-)'],
  },
  'OCN-': {
    name: 'cyanate ion',
    alternatives: ['isocyanate ion', 'NCO-', 'oxidonitridocarbonate(1-)'],
  },
  'OH-': {
    name: 'hydroxide ion',
    alternatives: ['hydroxyl ion', 'hydroxide anion'],
  },
  'Pb(OH)2': {
    name: 'lead(II) hydroxide',
    alternatives: ['plumbous hydroxide', 'lead dihydroxide'],
  },
  'Pb++': {
    name: 'lead(II) ion',
    alternatives: ['plumbous ion', 'Pb2+', 'lead(2+)'],
  },
  PbCl2: {
    name: 'lead(II) chloride',
    alternatives: ['plumbous chloride', 'cotunnite'],
  },
  'PbCl4--': {
    name: 'tetrachloroplumbate(II) ion',
    alternatives: [
      'tetrachloridoplumbate(II) ion',
      '[PbCl4]2-',
      'lead(II) tetrachloride complex',
    ],
  },
  PbCrO4: {
    name: 'lead(II) chromate',
    alternatives: ['chrome yellow', 'crocoite', 'plumbous chromate'],
  },
  PbI2: {
    name: 'lead(II) iodide',
    alternatives: ['plumbous iodide', 'lead diiodide'],
  },
  'PbI4--': {
    name: 'tetraiodoplumbate(II) ion',
    alternatives: [
      'tetraiodidoplumbate(II) ion',
      '[PbI4]2-',
      'lead(II) tetraiodide complex',
    ],
  },
  PbS: {
    name: 'lead(II) sulfide',
    alternatives: ['galena', 'plumbous sulfide'],
  },
  PbSO4: {
    name: 'lead(II) sulfate',
    alternatives: ['anglesite', 'plumbous sulfate'],
  },
  'PO4---': {
    name: 'phosphate ion',
    alternatives: ['orthophosphate ion', 'tetraoxidophosphate(3-)', 'PO4 3-'],
  },
  'S--': {
    name: 'sulfide ion',
    alternatives: ['sulfide anion', 'S2-', 'sulfide(2-)'],
  },
  'S2O3--': {
    name: 'thiosulfate ion',
    alternatives: ['thiosulphate ion', 'trioxidosulfidosulfate(2-)'],
  },
  'SCN-': {
    name: 'thiocyanate ion',
    alternatives: [
      'rhodanide ion',
      'isothiocyanate ion',
      'nitridosulfidocarbonate(1-)',
    ],
  },
  'Sn++++': {
    name: 'tin(IV) ion',
    alternatives: ['stannic ion', 'Sn4+', 'tin(4+)'],
  },
  'SnF6--': {
    name: 'hexafluorostannate(IV) ion',
    alternatives: [
      'hexafluoridostannate(IV) ion',
      '[SnF6]2-',
      'fluostannate ion',
    ],
  },
  'SO3--': {
    name: 'sulfite ion',
    alternatives: ['sulphite ion', 'trioxidosulfate(2-)'],
  },
  'SO4--': {
    name: 'sulfate ion',
    alternatives: ['sulphate ion', 'tetraoxidosulfate(2-)'],
  },
  'Zn(NH3)4++': {
    name: 'tetraamminezinc(II) ion',
    alternatives: [
      'tetraamminezinc(2+)',
      '[Zn(NH3)4]2+',
      'zinc(II) tetraammine complex',
    ],
  },
  'Zn(OH)2': {
    name: 'zinc hydroxide',
    alternatives: ['zinc(II) hydroxide', 'zinc dihydroxide'],
  },
  'Zn(OH)4--': {
    name: 'tetrahydroxozincate(II) ion',
    alternatives: [
      'zincate ion',
      'tetrahydroxidozincate(II) ion',
      '[Zn(OH)4]2-',
      'tetrahydroxozincate ion',
    ],
  },
  'Zn++': {
    name: 'zinc ion',
    alternatives: ['zinc(II) ion', 'Zn2+', 'zinc(2+)'],
  },
  ZnS: {
    name: 'zinc sulfide',
    alternatives: ['zinc(II) sulfide', 'sphalerite', 'wurtzite', 'blende'],
  },
};

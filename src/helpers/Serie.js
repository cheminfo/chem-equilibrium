const defaultOptions = {
  chunks: 200,
  log: false,
  from: 0,
  to: 1,
  isFixed: false,
};

export default class Serie {
  constructor(helper) {
    this.helper = helper;
  }

  getTitration(options) {
    options = { ...defaultOptions, ...options };
    // We don't want to change the original helper
    const helper = this.helper.clone();
    helper.resetSpecies();
    // Some options are meant for the helper
    // e.g. tolerance, solidTolerance, maxIterations
    helper.setOptions(options);

    const solVolume = options.solution.volume;
    const solConc = options.solution.concentration;
    const solQty = solConc * solVolume;

    const titrConc = options.titrationSolution.concentration;
    const titrVolStart = 0;
    const titrVolStop = options.titrationSolution.volume;

    let errorCount = 0;

    const vols = [];
    const ph = [];
    const solutions = [];
    const chunks = options.chunks;
    let sol;

    helper.addSpecie(options.solution.type);
    helper.addSpecie(options.titrationSolution.type);

    for (let i = 0; i <= chunks; i++) {
      const vol = titrVolStart + (titrVolStop - titrVolStart) * (i / chunks);
      const totalVol = vol + solVolume;
      const titrQty = vol * titrConc;
      helper.setTotal(options.titrationSolution.type, titrQty);
      helper.setTotal(options.solution.type, solQty);
      helper.setOptions({ volume: totalVol });
      const eq = helper.getEquilibrium();

      if (sol) {
        eq.setInitial(sol);
        sol = eq.solve();
      } else {
        sol = eq.solveRobust();
      }

      if (sol) {
        ph.push(-Math.log10(sol['H+']));
        solutions.push(sol);
        vols.push(vol);
      } else {
        errorCount++;
      }
    }

    const xy = [];
    for (let i = 0; i < ph.length; i++) {
      xy.push(vols[i], ph[i]);
    }

    const species = solutions[0] ? Object.keys(solutions[0]) : [];

    return {
      xy,
      errorCount,
      solutions,
      species,
      volumes: vols,
      equations: helper.getEquations({ filtered: true }),
    };
  }

  getSolutions(options) {
    options = { ...defaultOptions, ...options };
    // We don't want to change the original helper
    const helper = this.helper.clone();
    // Some options are meant for the helper
    // e.g. tolerance, solidTolerance, maxIterations
    helper.setOptions(options);

    checkOptions(options);
    const varying = options.varying;

    let errorCount = 0;
    const chunks = options.chunks;
    let sol;
    const solutions = [];
    const x = [];
    const log = options.log;
    const from = options.from;
    const to = options.to;

    for (let i = 0; i <= chunks; i++) {
      const val = options.from + ((to - from) * i) / chunks;
      const realVal = log ? 10 ** -val : val;

      if (options.isFixed) {
        helper.setAtEquilibrium(varying, realVal);
      } else {
        helper.setTotal(varying, realVal);
      }
      const eq = helper.getEquilibrium();
      if (sol) {
        eq.setInitial(sol);
        sol = eq.solve();
      } else {
        sol = eq.solveRobust();
      }
      if (sol) {
        x.push(val);
        solutions.push(sol);
      } else {
        errorCount++;
      }
    }
    return {
      x,
      solutions,
      errorCount,
      species: solutions[0] ? Object.keys(solutions[0]) : [],
    };
  }
}

function checkOptions(options) {
  if (options.from >= options.to) {
    throw new Error(
      'Invalid arguments: property "to" should be larger than "from"',
    );
  }

  if (!options.varying) {
    throw new Error('Invalid arguments: property "varying" is not defined');
  }
}

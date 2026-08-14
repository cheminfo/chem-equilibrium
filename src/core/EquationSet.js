import { Equation } from './Equation.js';

export class EquationSet {
  constructor(equations) {
    equations = equations || [];
    this._normalized = false;
    this._disabledKeys = new Set();
    this._equations = new Map();
    for (let i = 0; i < equations.length; i++) {
      this.add(equations[i]);
    }
  }

  [Symbol.iterator]() {
    return this._equations.values();
  }

  clone() {
    const eqSet = new EquationSet();
    eqSet._normalized = this._normalized;
    eqSet._disabledKeys = this._disabledKeys;
    for (const [key, eq] of this.entries()) {
      eqSet._equations.set(key, eq.clone());
    }
    return eqSet;
  }

  add(eq, key) {
    const equation = Equation.create(eq);
    key = key || getHash(eq.formed);
    this._equations.set(key, equation);
    this._normalized = false;
  }

  has(eq) {
    const key = eq instanceof Equation ? getHash(eq.formed) : eq;
    return this._equations.has(key);
  }

  get species() {
    return this.getSpecies();
  }

  getSpecies(options) {
    options = { ...options };
    const species = options.species;
    const type = options.type;
    const includeDisabled = options.includeDisabled;
    const speciesSet = new Set();

    if (species) {
      const subset = this.getSubset(species);
      delete options.species;
      return subset.getSpecies(options);
    }

    for (const [key, eq] of this.entries()) {
      if (this._disabledKeys.has(key) && !includeDisabled) continue;
      if (type && type !== eq.type) continue;
      speciesSet.add(eq.formed);
      for (const c of Object.keys(eq.components)) speciesSet.add(c);
    }
    return Array.from(speciesSet);
  }

  get components() {
    return this.getComponents();
  }

  getComponents(options) {
    options = options || {};
    const species = options.species;
    const type = options.type;
    const includeDisabled = options.includeDisabled;
    if (!this.isNormalized()) {
      throw new Error('Cannot get components from non-normalized equation set');
    }
    const speciesSet = new Set();
    for (const [key, eq] of this.entries()) {
      if (this._disabledKeys.has(key) && !includeDisabled) continue;
      if (type && type !== eq.type) continue;
      if (species) {
        if (species.includes(eq.formed)) {
          for (const c of Object.keys(eq.components)) speciesSet.add(c);
        } else {
          for (const c of Object.keys(eq.components)) {
            if (species.includes(c)) speciesSet.add(c);
          }
        }
      } else {
        for (const c of Object.keys(eq.components)) speciesSet.add(c);
      }
    }
    return Array.from(speciesSet);
  }

  disableEquation(key, hashIt) {
    key = hashIt ? getHash(key) : key;
    this._disabledKeys.add(key);
  }

  enableEquation(key, hashIt) {
    key = hashIt ? getHash(key) : key;
    this._disabledKeys.delete(key);
  }

  enableAllEquations() {
    this._disabledKeys.clear();
  }

  get size() {
    return this._equations.size;
  }

  get(id, hashIt) {
    const key = hashIt ? getHash(id) : id;
    return this._equations.get(key);
  }

  keys() {
    return this._equations.keys();
  }

  values() {
    return this._equations.values();
  }

  entries() {
    return this._equations.entries();
  }

  forEach(callback, thisArg) {
    for (const [key, equation] of this._equations) {
      callback.call(thisArg, equation, key, this._equations);
    }
  }

  getNormalized(solvent) {
    // In a normalized set, formed species can be found in any of the components
    // of the equation set
    let norm = new Array(this._equations.size);
    const keys = new Array(this._equations.size);
    let idx = 0;
    for (const [key, entry] of this.entries()) {
      norm[idx] = entry.withSolvent(solvent);
      keys[idx] = key;
      idx++;
    }
    norm = normalize(norm);

    const normSet = new EquationSet();
    for (let i = 0; i < norm.length; i++) {
      normSet.add(norm[i], keys[i]);
    }

    // return a new equation set that has been normalized
    // normalization requires the solvent to be set
    normSet._normalized = true;
    normSet._disabledKeys = new Set(this._disabledKeys);
    return normSet;
  }

  isNormalized() {
    return this._normalized;
  }

  getEquations(options) {
    options = options || {};
    return Array.from(this._equations)
      .filter((e) => options.includeDisabled || !this._disabledKeys.has(e[0]))
      .map((e) => {
        const r = e[1].toJSON();
        if (this._disabledKeys.has(e[0])) r.disabled = true;
        return r;
      });
  }

  getModel(totals, all) {
    if (!this.isNormalized()) {
      throw new Error('Cannot get model from un-normalized equation set');
    }
    const totalComp = {};
    const subset = all ? this : this.getSubset(Object.keys(totals));
    const components = subset.components;
    const subsetKeys = [...subset.keys()];
    const subsetArr = [...subset.values()].filter(
      (s, idx) => !this._disabledKeys.has(subsetKeys[idx]),
    );
    for (const c of components) totalComp[c] = 0;
    for (const key in totals) {
      const total = totals[key] || 0;
      if (components.includes(key)) {
        totalComp[key] += total;
      } else {
        const eq = subsetArr.find((e) => e.formed === key);
        if (eq) {
          const keys = Object.keys(eq.components);
          for (let i = 0; i < keys.length; i++) {
            totalComp[keys[i]] += eq.components[keys[i]] * total;
          }
        }
      }
    }

    return {
      volume: 1,
      components: components.map((key) => {
        return {
          label: key,
          total: totalComp[key],
        };
      }),
      formedSpecies: subsetArr.map((eq) => {
        return {
          solid: eq.type === 'precipitation',
          label: eq.formed,
          beta: 10 ** eq.pK,
          components: components.map((key) => eq.components[key] || 0),
        };
      }),
    };
  }

  getSubset(species) {
    const speciesSet = new Set(species);
    // get a subset of the equations given a set of species
    const newSet = new EquationSet();
    let moreAdded = true;
    let passes = 0;

    const f = (currentSpecies) => {
      passes++;
      if (passes === 10) return;
      for (const eq of this) {
        if (currentSpecies.includes(eq.formed) && !newSet.has(eq)) {
          newSet.add(eq);
          speciesSet.add(eq.formed);
          const newComponents = Object.keys(eq.components);
          for (const s of newComponents) speciesSet.add(s);
          f(newComponents);
        }
      }
    };

    f(species);

    if (passes === 10) {
      throw new Error('You might have a circular dependency in your equations');
    }

    moreAdded = true;
    passes = 0;
    while (passes <= 10 && moreAdded) {
      passes++;
      moreAdded = false;
      for (const eq of this) {
        const hasAll = Object.keys(eq.components).every((c) =>
          speciesSet.has(c),
        );
        if (hasAll && !newSet.has(eq)) {
          newSet.add(eq);
          speciesSet.add(eq.formed);
          moreAdded = true;
        }
      }
    }

    if (passes === 10) {
      throw new Error('You might have a circular dependency in your equations');
    }

    // Pass along some properties
    newSet._disabledKeys = new Set(this._disabledKeys);
    newSet._normalized = this._normalized;
    return newSet;
  }
}

function normalize(equations) {
  const N = equations.length;
  const newEquations = new Array(N).fill(0);
  const needs = new Array(N);

  // First, find the independent equations
  for (let i = 0; i < N; i++) {
    if (isIndependent(equations, i)) {
      newEquations[i] = equations[i];
    } else {
      const keys = Object.keys(equations[i].components);
      needs[i] = keys.map((key) =>
        equations.findIndex((eq) => eq.formed === key),
      );
    }
  }

  let iter = 0;
  while (!allDefined(newEquations) && iter < 10) {
    for (let i = 0; i < N; i++) {
      if (!newEquations[i] && allDefined(newEquations, needs[i])) {
        fillLine(equations, newEquations, i);
      }
    }
    iter++;
  }
  if (!allDefined(newEquations)) {
    throw new Error('There may be a circular dependency in the equations');
  }
  return newEquations;
}

function isIndependent(equations, idx) {
  const keys = Object.keys(equations[idx].components);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (equations.some((e) => e.formed === key)) return false;
  }
  return true;
}

function allDefined(arr, idx) {
  if (idx !== undefined) {
    return !idx.some((i) => i !== -1 && !arr[i]);
  }
  return !arr.includes(0);
}

function fillLine(equations, newEquations, i) {
  const eq = equations[i];
  const newEq = {
    type: eq.type,
    formed: eq.formed,
    components: {},
  };
  fillRec(equations, eq, newEq, 1);
  newEquations[i] = newEq;
}

function fillRec(equations, eq, eqToFill, n) {
  const componentsToFill = eqToFill.components;
  const components = eq.components;
  const keys = Object.keys(components);
  for (let j = 0; j < keys.length; j++) {
    const key = keys[j];
    const nn = n * components[key];
    const rep = equations.find((e) => e.formed === keys[j]);
    if (rep) {
      fillRec(equations, rep, eqToFill, nn);
    } else {
      componentsToFill[keys[j]] = componentsToFill[keys[j]] || 0;
      componentsToFill[keys[j]] += nn;
    }
  }
  eqToFill.pK = eqToFill.pK || 0;
  eqToFill.pK += n * eq.pK;
}

function getHash(id) {
  return btoa(id);
}

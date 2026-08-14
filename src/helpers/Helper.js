import deepcopy from 'deepcopy';

import database from '../../data/data.json' with { type: 'json' };
import EquationSet from '../core/EquationSet.js';
import Equilibrium from '../core/Equilibrium.js';

const defaultOptions = {
  solvent: 'H2O',
};

export default class Helper {
  constructor(options) {
    this.atEquilibrium = new Set();
    options = { ...defaultOptions, ...options };
    let db = options.database || database;
    if (options.extend && options.database) db = db.concat(database);
    db = processDB(db, options);
    this.species = {};
    this.options = options;
    this.eqSet = new EquationSet(db);
    this.addSpecie(options.solvent);
  }

  // Clone
  clone() {
    const helper = new Helper();
    helper.species = deepcopy(this.species);
    helper.eqSet = this.eqSet.clone();
    helper.options = deepcopy(this.options);
    helper.atEquilibrium = new Set(this.atEquilibrium);
    return helper;
  }

  // =========== Getters ==============

  getSpecies(options) {
    options = options || {};
    const species = options.filtered ? Object.keys(this.species) : null;
    const getOptions = { ...options, species };
    return this.eqSet.getSpecies(getOptions);
  }

  getComponents(options) {
    options = options || {};
    const species = options.filtered ? Object.keys(this.species) : null;
    const eqSet = species ? this.eqSet.getSubset(species) : this.eqSet;
    return eqSet.getNormalized(this.options.solvent).getComponents(options);
  }

  getEquations(options) {
    options = options || {};
    let eqSet = this.eqSet;
    if (options.filtered) {
      eqSet = this.eqSet.getSubset(Object.keys(this.species));
    }
    if (options.normalized) {
      eqSet = eqSet.getNormalized(this.options.solvent);
    }
    return eqSet.getEquations(options);
  }

  getModel() {
    const subSet = this.eqSet.getSubset(Object.keys(this.species));
    const normSet = subSet.getNormalized(this.options.solvent);
    const model = normSet.getModel(this.species, true);
    for (const c of model.components) {
      if (this.atEquilibrium.has(c.label)) {
        c.atEquilibrium = this.species[c.label];
        delete c.total;
      }
    }
    return model;
  }

  getEquilibrium() {
    return new Equilibrium(this.getModel(), this.options);
  }

  // =========== Setters ==============

  addSpecie(label, total = 0) {
    if (label === this.solvent) {
      total = 0;
    }
    if (this.species[label]) {
      this.species[label] += total;
    } else {
      this.species[label] = total;
    }
  }

  resetSpecies() {
    this.species = {};
    this.addSpecie(this.options.solvent);
  }

  setTotal(label, total) {
    this.species[label] = total;
    this.atEquilibrium.delete(label);
  }

  setAtEquilibrium(label, value) {
    this.species[label] = value;
    this.atEquilibrium.add(label);
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  disableEquation(formedSpecie) {
    this.eqSet.disableEquation(formedSpecie, true);
  }

  enableEquation(formedSpecie) {
    this.eqSet.enableEquation(formedSpecie, true);
  }

  enableAllEquations() {
    this.eqSet.enableAllEquations();
  }
}

function processDB(db, options) {
  db = deepcopy(db);
  const toRemove = [];
  for (let i = 0; i < db.length; i++) {
    if (typeof db[i].pK !== 'number' || options.solvent !== 'H2O') {
      if (db[i].pK[options.solvent]) {
        db[i].pK = db[i].pK[options.solvent];
      } else {
        toRemove.push(i);
      }
    }
  }

  for (let i = db.length - 1; i >= 0; i--) {
    if (toRemove.includes(i)) {
      db.splice(i, 1);
    }
  }

  return db;
}

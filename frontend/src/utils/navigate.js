/**
 * navigate.js — Singleton qui stocke la référence à la fonction navigate()
 * de React Router, afin de pouvoir déclencher une navigation programmatique
 * depuis des modules en dehors de l'arbre React (ex: intercepteurs Axios).
 *
 * Usage :
 *   1. Dans App.jsx (ou un composant racine) : setNavigateRef(navigate)
 *   2. Partout ailleurs : navigateTo('/some-path')
 */

let _navigate = null;

/** Stocke la référence au navigate de React Router. */
export const setNavigateRef = (navigateFn) => {
  _navigate = navigateFn;
};

/**
 * Navigue vers un chemin en utilisant React Router si disponible,
 * sinon retombe sur window.location.href (fallback).
 */
export const navigateTo = (path) => {
  if (_navigate) {
    _navigate(path);
  } else {
    window.location.href = path;
  }
};

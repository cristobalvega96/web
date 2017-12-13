module.exports = {
  "parser": "babel-eslint",
  "extends": "airbnb",
  "globals": {
    "_": true,
    "$": true,
    "google": true,
    "mapboxgl": true,
  },
  "rules": {
    "import/extensions": 0,
    "import/no-unresolved": 0,
    "react/jsx-filename-extension": 0,
    "import/no-extraneous-dependencies": 0,
    "arrow-body-style": 0,
    "indent": [
      2,
      2
    ],
    "quotes": [
      2,
      "single"
    ],
    "linebreak-style": [
      2,
      "unix"
    ],
    "semi": [
      2,
      "never"
    ],
    "comma-dangle": [
      2,
      "always-multiline",
    ],
    "no-unused-vars": 1,
    "no-empty": 1,
    "no-console": 1,
  },
};

module.exports = {
    "env": {
        "node": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": 0, // disallow use of console (off by default in the node environment)    
        "linebreak-style": [
            "error",
            "unix"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};

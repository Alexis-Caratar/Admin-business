"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var PrivateRoute = function (_a) {
    var children = _a.children;
    var token = localStorage.getItem("token");
    return token ? children : (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/login" });
};
exports.default = PrivateRoute;

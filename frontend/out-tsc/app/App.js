"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var Home_1 = require("./pages/Home");
var Login_1 = require("./pages/Login");
var AdminDashboard_1 = require("./pages/AdminDashboard");
var PrivateRoute_1 = require("./components/PrivateRoute");
var NotFound_1 = require("./pages/NotFound");
var App = function () {
    return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/login", element: (0, jsx_runtime_1.jsx)(Login_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin", element: (0, jsx_runtime_1.jsx)(PrivateRoute_1.default, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/admin/:modulo", element: (0, jsx_runtime_1.jsx)(PrivateRoute_1.default, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "*", element: (0, jsx_runtime_1.jsx)(NotFound_1.default, {}) })] }) }));
};
exports.default = App;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var API_URL = import.meta.env.VITE_apiurl;
var axiosInstance = axios_1.default.create({ baseURL: API_URL });
axiosInstance.interceptors.request.use(function (config) {
    var token = localStorage.getItem("token");
    if (token && config.headers)
        config.headers.Authorization = "Bearer ".concat(token);
    return config;
});
exports.default = axiosInstance;

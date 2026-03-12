"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var NotFound = function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    return ((0, jsx_runtime_1.jsx)("div", { style: styles.container, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.box, children: [(0, jsx_runtime_1.jsx)("img", { src: "https://franklinbelen.com/wp-content/uploads/cual-es-el-error-404-not-fund.jpg", alt: "Not found", style: styles.image }), (0, jsx_runtime_1.jsx)("h1", { children: "Not Found - 404" }), (0, jsx_runtime_1.jsx)("h1", { style: styles.title, children: "P\u00E1gina no encontrada" }), (0, jsx_runtime_1.jsx)("p", { style: styles.text, children: "Lo sentimos, no pudimos encontrar la p\u00E1gina que buscas." }), (0, jsx_runtime_1.jsx)("button", { style: styles.btn, onClick: function () { return navigate("/"); }, children: "Volver al inicio" })] }) }));
};
var styles = {
    container: {
        height: "100vh",
        width: "100vw",
        backgroundColor: "#F5F7FA",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
    },
    box: {
        textAlign: "center",
        background: "white",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        maxWidth: "450px",
    },
    image: {
        width: "230px",
        marginBottom: "20px",
    },
    title: {
        fontSize: "26px",
        fontWeight: 700,
        marginBottom: "10px",
        color: "#1e293b",
    },
    text: {
        fontSize: "16px",
        color: "#475569",
        marginBottom: "25px",
    },
    btn: {
        backgroundColor: "#2563eb",
        color: "white",
        padding: "12px 22px",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        cursor: "pointer",
        transition: "0.25s",
    },
};
exports.default = NotFound;

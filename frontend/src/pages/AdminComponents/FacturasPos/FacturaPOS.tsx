import React from "react";
import QRCode from "react-qr-code";

export const FacturaPOS = React.forwardRef(({ venta, productos }: any, ref: any) => {
  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div
      ref={ref}
      style={{
        width: "80mm",
        fontSize: "11px",
        padding: "8px",
        fontFamily: "monospace",
        color: "#000"
      }}
    >

      {/* ===== LOGO + NEGOCIO ===== */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <img
          src="https://png.pngtree.com/png-vector/20250531/ourlarge/pngtree-classic-restaurant-logo-with-cutlery-and-plate-png-image_16437145.png"
          alt="logo"
          style={{ width: 60, marginBottom: 4 }}
        />

        <div style={{ fontWeight: "bold", fontSize: 13 }}>
          PUNTO URBANO
        </div>

        <div>NIT: 123456789</div>
        <div>CRA 40 #16D-29</div>
        <div>Tel: 300 000 0000</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ===== INFO FACTURA ===== */}
      <div>
        <div>Factura: {venta?.numero_factura}</div>
        <div>Fecha: {venta?.fecha}</div>
        <div>Cliente: {venta?.nombre_completo || "Consumidor final"}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ===== PRODUCTOS ===== */}
      <div>
        {productos.map((p: any) => (
          <div key={p.id_producto} style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: "bold" }}>
              {p.nombre}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{p.cantidad} x {formatCOP(p.precio_unitario)}</span>
              <span>{formatCOP(p.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ===== TOTALES ===== */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Subtotal</span>
        <span>{formatCOP(venta?.venta_total)}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Descuento</span>
        <span>$0</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13 }}>
        <span>TOTAL</span>
        <span>{formatCOP(venta?.venta_total)}</span>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ===== MÉTODO DE PAGO ===== */}
      <div>
        <div>Pago: {venta?.metodo_pago}</div>
        <div>Recibido: {formatCOP(venta?.monto_recibido || venta?.venta_total)}</div>
        <div>Cambio: {formatCOP(venta?.cambio || 0)}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ===== QR ===== */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <QRCode
          value={`Factura:${venta?.numero_factura}-Total:${venta?.venta_total}`}
          size={80}
        />
        <div style={{ fontSize: 10, marginTop: 4 }}>
          Escanea la carta
        </div>
      </div>

      {/* ===== MENSAJE FINAL ===== */}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <div>¡Gracias por tu compra!</div>
        <div>Vuelve pronto 😊</div>
      </div>

      {/* ===== ESPACIO PARA CORTE ===== */}
      <div style={{ height: 40 }} />

    </div>
  );
});
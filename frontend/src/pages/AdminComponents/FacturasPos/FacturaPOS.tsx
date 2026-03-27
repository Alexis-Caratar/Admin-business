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
        padding: "10px",
        fontFamily: `"Roboto", monospace`,
        color: "#333",
        backgroundColor: "#fff",
      }}
    >
      {/* LOGO + NEGOCIO */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <img
          src="https://scontent.fpso2-1.fna.fbcdn.net/v/t39.30808-6/654550237_1636080677540571_5948649793158553684_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeFo9acJvskQkbXlCu8GkHMQRNzXqs_y1spE3Neqz_LWyqGsXZUgf0WTC3vxihy9JCm1bzgOmTmF0ajPUfprbfpr&_nc_ohc=wW9Hzs9jvoQQ7kNvwFYARWw&_nc_oc=AdogaJyZhzDnr-t61O-zxm0Eisb518qxLHk-Xz-Iat1wyqe531EnuIHv7ynMSFBjR-k&_nc_zt=23&_nc_ht=scontent.fpso2-1.fna&_nc_gid=7KTKeRWKvYZQIIYw4pjsRg&_nc_ss=7a32e&oh=00_Afx9TGpFdAo5qsAmI47lXz6q1RqS-pFmNbQHeIfz_HVf9g&oe=69CC3AB9"
          alt="logo"
          style={{ width: 60, borderRadius: 8, marginBottom: 4 }}
        />
        <div style={{ fontWeight: "bold", fontSize: 14, color: "#ff7f50" }}>PUNTO URBANO</div>
        <div style={{ fontSize: 10 }}>NIT: 123456789</div>
        <div style={{ fontSize: 10 }}>CRA 40 #16D-29, Pasto, Nariño</div>
        <div style={{ fontSize: 10 }}>Tel: 300 000 0000</div>
      </div>

   <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* INFO FACTURA */}
      <div style={{ marginBottom: 6}}>
        <div style={{ fontWeight: 500  }}>Factura: {venta?.numero_factura}</div>
        <div style={{ fontWeight: 500 }}>Fecha venta: {venta?.fecha_completa}</div>
        <div style={{ fontWeight: 500 }}>Vendedor: {venta?.nombre_vendedor}</div>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* INFO FACTURA */}
      <div style={{ marginBottom: 6 }}>
         <div style={{ fontWeight: 500 }}>identificacion/ nit: {venta?.identificacion_cliente || "2222222222"}</div>
        <div style={{ fontWeight: 500 }}>Cliente: {venta?.nombre_completo || "Consumidor final"}</div>
         <div style={{ fontWeight: 500 }}>telefono: {venta?.telefono || "322 6665512"}</div>
        <div style={{ fontWeight: 500 }}>email: {venta?.email || "Consumidorfinal@gmail.com"}</div>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* PRODUCTOS */}
      <div>
             <div style={{ marginBottom: 6 }}>
         <div style={{ fontWeight: 500 }}>Detalles venta</div>
      </div>

        {productos.map((p: any) => (
          <div key={p.id_producto} style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: "bold", fontSize: 11 }}>{p.nombre}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span>{p.cantidad} x {formatCOP(p.precio_unitario)}</span>
              <span>{formatCOP(p.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* TOTALES */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span>Subtotal</span>
        <span>{formatCOP(venta?.venta_total)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span>Descuento</span>
        <span>{formatCOP(venta?.descuento || 0)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 12, marginTop: 2 }}>
        <span>TOTAL</span>
        <span>{formatCOP(venta?.venta_total)}</span>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* MÉTODO DE PAGO */}
      <div style={{ fontSize: 10 }}>
        <div>Pago: {venta?.metodo_pago}</div>
        <div>Recibido: {formatCOP(venta?.monto_recibido || venta?.venta_total)}</div>
        <div>Cambio: {formatCOP(venta?.cambio || 0)}</div>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />

      {/* QR */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <QRCode
          value={`Factura:${venta?.numero_factura}-Total:${venta?.venta_total}`}
          size={80}
        />
        <div style={{ fontSize: 9, marginTop: 4 }}>Escanea la carta</div>
      </div>

      {/* MENSAJE FINAL */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 11 }}>
        <div>¡Gracias por tu compra!</div>
        <div>Vuelve pronto 😊</div>
      </div>

      {/* ESPACIO PARA CORTE */}
      <div style={{ height: 40 }} />
    </div>
  );
});
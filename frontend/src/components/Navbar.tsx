import React from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  menus: { id: number; nombre: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ menus }) => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/ofertas">Ofertas</Link></li>
        <li><Link to="/domicilios">Domicilios</Link></li>
        <li><Link to="/reservas">Reservas</Link></li>
        <li><Link to="/contacto">Contacto</Link></li>
        {menus.map(menu => (
          <li key={menu.id}><Link to={`/menu/${menu.id}`}>{menu.nombre}</Link></li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
